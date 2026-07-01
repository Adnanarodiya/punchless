from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
df = pd.read_excel(ROOT / "Sale File.xls", sheet_name="Sales Register", header=2)
df.columns = ["date", "party", "voucher", "gstin", "amount"]
df = df[df["date"].notna()]
print("filtered", len(df), flush=True)
for i, row in df.head(3).iterrows():
    print(row["party"], row["amount"], flush=True)
print("done", flush=True)