# 🤖 AGENT.md — Project Rules & Working Guidelines

## Project: Punchless — Workshop Attendance SaaS

---

## 📌 Golden Rules

1. **Never skip reading relevant docs** before working on any feature. Always check `docs/` folder first.
2. **Stripe/Billing is the LAST thing we build.** Do not touch payments until everything else works.
3. **One feature at a time.** Finish, test, then move to next.
4. **Monorepo discipline** — shared code goes in `packages/`, app-specific code stays in `apps/`.
5. **Database first** — always write migrations before building UI for any feature.
6. **Type safety** — use shared TypeScript types from `packages/types/` everywhere.
7. **RLS always on** — every Supabase table must have Row Level Security policies. No exceptions.
8. **Mobile-first thinking** — the employee experience on mobile is the core product.
9. **Zustand for state management.** Use Zustand whenever state management is needed. No Redux, no Context API for global state.
10. **Lucide icons ONLY.** All icons must come from the `lucide-react` (web) or `lucide-react-native` (mobile) package. Do NOT use any other icon library (no Heroicons, no FontAwesome, no React Icons, etc.).
11. **All UI components live in `packages/ui/`** — shadcn/ui style (Radix primitives + CVA + cn). Never create base components inside `apps/`. Import from `@punchless/ui`.
12. **Supabase DB types are auto-generated.** Run `pnpm db:gen-types` and keep them in `packages/types/src/database.types.ts`. Never hand-write DB types.
13. **`.env` files are NEVER committed.** Always update `.env.example` when adding/changing env variables. Every `.env` has a matching `.env.example`.
14. **Always update `PROJECT_TRACKER.md`** after creating, modifying, or deleting ANY file. This file tracks the full project structure, file descriptions, and phase progress. Never skip this step.
15. **NEVER use direct/random colors.** All colors come from CSS variables defined in `globals.css`. Use `text-primary`, `bg-destructive`, `text-muted-foreground`, etc. NEVER use `text-blue-400`, `bg-red-500`, `text-gray-600`, etc. See `docs/11_THEMING_AND_COLORS.md` for the full list.

---

## 🔐 Environment Variables Rules (CRITICAL!)

### Rule: `.env` files are NEVER pushed to GitHub. `.env.example` files are ALWAYS pushed and kept in sync.

### Env File Locations

| File | Purpose | Git? |
|------|---------|------|
| `.env` | Root env (Supabase project ID, keys) | ❌ NEVER |
| `.env.example` | Root env template (no real values) | ✅ ALWAYS |
| `apps/web/.env.local` | Web dashboard env (NEXT_PUBLIC_* + server keys) | ❌ NEVER |
| `apps/web/.env.example` | Web env template | ✅ ALWAYS |
| `apps/mobile/.env` | Mobile app env (EXPO_PUBLIC_*) | ❌ NEVER |
| `apps/mobile/.env.example` | Mobile env template | ✅ ALWAYS |

### When Adding a New Env Variable

1. Add the real value to the `.env` file
2. Add a placeholder to the matching `.env.example` file
3. **BOTH files must always have the same keys** (different values)

### Naming Convention

| App | Prefix | Example |
|-----|--------|---------|
| Next.js (browser-safe) | `NEXT_PUBLIC_` | `NEXT_PUBLIC_SUPABASE_URL` |
| Next.js (server-only) | No prefix | `SUPABASE_SERVICE_ROLE_KEY` |
| Expo (public) | `EXPO_PUBLIC_` | `EXPO_PUBLIC_SUPABASE_URL` |
| Root | No prefix | `SUPABASE_PROJECT_ID` |

### ❌ NEVER: Commit `.env`, `.env.local`, or any file with real API keys
### ✅ ALWAYS: Update `.env.example` when adding/changing env variables

---

## 📜 Useful Scripts (package.json)

All Supabase and build commands are saved in the root `package.json`:

```bash
# Development
pnpm dev                    # Run all apps (web + mobile)
pnpm build                  # Build all apps
pnpm lint                   # Lint all apps

# Database
pnpm db:gen-types           # Regenerate Supabase DB types → packages/types/
pnpm db:push                # Push local migrations to remote Supabase
pnpm db:pull                # Pull remote schema to local migrations
pnpm db:reset               # Reset local DB (runs migrations + seed)
pnpm db:migration:new       # Create a new migration file
pnpm db:diff                # Diff local vs remote schema
pnpm db:status              # List migration status

# Supabase Local
pnpm supabase:start         # Start local Supabase (Docker)
pnpm supabase:stop          # Stop local Supabase
pnpm supabase:status        # Check local Supabase status
```

---

## 🗂️ File & Folder Rules

| What | Where |
|---|---|
| All documentation | `docs/` folder |
| Doc index/agenda | `DOCS_INDEX.md` (root) |
| Agent rules | `AGENT.md` (root, this file) |
| Next.js dashboard | `apps/web/` |
| Expo mobile app | `apps/mobile/` |
| Shared UI components | `packages/ui/` |
| Shared TypeScript types | `packages/types/` |
| Shared config/env | `packages/config/` |
| Supabase migrations | `supabase/migrations/` |
| Supabase edge functions | `supabase/functions/` |
| Supabase seed data | `supabase/seed.sql` |

---

## 📂 Code Organization Rules (IMPORTANT!)

### Rule: One file per feature. Never dump everything in one file.

Server functions, actions, API calls, and logic must be **separated by feature/page**. Each feature gets its own file inside a dedicated folder.

### Web Dashboard (`apps/web/`)

```
apps/web/
├── lib/
│   ├── supabase/
│   │   ├── client.ts              ← Browser Supabase client
│   │   └── server.ts              ← Server-side Supabase client
│   │
│   ├── actions/                   ← Server Actions (one file per feature)
│   │   ├── auth.actions.ts        ← login, signup, logout, invite employee
│   │   ├── employee.actions.ts    ← add, edit, deactivate employee
│   │   ├── workshop.actions.ts    ← add, edit workshop locations
│   │   ├── job.actions.ts         ← create, assign, update job
│   │   ├── attendance.actions.ts  ← fetch attendance, manual close session
│   │   ├── salary.actions.ts      ← calculate salary, fetch reports
│   │   ├── advance.actions.ts     ← approve, reject advance requests
│   │   └── billing.actions.ts     ← Stripe actions (Phase 10 ONLY)
│   │
│   ├── queries/                   ← Data fetching (one file per feature)
│   │   ├── auth.queries.ts        ← get current user, get session
│   │   ├── employee.queries.ts    ← list employees, get employee by id
│   │   ├── workshop.queries.ts    ← list workshops, get workshop
│   │   ├── job.queries.ts         ← list jobs, get job detail
│   │   ├── attendance.queries.ts  ← get attendance history, live status
│   │   ├── salary.queries.ts      ← get salary breakdown, monthly summary
│   │   └── advance.queries.ts     ← list advances, pending count
│   │
│   └── utils/                     ← Helper functions
│       ├── formatting.ts          ← date, currency, time formatters
│       └── validation.ts          ← form validation schemas (zod)
```

### Mobile App (`apps/mobile/`)

```
apps/mobile/
├── lib/
│   ├── supabase.ts                ← Supabase client for mobile
│   │
│   ├── services/                  ← API/logic (one file per feature)
│   │   ├── auth.service.ts        ← login, logout, get session
│   │   ├── attendance.service.ts  ← start/end session, get status
│   │   ├── location.service.ts    ← GPS tracking, geofence logic
│   │   ├── job.service.ts         ← fetch jobs, update job status
│   │   ├── salary.service.ts      ← fetch salary data
│   │   └── advance.service.ts     ← request advance, fetch history
│   │
│   └── utils/                     ← Helpers
│       ├── formatting.ts
│       └── storage.ts             ← AsyncStorage helpers, offline queue
```

### Supabase Edge Functions

```
supabase/
├── functions/
│   ├── calculate-salary/index.ts  ← One function per purpose
│   ├── sync-stripe/index.ts       ← Phase 10 only
│   └── send-notification/index.ts
```

### Why This Structure?

- **Easy to find:** Need to fix login? Go to `auth.actions.ts`. Need to fix salary? Go to `salary.actions.ts`.
- **Easy to maintain:** Each file is small and focused. No 500-line god files.
- **Easy to review:** Changes to attendance don't touch job files.
- **Clear separation:** `actions/` = things that WRITE data. `queries/` = things that READ data. `services/` = combined logic for mobile.

### ❌ NEVER DO THIS:
```
# BAD — everything in one file
lib/api.ts              ← 1000 lines, all features mixed
lib/serverActions.ts    ← login + jobs + salary all in one
```

### ✅ ALWAYS DO THIS:
```
# GOOD — separated by feature
lib/actions/auth.actions.ts
lib/actions/job.actions.ts
lib/actions/salary.actions.ts
```

---

## 🔀 Git & Branch Rules

- `main` — production-ready code only
- `dev` — active development branch
- Feature branches: `feature/<feature-name>` (e.g., `feature/attendance-engine`)
- Always commit with clear messages: `feat:`, `fix:`, `docs:`, `chore:`

---

## 🏗️ Build Order (Strict)

```
Phase 1: Project Setup (monorepo, supabase, basic auth)
Phase 2: Database & Core Schema
Phase 3: Attendance Engine (GPS + state machine)
Phase 4: Job & Travel Tracking
Phase 5: Salary Calculation
Phase 6: Salary Advance Feature
Phase 7: Web Dashboard (owner/admin UI)
Phase 8: Mobile App (employee UI)
Phase 9: Polish, Testing, Edge Cases
Phase 10: Stripe Billing (LAST!)
```

---

## 🧪 Testing Rules

- Test each feature manually before moving on
- Write edge case notes in the relevant doc file
- Mobile GPS features must be tested on real devices

---

## 📝 When Adding a New Feature

1. Read the relevant `docs/` file
2. Write/update the database migration if needed
3. Update `packages/types/` with new types
4. Build backend logic (Supabase edge function or RLS)
5. Build frontend (web or mobile)
6. Test
7. Commit with proper message

---

## 🧩 UI Components — shadcn/ui Pattern (Mandatory)

All reusable UI components live in **`packages/ui/`** using the **shadcn/ui pattern**: Radix UI primitives + CVA (class-variance-authority) + Tailwind + `cn()` utility.

### Package Structure

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── button.tsx          ← Radix Slot + CVA variants
│   │   ├── dialog.tsx          ← Radix Dialog primitive
│   │   ├── alert-dialog.tsx    ← Radix AlertDialog primitive
│   │   ├── modal.tsx           ← Composed: wraps Dialog for easy use
│   │   ├── confirm-modal.tsx   ← Composed: wraps AlertDialog for confirmations
│   │   ├── visually-hidden.tsx ← Radix VisuallyHidden
│   │   ├── input.tsx           ← (add as needed)
│   │   ├── badge.tsx           ← (add as needed)
│   │   ├── card.tsx            ← (add as needed)
│   │   └── ... more as needed
│   │
│   ├── lib/
│   │   └── utils.ts            ← cn() = clsx + tailwind-merge
│   │
│   └── index.ts                ← Barrel exports
```

### Two Levels of Components

#### Level 1: Primitives (low-level, max flexibility)
These are thin wrappers around Radix UI. They give full control.
```tsx
// Example: Dialog, AlertDialog, Button
import { Dialog, DialogContent, DialogTitle } from "@punchless/ui/components/dialog";
import { Button } from "@punchless/ui/components/button";
```

#### Level 2: Composed (high-level, easy to use)
These wrap Level 1 primitives into ready-to-use components with sensible defaults.
```tsx
// Example: Modal wraps Dialog, ConfirmModal wraps AlertDialog
import { Modal } from "@punchless/ui/components/modal";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";

// Usage — just pass props, no assembly needed:
<Modal open={open} onOpenChange={setOpen} title="Add Employee">
  <form>...</form>
</Modal>

<ConfirmModal
  open={open}
  onOpenChange={setOpen}
  title="Delete Employee?"
  description="This action cannot be undone."
  variant="destructive"
  onConfirm={handleDelete}
/>
```

### How to Import

```tsx
// ✅ Direct import (recommended — tree-shakeable)
import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";

// ✅ Barrel import (also works)
import { Button, Modal, cn } from "@punchless/ui";
```

### Rules for Creating New Components

1. **Primitive first** — create the Radix-based primitive in `packages/ui/src/components/`
2. **Compose if needed** — if a component is used in a repetitive pattern, create a composed version
3. **Use CVA** for variant-based styling (like Button sizes/variants)
4. **Always use `cn()`** for className merging
5. **Always use `data-slot`** attribute for component identification
6. **Export from index.ts** — add every new component to the barrel export
7. **Icons from Lucide only** — inside components, import from `lucide-react`

### ❌ NEVER
- Don't create base UI components inside `apps/web/src/components/` or `apps/mobile/`
- Don't use raw HTML buttons/dialogs when a `packages/ui` component exists
- Don't install a separate component library (no MUI, no Chakra, no Ant Design)
- Don't duplicate component code between web and mobile

### ✅ ALWAYS
- All base components → `packages/ui/src/components/`
- App-specific composed layouts (like Sidebar, DashboardHeader) → `apps/web/src/components/`
- App-specific mobile layouts → `apps/mobile/components/`

---

## 🗃️ Supabase Types — Auto-Generated (Mandatory)

### Rule: Never hand-write database types. Always auto-generate.

After creating/changing any database table or migration, run:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > packages/types/src/database.types.ts
```

This generates the full `Database` type with `Row`, `Insert`, `Update` for every table.

### How to Use

```ts
// Import auto-generated types
import { Database, Tables, TablesInsert, TablesUpdate } from "@punchless/types/database.types";

// Use in Supabase client
import { createClient } from "@supabase/supabase-js";
const supabase = createClient<Database>(url, key);

// Use table row types directly
type User = Tables<"users">;
type NewUser = TablesInsert<"users">;
type UpdateUser = TablesUpdate<"users">;
```

### When to Regenerate Types
- After running any migration (`supabase db push` or `supabase migration up`)
- After adding/changing tables, columns, or RLS policies
- Before committing if DB schema changed

---

## 🐻 State Management — Zustand (Mandatory)

Use **Zustand** for all global/shared state management across the project.

### When to Use Zustand
- Current user session / auth state
- Current attendance state (mobile)
- Offline queue state (mobile)
- Any data shared across multiple components that isn't server-fetched

### When NOT to Use Zustand
- Simple local component state → use `useState`
- Server data fetching/caching → use React Query / SWR or Next.js server components
- Form state → use `useState` or form libraries

### Store Structure (one store per feature)
```
apps/web/lib/stores/
├── auth.store.ts           ← user session, role
└── ui.store.ts             ← sidebar open/close, modals

apps/mobile/lib/stores/
├── auth.store.ts           ← user session
├── attendance.store.ts     ← current state, active session
├── location.store.ts       ← GPS coords, tracking status
└── offline.store.ts        ← queued actions for sync
```

### Example
```ts
// lib/stores/attendance.store.ts
import { create } from 'zustand';

interface AttendanceStore {
  currentState: 'off_duty' | 'workshop' | 'travel' | 'on_site_job';
  activeSessionId: string | null;
  setCurrentState: (state: AttendanceStore['currentState']) => void;
}

export const useAttendanceStore = create<AttendanceStore>((set) => ({
  currentState: 'off_duty',
  activeSessionId: null,
  setCurrentState: (currentState) => set({ currentState }),
}));
```

### ❌ NEVER: `useContext` + `useReducer` for global state, Redux, MobX
### ✅ ALWAYS: Zustand stores, one per feature, in `lib/stores/`

---

## 🎨 Icons — Lucide ONLY (Mandatory)

Use **Lucide** for ALL icons across the project. No exceptions.

### Packages
- Web (Next.js): `lucide-react`
- Mobile (Expo): `lucide-react-native`

### Usage
```tsx
// Web
import { Users, MapPin, Clock, DollarSign } from 'lucide-react';

<Users className="w-5 h-5" />
<MapPin className="w-4 h-4 text-gray-500" />
```

```tsx
// Mobile
import { Users, MapPin, Clock } from 'lucide-react-native';

<Users size={20} color="#000" />
```

### Why Lucide?
- Consistent design across all icons
- Lightweight, tree-shakeable
- Works on both web and React Native
- One library for the entire project

### ❌ NEVER: Heroicons, FontAwesome, React Icons, Material Icons, Ionicons, Feather (separate package)
### ✅ ALWAYS: `lucide-react` (web) and `lucide-react-native` (mobile)

---

## ❌ Things to NEVER Do

- Don't hardcode company IDs or user IDs
- Don't skip RLS policies
- Don't build Stripe before Phase 10
- Don't put app-specific code in `packages/`
- Don't store sensitive keys in code — use environment variables
- Don't create tables without `company_id` (multi-tenancy!)
- Don't use any icon library other than Lucide
- Don't use Redux, MobX, or Context API for global state — use Zustand
- Don't mix multiple features in one Zustand store — one store per feature
- Don't use direct Tailwind colors (text-blue-400, bg-red-500, bg-gray-800, etc.)
- Always use CSS variable colors (text-primary, bg-destructive, text-muted-foreground, etc.)
- Don't add new colors without defining them in `globals.css` first

---

## ✅ Definition of Done (for any feature)

- [ ] Database migration written & applied
- [ ] Types updated in `packages/types/`
- [ ] RLS policies in place
- [ ] Feature works on web or mobile (whichever applies)
- [ ] No hardcoded values
- [ ] Code committed with proper message
