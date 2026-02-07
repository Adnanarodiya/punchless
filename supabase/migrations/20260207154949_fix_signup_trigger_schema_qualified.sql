-- Fix signup trigger: schema-qualified table names + stable search_path

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    INSERT INTO public.companies (name)
    VALUES (v_company_name)
    RETURNING id INTO new_company_id;

    INSERT INTO public.users (id, company_id, role, full_name, email)
    VALUES (
      NEW.id,
      new_company_id,
      'owner',
      CASE WHEN v_full_name <> '' THEN v_full_name ELSE split_part(COALESCE(NEW.email, ''), '@', 1) END,
      COALESCE(NEW.email, '')
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'handle_new_user_signup failed: %', SQLERRM;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();
