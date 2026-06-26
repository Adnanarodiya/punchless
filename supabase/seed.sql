-- ============================================
-- Punchless — Development Seed Data
-- ============================================
-- Populates demo data for ALL statement views:
--   • Client statement   (/dashboard/clients/.../statement)
--   • Supplier statement (/dashboard/suppliers/.../statement)
--   • Bank statement     (/dashboard/banks/.../statement)
--   • Staff statement    (/dashboard/employees/.../statement)
--
-- Idempotent: skips if "Rajesh Transport" client already exists for the company.
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