import type { UiLanguage } from "@punchless/types";

export type OwnerLabelKey =
  | "nav.home"
  | "nav.customers"
  | "nav.suppliers"
  | "nav.supplierBills"
  | "nav.payStaff"
  | "nav.settings"
  | "nav.moreTools"
  | "nav.invoices"
  | "nav.learn"
  | "nav.dailyReport"
  | "action.newBill"
  | "action.salesBill"
  | "action.purchaseBill"
  | "action.general"
  | "action.collectPayment"
  | "action.paySupplier"
  | "action.payStaff"
  | "action.addExpense"
  | "nav.incomeExpense"
  | "hero.customersOwe"
  | "hero.youOweSuppliers"
  | "hero.cashBank"
  | "pending.whoOwesWhat"
  | "settings.uiLanguage"
  | "settings.uiLanguageHint"
  | "support.needHelp";

const EN: Record<OwnerLabelKey, string> = {
  "nav.home": "Home",
  "nav.customers": "Customers",
  "nav.suppliers": "Suppliers",
  "nav.supplierBills": "Supplier bills",
  "nav.payStaff": "Pay Staff",
  "nav.settings": "Settings",
  "nav.moreTools": "More tools",
  "nav.invoices": "Invoices",
  "nav.learn": "Learn",
  "nav.dailyReport": "Daily report",
  "action.newBill": "New bill",
  "action.salesBill": "Sales bill",
  "action.purchaseBill": "Purchase bill",
  "action.general": "General",
  "action.collectPayment": "Collect payment",
  "action.paySupplier": "Pay supplier",
  "action.payStaff": "Pay employee",
  "action.addExpense": "Add expense / income",
  "nav.incomeExpense": "Income & expense",
  "hero.customersOwe": "Customers owe you",
  "hero.youOweSuppliers": "You owe suppliers",
  "hero.cashBank": "Cash + Bank",
  "pending.whoOwesWhat": "Who owes what",
  "settings.uiLanguage": "Dashboard language",
  "settings.uiLanguageHint":
    "Changes sidebar and home button labels. Data entry (customer names, amounts) stays as you type.",
  "support.needHelp": "Need help?",
};

const GU: Partial<Record<OwnerLabelKey, string>> = {
  "nav.home": "હોમ",
  "nav.customers": "ગ્રાહકો",
  "nav.suppliers": "સપ્લાયર્સ",
  "nav.supplierBills": "સપ્લાયર બિલ",
  "nav.payStaff": "સ્ટાફ પગાર",
  "nav.settings": "સેટિંગ્સ",
  "nav.moreTools": "વધુ ટૂલ્સ",
  "nav.invoices": "ઇન્વૉઇસ",
  "nav.learn": "શીખો",
  "nav.dailyReport": "દૈનિક રિપોર્ટ",
  "action.newBill": "નવું બિલ",
  "action.collectPayment": "પેમેન્ટ લો",
  "action.paySupplier": "સપ્લાયરને પે",
  "action.payStaff": "સ્ટાફ પગાર",
  "action.addExpense": "ખર્ચ / આવક ઉમેરો",
  "nav.incomeExpense": "આવક અને ખર્ચ",
  "hero.customersOwe": "ગ્રાહકોના બાકી",
  "hero.youOweSuppliers": "સપ્લાયરને બાકી",
  "hero.cashBank": "કેશ + બેંક",
  "pending.whoOwesWhat": "કોના બાકી",
  "settings.uiLanguage": "ડેશબોર્ડ ભાષા",
  "settings.uiLanguageHint":
    "સાઇડબાર અને હોમ બટનની ભાષા બદલાશે. ગ્રાહકનું નામ અને રકમ તમે જે લખો તે જ રહેશે.",
  "support.needHelp": "મદદ જોઈએ?",
};

const HI: Partial<Record<OwnerLabelKey, string>> = {
  "nav.home": "होम",
  "nav.customers": "ग्राहक",
  "nav.suppliers": "सप्लायर",
  "nav.supplierBills": "सप्लायर बिल",
  "nav.payStaff": "स्टाफ वेतन",
  "nav.settings": "सेटिंग्स",
  "nav.moreTools": "और टूल",
  "nav.invoices": "इनवॉइस",
  "nav.learn": "सीखें",
  "nav.dailyReport": "दैनिक रिपोर्ट",
  "action.newBill": "नया बिल",
  "action.collectPayment": "पेमेंट लें",
  "action.paySupplier": "सप्लायर को भुगतान",
  "action.payStaff": "स्टाफ वेतन",
  "action.addExpense": "खर्च / आय जोड़ें",
  "nav.incomeExpense": "आय और खर्च",
  "hero.customersOwe": "ग्राहकों का बाकी",
  "hero.youOweSuppliers": "सप्लायर को बाकी",
  "hero.cashBank": "कैश + बैंक",
  "pending.whoOwesWhat": "किसका बाकी",
  "settings.uiLanguage": "डैशबोर्ड भाषा",
  "settings.uiLanguageHint":
    "साइडबार और होम बटन की भाषा बदलेगी। नाम और रकम वैसी ही रहेंगी जैसी आप लिखें।",
  "support.needHelp": "मदद चाहिए?",
};

const BY_LANG: Record<UiLanguage, Partial<Record<OwnerLabelKey, string>>> = {
  en: EN,
  gu: GU,
  hi: HI,
};

export function ownerLabel(language: UiLanguage, key: OwnerLabelKey): string {
  return BY_LANG[language][key] ?? EN[key];
}

/** Map sidebar English labels to translation keys. */
export const NAV_LABEL_KEYS: Record<string, OwnerLabelKey> = {
  Dashboard: "nav.home",
  Home: "nav.home",
  Customers: "nav.customers",
  Suppliers: "nav.suppliers",
  "Supplier bills": "nav.supplierBills",
  "Staff salary": "nav.payStaff",
  "Pay Staff": "nav.payStaff",
  Settings: "nav.settings",
  "More tools": "nav.moreTools",
  Invoices: "nav.invoices",
  Learn: "nav.learn",
  "Daily report": "nav.dailyReport",
  "Income & expense": "nav.incomeExpense",
};

export function translateNavLabel(language: UiLanguage, label: string): string {
  const key = NAV_LABEL_KEYS[label];
  return key ? ownerLabel(language, key) : label;
}