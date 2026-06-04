-- Fix signup trigger: schema-qualified table names + stable search_path

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

  -- Owner signup flow (company_name present)
  IF v_company_name <> '' THEN
    -- Create the company
    INSERT INTO public.companies (name)
    VALUES (v_company_name)
    RETURNING id INTO new_company_id;

    -- Create the owner user record
    INSERT INTO public.users (id, company_id, role, full_name, email)
    VALUES (
      NEW.id,
      new_company_id,
      'owner',
      CASE WHEN v_full_name <> '' THEN v_full_name ELSE split_part(COALESCE(NEW.email, ''), '@', 1) END,
      COALESCE(NEW.email, '')
    );

    -- Update JWT app_metadata for RLS instant checks
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
