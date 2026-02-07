# 💰 08 — Salary Calculation Logic

## Overview

Salary is calculated **automatically** from attendance session data. No manual entry needed.

---

## Formula

```
Workshop Pay   = SUM(workshop session hours) × hourly_rate
Travel Pay     = SUM(travel session hours) × travel_rate
On-Site Pay    = SUM(on_site_job session hours) × hourly_rate
─────────────────────────────────────────────────────────
Gross Pay      = Workshop Pay + Travel Pay + On-Site Pay

Total Hours    = Workshop Hours + Travel Hours + On-Site Hours
Overtime Hours = MAX(0, Total Hours - (daily_shift_hours × working_days))
Overtime Pay   = Overtime Hours × hourly_rate × 1.5  (or configurable multiplier)

Advance Deduction = SUM(approved advances for this month)

Net Pay = Gross Pay + Overtime Pay - Advance Deduction
```

---

## Example Calculation

### Employee: Ravi
- `hourly_rate`: ₹150/hr
- `travel_rate`: ₹100/hr
- `daily_shift_hours`: 8 hrs
- Working days in month: 26

### Monthly Data
| Type | Total Hours |
|------|------------|
| Workshop | 160 hrs |
| Travel | 20 hrs |
| On-Site Job | 30 hrs |
| **Total** | **210 hrs** |

### Calculation
```
Workshop Pay   = 160 × ₹150 = ₹24,000
Travel Pay     = 20 × ₹100  = ₹2,000
On-Site Pay    = 30 × ₹150  = ₹4,500
──────────────────────────────────────
Gross Pay      = ₹30,500

Standard Hours = 8 × 26 = 208 hrs
Overtime       = 210 - 208 = 2 hrs
Overtime Pay   = 2 × ₹150 × 1.5 = ₹450

Advance Deduction = ₹5,000 (one approved advance)

Net Pay = ₹30,500 + ₹450 - ₹5,000 = ₹25,950
```

---

## Implementation: Supabase Edge Function

```
POST /functions/v1/calculate-salary

Body: {
  employee_id: "uuid",
  month: "2026-02"    // YYYY-MM format
}

Response: {
  employee_id: "uuid",
  month: "2026-02",
  workshop_hours: 160,
  travel_hours: 20,
  on_site_hours: 30,
  total_hours: 210,
  standard_hours: 208,
  overtime_hours: 2,
  workshop_pay: 24000,
  travel_pay: 2000,
  on_site_pay: 4500,
  gross_pay: 30500,
  overtime_pay: 450,
  advance_deduction: 5000,
  net_pay: 25950
}
```

### Logic (Pseudocode)
```
1. Fetch employee record (hourly_rate, travel_rate, daily_shift_hours)
2. Fetch all attendance_sessions for employee in given month
3. Group by state, sum duration_minutes
4. Convert to hours
5. Calculate each pay component
6. Fetch approved advances for that month
7. Return breakdown
```

---

## Daily vs Monthly

- **Daily view**: Show hours worked today, current status
- **Monthly view**: Full salary breakdown as above
- **Both available** on dashboard and mobile app

---

## Configurable Settings (Future)

- Overtime multiplier (1.5x default, but owner can change)
- Different rates for weekends/holidays
- Shift start/end times
- Grace period for late arrival

---

## Related Docs

- Attendance engine → `06_ATTENDANCE_ENGINE.md`
- Database schema → `05_DATABASE_SCHEMA.md`
- Web dashboard → `07_WEB_DASHBOARD.md`
