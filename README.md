# ⚡ Punchless

**Attendance that works without the punch.**

GPS-based automatic attendance, job tracking, travel time logging, and salary calculation — built for workshops and service businesses.

---

## Tech Stack

- **Web Dashboard:** Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Mobile App:** React Native + Expo (iOS & Android)
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **State Management:** Zustand
- **Icons:** Lucide
- **Monorepo:** Turborepo + pnpm

---

## Project Structure

```
punchless/
├── apps/
│   ├── web/              # Next.js Admin Dashboard
│   └── mobile/           # Expo Employee App
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── config/           # Shared configuration
│   └── ui/               # Shared UI components
├── supabase/
│   ├── migrations/       # Database migrations
│   ├── functions/        # Edge Functions
│   └── seed.sql          # Dev seed data
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Install

```bash
cd punchless
pnpm install
```

### Development

```bash
# Run all apps
pnpm dev

# Run only web dashboard
pnpm --filter @punchless/web dev

# Run only mobile app
pnpm --filter @punchless/mobile dev
```

---

## Documentation

See `DOCS_INDEX.md` at root for full documentation index, or check the `docs/` folder.

---

## License

Private — All rights reserved.
