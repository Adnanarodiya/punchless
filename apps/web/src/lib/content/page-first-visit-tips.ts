/** P2-1 — Short first-visit tips (read in ~30 seconds). */

export type PageTipId = "customers" | "suppliers" | "salary";

export type PageTip = {
  title: string;
  steps: string[];
};

export const PAGE_FIRST_VISIT_TIPS: Record<PageTipId, PageTip> = {
  customers: {
    title: "Customer money in 4 steps",
    steps: [
      "Add customer — opening balance if they already owe you.",
      "New bill — quick bill on Home or the New bill tab here.",
      "Collect payment — Home → Collect payment when they pay cash.",
      "Statement — ₹ icon on each row for full ledger.",
    ],
  },
  suppliers: {
    title: "Supplier money in 4 steps",
    steps: [
      "Add supplier — opening balance if you already owe them.",
      "Supplier bill — Commerce → Supplier bills (credit = udhar).",
      "Pay supplier — Home → Pay supplier when you pay cash.",
      "Statement — icon on each supplier row.",
    ],
  },
  salary: {
    title: "Pay staff this month",
    steps: [
      "Upload fingerprint file for the month (May file = May month).",
      "Check names and working days match your paper sheet.",
      "Pay this month on each employee row.",
      "Done — payment shows on Home under today's payments.",
    ],
  },
};