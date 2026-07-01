from pathlib import Path
import pandas as pd

ROOT = Path(__file__).parent.parent
for fname, sheet, hdr in [
    ("Sale File.xls", "Sales Register", 2),
    ("Purchase File.xls", "Purchase Register", 1),
    ("CASH Detail.xls", "Cash  Book", 1),
    ("BANK Receipt.xls", "Kotak Bank 4112748249  Receipt", 1),
    ("Bank Payment.xls", "Kotak Bank 4112748249 Payment", 1),
]:
    df = pd.read_excel(ROOT / fname, sheet_name=sheet, header=hdr)
    for col in df.columns:
        hits = df[df[col].astype(str).str.contains(r"\b1123\b", na=False, regex=True)]
        if len(hits):
            print(fname, col, len(hits))
            print(hits.head(3).to_string())