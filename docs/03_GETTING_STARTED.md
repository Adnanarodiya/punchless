# 🚀 03 — Getting Started (Setup Guide)

## Prerequisites

Make sure you have installed:

- **Node.js** (v18+)
- **pnpm** (package manager — used with Turborepo)
- **Git**
- **Supabase CLI** (`npx supabase init`)
- **Expo CLI** (`npx expo`)
- **VS Code** (recommended)

---

## Step 1: Create Monorepo

```bash
# Create project folder
mkdir workshop-saas
cd workshop-saas

# Initialize Turborepo
npx create-turbo@latest .

# Or manually:
pnpm init
```

### Root `package.json`
```json
{
  "name": "workshop-saas",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "devDependencies": {
    "turbo": "latest"
  }
}
```

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {}
  }
}
```

---

## Step 2: Create Apps

### Web Dashboard (Next.js)
```bash
cd apps
npx create-next-app@latest web --typescript --app --tailwind --eslint
```

### Mobile App (Expo)
```bash
cd apps
npx create-expo-app mobile --template blank-typescript
```

---

## Step 3: Create Shared Packages

### `packages/types/`
```bash
mkdir -p packages/types/src
```

```ts
// packages/types/src/index.ts
export type UserRole = 'owner' | 'admin' | 'employee';

export interface Company {
  id: string;
  name: string;
  subscription_status: 'active' | 'inactive' | 'trial';
  created_at: string;
}

export interface User {
  id: string;
  company_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  hourly_rate: number;
  travel_rate: number;
  is_active: boolean;
}

// ... more types added as we build
```

### `packages/config/`
Supabase client initialization shared between web & mobile.

### `packages/ui/`
Shared UI components (later).

---

## Step 4: Setup Supabase

```bash
# From project root
npx supabase init
```

This creates the `supabase/` folder with:
```
supabase/
├── config.toml
├── migrations/
├── functions/
└── seed.sql
```

### Local Development
```bash
npx supabase start     # Starts local Supabase (Docker required)
npx supabase db reset   # Resets DB and runs migrations + seed
```

### Create Supabase Project (Production)
1. Go to https://supabase.com
2. Create new project
3. Copy project URL and anon key
4. Add to `.env.local` files

---

## Step 5: Environment Variables

### `apps/web/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### `apps/mobile/.env`
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ NEVER commit `.env` files. Add them to `.gitignore`.

---

## Step 6: Run Everything

```bash
# From root — runs all apps in dev mode
pnpm turbo dev

# Or individually:
cd apps/web && pnpm dev       # Dashboard at localhost:3000
cd apps/mobile && pnpm start  # Expo dev server
```

---

## What's Next?

After setup is complete, move to:
1. `05_DATABASE_SCHEMA.md` — Create tables
2. `06_ATTENDANCE_ENGINE.md` — Build core attendance logic
3. `04_BUILD_PHASES.md` — Follow the phase-by-phase plan

---

## Related Docs

- Architecture → `02_ARCHITECTURE.md`
- Build phases → `04_BUILD_PHASES.md`
- Database → `05_DATABASE_SCHEMA.md`
