import traceback
try:
    import pandas as pd
    df = pd.read_excel("Sale File.xls", header=2)
    print("shape", df.shape)
except Exception:
    traceback.print_exc()