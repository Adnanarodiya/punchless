from pathlib import Path
import re
import pandas as pd

ROOT = Path(__file__).parent.parent

def clean_name(n):
    if n is None or (isinstance(n, float) and pd.isna(n)):
        return None
    s = str(n).strip()
    s = re.sub(r"_x000D_", "", s)
    s = re.sub(r"\s+Ok(?=\s*\(|\s*$)", "", s, flags=re.I)
    s = re.sub(r"\s*-\s*$", "", s)
    return s.strip() or None

def read_sales():
    df = pd.read_excel(ROOT / "Sale File.xls", sheet_name="Sales Register", header=2)
    df.columns = ["date", "party", "voucher", "gstin", "amount"]
    df = df[df["date"].notna()]
    df["party"] = df["party"].apply(clean_name)
    return df

def read_purchases():
    df = pd.read_excel(ROOT / "Purchase File.xls", sheet_name="Purchase Register", header=1)
    df.columns = ["date", "party", "invoice_no", "gstin", "amount"]
    df = df[df["date"].notna()]
    df["party"] = df["party"].apply(clean_name)
    return df

def read_cash():
    df = pd.read_excel(ROOT / "CASH Detail.xls", sheet_name="Cash  Book", header=1)
    df.columns = ["date", "cr_dr", "party", "amount"]
    df = df[df["date"].notna()]
    df["party"] = df["party"].apply(clean_name)
    return df

def read_bank_rcpt():
    df = pd.read_excel(ROOT / "BANK Receipt.xls", sheet_name="Kotak Bank 4112748249  Receipt", header=1)
    df.columns = ["date", "cr_dr", "party", "amount"]
    return df[df["date"].notna()]

def read_bank_pay():
    df = pd.read_excel(ROOT / "Bank Payment.xls", sheet_name="Kotak Bank 4112748249 Payment", header=1)
    df = df.rename(columns={df.columns[0]: "date", df.columns[6]: "amount", df.columns[2]: "party"})
    return df[df["date"].notna()]

sales = read_sales()
purchases = read_purchases()
cash = read_cash()
bank_rcpt = read_bank_rcpt()
bank_pay = read_bank_pay()

cash_open = cash[cash["party"].astype(str).str.contains("Opening", case=False, na=False)]
cash_cr = cash[(cash["cr_dr"] == "Cr") & ~cash["party"].astype(str).str.contains("Opening", case=False, na=False)]
cash_dr = cash[cash["cr_dr"] == "Dr"]

print("=== CUSTOMERS (Sales Register - unique parties) ===")
print("Count:", sales["party"].nunique())
print("Total sales:", round(sales["amount"].sum(), 2))

print("\n=== SUPPLIERS (Purchase Register - unique parties) ===")
print("Count:", purchases["party"].nunique())
print("Total purchases:", round(purchases["amount"].sum(), 2))
print("Parties:", sorted(purchases["party"].dropna().unique().tolist()))

print("\n=== CASH ===")
if len(cash_open):
    print("Opening balance:", float(cash_open.iloc[0]["amount"]))
print("Receipts:", len(cash_cr), round(cash_cr["amount"].sum(), 2))
print("Payments:", len(cash_dr), round(cash_dr["amount"].sum(), 2) if len(cash_dr) else 0)

print("\n=== KOTAK BANK ===")
print("Receipts:", len(bank_rcpt), round(bank_rcpt["amount"].sum(), 2))
print("Payments:", len(bank_pay), round(bank_pay["amount"].sum(), 2))
print("Net (receipts - payments):", round(bank_rcpt["amount"].sum() - bank_pay["amount"].sum(), 2))

# Extra parties from cash/bank receipts not in sales
sales_parties = set(sales["party"].dropna())
cash_parties = set(cash_cr["party"].dropna())
bank_parties = set(bank_rcpt["party"].apply(clean_name).dropna())
extra = (cash_parties | bank_parties) - sales_parties
print("\n=== RECEIPT-ONLY CUSTOMERS (not in sales register) ===")
print("Count:", len(extra))