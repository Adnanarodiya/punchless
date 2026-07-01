-- ============================================
-- Punchless — Development Seed Data
-- ============================================
-- Populates demo data for ALL statement views:
--   • Client statement   (/dashboard/clients/.../statement)
--   • Supplier statement (/dashboard/suppliers/.../statement)
--   • Bank statement     (/dashboard/banks/.../statement)
--   • Staff statement    (/dashboard/employees/.../statement)
--
-- Idempotent:
--   Block 1 — skips if "Rajesh Transport" client already exists.
--   Block 2 — skips if "BILAL" client already exists (journal demo with ZAID supplier).
--
-- Fresh local reset login (only when no owner existed before seed):
--   Email:    owner@demo.punchless
--   Password: demo1234
--
-- Run: pnpm db:reset   (local)
-- Run: npx supabase db execute -f supabase/seed.sql --linked   (remote)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_company_id UUID;
  v_owner_id UUID;
  v_workshop_id UUID;
  v_post_mechanic UUID;
  v_post_helper UUID;
  v_emp1_id UUID;
  v_emp2_id UUID;
  v_bank_hdfc UUID;
  v_bank_sbi UUID;
  v_client_rajesh UUID;
  v_client_patel UUID;
  v_supplier_parts UUID;
  v_supplier_oil UUID;
  -- invoices / purchases / payments
  v_inv1 UUID;
  v_inv2 UUID;
  v_inv3 UUID;
  v_inv4 UUID;
  v_inv5 UUID;
  v_cp1 UUID;
  v_cp2 UUID;
  v_cp3 UUID;
  v_pur1 UUID;
  v_pur2 UUID;
  v_pur3 UUID;
  v_pur4 UUID;
  v_sp1 UUID;
  v_sp2 UUID;
  v_sp3 UUID;
  v_bt1 UUID;
  v_bt2 UUID;
  v_bt3 UUID;
  v_bt4 UUID;
  v_bt5 UUID;
  v_bt6 UUID;
  v_sd1 UUID;
  v_sd2 UUID;
  v_sd3 UUID;
  v_sd4 UUID;
  v_sd5 UUID;
  v_sd6 UUID;
  v_spay1 UUID;
  v_spay2 UUID;
  v_spay3 UUID;
  v_adv1 UUID;
BEGIN
  -- Resolve or bootstrap company + owner
  SELECT u.company_id, u.id
  INTO v_company_id, v_owner_id
  FROM public.users u
  WHERE u.role = 'owner'
  ORDER BY u.created_at
  LIMIT 1;

  IF v_company_id IS NULL THEN
    v_company_id := '11111111-1111-1111-1111-111111111111';
    v_owner_id := '22222222-2222-2222-2222-222222222222';

    INSERT INTO public.companies (
      id, name, tagline, address, phone, email,
      work_start_time, grace_period_minutes, daily_work_hours, working_days_per_month
    ) VALUES (
      v_company_id,
      'Shahin Demo Motors',
      'Premium Workshop & Body Shop',
      'Plot 12, GIDC Industrial Estate, Ahmedabad, Gujarat 380015',
      '+91 98765 43210',
      'accounts@shahindemo.in',
      '10:00', 5, 8, 26
    );

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_owner_id,
      'authenticated',
      'authenticated',
      'owner@demo.punchless',
      crypt('demo1234', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Raju Owner"}',
      NOW(), NOW(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_owner_id,
      v_owner_id,
      jsonb_build_object('sub', v_owner_id::text, 'email', 'owner@demo.punchless'),
      'email',
      v_owner_id::text,
      NOW(), NOW(), NOW()
    );

    INSERT INTO public.users (
      id, company_id, role, full_name, email, phone, monthly_salary, is_active
    ) VALUES (
      v_owner_id, v_company_id, 'owner', 'Raju Owner', 'owner@demo.punchless',
      '9876543210', NULL, true
    );
  ELSE
    UPDATE public.companies SET
      tagline = COALESCE(tagline, 'Premium Workshop & Body Shop'),
      address = COALESCE(address, 'Plot 12, GIDC Industrial Estate, Ahmedabad, Gujarat 380015'),
      phone = COALESCE(phone, '+91 98765 43210'),
      email = COALESCE(email, 'accounts@shahindemo.in')
    WHERE id = v_company_id;
  END IF;

  -- Skip if demo clients already seeded for this company
  IF EXISTS (
    SELECT 1 FROM public.clients
    WHERE company_id = v_company_id AND name = 'Rajesh Transport'
  ) THEN
    RAISE NOTICE 'Punchless seed: demo statement data already exists for company %. Skipping.', v_company_id;
    RETURN;
  END IF;

  RAISE NOTICE 'Punchless seed: inserting statement demo data for company %', v_company_id;

  -- Workshop
  INSERT INTO public.workshops (
    id, company_id, name, address, lat, lng, radius, is_active
  ) VALUES (
    '55555555-5555-5555-5555-555555555555',
    v_company_id,
    'Main Workshop',
    'GIDC Ahmedabad',
    23.0225, 72.5714, 120, true
  )
  ON CONFLICT (id) DO NOTHING;
  v_workshop_id := '55555555-5555-5555-5555-555555555555';

  -- Posts
  INSERT INTO public.posts (id, company_id, name) VALUES
    ('e1111111-1111-1111-1111-111111111111', v_company_id, 'Senior Mechanic'),
    ('e2222222-2222-2222-2222-222222222222', v_company_id, 'Helper')
  ON CONFLICT DO NOTHING;
  v_post_mechanic := 'e1111111-1111-1111-1111-111111111111';
  v_post_helper := 'e2222222-2222-2222-2222-222222222222';

  -- Employees (create auth only if missing)
  v_emp1_id := '33333333-3333-3333-3333-333333333333';
  v_emp2_id := '44444444-4444-4444-4444-444444444444';

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_emp1_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_emp1_id, 'authenticated', 'authenticated',
      'mechanic@demo.punchless', crypt('demo1234', gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}',
      '{"full_name":"Vikram Mechanic"}',
      NOW(), NOW(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_emp1_id, v_emp1_id,
      jsonb_build_object('sub', v_emp1_id::text, 'email', 'mechanic@demo.punchless'),
      'email', v_emp1_id::text, NOW(), NOW(), NOW()
    );
    INSERT INTO public.users (
      id, company_id, role, full_name, email, phone, workshop_id, post_id,
      monthly_salary, joining_date, address, account_no, ifsc_code, hourly_rate, is_active
    ) VALUES (
      v_emp1_id, v_company_id, 'employee', 'Vikram Mechanic', 'mechanic@demo.punchless',
      '9123456780', v_workshop_id, v_post_mechanic, 32000, '2024-06-01',
      'Naroda, Ahmedabad', '123456789012', 'HDFC0001234', 153.85, true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_emp2_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_emp2_id, 'authenticated', 'authenticated',
      'helper@demo.punchless', crypt('demo1234', gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}',
      '{"full_name":"Suresh Helper"}',
      NOW(), NOW(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_emp2_id, v_emp2_id,
      jsonb_build_object('sub', v_emp2_id::text, 'email', 'helper@demo.punchless'),
      'email', v_emp2_id::text, NOW(), NOW(), NOW()
    );
    INSERT INTO public.users (
      id, company_id, role, full_name, email, phone, workshop_id, post_id,
      monthly_salary, joining_date, hourly_rate, is_active
    ) VALUES (
      v_emp2_id, v_company_id, 'employee', 'Suresh Helper', 'helper@demo.punchless',
      '9123456781', v_workshop_id, v_post_helper, 18000, '2025-01-15', 86.54, true
    );
  END IF;

  -- Banks
  v_bank_hdfc := '66666666-6666-6666-6666-666666666666';
  v_bank_sbi := '77777777-7777-7777-7777-777777777777';

  INSERT INTO public.bank_accounts (
    id, company_id, bank_name, account_name, account_number, ifsc_code, opening_balance
  ) VALUES
    (v_bank_hdfc, v_company_id, 'HDFC Bank', 'Shahin Demo Motors', '50100123456789', 'HDFC0001234', 150000),
    (v_bank_sbi, v_company_id, 'State Bank of India', 'Shahin Demo Motors', '30012345678', 'SBIN0000456', 85000);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_id,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES
    (v_company_id, 'bank', v_bank_hdfc, 'credit', 150000, 'bank', v_bank_hdfc,
     'opening_balance', v_bank_hdfc, 'Opening balance', '2025-04-01', v_owner_id),
    (v_company_id, 'bank', v_bank_sbi, 'credit', 85000, 'bank', v_bank_sbi,
     'opening_balance', v_bank_sbi, 'Opening balance', '2025-04-01', v_owner_id);

  -- Clients
  v_client_rajesh := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_client_patel := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  INSERT INTO public.clients (
    id, company_id, name, alias, contact, address, gst_number, opening_balance
  ) VALUES
    (v_client_rajesh, v_company_id, 'Rajesh Transport', 'RT', '9988776655',
     'Ring Road, Surat, Gujarat', '24AABCR1234A1Z5', 25000),
    (v_client_patel, v_company_id, 'Patel Fleet Services', 'PFS', '9876501234',
     'Vadodara, Gujarat', '24AABCP5678B1Z9', 8000);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES
    (v_company_id, 'client', v_client_rajesh, 'debit', 25000,
     'opening_balance', v_client_rajesh, 'Opening balance', '2025-04-01', v_owner_id),
    (v_company_id, 'client', v_client_patel, 'debit', 8000,
     'opening_balance', v_client_patel, 'Opening balance', '2025-04-01', v_owner_id);

  -- Tax invoices (Rajesh — rich statement)
  v_inv1 := 'f1111111-1111-1111-1111-111111111111';
  v_inv2 := 'f2222222-2222-2222-2222-222222222222';
  v_inv3 := 'f3333333-3333-3333-3333-333333333333';
  v_inv4 := 'f4444444-4444-4444-4444-444444444444';
  v_inv5 := 'f5555555-5555-5555-5555-555555555555';

  INSERT INTO public.invoices (
    id, company_id, client_id, invoice_number, invoice_date, vehicle_number,
    taxable_amount, gst_percent, gst_amount, total_amount,
    payment_mode, cash_amount, bank_amount, credit_amount, bank_id, remark, created_by
  ) VALUES
    (v_inv1, v_company_id, v_client_rajesh, 'INV-2504-001', '2025-04-12', 'GJ01AB1234',
     40000, 18, 7200, 47200, 'credit', 0, 0, 47200, NULL, 'Full body repaint — Tata 407', v_owner_id),
    (v_inv2, v_company_id, v_client_rajesh, 'INV-2505-014', '2025-05-08', 'GJ01CD5678',
     22000, 18, 3960, 25960, 'split', 12000, 0, 13960, NULL, 'Engine overhaul — partial cash', v_owner_id),
    (v_inv3, v_company_id, v_client_rajesh, 'INV-2506-022', '2025-06-18', 'GJ01AB1234',
     15000, 12, 1800, 16800, 'cash', 16800, 0, 0, NULL, 'Brake pad replacement — paid cash', v_owner_id),
    (v_inv4, v_company_id, v_client_rajesh, 'INV-2601-003', '2026-01-20', 'GJ27TX9999',
     35000, 18, 6300, 41300, 'split', 0, 15000, 26300, v_bank_hdfc, 'AC repair + denting', v_owner_id),
    (v_inv5, v_company_id, v_client_rajesh, 'INV-2606-011', '2026-06-10', 'GJ01AB1234',
     28000, 18, 5040, 33040, 'credit', 0, 0, 33040, NULL, 'Clutch + flywheel job', v_owner_id);

  INSERT INTO public.invoice_line_items (
    invoice_id, description, quantity, unit_price, gst_percent, amount, sort_order
  ) VALUES
    (v_inv1, 'Full body repaint labour', 1, 40000, 18, 40000, 0),
    (v_inv2, 'Engine overhaul labour', 1, 22000, 18, 22000, 0),
    (v_inv3, 'Brake pads + labour', 1, 15000, 12, 15000, 0),
    (v_inv4, 'AC gas refill + panel work', 1, 35000, 18, 35000, 0),
    (v_inv5, 'Clutch kit + flywheel', 1, 28000, 18, 28000, 0);

  -- Client ledger for invoices (debit unpaid + credit cash/bank portions)
  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES
    (v_company_id, 'client', v_client_rajesh, 'debit', 47200, NULL, 'invoice', v_inv1, 'Tax invoice #INV-2504-001', '2025-04-12', v_owner_id),
    (v_company_id, 'client', v_client_rajesh, 'credit', 12000, 'cash', 'payment', v_inv2, 'Tax invoice #INV-2505-014 — cash', '2025-05-08', v_owner_id),
    (v_company_id, 'client', v_client_rajesh, 'debit', 13960, NULL, 'invoice', v_inv2, 'Tax invoice #INV-2505-014', '2025-05-08', v_owner_id),
    (v_company_id, 'client', v_client_rajesh, 'credit', 16800, 'cash', 'payment', v_inv3, 'Tax invoice #INV-2506-022 — cash', '2025-06-18', v_owner_id),
    (v_company_id, 'client', v_client_rajesh, 'credit', 15000, 'bank', 'payment', v_inv4, 'Tax invoice #INV-2601-003 — bank', '2026-01-20', v_owner_id),
    (v_company_id, 'client', v_client_rajesh, 'debit', 26300, NULL, 'invoice', v_inv4, 'Tax invoice #INV-2601-003', '2026-01-20', v_owner_id),
    (v_company_id, 'client', v_client_rajesh, 'debit', 33040, NULL, 'invoice', v_inv5, 'Tax invoice #INV-2606-011', '2026-06-10', v_owner_id);

  -- Standalone client payments
  v_cp1 := 'c1111111-1111-1111-1111-111111111111';
  v_cp2 := 'c2222222-2222-2222-2222-222222222222';
  v_cp3 := 'c3333333-3333-3333-3333-333333333333';

  INSERT INTO public.client_payments (
    id, company_id, client_id, amount, payment_mode, bank_id, payment_date, remark, created_by
  ) VALUES
    (v_cp1, v_company_id, v_client_rajesh, 20000, 'bank', v_bank_hdfc, '2025-05-25', 'NEFT — part payment', v_owner_id),
    (v_cp2, v_company_id, v_client_rajesh, 15000, 'cash', NULL, '2026-02-10', 'Cash against Jan invoice', v_owner_id),
    (v_cp3, v_company_id, v_client_patel, 5000, 'cash', NULL, '2025-07-05', 'On-account payment', v_owner_id);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_id,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES
    (v_company_id, 'client', v_client_rajesh, 'credit', 20000, 'bank', v_bank_hdfc, 'payment', v_cp1, 'Payment received — NEFT', '2025-05-25', v_owner_id),
    (v_company_id, 'client', v_client_rajesh, 'credit', 15000, 'cash', NULL, 'payment', v_cp2, 'Payment received — cash', '2026-02-10', v_owner_id),
    (v_company_id, 'client', v_client_patel, 'credit', 5000, 'cash', NULL, 'payment', v_cp3, 'Payment received — on account', '2025-07-05', v_owner_id);

  -- Patel client — one more invoice
  INSERT INTO public.invoices (
    id, company_id, client_id, invoice_number, invoice_date, vehicle_number,
    taxable_amount, gst_percent, gst_amount, total_amount,
    payment_mode, cash_amount, bank_amount, credit_amount, created_by
  ) VALUES (
    'f6666666-6666-6666-6666-666666666666', v_company_id, v_client_patel, 'INV-2508-007', '2025-08-14', 'GJ06XY1122',
    12000, 18, 2160, 14160, 'credit', 0, 0, 14160, v_owner_id
  );
  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES (
    v_company_id, 'client', v_client_patel, 'debit', 14160, 'invoice',
    'f6666666-6666-6666-6666-666666666666', 'Tax invoice #INV-2508-007', '2025-08-14', v_owner_id
  );

  -- Suppliers
  v_supplier_parts := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_supplier_oil := 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  INSERT INTO public.suppliers (
    id, company_id, name, alias, contact, address, gst_number, opening_balance
  ) VALUES
    (v_supplier_parts, v_company_id, 'Auto Parts Hub', 'APH', '9012345678',
     'Sanand GIDC, Ahmedabad', '24AABCA9999C1Z1', 18000),
    (v_supplier_oil, v_company_id, 'Gujarat Lube Traders', 'GLT', '9098765432',
     'Narol, Ahmedabad', '24AABCG8888D1Z2', 6000);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES
    (v_company_id, 'supplier', v_supplier_parts, 'credit', 18000, 'opening_balance', v_supplier_parts, 'Opening balance', '2025-04-01', v_owner_id),
    (v_company_id, 'supplier', v_supplier_oil, 'credit', 6000, 'opening_balance', v_supplier_oil, 'Opening balance', '2025-04-01', v_owner_id);

  v_pur1 := '0a111111-1111-1111-1111-111111111111';
  v_pur2 := '0a222222-2222-2222-2222-222222222222';
  v_pur3 := '0a333333-3333-3333-3333-333333333333';
  v_pur4 := '0a444444-4444-4444-4444-444444444444';

  INSERT INTO public.purchase_invoices (
    id, company_id, supplier_id, invoice_type, invoice_number, invoice_date,
    taxable_amount, gst_percent, gst_amount, total_amount, remark, created_by
  ) VALUES
    (v_pur1, v_company_id, v_supplier_parts, 'purchase', 'PI-2504-88', '2025-04-20', 24000, 18, 4320, 28320, 'Clutch kit + bearings', v_owner_id),
    (v_pur2, v_company_id, v_supplier_parts, 'purchase', 'PI-2507-102', '2025-07-11', 18500, 18, 3330, 21830, 'Brake discs + pads bulk', v_owner_id),
    (v_pur3, v_company_id, v_supplier_parts, 'purchase', 'PI-2605-045', '2026-05-22', 12000, 12, 1440, 13440, 'Filters + belts', v_owner_id),
    (v_pur4, v_company_id, v_supplier_oil, 'purchase', 'PI-2509-031', '2025-09-03', 9500, 18, 1710, 11210, 'Engine oil 15W40 — 20 cartons', v_owner_id);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES
    (v_company_id, 'supplier', v_supplier_parts, 'credit', 28320, 'purchase', v_pur1, 'Purchase invoice #PI-2504-88', '2025-04-20', v_owner_id),
    (v_company_id, 'supplier', v_supplier_parts, 'credit', 21830, 'purchase', v_pur2, 'Purchase invoice #PI-2507-102', '2025-07-11', v_owner_id),
    (v_company_id, 'supplier', v_supplier_parts, 'credit', 13440, 'purchase', v_pur3, 'Purchase invoice #PI-2605-045', '2026-05-22', v_owner_id),
    (v_company_id, 'supplier', v_supplier_oil, 'credit', 11210, 'purchase', v_pur4, 'Purchase invoice #PI-2509-031', '2025-09-03', v_owner_id);

  v_sp1 := '0b111111-1111-1111-1111-111111111111';
  v_sp2 := '0b222222-2222-2222-2222-222222222222';
  v_sp3 := '0b333333-3333-3333-3333-333333333333';

  INSERT INTO public.supplier_payments (
    id, company_id, supplier_id, amount, payment_mode, bank_id, payment_date, remark, created_by
  ) VALUES
    (v_sp1, v_company_id, v_supplier_parts, 15000, 'bank', v_bank_hdfc, '2025-05-30', 'RTGS — April parts', v_owner_id),
    (v_sp2, v_company_id, v_supplier_parts, 12000, 'cash', NULL, '2025-08-01', 'Cash payment', v_owner_id),
    (v_sp3, v_company_id, v_supplier_oil, 8000, 'bank', v_bank_sbi, '2025-10-15', 'Cheque cleared', v_owner_id);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_id,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES
    (v_company_id, 'supplier', v_supplier_parts, 'debit', 15000, 'bank', v_bank_hdfc, 'payment', v_sp1, 'Payment made — RTGS', '2025-05-30', v_owner_id),
    (v_company_id, 'supplier', v_supplier_parts, 'debit', 12000, 'cash', NULL, 'payment', v_sp2, 'Payment made — cash', '2025-08-01', v_owner_id),
    (v_company_id, 'supplier', v_supplier_oil, 'debit', 8000, 'bank', v_bank_sbi, 'payment', v_sp3, 'Payment made — cheque', '2025-10-15', v_owner_id);

  -- Bank transactions + ledger
  v_bt1 := 'b1111111-1111-1111-1111-111111111111';
  v_bt2 := 'b2222222-2222-2222-2222-222222222222';
  v_bt3 := 'b3333333-3333-3333-3333-333333333333';
  v_bt4 := 'b4444444-4444-4444-4444-444444444444';
  v_bt5 := 'b5555555-5555-5555-5555-555555555555';
  v_bt6 := 'b6666666-6666-6666-6666-666666666666';

  INSERT INTO public.bank_transactions (
    id, company_id, bank_id, transaction_type, amount, transaction_date, remark, created_by
  ) VALUES
    (v_bt1, v_company_id, v_bank_hdfc, 'deposit', 45000, '2025-04-28', 'Client collection deposit', v_owner_id),
    (v_bt2, v_company_id, v_bank_hdfc, 'withdraw', 22000, '2025-05-30', 'Supplier RTGS', v_owner_id),
    (v_bt3, v_company_id, v_bank_hdfc, 'deposit', 35000, '2026-01-22', 'January collections', v_owner_id),
    (v_bt4, v_company_id, v_bank_hdfc, 'withdraw', 8000, '2026-03-05', 'Office rent', v_owner_id),
    (v_bt5, v_company_id, v_bank_sbi, 'deposit', 25000, '2025-06-15', 'Cash deposit from counter', v_owner_id),
    (v_bt6, v_company_id, v_bank_sbi, 'withdraw', 12000, '2025-10-16', 'Supplier cheque', v_owner_id);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_id,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES
    (v_company_id, 'bank', v_bank_hdfc, 'credit', 45000, 'bank', v_bank_hdfc, 'bank_transaction', v_bt1, 'Deposit — client collection', '2025-04-28', v_owner_id),
    (v_company_id, 'bank', v_bank_hdfc, 'debit', 22000, 'bank', v_bank_hdfc, 'bank_transaction', v_bt2, 'Withdraw — supplier RTGS', '2025-05-30', v_owner_id),
    (v_company_id, 'bank', v_bank_hdfc, 'credit', 35000, 'bank', v_bank_hdfc, 'bank_transaction', v_bt3, 'Deposit — January collections', '2026-01-22', v_owner_id),
    (v_company_id, 'bank', v_bank_hdfc, 'debit', 8000, 'bank', v_bank_hdfc, 'bank_transaction', v_bt4, 'Withdraw — office rent', '2026-03-05', v_owner_id),
    (v_company_id, 'bank', v_bank_sbi, 'credit', 25000, 'bank', v_bank_sbi, 'bank_transaction', v_bt5, 'Deposit — counter cash', '2025-06-15', v_owner_id),
    (v_company_id, 'bank', v_bank_sbi, 'debit', 12000, 'bank', v_bank_sbi, 'bank_transaction', v_bt6, 'Withdraw — supplier cheque', '2025-10-16', v_owner_id);

  -- Staff statement (Vikram) — deposits, payments, advance
  v_sd1 := 'd1111111-1111-1111-1111-111111111111';
  v_sd2 := 'd2222222-2222-2222-2222-222222222222';
  v_sd3 := 'd3333333-3333-3333-3333-333333333333';
  v_sd4 := 'd4444444-4444-4444-4444-444444444444';
  v_sd5 := 'd5555555-5555-5555-5555-555555555555';
  v_sd6 := 'd6666666-6666-6666-6666-666666666666';

  INSERT INTO public.salary_deposits (
    id, company_id, employee_id, amount, deposit_date, remark, created_by
  ) VALUES
    (v_sd1, v_company_id, v_emp1_id, 32000, '2025-04-30', 'April salary accrual', v_owner_id),
    (v_sd2, v_company_id, v_emp1_id, 32000, '2025-05-31', 'May salary accrual', v_owner_id),
    (v_sd3, v_company_id, v_emp1_id, 32000, '2025-06-30', 'June salary accrual', v_owner_id),
    (v_sd4, v_company_id, v_emp1_id, 32000, '2026-01-31', 'January salary accrual', v_owner_id),
    (v_sd5, v_company_id, v_emp1_id, 32000, '2026-02-28', 'February salary accrual', v_owner_id),
    (v_sd6, v_company_id, v_emp1_id, 32000, '2026-06-30', 'June 2026 salary accrual', v_owner_id);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES
    (v_company_id, 'staff', v_emp1_id, 'credit', 32000, 'salary_deposit', v_sd1, 'Salary deposit — Vikram Mechanic', '2025-04-30', v_owner_id),
    (v_company_id, 'staff', v_emp1_id, 'credit', 32000, 'salary_deposit', v_sd2, 'Salary deposit — Vikram Mechanic', '2025-05-31', v_owner_id),
    (v_company_id, 'staff', v_emp1_id, 'credit', 32000, 'salary_deposit', v_sd3, 'Salary deposit — Vikram Mechanic', '2025-06-30', v_owner_id),
    (v_company_id, 'staff', v_emp1_id, 'credit', 32000, 'salary_deposit', v_sd4, 'Salary deposit — Vikram Mechanic', '2026-01-31', v_owner_id),
    (v_company_id, 'staff', v_emp1_id, 'credit', 32000, 'salary_deposit', v_sd5, 'Salary deposit — Vikram Mechanic', '2026-02-28', v_owner_id),
    (v_company_id, 'staff', v_emp1_id, 'credit', 32000, 'salary_deposit', v_sd6, 'Salary deposit — Vikram Mechanic', '2026-06-30', v_owner_id);

  v_spay1 := 'a0111111-1111-1111-1111-111111111111';
  v_spay2 := 'a0222222-2222-2222-2222-222222222222';
  v_spay3 := 'a0333333-3333-3333-3333-333333333333';

  INSERT INTO public.staff_payments (
    id, company_id, employee_id, payment_type, amount, payment_mode, bank_id, payment_date, remark, created_by
  ) VALUES
    (v_spay1, v_company_id, v_emp1_id, 'advance', 5000, 'cash', NULL, '2025-05-05', 'Festival advance', v_owner_id),
    (v_spay2, v_company_id, v_emp1_id, 'salary_paid', 30000, 'bank', v_bank_hdfc, '2025-05-05', 'April salary paid', v_owner_id),
    (v_spay3, v_company_id, v_emp1_id, 'salary_paid', 32000, 'bank', v_bank_hdfc, '2026-02-05', 'January salary paid', v_owner_id);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_id,
    reference_type, reference_id, remark, entry_date, created_by
  ) VALUES
    (v_company_id, 'staff', v_emp1_id, 'debit', 5000, 'cash', NULL, 'staff_payment', v_spay1, 'Advance — Vikram Mechanic', '2025-05-05', v_owner_id),
    (v_company_id, 'staff', v_emp1_id, 'debit', 30000, 'bank', v_bank_hdfc, 'staff_payment', v_spay2, 'Salary paid — Vikram Mechanic', '2025-05-05', v_owner_id),
    (v_company_id, 'staff', v_emp1_id, 'debit', 32000, 'bank', v_bank_hdfc, 'staff_payment', v_spay3, 'Salary paid — Vikram Mechanic', '2026-02-05', v_owner_id);

  v_adv1 := 'a0444444-4444-4444-4444-444444444444';
  INSERT INTO public.salary_advances (
    id, company_id, employee_id, amount, reason, status, approved_by, approved_at, salary_month
  ) VALUES (
    v_adv1, v_company_id, v_emp1_id, 3000, 'Medical emergency', 'approved',
    v_owner_id, '2025-08-12 10:00:00+00', '2025-08'
  );

  RAISE NOTICE 'Punchless seed complete. View statements:';
  RAISE NOTICE '  Client:   Rajesh Transport (primary demo)';
  RAISE NOTICE '  Supplier: Auto Parts Hub';
  RAISE NOTICE '  Bank:     HDFC Bank';
  RAISE NOTICE '  Staff:    Vikram Mechanic';
END $$;

-- ============================================
-- Journal demo: BILAL (customer) + ZAID (supplier)
-- 10 sales bills + 10 purchase bills with discounts, CN/DN, payments
-- Idempotent: skips if BILAL client already exists.
-- ============================================

DO $$
DECLARE
  v_company_id UUID;
  v_owner_id UUID;
  v_bank_hdfc UUID;
  v_client_bilal UUID := 'b1111111-b111-b111-b111-b11111111111';
  v_supplier_zaid UUID := 'a2111111-1111-1111-1111-111111111111';
  v_bil_inv1 UUID := 'c1000001-0001-4001-8001-000000000001';
  v_bil_inv2 UUID := 'c1000002-0001-4001-8001-000000000002';
  v_bil_inv3 UUID := 'c1000003-0001-4001-8001-000000000003';
  v_bil_inv4 UUID := 'c1000004-0001-4001-8001-000000000004';
  v_bil_inv5 UUID := 'c1000005-0001-4001-8001-000000000005';
  v_bil_inv6 UUID := 'c1000006-0001-4001-8001-000000000006';
  v_bil_inv7 UUID := 'c1000007-0001-4001-8001-000000000007';
  v_bil_inv8 UUID := 'c1000008-0001-4001-8001-000000000008';
  v_bil_inv9 UUID := 'c1000009-0001-4001-8001-000000000009';
  v_bil_inv10 UUID := 'c100000a-0001-4001-8001-00000000000a';
  v_zaid_pur1 UUID := 'd1000001-0001-4001-8001-000000000001';
  v_zaid_pur2 UUID := 'd1000002-0001-4001-8001-000000000002';
  v_zaid_pur3 UUID := 'd1000003-0001-4001-8001-000000000003';
  v_zaid_pur4 UUID := 'd1000004-0001-4001-8001-000000000004';
  v_zaid_pur5 UUID := 'd1000005-0001-4001-8001-000000000005';
  v_zaid_pur6 UUID := 'd1000006-0001-4001-8001-000000000006';
  v_zaid_pur7 UUID := 'd1000007-0001-4001-8001-000000000007';
  v_zaid_pur8 UUID := 'd1000008-0001-4001-8001-000000000008';
  v_zaid_pur9 UUID := 'd1000009-0001-4001-8001-000000000009';
  v_zaid_pur10 UUID := 'd100000a-0001-4001-8001-00000000000a';
  v_ds_bil2 UUID := 'e1000002-0001-4001-8001-000000000002';
  v_ds_bil8 UUID := 'e1000008-0001-4001-8001-000000000008';
  v_ds_zaid2 UUID := 'e2000002-0001-4001-8001-000000000002';
  v_ds_zaid5 UUID := 'e2000005-0001-4001-8001-000000000005';
  v_ds_zaid8 UUID := 'e2000008-0001-4001-8001-000000000008';
  v_cp_bil2 UUID := 'f1000002-0001-4001-8001-000000000002';
  v_cp_bil8 UUID := 'f1000008-0001-4001-8001-000000000008';
  v_cp_bil9 UUID := 'f1000009-0001-4001-8001-000000000009';
  v_sp_zaid2 UUID := 'f2000002-0001-4001-8001-000000000002';
  v_sp_zaid4 UUID := 'f2000004-0001-4001-8001-000000000004';
  v_sp_zaid5 UUID := 'f2000005-0001-4001-8001-000000000005';
  v_sp_zaid7 UUID := 'f2000007-0001-4001-8001-000000000007';
  v_sp_zaid8 UUID := 'f2000008-0001-4001-8001-000000000008';
  v_sp_zaid10 UUID := 'f200000a-0001-4001-8001-00000000000a';
  v_cn1 UUID := 'a1000001-0001-4001-8001-000000000001';
  v_cn2 UUID := 'a1000002-0001-4001-8001-000000000002';
  v_dn1 UUID := 'a2000001-0001-4001-8001-000000000001';
BEGIN
  SELECT u.company_id, u.id
  INTO v_company_id, v_owner_id
  FROM public.users u
  WHERE u.role = 'owner'
  ORDER BY u.created_at
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE NOTICE 'Journal seed: no company found. Run main seed first.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.clients
    WHERE company_id = v_company_id AND name = 'BILAL'
  ) THEN
    RAISE NOTICE 'Journal seed: BILAL demo already exists for company %. Skipping.', v_company_id;
    RETURN;
  END IF;

  SELECT id INTO v_bank_hdfc
  FROM public.bank_accounts
  WHERE company_id = v_company_id AND bank_name = 'HDFC Bank'
  LIMIT 1;

  IF v_bank_hdfc IS NULL THEN
    RAISE NOTICE 'Journal seed: HDFC bank not found. Run main seed first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Journal seed: inserting BILAL + ZAID demo for company %', v_company_id;

  INSERT INTO public.clients (
    id, company_id, name, alias, contact, address, opening_balance
  ) VALUES (
    v_client_bilal, v_company_id, 'BILAL', 'BIL', '9900112233',
    'Navrangpura, Ahmedabad', 0
  );

  INSERT INTO public.suppliers (
    id, company_id, name, alias, contact, address, opening_balance
  ) VALUES (
    v_supplier_zaid, v_company_id, 'ZAID', 'ZAI', '9900334455',
    'Naroda, Ahmedabad', 0
  );

  -- BILAL — 10 sales bills (bookkeeping, no GST)
  INSERT INTO public.invoices (
    id, company_id, client_id, invoice_number, invoice_date, vehicle_number,
    taxable_amount, gst_percent, gst_amount, total_amount,
    payment_mode, cash_amount, bank_amount, credit_amount, remark, created_by
  ) VALUES
    (v_bil_inv1, v_company_id, v_client_bilal, 'SB-BIL-001', '2026-01-05', 'GJ01BL1001',
     10000, 0, 0, 10000, 'credit', 0, 0, 10000, 'General repair — open', v_owner_id),
    (v_bil_inv2, v_company_id, v_client_bilal, 'SB-BIL-002', '2026-01-10', 'GJ01BL1002',
     15000, 0, 0, 15000, 'credit', 0, 0, 0, 'Paint job — discount + cash settled', v_owner_id),
    (v_bil_inv3, v_company_id, v_client_bilal, 'SB-BIL-003', '2026-01-15', 'GJ01BL1003',
     12000, 0, 0, 12000, 'credit', 0, 0, 9000, 'Service — partial credit note', v_owner_id),
    (v_bil_inv4, v_company_id, v_client_bilal, 'SB-BIL-004', '2026-01-20', 'GJ01BL1004',
     8000, 0, 0, 8000, 'credit', 0, 0, 8000, 'Wheel alignment — open', v_owner_id),
    (v_bil_inv5, v_company_id, v_client_bilal, 'SB-BIL-005', '2026-02-01', 'GJ01BL1005',
     20000, 0, 0, 20000, 'credit', 0, 0, 21500, 'Engine work — debit note added', v_owner_id),
    (v_bil_inv6, v_company_id, v_client_bilal, 'SB-BIL-006', '2026-02-05', 'GJ01BL1006',
     5000, 0, 0, 5000, 'credit', 0, 0, 0, 'Minor service — fully credited off', v_owner_id),
    (v_bil_inv7, v_company_id, v_client_bilal, 'SB-BIL-007', '2026-02-10', 'GJ01BL1007',
     18000, 0, 0, 18000, 'credit', 0, 0, 18000, 'AC repair — open', v_owner_id),
    (v_bil_inv8, v_company_id, v_client_bilal, 'SB-BIL-008', '2026-02-15', 'GJ01BL1008',
     22000, 0, 0, 22000, 'credit', 0, 0, 0, 'Body work — discount + bank settled', v_owner_id),
    (v_bil_inv9, v_company_id, v_client_bilal, 'SB-BIL-009', '2026-02-20', 'GJ01BL1009',
     9000, 0, 0, 9000, 'credit', 0, 0, 0, 'Oil change — paid in full', v_owner_id),
    (v_bil_inv10, v_company_id, v_client_bilal, 'SB-BIL-010', '2026-06-01', 'GJ01BL1010',
     16000, 0, 0, 16000, 'credit', 0, 0, 16000, 'Clutch job — open', v_owner_id);

  INSERT INTO public.invoice_line_items (invoice_id, description, quantity, unit_price, gst_percent, amount, sort_order)
  VALUES
    (v_bil_inv1, 'Labour + parts', 1, 10000, 0, 10000, 0),
    (v_bil_inv2, 'Full paint', 1, 15000, 0, 15000, 0),
    (v_bil_inv3, 'Periodic service', 1, 12000, 0, 12000, 0),
    (v_bil_inv4, 'Wheel alignment', 1, 8000, 0, 8000, 0),
    (v_bil_inv5, 'Engine overhaul', 1, 20000, 0, 20000, 0),
    (v_bil_inv6, 'Minor service', 1, 5000, 0, 5000, 0),
    (v_bil_inv7, 'AC gas + coil', 1, 18000, 0, 18000, 0),
    (v_bil_inv8, 'Panel beating', 1, 22000, 0, 22000, 0),
    (v_bil_inv9, 'Oil + filter', 1, 9000, 0, 9000, 0),
    (v_bil_inv10, 'Clutch plate', 1, 16000, 0, 16000, 0);

  -- BILAL invoice ledger (debits on bill)
  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES
    (v_company_id, 'client', v_client_bilal, 'debit', 10000, 'invoice', v_bil_inv1, 'Sales bill #SB-BIL-001', '2026-01-05', 'sales_bill', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'debit', 15000, 'invoice', v_bil_inv2, 'Sales bill #SB-BIL-002', '2026-01-10', 'sales_bill', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'debit', 12000, 'invoice', v_bil_inv3, 'Sales bill #SB-BIL-003', '2026-01-15', 'sales_bill', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'debit', 8000, 'invoice', v_bil_inv4, 'Sales bill #SB-BIL-004', '2026-01-20', 'sales_bill', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'debit', 20000, 'invoice', v_bil_inv5, 'Sales bill #SB-BIL-005', '2026-02-01', 'sales_bill', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'debit', 5000, 'invoice', v_bil_inv6, 'Sales bill #SB-BIL-006', '2026-02-05', 'sales_bill', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'debit', 18000, 'invoice', v_bil_inv7, 'Sales bill #SB-BIL-007', '2026-02-10', 'sales_bill', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'debit', 22000, 'invoice', v_bil_inv8, 'Sales bill #SB-BIL-008', '2026-02-15', 'sales_bill', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'debit', 9000, 'invoice', v_bil_inv9, 'Sales bill #SB-BIL-009', '2026-02-20', 'sales_bill', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'debit', 16000, 'invoice', v_bil_inv10, 'Sales bill #SB-BIL-010', '2026-06-01', 'sales_bill', v_owner_id);

  -- BILAL bill 002: discount given 2000 + cash 13000
  INSERT INTO public.discount_settlements (
    id, company_id, settlement_kind, party_side, party_id, bill_id, bill_side,
    invoice_number, bill_amount, discount_amount, payment_amount, payment_mode,
    entry_date, remark, created_by
  ) VALUES (
    v_ds_bil2, v_company_id, 'given', 'client', v_client_bilal, v_bil_inv2, 'client',
    'SB-BIL-002', 15000, 2000, 13000, 'cash', '2026-01-12',
    'Festival discount on paint job', v_owner_id
  );

  INSERT INTO public.client_payments (
    id, company_id, client_id, amount, payment_mode, payment_date, remark,
    entry_category, created_by
  ) VALUES (
    v_cp_bil2, v_company_id, v_client_bilal, 13000, 'cash', '2026-01-12',
    'Payment received (cash) — #SB-BIL-002', 'receipt', v_owner_id
  );

  UPDATE public.discount_settlements
  SET payment_reference_id = v_cp_bil2
  WHERE id = v_ds_bil2;

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES
    (v_company_id, 'client', v_client_bilal, 'credit', 13000, 'cash', 'payment', v_cp_bil2,
     'Payment received (cash) — #SB-BIL-002', '2026-01-12', 'receipt', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'credit', 2000, NULL, 'discount_settlement', v_ds_bil2,
     'Discount given — #SB-BIL-002', '2026-01-12', 'discount_given', v_owner_id);

  -- BILAL bill 003: credit note CN-0001 for 3000
  INSERT INTO public.credit_notes (
    id, company_id, credit_note_number, invoice_id, client_id, issue_date, amount, remark, created_by
  ) VALUES (
    v_cn1, v_company_id, 'CN-0001', v_bil_inv3, v_client_bilal, '2026-01-18', 3000,
    'Warranty adjustment on service', v_owner_id
  );

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES (
    v_company_id, 'client', v_client_bilal, 'credit', 3000, 'credit_note', v_cn1,
    'Credit note CN-0001 — #SB-BIL-003', '2026-01-18', 'credit_note', v_owner_id
  );

  -- BILAL bill 005: debit note DN-0001 for 1500
  INSERT INTO public.debit_notes (
    id, company_id, debit_note_number, invoice_id, client_id, issue_date, amount, remark, created_by
  ) VALUES (
    v_dn1, v_company_id, 'DN-0001', v_bil_inv5, v_client_bilal, '2026-02-03', 1500,
    'Extra parts not on original bill', v_owner_id
  );

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES (
    v_company_id, 'client', v_client_bilal, 'debit', 1500, 'debit_note', v_dn1,
    'Debit note DN-0001 — #SB-BIL-005', '2026-02-03', 'debit_note', v_owner_id
  );

  -- BILAL bill 006: credit note CN-0002 full settlement
  INSERT INTO public.credit_notes (
    id, company_id, credit_note_number, invoice_id, client_id, issue_date, amount, remark, created_by
  ) VALUES (
    v_cn2, v_company_id, 'CN-0002', v_bil_inv6, v_client_bilal, '2026-02-07', 5000,
    'Bill cancelled — goodwill credit', v_owner_id
  );

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES (
    v_company_id, 'client', v_client_bilal, 'credit', 5000, 'credit_note', v_cn2,
    'Credit note CN-0002 — #SB-BIL-006', '2026-02-07', 'credit_note', v_owner_id
  );

  -- BILAL bill 008: discount given 3000 + bank 19000
  INSERT INTO public.discount_settlements (
    id, company_id, settlement_kind, party_side, party_id, bill_id, bill_side,
    invoice_number, bill_amount, discount_amount, payment_amount, payment_mode,
    bank_sub_mode, bank_id, entry_date, remark, created_by
  ) VALUES (
    v_ds_bil8, v_company_id, 'given', 'client', v_client_bilal, v_bil_inv8, 'client',
    'SB-BIL-008', 22000, 3000, 19000, 'bank', 'net_banking', v_bank_hdfc, '2026-02-18',
    'Volume discount on body work', v_owner_id
  );

  INSERT INTO public.client_payments (
    id, company_id, client_id, amount, payment_mode, bank_sub_mode, bank_id,
    payment_date, remark, entry_category, created_by
  ) VALUES (
    v_cp_bil8, v_company_id, v_client_bilal, 19000, 'bank', 'net_banking', v_bank_hdfc,
    '2026-02-18', 'Payment received (net banking) — #SB-BIL-008', 'receipt', v_owner_id
  );

  UPDATE public.discount_settlements
  SET payment_reference_id = v_cp_bil8
  WHERE id = v_ds_bil8;

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES
    (v_company_id, 'client', v_client_bilal, 'credit', 19000, 'bank', 'net_banking', v_bank_hdfc,
     'payment', v_cp_bil8, 'Payment received (net banking) — #SB-BIL-008', '2026-02-18', 'receipt', v_owner_id),
    (v_company_id, 'client', v_client_bilal, 'credit', 3000, NULL, NULL, NULL,
     'discount_settlement', v_ds_bil8, 'Discount given — #SB-BIL-008', '2026-02-18', 'discount_given', v_owner_id),
    (v_company_id, 'bank', v_bank_hdfc, 'credit', 19000, 'bank', 'net_banking', v_bank_hdfc,
     'payment', v_cp_bil8, 'Payment received (net banking) — #SB-BIL-008', '2026-02-18', 'receipt', v_owner_id);

  -- BILAL bill 009: full cash payment
  INSERT INTO public.client_payments (
    id, company_id, client_id, amount, payment_mode, payment_date, remark,
    entry_category, created_by
  ) VALUES (
    v_cp_bil9, v_company_id, v_client_bilal, 9000, 'cash', '2026-02-22',
    'Payment received (cash) — #SB-BIL-009', 'receipt', v_owner_id
  );

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES (
    v_company_id, 'client', v_client_bilal, 'credit', 9000, 'cash', 'payment', v_cp_bil9,
    'Payment received (cash) — #SB-BIL-009', '2026-02-22', 'receipt', v_owner_id
  );

  -- ZAID — 10 purchase bills
  INSERT INTO public.purchase_invoices (
    id, company_id, supplier_id, invoice_type, invoice_number, invoice_date,
    taxable_amount, gst_percent, gst_amount, total_amount, credit_amount, remark, created_by
  ) VALUES
    (v_zaid_pur1, v_company_id, v_supplier_zaid, 'purchase', 'PB-ZAID-001', '2026-01-06',
     14000, 0, 0, 14000, 14000, 'Spare parts batch — open', v_owner_id),
    (v_zaid_pur2, v_company_id, v_supplier_zaid, 'purchase', 'PB-ZAID-002', '2026-01-11',
     11000, 0, 0, 11000, 0, 'Filters — discount + cash settled', v_owner_id),
    (v_zaid_pur3, v_company_id, v_supplier_zaid, 'purchase', 'PB-ZAID-003', '2026-01-16',
     9500, 0, 0, 9500, 9500, 'Bearings — open', v_owner_id),
    (v_zaid_pur4, v_company_id, v_supplier_zaid, 'purchase', 'PB-ZAID-004', '2026-01-22',
     18000, 0, 0, 18000, 0, 'Engine oil drums — bank paid', v_owner_id),
    (v_zaid_pur5, v_company_id, v_supplier_zaid, 'purchase', 'PB-ZAID-005', '2026-02-02',
     7500, 0, 0, 7500, 0, 'Gaskets — discount + bank settled', v_owner_id),
    (v_zaid_pur6, v_company_id, v_supplier_zaid, 'purchase', 'PB-ZAID-006', '2026-02-08',
     20000, 0, 0, 20000, 20000, 'Clutch kits — open', v_owner_id),
    (v_zaid_pur7, v_company_id, v_supplier_zaid, 'purchase', 'PB-ZAID-007', '2026-02-12',
     12500, 0, 0, 12500, 7500, 'Brake pads — partial paid', v_owner_id),
    (v_zaid_pur8, v_company_id, v_supplier_zaid, 'purchase', 'PB-ZAID-008', '2026-02-16',
     16000, 0, 0, 16000, 0, 'Radiators — discount + bank settled', v_owner_id),
    (v_zaid_pur9, v_company_id, v_supplier_zaid, 'purchase', 'PB-ZAID-009', '2026-02-25',
     8800, 0, 0, 8800, 8800, 'Hoses — open', v_owner_id),
    (v_zaid_pur10, v_company_id, v_supplier_zaid, 'purchase', 'PB-ZAID-010', '2026-06-02',
     13200, 0, 0, 13200, 0, 'Belts — cash paid', v_owner_id);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES
    (v_company_id, 'supplier', v_supplier_zaid, 'credit', 14000, 'purchase', v_zaid_pur1, 'Purchase bill #PB-ZAID-001', '2026-01-06', 'purchase_bill', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'credit', 11000, 'purchase', v_zaid_pur2, 'Purchase bill #PB-ZAID-002', '2026-01-11', 'purchase_bill', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'credit', 9500, 'purchase', v_zaid_pur3, 'Purchase bill #PB-ZAID-003', '2026-01-16', 'purchase_bill', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'credit', 18000, 'purchase', v_zaid_pur4, 'Purchase bill #PB-ZAID-004', '2026-01-22', 'purchase_bill', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'credit', 7500, 'purchase', v_zaid_pur5, 'Purchase bill #PB-ZAID-005', '2026-02-02', 'purchase_bill', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'credit', 20000, 'purchase', v_zaid_pur6, 'Purchase bill #PB-ZAID-006', '2026-02-08', 'purchase_bill', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'credit', 12500, 'purchase', v_zaid_pur7, 'Purchase bill #PB-ZAID-007', '2026-02-12', 'purchase_bill', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'credit', 16000, 'purchase', v_zaid_pur8, 'Purchase bill #PB-ZAID-008', '2026-02-16', 'purchase_bill', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'credit', 8800, 'purchase', v_zaid_pur9, 'Purchase bill #PB-ZAID-009', '2026-02-25', 'purchase_bill', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'credit', 13200, 'purchase', v_zaid_pur10, 'Purchase bill #PB-ZAID-010', '2026-06-02', 'purchase_bill', v_owner_id);

  -- ZAID bill 002: discount received 1000 + cash 10000
  INSERT INTO public.discount_settlements (
    id, company_id, settlement_kind, party_side, party_id, bill_id, bill_side,
    invoice_number, bill_amount, discount_amount, payment_amount, payment_mode,
    entry_date, remark, created_by
  ) VALUES (
    v_ds_zaid2, v_company_id, 'received', 'supplier', v_supplier_zaid, v_zaid_pur2, 'supplier',
    'PB-ZAID-002', 11000, 1000, 10000, 'cash', '2026-01-14',
    'Bulk purchase discount from ZAID', v_owner_id
  );

  INSERT INTO public.supplier_payments (
    id, company_id, supplier_id, amount, payment_mode, payment_date, remark,
    entry_category, created_by
  ) VALUES (
    v_sp_zaid2, v_company_id, v_supplier_zaid, 10000, 'cash', '2026-01-14',
    'Payment made (cash) — #PB-ZAID-002', 'payment', v_owner_id
  );

  UPDATE public.discount_settlements SET payment_reference_id = v_sp_zaid2 WHERE id = v_ds_zaid2;

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES
    (v_company_id, 'supplier', v_supplier_zaid, 'debit', 10000, 'cash', 'payment', v_sp_zaid2,
     'Payment made (cash) — #PB-ZAID-002', '2026-01-14', 'payment', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'debit', 1000, NULL, 'discount_settlement', v_ds_zaid2,
     'Discount received — #PB-ZAID-002', '2026-01-14', 'discount_received', v_owner_id);

  -- ZAID bill 004: full bank payment
  INSERT INTO public.supplier_payments (
    id, company_id, supplier_id, amount, payment_mode, bank_sub_mode, bank_id,
    payment_date, remark, entry_category, created_by
  ) VALUES (
    v_sp_zaid4, v_company_id, v_supplier_zaid, 18000, 'bank', 'upi', v_bank_hdfc,
    '2026-01-24', 'Payment made (upi) — #PB-ZAID-004', 'payment', v_owner_id
  );

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES
    (v_company_id, 'supplier', v_supplier_zaid, 'debit', 18000, 'bank', 'upi', v_bank_hdfc,
     'payment', v_sp_zaid4, 'Payment made (upi) — #PB-ZAID-004', '2026-01-24', 'payment', v_owner_id),
    (v_company_id, 'bank', v_bank_hdfc, 'debit', 18000, 'bank', 'upi', v_bank_hdfc,
     'payment', v_sp_zaid4, 'Payment made (upi) — #PB-ZAID-004', '2026-01-24', 'payment', v_owner_id);

  -- ZAID bill 005: discount received 500 + bank 7000
  INSERT INTO public.discount_settlements (
    id, company_id, settlement_kind, party_side, party_id, bill_id, bill_side,
    invoice_number, bill_amount, discount_amount, payment_amount, payment_mode,
    bank_sub_mode, bank_id, entry_date, remark, created_by
  ) VALUES (
    v_ds_zaid5, v_company_id, 'received', 'supplier', v_supplier_zaid, v_zaid_pur5, 'supplier',
    'PB-ZAID-005', 7500, 500, 7000, 'bank', 'net_banking', v_bank_hdfc, '2026-02-04',
    'Early payment discount', v_owner_id
  );

  INSERT INTO public.supplier_payments (
    id, company_id, supplier_id, amount, payment_mode, bank_sub_mode, bank_id,
    payment_date, remark, entry_category, created_by
  ) VALUES (
    v_sp_zaid5, v_company_id, v_supplier_zaid, 7000, 'bank', 'net_banking', v_bank_hdfc,
    '2026-02-04', 'Payment made (net banking) — #PB-ZAID-005', 'payment', v_owner_id
  );

  UPDATE public.discount_settlements SET payment_reference_id = v_sp_zaid5 WHERE id = v_ds_zaid5;

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES
    (v_company_id, 'supplier', v_supplier_zaid, 'debit', 7000, 'bank', 'net_banking', v_bank_hdfc,
     'payment', v_sp_zaid5, 'Payment made (net banking) — #PB-ZAID-005', '2026-02-04', 'payment', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'debit', 500, NULL, NULL, NULL,
     'discount_settlement', v_ds_zaid5, 'Discount received — #PB-ZAID-005', '2026-02-04', 'discount_received', v_owner_id),
    (v_company_id, 'bank', v_bank_hdfc, 'debit', 7000, 'bank', 'net_banking', v_bank_hdfc,
     'payment', v_sp_zaid5, 'Payment made (net banking) — #PB-ZAID-005', '2026-02-04', 'payment', v_owner_id);

  -- ZAID bill 007: partial payment 5000
  INSERT INTO public.supplier_payments (
    id, company_id, supplier_id, amount, payment_mode, payment_date, remark,
    entry_category, created_by
  ) VALUES (
    v_sp_zaid7, v_company_id, v_supplier_zaid, 5000, 'cash', '2026-02-14',
    'Payment made (cash) — #PB-ZAID-007', 'payment', v_owner_id
  );

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES (
    v_company_id, 'supplier', v_supplier_zaid, 'debit', 5000, 'cash', 'payment', v_sp_zaid7,
    'Payment made (cash) — #PB-ZAID-007', '2026-02-14', 'payment', v_owner_id
  );

  -- ZAID bill 008: discount received 2000 + bank 14000
  INSERT INTO public.discount_settlements (
    id, company_id, settlement_kind, party_side, party_id, bill_id, bill_side,
    invoice_number, bill_amount, discount_amount, payment_amount, payment_mode,
    bank_sub_mode, bank_id, entry_date, remark, created_by
  ) VALUES (
    v_ds_zaid8, v_company_id, 'received', 'supplier', v_supplier_zaid, v_zaid_pur8, 'supplier',
    'PB-ZAID-008', 16000, 2000, 14000, 'bank', 'net_banking', v_bank_hdfc, '2026-02-18',
    'Year-end discount from ZAID', v_owner_id
  );

  INSERT INTO public.supplier_payments (
    id, company_id, supplier_id, amount, payment_mode, bank_sub_mode, bank_id,
    payment_date, remark, entry_category, created_by
  ) VALUES (
    v_sp_zaid8, v_company_id, v_supplier_zaid, 14000, 'bank', 'net_banking', v_bank_hdfc,
    '2026-02-18', 'Payment made (net banking) — #PB-ZAID-008', 'payment', v_owner_id
  );

  UPDATE public.discount_settlements SET payment_reference_id = v_sp_zaid8 WHERE id = v_ds_zaid8;

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES
    (v_company_id, 'supplier', v_supplier_zaid, 'debit', 14000, 'bank', 'net_banking', v_bank_hdfc,
     'payment', v_sp_zaid8, 'Payment made (net banking) — #PB-ZAID-008', '2026-02-18', 'payment', v_owner_id),
    (v_company_id, 'supplier', v_supplier_zaid, 'debit', 2000, NULL, NULL, NULL,
     'discount_settlement', v_ds_zaid8, 'Discount received — #PB-ZAID-008', '2026-02-18', 'discount_received', v_owner_id),
    (v_company_id, 'bank', v_bank_hdfc, 'debit', 14000, 'bank', 'net_banking', v_bank_hdfc,
     'payment', v_sp_zaid8, 'Payment made (net banking) — #PB-ZAID-008', '2026-02-18', 'payment', v_owner_id);

  -- ZAID bill 010: full cash payment
  INSERT INTO public.supplier_payments (
    id, company_id, supplier_id, amount, payment_mode, payment_date, remark,
    entry_category, created_by
  ) VALUES (
    v_sp_zaid10, v_company_id, v_supplier_zaid, 13200, 'cash', '2026-06-03',
    'Payment made (cash) — #PB-ZAID-010', 'payment', v_owner_id
  );

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES (
    v_company_id, 'supplier', v_supplier_zaid, 'debit', 13200, 'cash', 'payment', v_sp_zaid10,
    'Payment made (cash) — #PB-ZAID-010', '2026-06-03', 'payment', v_owner_id
  );

  RAISE NOTICE 'Journal seed complete:';
  RAISE NOTICE '  Customer BILAL — 10 sales bills (discounts, CN/DN, payments, 4 open)';
  RAISE NOTICE '  Supplier ZAID  — 10 purchase bills (discounts, payments, 4 open)';
END $$;

-- Ensure INCOME + EXPENSE system parties for every company (idempotent)
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  FOR v_company_id IN SELECT id FROM public.companies LOOP
    PERFORM public.ensure_system_parties(v_company_id);
  END LOOP;
END $$;

-- ============================================
-- INCOME + EXPENSE demo entries (10 each)
-- Idempotent: skips if first income remark already exists.
-- ============================================

DO $$
DECLARE
  v_company_id UUID;
  v_owner_id UUID;
  v_bank_hdfc UUID;
  v_client_income UUID;
  v_supplier_expense UUID;
  v_cp_inc1 UUID := 'e3000001-0001-4001-8001-000000000001';
  v_cp_inc2 UUID := 'e3000002-0001-4001-8001-000000000002';
  v_cp_inc3 UUID := 'e3000003-0001-4001-8001-000000000003';
  v_cp_inc4 UUID := 'e3000004-0001-4001-8001-000000000004';
  v_cp_inc5 UUID := 'e3000005-0001-4001-8001-000000000005';
  v_cp_inc6 UUID := 'e3000006-0001-4001-8001-000000000006';
  v_cp_inc7 UUID := 'e3000007-0001-4001-8001-000000000007';
  v_cp_inc8 UUID := 'e3000008-0001-4001-8001-000000000008';
  v_cp_inc9 UUID := 'e3000009-0001-4001-8001-000000000009';
  v_cp_inc10 UUID := 'e300000a-0001-4001-8001-00000000000a';
  v_sp_exp1 UUID := 'e4000001-0001-4001-8001-000000000001';
  v_sp_exp2 UUID := 'e4000002-0001-4001-8001-000000000002';
  v_sp_exp3 UUID := 'e4000003-0001-4001-8001-000000000003';
  v_sp_exp4 UUID := 'e4000004-0001-4001-8001-000000000004';
  v_sp_exp5 UUID := 'e4000005-0001-4001-8001-000000000005';
  v_sp_exp6 UUID := 'e4000006-0001-4001-8001-000000000006';
  v_sp_exp7 UUID := 'e4000007-0001-4001-8001-000000000007';
  v_sp_exp8 UUID := 'e4000008-0001-4001-8001-000000000008';
  v_sp_exp9 UUID := 'e4000009-0001-4001-8001-000000000009';
  v_sp_exp10 UUID := 'e400000a-0001-4001-8001-00000000000a';
BEGIN
  SELECT u.company_id, u.id
  INTO v_company_id, v_owner_id
  FROM public.users u
  WHERE u.role = 'owner'
  ORDER BY u.created_at
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE NOTICE 'Income/expense seed: no company found. Skipping.';
    RETURN;
  END IF;

  PERFORM public.ensure_system_parties(v_company_id);

  SELECT id INTO v_client_income
  FROM public.clients
  WHERE company_id = v_company_id AND name = 'INCOME' AND is_deleted = false
  LIMIT 1;

  SELECT id INTO v_supplier_expense
  FROM public.suppliers
  WHERE company_id = v_company_id AND name = 'EXPENSE' AND is_deleted = false
  LIMIT 1;

  IF v_client_income IS NULL OR v_supplier_expense IS NULL THEN
    RAISE NOTICE 'Income/expense seed: system parties missing. Skipping.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.client_payments
    WHERE company_id = v_company_id AND id = v_cp_inc1
  ) THEN
    RAISE NOTICE 'Income/expense demo already exists for company %. Skipping.', v_company_id;
    RETURN;
  END IF;

  SELECT id INTO v_bank_hdfc
  FROM public.bank_accounts
  WHERE company_id = v_company_id AND bank_name = 'HDFC Bank'
  LIMIT 1;

  RAISE NOTICE 'Income/expense seed: inserting 10 INCOME + 10 EXPENSE entries for company %', v_company_id;

  -- INCOME — 10 receipts (6 cash, 4 bank)
  INSERT INTO public.client_payments (
    id, company_id, client_id, amount, payment_mode, bank_sub_mode, bank_id,
    payment_date, remark, entry_category, created_by
  ) VALUES
    (v_cp_inc1, v_company_id, v_client_income, 1500, 'cash', NULL, NULL,
     '2026-01-08', 'INCOME - used oil sale', 'indirect_income', v_owner_id),
    (v_cp_inc2, v_company_id, v_client_income, 3200, 'cash', NULL, NULL,
     '2026-01-15', 'INCOME - scrap metal', 'indirect_income', v_owner_id),
    (v_cp_inc3, v_company_id, v_client_income, 800, 'cash', NULL, NULL,
     '2026-01-22', 'INCOME - old battery sale', 'indirect_income', v_owner_id),
    (v_cp_inc4, v_company_id, v_client_income, 4500, 'bank', 'upi', v_bank_hdfc,
     '2026-02-03', 'INCOME - coolant drums sold', 'indirect_income', v_owner_id),
    (v_cp_inc5, v_company_id, v_client_income, 6000, 'bank', 'net_banking', v_bank_hdfc,
     '2026-02-10', 'INCOME - workshop rent share', 'indirect_income', v_owner_id),
    (v_cp_inc6, v_company_id, v_client_income, 1200, 'cash', NULL, NULL,
     '2026-02-18', 'INCOME - tyre disposal', 'indirect_income', v_owner_id),
    (v_cp_inc7, v_company_id, v_client_income, 950, 'cash', NULL, NULL,
     '2026-03-05', 'INCOME - filter cores return', 'indirect_income', v_owner_id),
    (v_cp_inc8, v_company_id, v_client_income, 2100, 'bank', 'upi', v_bank_hdfc,
     '2026-03-12', 'INCOME - paint thinner sale', 'indirect_income', v_owner_id),
    (v_cp_inc9, v_company_id, v_client_income, 3800, 'cash', NULL, NULL,
     '2026-04-01', 'INCOME - waste iron', 'indirect_income', v_owner_id),
    (v_cp_inc10, v_company_id, v_client_income, 500, 'cash', NULL, NULL,
     '2026-06-15', 'INCOME - parking fee collected', 'indirect_income', v_owner_id);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES
    (v_company_id, 'client', v_client_income, 'credit', 1500, 'cash', NULL, NULL,
     'payment', v_cp_inc1, 'INCOME - used oil sale', '2026-01-08', 'indirect_income', v_owner_id),
    (v_company_id, 'client', v_client_income, 'credit', 3200, 'cash', NULL, NULL,
     'payment', v_cp_inc2, 'INCOME - scrap metal', '2026-01-15', 'indirect_income', v_owner_id),
    (v_company_id, 'client', v_client_income, 'credit', 800, 'cash', NULL, NULL,
     'payment', v_cp_inc3, 'INCOME - old battery sale', '2026-01-22', 'indirect_income', v_owner_id),
    (v_company_id, 'client', v_client_income, 'credit', 4500, 'bank', 'upi', v_bank_hdfc,
     'payment', v_cp_inc4, 'INCOME - coolant drums sold', '2026-02-03', 'indirect_income', v_owner_id),
    (v_company_id, 'client', v_client_income, 'credit', 6000, 'bank', 'net_banking', v_bank_hdfc,
     'payment', v_cp_inc5, 'INCOME - workshop rent share', '2026-02-10', 'indirect_income', v_owner_id),
    (v_company_id, 'client', v_client_income, 'credit', 1200, 'cash', NULL, NULL,
     'payment', v_cp_inc6, 'INCOME - tyre disposal', '2026-02-18', 'indirect_income', v_owner_id),
    (v_company_id, 'client', v_client_income, 'credit', 950, 'cash', NULL, NULL,
     'payment', v_cp_inc7, 'INCOME - filter cores return', '2026-03-05', 'indirect_income', v_owner_id),
    (v_company_id, 'client', v_client_income, 'credit', 2100, 'bank', 'upi', v_bank_hdfc,
     'payment', v_cp_inc8, 'INCOME - paint thinner sale', '2026-03-12', 'indirect_income', v_owner_id),
    (v_company_id, 'client', v_client_income, 'credit', 3800, 'cash', NULL, NULL,
     'payment', v_cp_inc9, 'INCOME - waste iron', '2026-04-01', 'indirect_income', v_owner_id),
    (v_company_id, 'client', v_client_income, 'credit', 500, 'cash', NULL, NULL,
     'payment', v_cp_inc10, 'INCOME - parking fee collected', '2026-06-15', 'indirect_income', v_owner_id);

  IF v_bank_hdfc IS NOT NULL THEN
    INSERT INTO public.ledger_entries (
      company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id,
      reference_type, reference_id, remark, entry_date, entry_category, created_by
    ) VALUES
      (v_company_id, 'bank', v_bank_hdfc, 'credit', 4500, 'bank', 'upi', v_bank_hdfc,
       'payment', v_cp_inc4, 'INCOME - coolant drums sold', '2026-02-03', 'indirect_income', v_owner_id),
      (v_company_id, 'bank', v_bank_hdfc, 'credit', 6000, 'bank', 'net_banking', v_bank_hdfc,
       'payment', v_cp_inc5, 'INCOME - workshop rent share', '2026-02-10', 'indirect_income', v_owner_id),
      (v_company_id, 'bank', v_bank_hdfc, 'credit', 2100, 'bank', 'upi', v_bank_hdfc,
       'payment', v_cp_inc8, 'INCOME - paint thinner sale', '2026-03-12', 'indirect_income', v_owner_id);
  END IF;

  -- EXPENSE — 10 payments (7 cash, 3 bank)
  INSERT INTO public.supplier_payments (
    id, company_id, supplier_id, amount, payment_mode, bank_sub_mode, bank_id,
    payment_date, remark, entry_category, created_by
  ) VALUES
    (v_sp_exp1, v_company_id, v_supplier_expense, 2500, 'cash', NULL, NULL,
     '2026-01-09', 'EXPENSE - AC repair', 'indirect_expense', v_owner_id),
    (v_sp_exp2, v_company_id, v_supplier_expense, 450, 'cash', NULL, NULL,
     '2026-01-16', 'EXPENSE - tea & snacks', 'indirect_expense', v_owner_id),
    (v_sp_exp3, v_company_id, v_supplier_expense, 8200, 'bank', 'net_banking', v_bank_hdfc,
     '2026-01-25', 'EXPENSE - electricity bill', 'indirect_expense', v_owner_id),
    (v_sp_exp4, v_company_id, v_supplier_expense, 1500, 'cash', NULL, NULL,
     '2026-02-04', 'EXPENSE - workshop cleaning', 'indirect_expense', v_owner_id),
    (v_sp_exp5, v_company_id, v_supplier_expense, 900, 'cash', NULL, NULL,
     '2026-02-12', 'EXPENSE - tool sharpening', 'indirect_expense', v_owner_id),
    (v_sp_exp6, v_company_id, v_supplier_expense, 1200, 'bank', 'upi', v_bank_hdfc,
     '2026-02-20', 'EXPENSE - internet bill', 'indirect_expense', v_owner_id),
    (v_sp_exp7, v_company_id, v_supplier_expense, 3400, 'cash', NULL, NULL,
     '2026-03-08', 'EXPENSE - floor paint', 'indirect_expense', v_owner_id),
    (v_sp_exp8, v_company_id, v_supplier_expense, 1800, 'bank', 'net_banking', v_bank_hdfc,
     '2026-03-18', 'EXPENSE - safety gloves bulk', 'indirect_expense', v_owner_id),
    (v_sp_exp9, v_company_id, v_supplier_expense, 650, 'cash', NULL, NULL,
     '2026-04-05', 'EXPENSE - water cooler service', 'indirect_expense', v_owner_id),
    (v_sp_exp10, v_company_id, v_supplier_expense, 2200, 'cash', NULL, NULL,
     '2026-06-16', 'EXPENSE - signage repair', 'indirect_expense', v_owner_id);

  INSERT INTO public.ledger_entries (
    company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id,
    reference_type, reference_id, remark, entry_date, entry_category, created_by
  ) VALUES
    (v_company_id, 'supplier', v_supplier_expense, 'debit', 2500, 'cash', NULL, NULL,
     'payment', v_sp_exp1, 'EXPENSE - AC repair', '2026-01-09', 'indirect_expense', v_owner_id),
    (v_company_id, 'supplier', v_supplier_expense, 'debit', 450, 'cash', NULL, NULL,
     'payment', v_sp_exp2, 'EXPENSE - tea & snacks', '2026-01-16', 'indirect_expense', v_owner_id),
    (v_company_id, 'supplier', v_supplier_expense, 'debit', 8200, 'bank', 'net_banking', v_bank_hdfc,
     'payment', v_sp_exp3, 'EXPENSE - electricity bill', '2026-01-25', 'indirect_expense', v_owner_id),
    (v_company_id, 'supplier', v_supplier_expense, 'debit', 1500, 'cash', NULL, NULL,
     'payment', v_sp_exp4, 'EXPENSE - workshop cleaning', '2026-02-04', 'indirect_expense', v_owner_id),
    (v_company_id, 'supplier', v_supplier_expense, 'debit', 900, 'cash', NULL, NULL,
     'payment', v_sp_exp5, 'EXPENSE - tool sharpening', '2026-02-12', 'indirect_expense', v_owner_id),
    (v_company_id, 'supplier', v_supplier_expense, 'debit', 1200, 'bank', 'upi', v_bank_hdfc,
     'payment', v_sp_exp6, 'EXPENSE - internet bill', '2026-02-20', 'indirect_expense', v_owner_id),
    (v_company_id, 'supplier', v_supplier_expense, 'debit', 3400, 'cash', NULL, NULL,
     'payment', v_sp_exp7, 'EXPENSE - floor paint', '2026-03-08', 'indirect_expense', v_owner_id),
    (v_company_id, 'supplier', v_supplier_expense, 'debit', 1800, 'bank', 'net_banking', v_bank_hdfc,
     'payment', v_sp_exp8, 'EXPENSE - safety gloves bulk', '2026-03-18', 'indirect_expense', v_owner_id),
    (v_company_id, 'supplier', v_supplier_expense, 'debit', 650, 'cash', NULL, NULL,
     'payment', v_sp_exp9, 'EXPENSE - water cooler service', '2026-04-05', 'indirect_expense', v_owner_id),
    (v_company_id, 'supplier', v_supplier_expense, 'debit', 2200, 'cash', NULL, NULL,
     'payment', v_sp_exp10, 'EXPENSE - signage repair', '2026-06-16', 'indirect_expense', v_owner_id);

  IF v_bank_hdfc IS NOT NULL THEN
    INSERT INTO public.ledger_entries (
      company_id, entity_type, entity_id, entry_type, amount, payment_mode, bank_sub_mode, bank_id,
      reference_type, reference_id, remark, entry_date, entry_category, created_by
    ) VALUES
      (v_company_id, 'bank', v_bank_hdfc, 'debit', 8200, 'bank', 'net_banking', v_bank_hdfc,
       'payment', v_sp_exp3, 'EXPENSE - electricity bill', '2026-01-25', 'indirect_expense', v_owner_id),
      (v_company_id, 'bank', v_bank_hdfc, 'debit', 1200, 'bank', 'upi', v_bank_hdfc,
       'payment', v_sp_exp6, 'EXPENSE - internet bill', '2026-02-20', 'indirect_expense', v_owner_id),
      (v_company_id, 'bank', v_bank_hdfc, 'debit', 1800, 'bank', 'net_banking', v_bank_hdfc,
       'payment', v_sp_exp8, 'EXPENSE - safety gloves bulk', '2026-03-18', 'indirect_expense', v_owner_id);
  END IF;

  RAISE NOTICE 'Income/expense seed complete — 10 INCOME + 10 EXPENSE entries';
END $$;