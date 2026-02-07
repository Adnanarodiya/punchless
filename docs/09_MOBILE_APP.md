# 📱 09 — Mobile App (Expo / React Native)

## Overview

The mobile app is for **employees only**. It handles automatic attendance, job tracking, salary viewing, and advance requests.

**Tech:** React Native + Expo, TypeScript, Supabase JS Client

---

## Screen Structure

```
apps/mobile/
├── app/                        (Expo Router - file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx           ← Employee login
│   │   └── _layout.tsx
│   │
│   ├── (tabs)/
│   │   ├── _layout.tsx         ← Bottom tab navigator
│   │   ├── home.tsx            ← Status + today summary
│   │   ├── jobs.tsx            ← Assigned jobs
│   │   ├── salary.tsx          ← Salary breakdown
│   │   ├── advances.tsx        ← Request + history
│   │   └── profile.tsx         ← Profile + settings
│   │
│   ├── job/
│   │   └── [id].tsx            ← Job detail + actions
│   │
│   └── _layout.tsx
```

---

## Key Screens

### Home Screen
- **Current Status Badge**: OFF_DUTY / WORKSHOP / TRAVEL / ON_SITE_JOB
- Today's summary: hours at workshop, travel, on-site
- Active job card (if any)
- Quick action: "Start Travel" / "Mark Job Done"

### Jobs Screen
- List of assigned jobs (pending, in_progress, completed)
- Each job card: title, customer, location, status
- Tap to open job detail

### Job Detail Screen
- Job info: title, description, customer, location on map
- Action buttons based on current state:
  - If WORKSHOP → "Start Travel" button
  - If TRAVEL → "Arrived at Job" button (or auto-detect via GPS)
  - If ON_SITE_JOB → "Job Completed" button
- Timeline: travel started → arrived → completed

### Salary Screen
- Current month breakdown
- Workshop hours, travel hours, on-site hours
- Gross pay, overtime, deductions, net pay
- Monthly history (scroll through past months)

### Advances Screen
- "Request Advance" button → amount, reason
- List of past requests with status (pending/approved/rejected)
- Shows approved amount and deduction month

### Profile Screen
- Name, email, phone
- Company name
- Notification settings
- Logout

---

## Background GPS Tracking

### Setup
```
expo-location  → GPS access
expo-task-manager → Background task registration
```

### Background Task
```
1. Register background location task on app start
2. Task runs every 15-60 seconds (based on current state)
3. Each tick:
   a. Get current coordinates
   b. Read current state from local storage
   c. Calculate distance to workshop(s)
   d. Calculate distance to active job site (if any)
   e. Determine if state transition needed
   f. If yes → call Supabase to create/end session
   g. Update local state
```

### Permissions Required
- `ACCESS_FINE_LOCATION` (Android)
- `ACCESS_BACKGROUND_LOCATION` (Android)
- `NSLocationWhenInUseUsageDescription` (iOS)
- `NSLocationAlwaysUsageDescription` (iOS)

### Permission Flow
```
App opens → Request foreground location
  ↓
Granted → Explain why background is needed
  ↓
Request background location
  ↓
Granted → Start tracking
  ↓
Denied → Show message, app works but no auto-attendance
```

---

## Offline Support

Since employees may have poor connectivity on-site:

1. **Queue state changes locally** (AsyncStorage or SQLite)
2. When internet is back → **sync all queued changes** to Supabase
3. Show "offline" indicator in the app
4. GPS tracking continues even offline

---

## Push Notifications

| Event | Notification |
|-------|-------------|
| Job assigned | "New job assigned: [title]" |
| Advance approved | "Your advance of ₹[amount] has been approved" |
| Advance rejected | "Your advance request was rejected" |
| Salary ready | "Your salary for [month] is ready to view" |

**Implementation:** Expo Push Notifications + Supabase webhook/trigger

---

## State Management

- **Local state**: Current attendance state, cached data
- **Server state**: Supabase queries (use React Query or SWR)
- **Persisted state**: AsyncStorage for offline queue, auth tokens

---

## Related Docs

- Attendance engine → `06_ATTENDANCE_ENGINE.md`
- Salary calculation → `08_SALARY_CALCULATION.md`
- Architecture → `02_ARCHITECTURE.md`
