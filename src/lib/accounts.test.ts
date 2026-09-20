import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLedgerLines,
  financialYear,
  formatInr,
  gstBreakup,
  linesBalance,
  nextVoucherNo,
  rupeesToPaise,
} from "./accounts.ts";
import { parseIndianBankSms } from "./accounts.ts";

describe("money", () => {
  it("parses Indian rupee strings to paise", () => {
    assert.equal(rupeesToPaise("₹1,250.50"), 125050);
    assert.equal(rupeesToPaise("12,00,000"), 120000000);
  });

  it("formats Indian grouping", () => {
    assert.equal(formatInr(12345678), "₹1,23,456.78");
    assert.equal(formatInr(500), "₹5.00");
  });
});

describe("financial year", () => {
  it("starts in April", () => {
    const fy = financialYear(new Date("2026-09-20T12:00:00+05:30"));
    assert.equal(fy.label, "2026-27");
    const before = financialYear(new Date("2026-03-31T12:00:00+05:30"));
    assert.equal(before.label, "2025-26");
  });
});

describe("GST", () => {
  it("splits inclusive intra-state 18%", () => {
    const gst = gstBreakup({ amountPaise: 11800, rate: 18, kind: "intra", inclusive: true });
    assert.equal(gst.taxablePaise, 10000);
    assert.equal(gst.cgstPaise, 900);
    assert.equal(gst.sgstPaise, 900);
    assert.equal(gst.grossPaise, 11800);
  });

  it("keeps agri sales exempt", () => {
    const gst = gstBreakup({ amountPaise: 50000, rate: 0, kind: "exempt" });
    assert.equal(gst.gstPaise, 0);
    assert.equal(gst.grossPaise, 50000);
  });
});

describe("ledger", () => {
  it("balances an expense with GST", () => {
    const gst = gstBreakup({ amountPaise: 11800, rate: 18, kind: "intra", inclusive: true });
    const lines = buildLedgerLines({
      kind: "expense",
      grossPaise: gst.grossPaise,
      gst,
      categoryAccountId: "exp_fuel",
      walletAccountId: "upi",
    });
    const bal = linesBalance(lines);
    assert.equal(bal.ok, true);
    assert.equal(bal.debit, 11800);
  });

  it("numbers vouchers inside the FY", () => {
    const fy = financialYear(new Date("2026-09-20T12:00:00+05:30"));
    assert.equal(nextVoucherNo(["SF/2026-27/0003"], fy), "SF/2026-27/0004");
  });
});

describe("SMS", () => {
  it("reads an SBI UPI debit", () => {
    const parsed = parseIndianBankSms(
      "Rs.1,250.00 debited from A/c XX1234 on 18-09-26. Avl Bal Rs.12,300.50. Info: UPI/P2M/123456/HP PETROL. -SBI",
    );
    assert.ok(!("error" in parsed));
    if ("error" in parsed) return;
    assert.equal(parsed.kind, "expense");
    assert.equal(parsed.amountPaise, 125000);
    assert.equal(parsed.paymentMode, "upi");
    assert.equal(parsed.categoryAccountId, "exp_fuel");
    assert.ok(parsed.party?.toLowerCase().includes("petrol"));
  });

  it("reads a credit into the farm account", () => {
    const parsed = parseIndianBankSms(
      "INR 8,000.00 is credited to your A/c XX4321 on 20-09-2026 from AMUTHA via UPI. Total Bal: INR 18,000.00 HDFC Bank",
    );
    assert.ok(!("error" in parsed));
    if ("error" in parsed) return;
    assert.equal(parsed.kind, "income");
    assert.equal(parsed.amountPaise, 800000);
    assert.equal(parsed.party, "AMUTHA");
  });
});
