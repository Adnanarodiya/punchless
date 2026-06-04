# Punchless — Code Review Audit Report

**Date:** 2026-06-04  
**Auditor:** Claude Code  
**Branch:** main  

---

## Executive Summary

All **16 review items** have been verified against the live codebase.  
**15 of 16 are fully implemented.**  
**1 item is NOT DONE** — signup rate limiting (Item 10).

---

## Status Table

| # | Item | Phase | Status |
|---|------|-------|--------|
| 1 | Salary report includes deactivated employees | A — Critical | ✅ DONE |
| 2 | Forged hourly rate vulnerability patched | A — Critical | ✅ DONE |
| 3 | Hard deletes replaced with soft deletes | A — Critical | ✅ DONE |
| 4 | Error boundary added to dashboard | A — Critical | ✅ DONE |
| 5 | N+1 loop replaced with single RPC | B — Performance | ✅ DONE |
| 6 | Auth queries reduced from 3 to 1 | B — Performance | ✅ DONE |
| 7 | Salary aggregation moved to DB | B — Performance | ✅ DONE |
| 8 | RLS optimized with JWT app_metadata | B — Performance | ✅ DONE |
| 9 | Pagination added to list views | B — Performance | ✅ DONE |
| 10 | Signup rate limiting | B — Performance | ❌ NOT DONE |
| 11 | Workshop cache persisted to AsyncStorage | C — Mobile | ✅ DONE |
| 12 | `offline.store.ts` built | C — Mobile | ✅ DONE |
| 13 | Supabase only called on real state transitions | C — Mobile | ✅ DONE |
| 14 | Background task wrapped in try/catch | C — Mobile | ✅ DONE |
| 15 | Workshop cache TTL reduced to 30 seconds | C — Mobile | ✅ DONE |
| 16 | Server-side geofence validation (Edge Function) | C — Mobile | ✅ DONE |

---

## Completed Items — Verification Evidence

### 1. Salary report includes deactivated employees ✅
**File:** `apps/web/src/lib/queries/salary.queries.ts` lines 88–91

```typescript
if (employeeIds.size > 0) {
  employeeQuery = employeeQuery.or(
    `is_active.eq.true,id.in.(${Array.from(employeeIds).join(",")})`
  );
} else {
  employeeQuery = employeeQuery.eq("is_active", true);
}
```

Employees who have attendance sessions in the selected month are always included in the report, even if they have since been deactivated.

---

### 2. Forged hourly rate vulnerability patched ✅
**File:** `apps/web/src/lib/actions/employee.actions.ts` lines 39–46

```typescript
const { data: companySettings } = await supabase
  .from("companies")
  .select("daily_work_hours, working_days_per_month")
  .eq("id", me.company_id)
  .single();

const dailyWorkHours = companySettings?.daily_work_hours ?? 8;
const workingDaysPerMonth = companySettings?.working_days_per_month ?? 26;
const hourlyRate = calcHourlyRate(monthlySalary, dailyWorkHours, workingDaysPerMonth);
```

No `formData.get("dailyWorkHours")` lines exist. Rates are computed server-side from DB values only.

---

### 3. Hard deletes replaced with soft deletes ✅
**File:** `supabase/migrations/20260604045448_soft_delete_and_rls_optimizations.sql` lines 4–6

```sql
ALTER TABLE public.users     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.jobs      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
```

Delete actions confirmed soft:
- `employee.actions.ts` line 164: `deleted_at: new Date().toISOString()`
- `workshop.actions.ts` line 99: `deleted_at: new Date().toISOString()`
- `job.actions.ts` line 97: `deleted_at: new Date().toISOString()`

---

### 4. Error boundary added to dashboard ✅
**File:** `apps/web/src/app/(dashboard)/error.tsx`

Exists. Exports a client component with `useEffect` error logging and a reset button. Next.js uses this automatically for any server component failure in the dashboard route segment.

---

### 5. N+1 loop replaced with single RPC ✅
**File:** `apps/web/src/lib/actions/settings.actions.ts` lines 36–41

```typescript
const { error: rpcError } = await supabase.rpc("recalculate_hourly_rates" as any, {
  p_company_id: me.company_id,
  p_daily_hours: dailyWorkHours,
  p_working_days: workingDaysPerMonth,
});
```

RPC defined in migration — single SQL `UPDATE` for all employees in the company.

---

### 6. Auth queries reduced from 3 to 1 ✅
**File:** `apps/web/src/lib/queries/auth.queries.ts` lines 29–35

```typescript
const { data, error } = await supabase
  .from("users")
  .select("*, company:companies(id, name, subscription_status)")
  .eq("id", authUser.id)
  .is("deleted_at", null)
  .single();
```

User and company fetched in a single joined query.

---

### 7. Salary aggregation moved to DB ✅
**File:** `apps/web/src/lib/queries/salary.queries.ts` lines 55–59

```typescript
const { data: sessionsData } = await supabase.rpc("get_monthly_attendance_summary" as any, {
  p_company_id: companyId,
  p_start_time: startDate,
  p_end_time: endDate,
});
```

PostgreSQL does `SUM(duration_minutes) GROUP BY employee_id, state`. App never loads raw session rows.

---

### 8. RLS optimized with JWT app_metadata ✅
**File:** `supabase/migrations/20260604045448_soft_delete_and_rls_optimizations.sql` lines 14–20

```sql
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'company_id', '')::uuid,
    (SELECT company_id FROM public.users WHERE id = auth.uid())
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

JWT claim read first (memory, no DB hit). Falls back to user table only if claim is missing. Marked `STABLE` for query plan caching.

---

### 9. Pagination added to list views ✅
**File:** `apps/web/src/lib/queries/history.queries.ts` — `.range(offset, offset + limit - 1)` applied  
**File:** `apps/web/src/lib/queries/salary.queries.ts` lines 24–25 — `const offset = (page - 1) * limit` with `.range()`

Both history and salary list views are paginated.

---

### 11. Workshop cache persisted to AsyncStorage ✅
**File:** `apps/mobile/lib/services/geofence.service.ts` lines 25–68

```typescript
const WORKSHOPS_CACHE_KEY = "punchless_cached_workshops";
const WORKSHOP_CACHE_TTL = 30 * 1000; // 30 seconds

await AsyncStorage.setItem(WORKSHOPS_CACHE_KEY, JSON.stringify(networkWorkshops));
// ...
const cachedStr = await AsyncStorage.getItem(WORKSHOPS_CACHE_KEY);
```

Persistent cache survives background task module reloads.

---

### 12. `offline.store.ts` built ✅
**File:** `apps/mobile/lib/stores/offline.store.ts`

Zustand store with `addToQueue()`, `syncQueue()`, and `loadQueue()`. Uses AsyncStorage for persistence. Called on app foreground and after geofence events.

---

### 13. Supabase only called on real state transitions ✅
**File:** `apps/mobile/lib/services/geofence.service.ts` lines 207–211

Returns `{ transitioned: false }` immediately when state has not changed. Supabase call only happens when the computed state differs from the current store state.

---

### 14. Background task wrapped in try/catch ✅
**File:** `apps/mobile/lib/tasks/background-location.ts` lines 21–70

Full `try/catch` wraps the task body. Errors are stored in `useLocationStore.getState().setLastBackgroundError()` and can be surfaced as a banner on the home screen.

---

### 15. Workshop cache TTL reduced to 30 seconds ✅
**File:** `apps/mobile/lib/services/geofence.service.ts` line 30

```typescript
const WORKSHOP_CACHE_TTL = 30 * 1000; // 30 seconds TTL
```

Reduced from 2 minutes (120,000 ms) to 30 seconds (30,000 ms).

---

### 16. Server-side geofence validation ✅
**File:** `supabase/functions/validate-checkin/index.ts`

Edge Function exists. Fetches active workshops, computes distance on the server, rejects check-in if outside all geofences. Client sends coordinates but cannot forge proximity.

---

---

## ❌ NOT DONE — Item 10: Signup Rate Limiting

### Current State

**File:** `apps/web/src/lib/actions/auth.actions.ts`

```typescript
const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,   // auto-confirmed — no email verification required
  user_metadata: { full_name: fullName, company_name: companyName },
});
```

- Uses the **Supabase admin API**, which bypasses all Supabase Auth rate limits
- `email_confirm: true` means accounts are instantly active with no email verification
- No IP-based throttle, no request frequency check, no CAPTCHA
- Any script can POST to the signup endpoint and create unlimited companies

---

### What Needs to Be Done

There are two approaches. **Approach A is recommended for immediate safety; Approach B for long-term.**

#### Approach A — Quick fix (1–2 hours)
Add in-memory or Redis-based rate limiting in the server action itself using the `upstash/ratelimit` package or a simple IP + timestamp check in the action:

```typescript
// In auth.actions.ts, before calling createUser:
const ip = headers().get("x-forwarded-for") ?? "unknown";
const key = `signup:${ip}`;
// Allow max 3 signups per IP per hour
const attempts = await kv.incr(key);
if (attempts === 1) await kv.expire(key, 3600);
if (attempts > 3) {
  return { error: "Too many signup attempts. Please try again later." };
}
```

#### Approach B — Right fix (Supabase dashboard, 5 minutes + requires removing `email_confirm: true`)
1. Remove `email_confirm: true` from `admin.auth.admin.createUser`
2. Switch back to `supabase.auth.signUp()` (the non-admin client)
3. In Supabase dashboard → Authentication → Settings → enable email confirmation
4. Supabase's built-in rate limiting then applies automatically (max 3 signups per hour per email)

---

### Pros and Cons Analysis

#### If you DO implement rate limiting

| Pros | Details |
|------|---------|
| Prevents bot attacks | Automated scripts cannot flood your DB with fake companies |
| Protects Supabase row limits | Your free/paid tier has row limits — fake accounts burn through them |
| Prevents email spam | If you send welcome emails, bots won't trigger thousands of them |
| Reduces server costs | Each signup creates a Supabase Auth user + two DB rows (users + companies) |
| Demonstrates security posture | Required for any enterprise customer security review or SOC 2 |

| Cons | Details |
|------|---------|
| Extra code to maintain | Upstash KV or Redis adds an infrastructure dependency |
| Could block legitimate users | A corporate proxy might share one IP — tune the limit carefully (5–10/hour is safer than 3) |
| Email confirmation adds friction | Users must check email before logging in — slightly higher drop-off at signup |

#### If you do NOT implement rate limiting

| Risk | Impact |
|------|--------|
| Unlimited free company creation | Anyone can create thousands of companies — exhausts your Supabase quotas |
| Database bloat | Fake companies and users pile up with no natural cleanup |
| Billing overrun | Supabase charges by row count and auth users above free tier |
| Welcome email costs | If you add email later, bots trigger thousands of sends on your SendGrid/Resend bill |
| No traceability | With `email_confirm: true`, there's no way to verify if a company email is real |
| Competitor abuse | A competitor could flood your platform with fake signups to exhaust capacity |

---

### Recommended Action

**Do Approach B first** (5 minutes, no new dependencies):

1. In `apps/web/src/lib/actions/auth.actions.ts`, change `email_confirm: true` to `email_confirm: false` and switch to the regular Supabase client's `signUp` method
2. Go to Supabase Dashboard → Authentication → Settings → Email → enable "Confirm email"
3. Test that the confirmation email arrives and the flow works

**Then add Approach A** if you want stricter protection (bots that control many email addresses would still bypass step B alone).

This is the only item in the entire review that is not yet addressed in the codebase.

---

## Final Score

```
Phase A — Critical bugs:     4 / 4 complete ✅
Phase B — Performance:       4 / 5 complete ⚠️  (Item 10 missing)
Phase C — Mobile reliability: 6 / 6 complete ✅

Overall: 14 / 16 complete (87.5%)
         Missing: Item 10 — Signup rate limiting
```
