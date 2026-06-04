# ⚠️ Supabase Setup & Operations

This file tracks the setup steps and dashboard settings that must be configured for your new Supabase project (`hrjarkhzmhgdrlkzpkka`).

---

## 🛠️ DB & Migration Status
* **Status**: **Completed** (All 10 database migrations have been successfully pushed to the new database).

---

## 🚀 Edge Functions Deployment
Since edge function deployment requires a Supabase access token (`SUPABASE_ACCESS_TOKEN` or `supabase login`), please run the following command from your terminal to deploy the geofence validation Edge Function:
```bash
npx supabase functions deploy validate-checkin --project-ref hrjarkhzmhgdrlkzpkka
```

---

## ⚙️ Supabase Dashboard Configuration

### 1. Enable Authentication Email Confirmation
To prevent spam registrations and enforce email validity:
1. Go to **Supabase Dashboard** -> **Authentication** -> **Settings**.
2. Scroll down to the **User Signups** section.
3. Toggle/Enable **Confirm email**.
4. Click **Save** at the bottom of the page.

### 2. Add Service Role Key (If needed)
Make sure to copy the `service_role` key from your Supabase Dashboard settings (**Project Settings** -> **API**) and add it to your `.env` file under `SUPABASE_SERVICE_ROLE_KEY` if you need to run server actions requiring service-role privileges.
