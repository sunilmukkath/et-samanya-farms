export const voucherKinds = ["expense", "income", "transfer", "journal"] as const;
export type VoucherKind = (typeof voucherKinds)[number];

export const paymentModes = ["cash", "upi", "bank", "cheque", "card", "credit"] as const;
export type PaymentMode = (typeof paymentModes)[number];

export const gstKinds = ["none", "exempt", "intra", "inter"] as const;
export type GstKind = (typeof gstKinds)[number];

export const gstRates = [0, 5, 12, 18, 28] as const;

export const accountTypes = ["asset", "liability", "equity", "income", "expense"] as const;
export type AccountType = (typeof accountTypes)[number];

export const voucherSources = ["manual", "photo", "sms"] as const;
export type VoucherSource = (typeof voucherSources)[number];

export type ChartAccount = {
  id: string;
  code: string;
  name: string;
  tamil: string;
  type: AccountType;
  group: string;
};

export const chartOfAccounts: ChartAccount[] = [
  { id: "cash", code: "1000", name: "Cash in hand", tamil: "ரொக்கம்", type: "asset", group: "Current assets" },
  { id: "bank", code: "1010", name: "Bank", tamil: "வங்கி", type: "asset", group: "Current assets" },
  { id: "upi", code: "1020", name: "UPI / wallets", tamil: "யூபிஐ", type: "asset", group: "Current assets" },
  { id: "debtors", code: "1100", name: "Sundry debtors", tamil: "கடனாளிகள்", type: "asset", group: "Current assets" },
  { id: "inventory", code: "1200", name: "Produce on hand", tamil: "சரக்கு", type: "asset", group: "Current assets" },
  { id: "input_cgst", code: "1301", name: "Input CGST", tamil: "உள்ளீட்டு சிஜிஎஸ்டி", type: "asset", group: "Duties & taxes" },
  { id: "input_sgst", code: "1302", name: "Input SGST", tamil: "உள்ளீட்டு எஸ்ஜிஎஸ்டி", type: "asset", group: "Duties & taxes" },
  { id: "input_igst", code: "1303", name: "Input IGST", tamil: "உள்ளீட்டு ஐஜிஎஸ்டி", type: "asset", group: "Duties & taxes" },
  { id: "fixed_assets", code: "1500", name: "Farm plant & machinery", tamil: "இயந்திரம்", type: "asset", group: "Fixed assets" },
  { id: "creditors", code: "2000", name: "Sundry creditors", tamil: "கடனீந்தோர்", type: "liability", group: "Current liabilities" },
  { id: "output_cgst", code: "2101", name: "Output CGST", tamil: "வெளியீட்டு சிஜிஎஸ்டி", type: "liability", group: "Duties & taxes" },
  { id: "output_sgst", code: "2102", name: "Output SGST", tamil: "வெளியீட்டு எஸ்ஜிஎஸ்டி", type: "liability", group: "Duties & taxes" },
  { id: "output_igst", code: "2103", name: "Output IGST", tamil: "வெளியீட்டு ஐஜிஎஸ்டி", type: "liability", group: "Duties & taxes" },
  { id: "loans", code: "2200", name: "Loans", tamil: "கடன்", type: "liability", group: "Loans" },
  { id: "capital", code: "3000", name: "Capital", tamil: "மூலதனம்", type: "equity", group: "Capital" },
  { id: "drawings", code: "3100", name: "Drawings", tamil: "எடுப்பு", type: "equity", group: "Capital" },
  { id: "sales_veg", code: "4001", name: "Vegetable sales", tamil: "காய்கறி விற்பனை", type: "income", group: "Sales" },
  { id: "sales_greens", code: "4002", name: "Greens / keerai sales", tamil: "கீரை விற்பனை", type: "income", group: "Sales" },
  { id: "sales_sesame", code: "4003", name: "Sesame sales", tamil: "எள் விற்பனை", type: "income", group: "Sales" },
  { id: "sales_urad", code: "4004", name: "Urad sales", tamil: "உளுந்து விற்பனை", type: "income", group: "Sales" },
  { id: "sales_fruit", code: "4005", name: "Fruit sales", tamil: "பழ விற்பனை", type: "income", group: "Sales" },
  { id: "stay_income", code: "4100", name: "Farm stay", tamil: "தங்கல் வருமானம்", type: "income", group: "Services" },
  { id: "workshop_income", code: "4110", name: "Walks & workshops", tamil: "பயிற்சி வருமானம்", type: "income", group: "Services" },
  { id: "other_income", code: "4900", name: "Other income", tamil: "பிற வருமானம்", type: "income", group: "Other" },
  { id: "exp_seeds", code: "5001", name: "Seeds & planting", tamil: "விதை", type: "expense", group: "Farm inputs" },
  { id: "exp_labour", code: "5002", name: "Labour / coolie", tamil: "கூலி", type: "expense", group: "Farm inputs" },
  { id: "exp_manure", code: "5003", name: "Manure, compost, fertiliser", tamil: "எரு", type: "expense", group: "Farm inputs" },
  { id: "exp_feed", code: "5004", name: "Feed & veterinary", tamil: "தீவனம்", type: "expense", group: "Animals" },
  { id: "exp_fuel", code: "5100", name: "Fuel, diesel, electricity", tamil: "எரிபொருள்", type: "expense", group: "Operations" },
  { id: "exp_water", code: "5110", name: "Irrigation & water", tamil: "நீர்", type: "expense", group: "Operations" },
  { id: "exp_repair", code: "5120", name: "Repairs & maintenance", tamil: "பழுது", type: "expense", group: "Operations" },
  { id: "exp_transport", code: "5130", name: "Transport", tamil: "போக்குவரத்து", type: "expense", group: "Operations" },
  { id: "exp_pack", code: "5140", name: "Packing & market", tamil: "பொதி", type: "expense", group: "Operations" },
  { id: "exp_stay", code: "5200", name: "Stay supplies", tamil: "தங்கல் செலவு", type: "expense", group: "Hospitality" },
  { id: "exp_prof", code: "5300", name: "Professional fees", tamil: "கட்டணம்", type: "expense", group: "Admin" },
  { id: "exp_bank", code: "5310", name: "Bank charges", tamil: "வங்கி கட்டணம்", type: "expense", group: "Admin" },
  { id: "exp_misc", code: "5900", name: "Miscellaneous", tamil: "இதர செலவு", type: "expense", group: "Admin" },
];

export const accountById = Object.fromEntries(chartOfAccounts.map((row) => [row.id, row])) as Record<
  string,
  ChartAccount
>;

export function isVoucherKind(value: string): value is VoucherKind {
  return voucherKinds.includes(value as VoucherKind);
}

export function isPaymentMode(value: string): value is PaymentMode {
  return paymentModes.includes(value as PaymentMode);
}

export function isGstKind(value: string): value is GstKind {
  return gstKinds.includes(value as GstKind);
}

export function rupeesToPaise(input: string | number | null | undefined) {
  if (input == null || input === "") return null;
  const raw = String(input).replace(/[₹,\s]/g, "").replace(/^-/, "");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function paiseToRupees(paise: number) {
  return paise / 100;
}

export function formatInr(paise: number | null | undefined) {
  if (paise == null || !Number.isFinite(paise)) return "₹0.00";
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(Math.round(paise));
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const digits = String(whole);
  let grouped: string;
  if (digits.length <= 3) grouped = digits;
  else {
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    grouped = `${rest},${last3}`;
  }
  return `${sign}₹${grouped}.${frac}`;
}

export type FinancialYear = {
  label: string;
  startYear: number;
  start: Date;
  end: Date;
};

export function financialYear(date: Date = new Date()): FinancialYear {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return {
    label: `${startYear}-${String(startYear + 1).slice(-2)}`,
    startYear,
    start: new Date(`${startYear}-04-01T00:00:00+05:30`),
    end: new Date(`${startYear + 1}-03-31T23:59:59+05:30`),
  };
}

export function parseIstDate(value: string | null | undefined, fallback = new Date()) {
  if (!value) return fallback;
  const iso = /^\d{4}-\d{2}-\d{2}$/.exec(value.trim());
  if (iso) {
    const day = value.trim();
    if (day === istInputDate(fallback)) return fallback;
    return new Date(`${day}T12:00:00+05:30`);
  }
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(value.trim());
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    let year = dmy[3];
    if (year.length === 2) year = `20${year}`;
    return new Date(`${year}-${month}-${day}T12:00:00+05:30`);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function istInputDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export type GstBreakup = {
  taxablePaise: number;
  gstPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  grossPaise: number;
};

export function gstBreakup(opts: {
  amountPaise: number;
  rate: number;
  kind: GstKind;
  inclusive?: boolean;
}): GstBreakup {
  const amount = Math.round(opts.amountPaise);
  const rate = gstRates.includes(opts.rate as (typeof gstRates)[number]) ? opts.rate : 0;
  if (opts.kind === "none" || opts.kind === "exempt" || rate === 0) {
    return {
      taxablePaise: amount,
      gstPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      grossPaise: amount,
    };
  }
  const inclusive = opts.inclusive !== false;
  const taxable = inclusive ? Math.round((amount * 100) / (100 + rate)) : amount;
  const gst = inclusive ? amount - taxable : Math.round((taxable * rate) / 100);
  const gross = inclusive ? amount : taxable + gst;
  if (opts.kind === "inter") {
    return { taxablePaise: taxable, gstPaise: gst, cgstPaise: 0, sgstPaise: 0, igstPaise: gst, grossPaise: gross };
  }
  const cgst = Math.floor(gst / 2);
  return {
    taxablePaise: taxable,
    gstPaise: gst,
    cgstPaise: cgst,
    sgstPaise: gst - cgst,
    igstPaise: 0,
    grossPaise: gross,
  };
}

export function walletForMode(mode: PaymentMode, kind: VoucherKind) {
  if (mode === "credit") return kind === "income" ? "debtors" : "creditors";
  if (mode === "cash") return "cash";
  if (mode === "upi") return "upi";
  return "bank";
}

export function defaultCategory(kind: VoucherKind) {
  if (kind === "income") return "sales_veg";
  if (kind === "transfer") return "bank";
  return "exp_misc";
}

const CATEGORY_HINTS: { id: string; pattern: RegExp }[] = [
  { id: "exp_fuel", pattern: /\b(petrol|diesel|hpcl|bpcl|iocl|indian oil|hp pump|fuel|electricity|tneb|tangedco)\b/i },
  { id: "exp_labour", pattern: /\b(coolie|labour|labor|wages|daily wage)\b/i },
  { id: "exp_seeds", pattern: /\b(seed|sapling|nursery|planting)\b/i },
  { id: "exp_manure", pattern: /\b(manure|compost|fertilizer|fertiliser|urea|dap|vermi)\b/i },
  { id: "exp_feed", pattern: /\b(feed|fodder|vet|veterinary|cattle feed)\b/i },
  { id: "exp_water", pattern: /\b(irrigation|drip|borewell|tanker|water)\b/i },
  { id: "exp_repair", pattern: /\b(repair|spare|welding|pump service|maintenance)\b/i },
  { id: "exp_transport", pattern: /\b(transport|lorry|tempo|ola|uber|fastag|toll)\b/i },
  { id: "exp_pack", pattern: /\b(crate|gunny|packing|mandi|market fee)\b/i },
  { id: "exp_stay", pattern: /\b(grocery|provisions|stay supplies|linens)\b/i },
  { id: "exp_prof", pattern: /\b(ca fee|audit|advocate|professional|gst return)\b/i },
  { id: "exp_bank", pattern: /\b(bank charge|atm fee|sms alert fee)\b/i },
  { id: "sales_veg", pattern: /\b(vegetable|vendors? sale|kaikari|gourd)\b/i },
  { id: "sales_greens", pattern: /\b(keerai|spinach|greens)\b/i },
  { id: "sales_sesame", pattern: /\b(sesame|gingelly|ellu)\b/i },
  { id: "sales_urad", pattern: /\b(urad|ulundhu|black gram)\b/i },
  { id: "sales_fruit", pattern: /\b(mango|jackfruit|guava|watermelon|fruit)\b/i },
  { id: "stay_income", pattern: /\b(farm stay|homestay|guest|booking)\b/i },
  { id: "workshop_income", pattern: /\b(workshop|walk|picnic|training)\b/i },
];

export function suggestCategoryId(text: string, kind: VoucherKind) {
  for (const hint of CATEGORY_HINTS) {
    if (hint.pattern.test(text)) return hint.id;
  }
  return defaultCategory(kind);
}

export function paymentModeLabel(mode: PaymentMode) {
  return {
    cash: "Cash",
    upi: "UPI",
    bank: "NEFT / IMPS",
    cheque: "Cheque",
    card: "Card",
    credit: "Credit / udhaar",
  }[mode];
}

export function voucherKindLabel(kind: VoucherKind) {
  return { expense: "Expense", income: "Income", transfer: "Contra / transfer", journal: "Journal" }[kind];
}

export function accountsForKind(kind: VoucherKind) {
  if (kind === "income") return chartOfAccounts.filter((row) => row.type === "income");
  if (kind === "expense") return chartOfAccounts.filter((row) => row.type === "expense");
  if (kind === "transfer") return chartOfAccounts.filter((row) => row.type === "asset");
  return chartOfAccounts;
}

export function fingerprint(text: string) {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function nextVoucherNo(existing: string[], fy: FinancialYear) {
  const prefix = `SF/${fy.label}/`;
  let max = 0;
  for (const value of existing) {
    if (!value.startsWith(prefix)) continue;
    const n = Number(value.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export type LedgerLineDraft = {
  accountId: string;
  debitPaise: number;
  creditPaise: number;
};

export function buildLedgerLines(opts: {
  kind: VoucherKind;
  grossPaise: number;
  gst: GstBreakup;
  categoryAccountId: string;
  walletAccountId: string;
  transferToId?: string | null;
}): LedgerLineDraft[] {
  const lines: LedgerLineDraft[] = [];
  const push = (accountId: string, debitPaise: number, creditPaise: number) => {
    if (!accountId || (debitPaise === 0 && creditPaise === 0)) return;
    lines.push({ accountId, debitPaise, creditPaise });
  };

  if (opts.kind === "transfer") {
    const dest = opts.transferToId || opts.categoryAccountId;
    push(dest, opts.gst.grossPaise, 0);
    push(opts.walletAccountId, 0, opts.gst.grossPaise);
    return lines;
  }

  if (opts.kind === "expense") {
    push(opts.categoryAccountId, opts.gst.taxablePaise, 0);
    push("input_cgst", opts.gst.cgstPaise, 0);
    push("input_sgst", opts.gst.sgstPaise, 0);
    push("input_igst", opts.gst.igstPaise, 0);
    push(opts.walletAccountId, 0, opts.gst.grossPaise);
    return lines;
  }

  if (opts.kind === "income") {
    push(opts.walletAccountId, opts.gst.grossPaise, 0);
    push(opts.categoryAccountId, 0, opts.gst.taxablePaise);
    push("output_cgst", 0, opts.gst.cgstPaise);
    push("output_sgst", 0, opts.gst.sgstPaise);
    push("output_igst", 0, opts.gst.igstPaise);
    return lines;
  }

  push(opts.categoryAccountId, opts.gst.grossPaise, 0);
  push(opts.walletAccountId, 0, opts.gst.grossPaise);
  return lines;
}

export function linesBalance(lines: LedgerLineDraft[]) {
  const debit = lines.reduce((sum, row) => sum + row.debitPaise, 0);
  const credit = lines.reduce((sum, row) => sum + row.creditPaise, 0);
  return { debit, credit, ok: debit === credit && debit > 0 };
}

export type ParsedSms = {
  kind: VoucherKind;
  amountPaise: number;
  occurredAt: Date | null;
  party: string | null;
  paymentMode: PaymentMode;
  walletAccountId: string;
  categoryAccountId: string;
  narration: string;
  reference: string | null;
  bankHint: string | null;
  confidence: number;
  fingerprint: string;
};

function firstSmsAmount(text: string) {
  const patterns = [
    /(?:INR|Rs\.?|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    /(?:debited|credited|spent|paid|received)\s+(?:for\s+)?(?:INR|Rs\.?|₹)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      const paise = rupeesToPaise(match[1]);
      if (paise && paise > 0) return paise;
    }
  }
  return null;
}

function smsDirection(text: string): VoucherKind | null {
  if (/\b(debited|debit|spent|paid|withdrawn|dr\b|purchase|payment of)\b/i.test(text)) return "expense";
  if (/\b(credited|credit|received|deposited|cr\b|received from)\b/i.test(text)) return "income";
  return null;
}

function smsModeAndWallet(text: string): { paymentMode: PaymentMode; walletAccountId: string } {
  if (/\b(upi|gpay|google pay|phonepe|paytm|bhim|bharatpe)\b/i.test(text)) {
    return { paymentMode: "upi", walletAccountId: "upi" };
  }
  if (/\b(atm|pos|card|visa|mastercard)\b/i.test(text)) {
    return { paymentMode: "card", walletAccountId: "bank" };
  }
  if (/\b(neft|imps|rtgs|cheque|chq)\b/i.test(text)) {
    return { paymentMode: "bank", walletAccountId: "bank" };
  }
  if (/\b(a\/c|account|bank)\b/i.test(text)) {
    return { paymentMode: "bank", walletAccountId: "bank" };
  }
  return { paymentMode: "upi", walletAccountId: "upi" };
}

function smsParty(text: string) {
  const patterns = [
    /\b(?:to|at|from|towards|paid to|credited to|debited to)\s+([A-Z][A-Za-z0-9 .&'-]{2,40})/,
    /Info:\s*(?:UPI\/(?:P2M|P2P)\/\d+\/)?([A-Z][A-Za-z0-9 .&'-]{2,40})/i,
    /(?:UPI)[\/-][A-Z0-9]+[\/-]([A-Z][A-Za-z0-9 .&'-]{2,40})/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      const name = match[1].replace(/\s+(on|via|using|ref|avl|total|info).*$/i, "").trim();
      if (name && !/^(a\/c|inr|rs|upi|info)$/i.test(name)) return name.slice(0, 48);
    }
  }
  return null;
}

function smsDate(text: string) {
  const match =
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/.exec(text) ??
    /\b(\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s?\d{2,4})\b/i.exec(text);
  if (!match?.[1]) return null;
  const value = match[1].replace(/\s+/g, "-");
  const months: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  const named = /^(\d{1,2})-([A-Za-z]+)-?(\d{2,4})?$/.exec(value);
  if (named) {
    const month = months[named[2].slice(0, 3).toLowerCase()];
    if (!month) return parseIstDate(value);
    const year = named[3] ? (named[3].length === 2 ? `20${named[3]}` : named[3]) : String(new Date().getFullYear());
    return parseIstDate(`${named[1]}/${month}/${year}`);
  }
  return parseIstDate(match[1]);
}

export function parseIndianBankSms(text: string): ParsedSms | { error: string } {
  const raw = text.replace(/\s+/g, " ").trim();
  if (raw.length < 12) return { error: "That SMS is too short to be a bank message." };
  const amountPaise = firstSmsAmount(raw);
  if (!amountPaise) return { error: "Could not find a rupee amount in the SMS." };
  const kind = smsDirection(raw);
  if (!kind) return { error: "Could not tell if this is a debit or a credit." };
  const { paymentMode, walletAccountId } = smsModeAndWallet(raw);
  const party = smsParty(raw);
  const occurredAt = smsDate(raw);
  const hint = [party, raw].filter(Boolean).join(" ");
  const bank =
    /\b(SBI|HDFC|ICICI|AXIS|KOTAK|CANARA|IOB|INDIAN BANK|PNB|BOB|UNION BANK|IDFC|YES BANK)\b/i.exec(raw)?.[1] ??
    null;
  const ref = /\b(?:UPI|IMPS|NEFT|RRN|Ref)[\/:\s-]*([A-Z0-9]{6,22})/i.exec(raw)?.[1] ?? null;
  return {
    kind,
    amountPaise,
    occurredAt,
    party,
    paymentMode,
    walletAccountId,
    categoryAccountId: suggestCategoryId(hint, kind),
    narration: raw.slice(0, 280),
    reference: ref,
    bankHint: bank ? bank.toUpperCase() : null,
    confidence: party && occurredAt ? 0.86 : party || occurredAt ? 0.72 : 0.6,
    fingerprint: fingerprint(raw),
  };
}
