# Theme backups (2026-06-29)

Two snapshots live under `apps/web/theme-backup/`:

| Folder | Theme |
|--------|--------|
| `pre-oklch-amber/` | **Old** — zinc HSL + Inter (revert here if client dislikes amber) |
| `new-oklch-amber/` | **Current** — warm oklch amber + Plus Jakarta Sans |

Each folder contains `globals.css`, `tailwind.config.ts`, and `layout.tsx`.

## Revert to OLD theme (client wants previous look)

From repo root:

```powershell
.\apps\web\theme-backup\pre-oklch-amber\restore-theme.ps1
```

Then restart dev server and hard-refresh the browser.

## Switch back to NEW theme

```powershell
.\apps\web\theme-backup\new-oklch-amber\restore-theme.ps1
```

(Copy `restore-theme.ps1` into `new-oklch-amber/` or run the same copy commands manually.)

## Manual restore (old theme)

```text
apps/web/theme-backup/pre-oklch-amber/globals.css       → apps/web/src/app/globals.css
apps/web/theme-backup/pre-oklch-amber/tailwind.config.ts → apps/web/tailwind.config.ts
apps/web/theme-backup/pre-oklch-amber/layout.tsx        → apps/web/src/app/layout.tsx
```

## After any theme swap

Run `pnpm --filter web build` to confirm no errors.