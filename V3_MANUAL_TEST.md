# V3 Manual Test Checklist

> **For:** Adnan (`aiarodiya07@gmail.com`)  
> **When:** After `pnpm dev` is running (`http://localhost:3000` or your deployed URL)  
> **Automated tests already passed:** `pnpm e2e:v3` ✅

Login, then work through each block. Tick ✅ when done.

---

## Block 1 — Home & Primary Actions (2 min)

1. Open **Home** (`/dashboard`)
2. Confirm three buttons: **Sales bill**, **Purchase bill**, **General**
3. Confirm **Today's book** section shows Cash book + Bank book cards
4. Confirm sidebar has: Home, Daily report, **Cash book**, **Bank book**, Customers, Suppliers

---

## Block 2 — Sales Bill (3 min)

1. Click **Sales bill**
2. Confirm field order: Invoice # (`ISHABA-` prefix) → Date → Party → GST (optional) → Amount → Remark
3. Enter suffix e.g. `TEST-001`, today's date, amount `1000`
4. Type a **new customer name** (e.g. `Manual Test Customer`) — save
5. ✅ Toast: "Sales bill saved"
6. Go to **Customers** → find that customer → open **Statement**
7. ✅ Ledger shows **Sales bill #ISHABA-TEST-001** for ₹1,000
8. ✅ Running balance / Due = ₹1,000

---

## Block 3 — Partial Receipt via General (3 min)

1. Home → **General**
2. Select **Receipt** → **Cash** → **Party** → Customer
3. Search the customer from Block 2
4. ✅ Outstanding hint shows ₹1,000 (or current due)
5. Enter amount `500`, remark `Partial payment test`, save
6. Open customer **Statement** again
7. ✅ Credit line for ₹500
8. ✅ Remaining due = ₹500

---

## Block 4 — Purchase Bill (2 min)

1. Click **Purchase bill**
2. Enter supplier invoice # `SUP-TEST-01`, date, amount `800`
3. Type new supplier name e.g. `Manual Test Supplier`, save
4. Go to **Suppliers** → statement
5. ✅ Purchase bill ₹800 on ledger
6. ✅ Payable = ₹800

---

## Block 5 — Indirect Income / Expense (2 min)

1. **General** → **Payment** → **Cash** → **Indirect Expense**
2. Amount `200`, remark `Electrical work in workshop`, save
3. Open **Cash book** (`/dashboard/cash-book`)
4. ✅ Entry shows with remark and payment column

5. **General** → **Receipt** → **Cash** → **Indirect Income**
6. Amount `150`, remark `Sold used oil`, save
7. ✅ Appears in Cash book as receipt

---

## Block 6 — Bank + UPI (2 min)

1. **Settings** → ensure at least one **Bank account** exists (or add via Banks page)
2. **General** → **Receipt** → **Bank** → **UPI** → **Party** → same customer
3. Amount `500` (clears remaining due if Block 3 done), save
4. Open **Bank book** (`/dashboard/bank-book`)
5. ✅ Bank receipt appears

---

## Block 7 — Party GST Memory (1 min)

1. **Sales bill** → select existing customer from dropdown
2. ✅ GST field auto-fills if saved earlier
3. Save another bill with suffix `TEST-002`

---

## Block 8 — Reports & Print (2 min)

1. **Daily report** — today's entries visible
2. Customer **Statement** → **Print** — readable ledger, no GST tax invoice layout required
3. Confirm **no GST Report** in Reports menu

---

## Success = All 8 blocks pass

If anything fails, note the step number and screenshot — we'll fix before production use.

**Clean test data (optional):**

```bash
pnpm db:wipe-keep-user:confirm
```

This removes all data except your login.