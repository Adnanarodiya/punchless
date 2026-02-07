# ⏱️ 06 — Attendance Engine (GPS + State Machine)

## Overview

The attendance engine is the **core feature** of this SaaS. It automatically tracks where an employee is and what they're doing — no manual punch-in required.

---

## State Machine

An employee is always in one of these states:

```
┌──────────┐     enters workshop      ┌──────────┐
│ OFF_DUTY  │ ──────────────────────► │ WORKSHOP  │
└──────────┘                          └────┬─────┘
     ▲                                     │
     │ leaves workshop                     │ assigned job,
     │ (no active job)                     │ starts travel
     │                                     ▼
     │                              ┌──────────┐
     │                              │  TRAVEL   │
     │                              └────┬─────┘
     │                                   │
     │                                   │ reaches job site
     │                                   ▼
     │                              ┌──────────────┐
     │                              │ ON_SITE_JOB   │
     │                              └────┬─────────┘
     │                                   │
     │                                   │ job completed,
     │                                   │ starts return travel
     │                                   ▼
     │                              ┌──────────┐
     │                              │  TRAVEL   │
     │                              │  (return) │
     │                              └────┬─────┘
     │                                   │
     │               reaches workshop    │
     └───────────────────────────────────┘
```

### State Transitions

| From | To | Trigger |
|------|-----|---------|
| OFF_DUTY | WORKSHOP | GPS enters workshop geofence |
| WORKSHOP | OFF_DUTY | GPS exits workshop geofence (no active job) |
| WORKSHOP | TRAVEL | Employee starts travel to job |
| TRAVEL | ON_SITE_JOB | GPS enters job site geofence |
| ON_SITE_JOB | TRAVEL | Employee marks job done, starts return |
| TRAVEL | WORKSHOP | GPS enters workshop geofence |
| TRAVEL | OFF_DUTY | Employee ends shift (goes home directly) |

---

## How GPS Tracking Works (Mobile App)

### Technology
- `expo-location` for foreground + background location tracking
- `expo-task-manager` for background tasks

### Flow
```
App starts
    │
    ▼
Request location permissions (foreground + background)
    │
    ▼
Start background location tracking
    │
    ▼
Every X seconds (configurable, e.g., 30s):
    │
    ├── Get current GPS coordinates
    ├── Fetch workshop location (lat, lng, radius)
    ├── Calculate distance to workshop
    │
    ├── If distance < radius AND current state = OFF_DUTY
    │       → Transition to WORKSHOP
    │       → Create new attendance_session (state: workshop)
    │
    ├── If distance > radius AND current state = WORKSHOP AND no active job
    │       → Transition to OFF_DUTY
    │       → End current attendance_session (set end_time)
    │
    └── If traveling to job:
            → Check distance to job site
            → If within job radius → Transition to ON_SITE_JOB
```

### Battery Optimization
- Use `Accuracy.Balanced` (not highest) to save battery
- Increase interval when OFF_DUTY (e.g., every 60s)
- Decrease interval when WORKSHOP or TRAVEL (e.g., every 15-30s)
- Use geofencing APIs where possible instead of constant polling

---

## Session Recording

Each state transition creates/ends a session in `attendance_sessions`:

```
Example Day for Employee "Ravi":

Session 1: WORKSHOP    | 09:00 → 10:30 | workshop_id: abc
Session 2: TRAVEL      | 10:30 → 11:00 | job_id: xyz
Session 3: ON_SITE_JOB | 11:00 → 13:00 | job_id: xyz
Session 4: TRAVEL      | 13:00 → 13:30 | job_id: xyz
Session 5: WORKSHOP    | 13:30 → 18:00 | workshop_id: abc

Total: 8.5 hours
  Workshop: 7 hours
  Travel: 1 hour
  On-site: 2 hours
  Overtime: 0.5 hours (if shift = 8 hrs)
```

---

## Edge Cases to Handle

1. **Employee opens app outside workshop** → Stay OFF_DUTY, don't create session
2. **GPS signal lost temporarily** → Keep current state, don't end session. Use a grace period (e.g., 5 min)
3. **Employee phone dies mid-shift** → Session stays open (end_time = NULL). Owner can manually close it from dashboard.
4. **Multiple workshops** → Check distance against ALL workshop locations for the company
5. **Employee goes to job without starting travel** → Require explicit "Start Travel" button press (don't rely only on GPS for job transitions)
6. **Internet offline** → Queue state changes locally, sync when back online
7. **Overlapping sessions** → Prevent: always end current session before starting new one

---

## Hybrid Approach: GPS + Manual Actions

Not everything should be GPS-only. The recommended approach:

| Transition | Method |
|-----------|--------|
| OFF_DUTY → WORKSHOP | **Automatic** (GPS geofence) |
| WORKSHOP → OFF_DUTY | **Automatic** (GPS geofence) |
| WORKSHOP → TRAVEL | **Manual** (employee taps "Start Travel") |
| TRAVEL → ON_SITE_JOB | **Automatic** (GPS reaches job site) OR **Manual** button |
| ON_SITE_JOB → TRAVEL | **Manual** (employee taps "Job Done") |
| TRAVEL → WORKSHOP | **Automatic** (GPS geofence) |

This prevents false transitions and gives employees control over job-related states.

---

## Related Docs

- Database schema → `05_DATABASE_SCHEMA.md`
- Salary calculation → `08_SALARY_CALCULATION.md`
- Mobile app → `09_MOBILE_APP.md`
- Build phases → `04_BUILD_PHASES.md`
