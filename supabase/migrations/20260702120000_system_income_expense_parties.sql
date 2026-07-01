-- System parties: INCOME (client) + EXPENSE (supplier) for every company

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.ensure_system_parties(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_company_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.clients (
    company_id, name, alias, opening_balance, is_system
  )
  SELECT p_company_id, 'INCOME', 'INC', 0, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.clients
    WHERE company_id = p_company_id AND name = 'INCOME'
  );

  UPDATE public.clients
  SET is_system = true, is_deleted = false, deleted_at = NULL
  WHERE company_id = p_company_id AND name = 'INCOME';

  INSERT INTO public.suppliers (
    company_id, name, alias, opening_balance, is_system
  )
  SELECT p_company_id, 'EXPENSE', 'EXP', 0, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE company_id = p_company_id AND name = 'EXPENSE'
  );

  UPDATE public.suppliers
  SET is_system = true, is_deleted = false, deleted_at = NULL
  WHERE company_id = p_company_id AND name = 'EXPENSE';
END;
$$;

-- Backfill all existing companies
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  FOR v_company_id IN SELECT id FROM public.companies LOOP
    PERFORM public.ensure_system_parties(v_company_id);
  END LOOP;
END $$;

-- Owner signup: create system parties after company insert
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_company_id UUID;
  v_company_name TEXT;
  v_full_name TEXT;
BEGIN
  v_company_name := COALESCE(TRIM(NEW.raw_user_meta_data->>'company_name'), '');
  v_full_name := COALESCE(TRIM(NEW.raw_user_meta_data->>'full_name'), '');

  IF v_company_name <> '' THEN
    INSERT INTO public.companies (name)
    VALUES (v_company_name)
    RETURNING id INTO new_company_id;

    PERFORM public.ensure_system_parties(new_company_id);

    INSERT INTO public.users (id, company_id, role, full_name, email)
    VALUES (
      NEW.id,
      new_company_id,
      'owner',
      CASE WHEN v_full_name <> '' THEN v_full_name ELSE split_part(COALESCE(NEW.email, ''), '@', 1) END,
      COALESCE(NEW.email, '')
    );

    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('company_id', new_company_id, 'role', 'owner')
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'handle_new_user_signup failed: %', SQLERRM;
END;
$$;