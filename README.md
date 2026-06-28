# Punchless V3 — Bookkeeping

Simple daily bookkeeping for workshops: sales bills, purchase bills, cash & bank receipts/payments, and party ledgers.

**Product spec:** see [`V3.md`](./V3.md) — the single source of truth for what we are building.

---

## Tech Stack

- **Web Dashboard:** Next.js 15 (App Router, TypeScript, Tailwind CSS v4)
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **State Management:** Zustand
- **Icons:** Lucide
- **Monorepo:** Turborepo + pnpm

---

## Project Structure

```
punchless/
├── apps/
│   ├── web/              # Next.js bookkeeping dashboard
│   └── mobile/           # (deferred — not V3 focus)
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── config/           # Shared configuration
│   └── ui/               # Shared UI components
├── supabase/
│   ├── migrations/       # Database migrations
│   └── seed.sql          # Dev seed data
├── V3.md                 # Product spec & build plan
├── AGENT.md              # Developer / AI rules
└── PROJECT_TRACKER.md    # File map & progress
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
pnpm dev                    # Run all apps
pnpm --filter @punchless/web dev   # Web dashboard only
```

### Database

```bash
pnpm db:push                # Push migrations to Supabase
pnpm db:gen-types           # Regenerate TypeScript DB types
pnpm db:wipe-keep-user:confirm   # Wipe data, keep owner login
```

---

## Documentation

| File | Purpose |
|------|---------|
| [`V3.md`](./V3.md) | Bookkeeping product spec & implementation phases |
| [`AGENT.md`](./AGENT.md) | Coding rules for AI and developers |
| [`PROJECT_TRACKER.md`](./PROJECT_TRACKER.md) | File map and phase progress |
| [`docs/11_THEMING_AND_COLORS.md`](./docs/11_THEMING_AND_COLORS.md) | CSS color tokens |

---

## License

Private — All rights reserved.