from pathlib import Path
import pandas as pd

df = pd.read_excel(Path(__file__).parent.parent / "CASH Detail.xls", sheet_name="Cash  Book", header=1)
print(df.columns.tolist())
print(df.iloc[:, 1].value_counts())
dr = df[df.iloc[:, 1].astype(str).str.strip() == "Dr"]
print("Dr count", len(dr))
if len(dr):
    print(dr.head(3).to_string())