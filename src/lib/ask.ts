import { listObservations } from "@/db/queries";
import type { ObservationRow } from "@/db/schema";
import type { FieldGuide } from "@/lib/guide";
import { domainCatalogBySlug } from "@/lib/packs/domains";
import { getFarmProfile } from "@/lib/profile";
import { geminiGenerateJson, geminiGenerateText } from "@/lib/vision";

export type AskHit = {
  id: string;
  domain: string;
  domainLabel: string;
  occurredAt: string;
  note: string;
  photoUrl: string | null;
};

export type AskResult = {
  question: string;
  answer: string;
  terms: string[];
  rows: AskHit[];
};

const EMPTY =
  "We have not logged that yet. Walk the land, save a note, then ask again.";

function cleanTerm(value: string) {
  return value.replace(/[%_]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function tokenize(question: string) {
  return question
    .split(/[\s,?.!;:]+/)
    .map(cleanTerm)
    .filter((term) => term.length >= 2)
    .slice(0, 8);
}

function toHit(row: ObservationRow): AskHit {
  const meta = domainCatalogBySlug[row.domain as keyof typeof domainCatalogBySlug];
  return {
    id: row.id,
    domain: row.domain,
    domainLabel: meta?.label ?? row.domain,
    occurredAt: row.occurredAt.toISOString(),
    note: row.note || summary(row.details as Record<string, unknown> | null),
    photoUrl: row.photoUrl,
  };
}

function summary(details: Record<string, unknown> | null) {
  if (!details) return "Logged";
  const bits = Object.entries(details)
    .filter(([key, value]) => value != null && value !== "" && key !== "aiSuggestion")
    .map(([key, value]) => `${key}: ${String(value)}`);
  return bits.join(" · ") || "Logged";
}

async function searchTerms(terms: string[]) {
  const unique = [...new Set(terms.map(cleanTerm).filter(Boolean))];
  const found = new Map<string, ObservationRow>();
  for (const term of unique.slice(0, 8)) {
    const rows = await listObservations({ query: term, limit: 16 });
    for (const row of rows) found.set(row.id, row);
  }
  return [...found.values()]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 24);
}

async function extractTerms(question: string) {
  const raw = await geminiGenerateJson(
    `Extract search keywords from a farmer's question about their own field log.
Return ONLY JSON: {"terms":["..."]} with 3-8 short words.
Include English and Tamil if either appears. No sentences.
Question: ${question}`,
  );
  if (!raw) return tokenize(question);
  try {
    const parsed = JSON.parse(raw) as { terms?: unknown };
    const terms = Array.isArray(parsed.terms)
      ? parsed.terms.map((item) => cleanTerm(String(item))).filter(Boolean)
      : [];
    return terms.length ? terms : tokenize(question);
  } catch {
    return tokenize(question);
  }
}

export async function askFarm(questionRaw: string): Promise<AskResult> {
  const question = cleanTerm(questionRaw).slice(0, 240);
  if (!question) {
    return { question: "", answer: "", terms: [], rows: [] };
  }

  const fallback = tokenize(question);
  let terms = fallback;
  const extracted = await extractTerms(question).catch(() => fallback);
  if (extracted.length) terms = [...new Set([question, ...extracted, ...fallback])].slice(0, 10);

  let rows = await searchTerms(terms);
  if (!rows.length && question !== fallback[0]) {
    rows = await searchTerms([question, ...fallback]);
  }

  const hits = rows.map(toHit);
  if (!hits.length) {
    return { question, answer: EMPTY, terms, rows: [] };
  }

  const profile = await getFarmProfile();
  const facts = hits.slice(0, 16).map((row) => ({
    domain: row.domainLabel,
    when: row.occurredAt,
    note: row.note,
  }));
  const model = await geminiGenerateText(
    `You answer a farmer at ${profile.name} from THEIR field notes only.
Question: ${question}
Facts JSON: ${JSON.stringify(facts)}
Rules:
- 2–5 short sentences.
- If the facts do not contain the answer, reply exactly: ${EMPTY}
- Do not invent dates, millimetres, kilograms, species, or advice.
- Prefer the most recent matching notes.
- Tamil in parentheses is welcome when the notes used Tamil.`,
  );

  const answer = model?.trim() || `${hits.length} matching note${hits.length === 1 ? "" : "s"} in the log.`;
  return { question, answer, terms, rows: hits };
}

export async function askGuide(questionRaw: string, guide: FieldGuide): Promise<{ question: string; answer: string }> {
  const question = cleanTerm(questionRaw).slice(0, 240);
  if (!question) return { question: "", answer: "" };
  const fallback = localGuideAnswer(question, guide);
  const model = await geminiGenerateText(
    `You advise a farmer in India. Answer in the same language as the question (Tamil, Hindi, or English).
Scale: ${guide.scale === "home" ? "home garden, pots, balcony, kitchen beds" : "a working farm"}.
Use only this brief. If the brief does not cover the question, say what to check on the land.
Do not invent millimetres, rupees, kilograms, or pesticide brand names.
3 to 6 short sentences.
Brief:
${guide.brief}
Question: ${question}`,
  );
  return { question, answer: model?.trim() || fallback };
}

function localGuideAnswer(question: string, guide: FieldGuide) {
  const q = question.toLowerCase();
  if (/(water|irrig|தண்ணீர்|paani|pani|पानी)/i.test(q)) {
    return guide.water.map((call) => `${call.title}. ${call.detail}`).join(" ");
  }
  if (/(price|market|rate|mandi|விலை|भाव|bhav)/i.test(q)) return guide.marketLine;
  if (/(yield|harvest|crop|அறுவடை)/i.test(q)) return guide.outlook.map((row) => row.line).join(" ");
  if (/(disease|pest|leaf|நோய்|कीट|keeda)/i.test(q)) {
    const issue = guide.issues[0];
    return issue
      ? `${issue.crop}: ${issue.issue}${issue.step ? `. ${issue.step}` : ""}`
      : "Take a daylight photo of one sick leaf in See the leaf.";
  }
  return guide.advisories.slice(0, 3).join(" ") || guide.satelliteLine;
}
