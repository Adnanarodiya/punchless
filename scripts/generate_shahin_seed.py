"""Generate Shahin Motors real data seed SQL from Tally Excel exports."""
import hashlib
import re
import uuid
from datetime import datetime
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "supabase" / "seed_shahin_real_data.sql"

KOTAK_BANK_ID = "88888888-8888-8888-8888-888888888888"
MARKER_INVOICE = "ISHABA2627000001"


def clean_name(n):
    if n is None or (isinstance(n, float) and pd.isna(n)):
        return None
    s = str(n).strip()
    s = re.sub(r"_x000D_", "", s)
    s = re.sub(r"\s+Ok(?=\s*\(|\s*$)", "", s, flags=re.I)
    s = re.sub(r"\s*-\s*$", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip() or None


def is_valid_party_name(name: str | None) -> bool:
    if not name:
        return False
    lower = name.lower().strip()
    if lower in ("income", "expense") or "cancelled" in lower:
        return False
    if re.fullmatch(r"\d+", name):
        return False
    if re.match(r"^\d+-Parts-", name, re.I):
        return False
    return True


def is_valid_amount(amount) -> bool:
    if amount is None or (isinstance(amount, float) and pd.isna(amount)):
        return False
    try:
        return float(amount) > 0
    except (TypeError, ValueError):
        return False


def sql_str(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def sql_num(n):
    if n is None or (isinstance(n, float) and pd.isna(n)):
        return "0"
    return str(round(float(n), 2))


def sql_date(d):
    if d is None or (isinstance(d, float) and pd.isna(d)):
        return "CURRENT_DATE"
    ts = pd.Timestamp(d)
    if pd.isna(ts):
        return "CURRENT_DATE"
    return f"'{ts.strftime('%Y-%m-%d')}'"


def valid_date(d):
    if d is None or (isinstance(d, float) and pd.isna(d)):
        return False
    return not pd.isna(pd.Timestamp(d))


def det_uuid(namespace: str, key: str) -> str:
    h = hashlib.md5(f"{namespace}:{key}".encode()).hexdigest()
    return str(uuid.UUID(h))


def is_indirect_expense(name: str) -> bool:
    lower = name.lower()
    keywords = (
        "salary",
        "rent",
        "housekeeping",
        "watchman",
        "electricity",
        "internet",
        "tea",
        "snack",
        "expense",
        " ca",
        "patel ca",
    )
    return any(k in lower for k in keywords)


def read_rows(path, sheet, header_row, col_names):
    df = pd.read_excel(ROOT / path, sheet_name=sheet, header=header_row)
    rows = []
    for tup in df.itertuples(index=False):
        vals = list(tup)
        if len(vals) < len(col_names):
            vals += [None] * (len(col_names) - len(vals))
        row = dict(zip(col_names, vals[: len(col_names)]))
        if not valid_date(row.get("date")):
            continue
        rows.append(row)
    return rows


def load_sales():
    rows = read_rows("Sale File.xls", "Sales Register", 2, ["date", "party", "voucher", "gstin", "amount"])
    out = []
    for r in rows:
        r["party"] = clean_name(r["party"])
        if not is_valid_party_name(r["party"]) or not is_valid_amount(r["amount"]):
            continue
        g = r["gstin"]
        r["gstin"] = None if g is None or (isinstance(g, float) and pd.isna(g)) else str(g).strip()
        out.append(r)
    return out


def load_purchases():
    rows = read_rows("Purchase File.xls", "Purchase Register", 1, ["date", "party", "invoice_no", "gstin", "amount"])
    out = []
    for r in rows:
        r["party"] = clean_name(r["party"])
        if not is_valid_party_name(r["party"]) or not is_valid_amount(r["amount"]):
            continue
        inv = r["invoice_no"]
        r["invoice_no"] = str(inv).strip() if inv is not None and not (isinstance(inv, float) and pd.isna(inv)) else None
        g = r["gstin"]
        r["gstin"] = None if g is None or (isinstance(g, float) and pd.isna(g)) else str(g).strip()
        out.append(r)
    return out


def load_cash():
    rows = read_rows("CASH Detail.xls", "Cash  Book", 1, ["date", "cr_dr", "party", "amount"])
    for r in rows:
        r["party"] = clean_name(r["party"])
    return rows


def load_bank_receipts():
    rows = read_rows("BANK Receipt.xls", "Kotak Bank 4112748249  Receipt", 1, ["date", "cr_dr", "party", "amount"])
    for r in rows:
        r["party"] = clean_name(r["party"])
    return rows


def load_bank_payments():
    df = pd.read_excel(ROOT / "Bank Payment.xls", sheet_name="Kotak Bank 4112748249 Payment", header=1)
    rows = []
    for tup in df.itertuples(index=False):
        vals = list(tup)
        date_v, cr_dr, party = vals[0], vals[1], vals[2]
        amount = vals[6] if len(vals) > 6 else None
        if not valid_date(date_v):
            continue
        rows.append({"date": date_v, "cr_dr": cr_dr, "party": clean_name(party), "amount": amount})
    return rows


def build_party_maps(sales, purchases):
    clients = {}
    client_gst = {}
    for row in sales:
        name = row["party"]
        if not name:
            continue
        clients[name] = det_uuid("client", name)
        if row["gstin"]:
            client_gst[name] = row["gstin"]

    suppliers = {}
    supplier_gst = {}
    for row in purchases:
        name = row["party"]
        if not name:
            continue
        suppliers[name] = det_uuid("supplier", name)
        if row["gstin"]:
            supplier_gst[name] = row["gstin"]

    return clients, client_gst, suppliers, supplier_gst


def resolve_receipt_party(name, clients):
    if name in clients:
        return clients[name], "receipt", name
    cid = det_uuid("client", name)
    clients[name] = cid
    return cid, "receipt", name


def resolve_payment_party(name, suppliers):
    if name in suppliers:
        return suppliers[name], "payment", False
    return None, "indirect_expense", True


def main():
    print("Loading Excel files...", flush=True)
    sales = load_sales()
    purchases = load_purchases()
    cash = load_cash()
    bank_rcpt = load_bank_receipts()
    bank_pay = load_bank_payments()
    bank_rcpt_f = [r for r in bank_rcpt if is_valid_party_name(r["party"]) and is_valid_amount(r["amount"])]
    bank_pay_f = [
        r
        for r in bank_pay
        if is_valid_amount(r["amount"])
        and (is_valid_party_name(r["party"]) or (r["party"] and is_indirect_expense(r["party"])))
    ]
    bank_receipts_total = sum(float(r["amount"]) for r in bank_rcpt_f)
    bank_payments_total = sum(float(r["amount"]) for r in bank_pay_f)
    bank_opening = round(max(0, bank_payments_total - bank_receipts_total), 2)
    cash_opening_row = next(
        (r for r in cash if r.get("party") and "opening balance" in str(r["party"]).lower()),
        None,
    )
    cash_opening = round(float(cash_opening_row["amount"]), 2) if cash_opening_row else 0
    print(f"Loaded: {len(sales)} sales, {len(purchases)} purchases, {len(cash)} cash, {len(bank_rcpt)} bank rcpt, {len(bank_pay)} bank pay", flush=True)
    print(f"  Bank opening (payments - receipts): {bank_opening}", flush=True)

    clients, client_gst, suppliers, supplier_gst = build_party_maps(sales, purchases)

    lines = [
        "-- ============================================",
        "-- Shahin Motors — Real Tally data (Apr–Jun 2026)",
        "-- Source: Sale/Purchase/Cash/Bank Excel exports",
        "-- Idempotent: skips if ISHABA2627000001 already exists.",
        "-- Bank: Kotak Bank 4112748249",
        "-- ============================================",
        "",
        "DO $$",
        "DECLARE",
        "  v_company_id UUID;",
        "  v_owner_id UUID;",
        f"  v_bank_kotak UUID := '{KOTAK_BANK_ID}';",
        "  v_supplier_expense UUID;",
        "BEGIN",
        "  SELECT u.company_id, u.id",
        "  INTO v_company_id, v_owner_id",
        "  FROM public.users u",
        "  WHERE u.role = 'owner'",
        "  ORDER BY u.created_at",
        "  LIMIT 1;",
        "",
        "  IF v_company_id IS NULL THEN",
        "    RAISE NOTICE 'Shahin seed: no company found. Skipping.';",
        "    RETURN;",
        "  END IF;",
        "",
        f"  IF EXISTS (",
        f"    SELECT 1 FROM public.invoices",
        f"    WHERE company_id = v_company_id AND invoice_number = '{MARKER_INVOICE}'",
        f"  ) THEN",
        "    RAISE NOTICE 'Shahin seed: real data already loaded. Skipping.';",
        "    RETURN;",
        "  END IF;",
        "",
        "  PERFORM public.ensure_system_parties(v_company_id);",
        "",
        "  SELECT id INTO v_supplier_expense",
        "  FROM public.suppliers",
        "  WHERE company_id = v_company_id AND name = 'EXPENSE' AND is_deleted = false",
        "  LIMIT 1;",
        "",
        "  RAISE NOTICE 'Shahin seed: loading real Tally data for company %', v_company_id;",
        "",
        "  INSERT INTO public.bank_accounts (",
        "    id, company_id, bank_name, account_name, account_number, opening_balance",
        "  ) VALUES (",
        f"    v_bank_kotak, v_company_id, 'Kotak Bank', 'Shahin Motors', '4112748249', {bank_opening}",
        "  ) ON CONFLICT (id) DO NOTHING;",
        "",
    ]
    if bank_opening > 0:
        lines.extend([
            f"  -- Kotak opening balance (so Apr–Jun net is not negative)",
            "  INSERT INTO public.ledger_entries (",
            "    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_id,",
            "    reference_type, reference_id, remark, entry_date, created_by",
            "  ) VALUES (",
            f"    v_company_id, 'bank', v_bank_kotak, 'credit', {bank_opening}, 'bank', v_bank_kotak,",
            "    'opening_balance', v_bank_kotak, 'Kotak Bank opening balance (1-Apr-2026)', '2026-04-01', v_owner_id",
            "  );",
            "",
        ])

    # Collect all client names from sales + receipts
    all_client_names = set(clients.keys())
    for row in cash:
        if (
            row["cr_dr"] == "Cr"
            and is_valid_party_name(row["party"])
            and "opening balance" not in row["party"].lower()
        ):
            all_client_names.add(row["party"])
            clients.setdefault(row["party"], det_uuid("client", row["party"]))
    for row in bank_rcpt:
        if is_valid_party_name(row["party"]):
            all_client_names.add(row["party"])
            clients.setdefault(row["party"], det_uuid("client", row["party"]))

    lines.append(f"  -- Clients ({len(all_client_names)})")
    for name in sorted(all_client_names):
        cid = clients[name]
        gst = client_gst.get(name)
        lines.append(
            f"  INSERT INTO public.clients (id, company_id, name, gst_number, opening_balance)"
        )
        lines.append(
            f"  VALUES ('{cid}', v_company_id, {sql_str(name)}, {sql_str(gst)}, 0);"
        )
    lines.append("")

    lines.append(f"  -- Suppliers ({len(suppliers)})")
    for name in sorted(suppliers.keys()):
        sid = suppliers[name]
        gst = supplier_gst.get(name)
        lines.append(
            f"  INSERT INTO public.suppliers (id, company_id, name, gst_number, opening_balance)"
        )
        lines.append(
            f"  VALUES ('{sid}', v_company_id, {sql_str(name)}, {sql_str(gst)}, 0);"
        )
    lines.append("")

    lines.append(f"  -- Sales bills ({len(sales)})")
    for i, row in enumerate(sales):
        inv_id = det_uuid("sale", str(row["voucher"]))
        cid = clients[row["party"]]
        amt = sql_num(row["amount"])
        voucher = str(row["voucher"]).strip()
        lines.append(
            f"  INSERT INTO public.invoices (id, company_id, client_id, invoice_number, invoice_date, taxable_amount, gst_percent, gst_amount, total_amount, payment_mode, cash_amount, bank_amount, credit_amount, entry_category, remark, created_by) VALUES ('{inv_id}', v_company_id, '{cid}', {sql_str(voucher)}, {sql_date(row['date'])}, {amt}, 0, 0, {amt}, 'credit', 0, 0, {amt}, 'sales_bill', {sql_str(row['party'])}, v_owner_id);"
        )
        lines.append(
            f"  INSERT INTO public.ledger_entries (company_id, entity_type, entity_id, entry_type, amount, reference_type, reference_id, remark, entry_date, entry_category, created_by) VALUES (v_company_id, 'client', '{cid}', 'debit', {amt}, 'invoice', '{inv_id}', 'Sales bill #{voucher}', {sql_date(row['date'])}, 'sales_bill', v_owner_id);"
        )
    lines.append("")

    lines.append(f"  -- Purchase bills ({len(purchases)})")
    for row in purchases:
        pur_id = det_uuid("purchase", f"{row['invoice_no']}|{row['date']}")
        sid = suppliers[row["party"]]
        amt = sql_num(row["amount"])
        inv_no = row["invoice_no"]
        lines.append(
            f"  INSERT INTO public.purchase_invoices (id, company_id, supplier_id, invoice_type, invoice_number, invoice_date, taxable_amount, gst_percent, gst_amount, total_amount, credit_amount, entry_category, remark, created_by) VALUES ('{pur_id}', v_company_id, '{sid}', 'purchase', {sql_str(inv_no)}, {sql_date(row['date'])}, {amt}, 0, 0, {amt}, {amt}, 'purchase_bill', {sql_str(row['party'])}, v_owner_id);"
        )
        lines.append(
            f"  INSERT INTO public.ledger_entries (company_id, entity_type, entity_id, entry_type, amount, reference_type, reference_id, remark, entry_date, entry_category, created_by) VALUES (v_company_id, 'supplier', '{sid}', 'credit', {amt}, 'purchase', '{pur_id}', 'Purchase bill #{inv_no}', {sql_date(row['date'])}, 'purchase_bill', v_owner_id);"
        )
    lines.append("")

    cash_cr = [
        r
        for r in cash
        if r["cr_dr"] == "Cr"
        and is_valid_party_name(r["party"])
        and "opening balance" not in r["party"].lower()
        and is_valid_amount(r["amount"])
    ]
    cash_dr = [
        r
        for r in cash
        if r["cr_dr"] == "Dr" and is_valid_party_name(r["party"]) and is_valid_amount(r["amount"])
    ]

    lines.append(f"  -- Cash receipts ({len(cash_cr)})")
    for i, row in enumerate(cash_cr):
        pay_id = det_uuid("cash_rcpt", f"{row['date']}|{row['party']}|{row['amount']}|{i}")
        cid, _, pname = resolve_receipt_party(row["party"], clients)
        amt = sql_num(row["amount"])
        remark = f"Payment received (cash) — {pname}"
        lines.append(
            f"  INSERT INTO public.client_payments (id, company_id, client_id, amount, payment_mode, payment_date, remark, entry_category, created_by) VALUES ('{pay_id}', v_company_id, '{cid}', {amt}, 'cash', {sql_date(row['date'])}, {sql_str(remark)}, 'receipt', v_owner_id);"
        )
        lines.append(
            f"  INSERT INTO public.ledger_entries (company_id, entity_type, entity_id, entry_type, amount, payment_mode, reference_type, reference_id, remark, entry_date, entry_category, created_by) VALUES (v_company_id, 'client', '{cid}', 'credit', {amt}, 'cash', 'payment', '{pay_id}', {sql_str(remark)}, {sql_date(row['date'])}, 'receipt', v_owner_id);"
        )
    lines.append("")

    lines.append(f"  -- Cash payments ({len(cash_dr)})")
    for i, row in enumerate(cash_dr):
        pay_id = det_uuid("cash_pay", f"{row['date']}|{row['party']}|{row['amount']}|{i}")
        pname = row["party"]
        sid, cat, is_indirect = resolve_payment_party(pname, suppliers)
        sid_expr = "v_supplier_expense" if is_indirect else f"'{sid}'"
        amt = sql_num(row["amount"])
        remark = f"Payment made (cash) — {pname}"
        lines.append(
            f"  INSERT INTO public.supplier_payments (id, company_id, supplier_id, amount, payment_mode, payment_date, remark, entry_category, created_by) VALUES ('{pay_id}', v_company_id, {sid_expr}, {amt}, 'cash', {sql_date(row['date'])}, {sql_str(remark)}, {sql_str(cat)}, v_owner_id);"
        )
        lines.append(
            f"  INSERT INTO public.ledger_entries (company_id, entity_type, entity_id, entry_type, amount, payment_mode, reference_type, reference_id, remark, entry_date, entry_category, created_by) VALUES (v_company_id, 'supplier', {sid_expr}, 'debit', {amt}, 'cash', 'payment', '{pay_id}', {sql_str(remark)}, {sql_date(row['date'])}, {sql_str(cat)}, v_owner_id);"
        )
    lines.append("")

    bank_rcpt = [
        r for r in bank_rcpt if is_valid_party_name(r["party"]) and is_valid_amount(r["amount"])
    ]
    bank_pay = [
        r
        for r in bank_pay
        if is_valid_amount(r["amount"])
        and (is_valid_party_name(r["party"]) or (r["party"] and is_indirect_expense(r["party"])))
    ]

    lines.append(f"  -- Bank receipts ({len(bank_rcpt)})")
    for i, row in enumerate(bank_rcpt):
        pay_id = det_uuid("bank_rcpt", f"{row['date']}|{row['party']}|{row['amount']}|{i}")
        cid, _, pname = resolve_receipt_party(row["party"], clients)
        amt = sql_num(row["amount"])
        remark = f"Payment received (bank) — {pname}"
        lines.append(
            f"  INSERT INTO public.client_payments (id, company_id, client_id, amount, payment_mode, bank_sub_mode, bank_id, payment_date, remark, entry_category, created_by) VALUES ('{pay_id}', v_company_id, '{cid}', {amt}, 'bank', 'net_banking', v_bank_kotak, {sql_date(row['date'])}, {sql_str(remark)}, 'receipt', v_owner_id);"
        )
        lines.append(
            f"  INSERT INTO public.ledger_entries (company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id, reference_type, reference_id, remark, entry_date, entry_category, created_by) VALUES (v_company_id, 'client', '{cid}', 'credit', {amt}, 'bank', 'net_banking', v_bank_kotak, 'payment', '{pay_id}', {sql_str(remark)}, {sql_date(row['date'])}, 'receipt', v_owner_id);"
        )
        lines.append(
            f"  INSERT INTO public.ledger_entries (company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id, reference_type, reference_id, remark, entry_date, entry_category, created_by) VALUES (v_company_id, 'bank', v_bank_kotak, 'credit', {amt}, 'bank', 'net_banking', v_bank_kotak, 'payment', '{pay_id}', {sql_str(remark)}, {sql_date(row['date'])}, 'receipt', v_owner_id);"
        )
    lines.append("")

    lines.append(f"  -- Bank payments ({len(bank_pay)})")
    for i, row in enumerate(bank_pay):
        pay_id = det_uuid("bank_pay", f"{row['date']}|{row['party']}|{row['amount']}|{i}")
        pname = row["party"]
        sid, cat, is_indirect = resolve_payment_party(pname, suppliers)
        sid_expr = "v_supplier_expense" if is_indirect else f"'{sid}'"
        amt = sql_num(row["amount"])
        remark = f"Payment made (bank) — {pname}"
        lines.append(
            f"  INSERT INTO public.supplier_payments (id, company_id, supplier_id, amount, payment_mode, bank_sub_mode, bank_id, payment_date, remark, entry_category, created_by) VALUES ('{pay_id}', v_company_id, {sid_expr}, {amt}, 'bank', 'net_banking', v_bank_kotak, {sql_date(row['date'])}, {sql_str(remark)}, {sql_str(cat)}, v_owner_id);"
        )
        lines.append(
            f"  INSERT INTO public.ledger_entries (company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id, reference_type, reference_id, remark, entry_date, entry_category, created_by) VALUES (v_company_id, 'supplier', {sid_expr}, 'debit', {amt}, 'bank', 'net_banking', v_bank_kotak, 'payment', '{pay_id}', {sql_str(remark)}, {sql_date(row['date'])}, {sql_str(cat)}, v_owner_id);"
        )
        lines.append(
            f"  INSERT INTO public.ledger_entries (company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id, reference_type, reference_id, remark, entry_date, entry_category, created_by) VALUES (v_company_id, 'bank', v_bank_kotak, 'debit', {amt}, 'bank', 'net_banking', v_bank_kotak, 'payment', '{pay_id}', {sql_str(remark)}, {sql_date(row['date'])}, {sql_str(cat)}, v_owner_id);"
        )
    lines.append("")

    lines.extend([
        f"  RAISE NOTICE 'Shahin seed complete: {len(sales)} sales, {len(purchases)} purchases,",
        f"    {len(cash_cr)} cash receipts, {len(cash_dr)} cash payments,",
        f"    {len(bank_rcpt)} bank receipts, {len(bank_pay)} bank payments';",
        "END $$;",
        "",
    ])

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Written {OUT} ({len(lines)} lines)", flush=True)


if __name__ == "__main__":
    main()