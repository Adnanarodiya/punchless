# 🎨 11 — Theming & Colors

## The #1 Rule

> **NEVER use direct/random colors anywhere. ALWAYS use CSS variables from `globals.css`.**

---

## Single Source of Truth

All colors are defined in **one file only**:

```
apps/web/src/app/globals.css
```

Want to change the entire theme? Change this file. Every page, every component updates automatically.

---

## Available Color Variables

### Core

| Variable | Usage |
|----------|-------|
| `bg-background` | Page/app background |
| `text-foreground` | Default text color |
| `bg-card` / `text-card-foreground` | Card backgrounds & text |
| `bg-popover` / `text-popover-foreground` | Dropdowns, popovers |

### Brand / Action

| Variable | Usage |
|----------|-------|
| `bg-primary` / `text-primary` | Brand color, main CTAs, links |
| `text-primary-foreground` | Text on primary background |
| `bg-secondary` / `text-secondary` | Secondary actions, less important buttons |
| `bg-accent` / `text-accent` | Hover states, highlights |

### Status

| Variable | Usage | Meaning |
|----------|-------|---------|
| `bg-destructive` / `text-destructive` | Errors, delete buttons, danger | ❌ Bad |
| `bg-success` / `text-success` | Active, completed, online | ✅ Good |
| `bg-warning` / `text-warning` | Pending, caution, overtime | ⚠️ Caution |
| `bg-info` / `text-info` | Informational, travel, neutral | ℹ️ Info |

### Muted / Subtle

| Variable | Usage |
|----------|-------|
| `bg-muted` | Subtle backgrounds (badges, tags) |
| `text-muted-foreground` | Helper text, descriptions, timestamps |

### Borders & Inputs

| Variable | Usage |
|----------|-------|
| `border-border` | All borders |
| `bg-input` | Input field backgrounds |
| `ring-ring` | Focus ring color |

### Sidebar (Dashboard)

| Variable | Usage |
|----------|-------|
| `bg-sidebar` | Sidebar background |
| `text-sidebar-foreground` | Sidebar text |
| `border-sidebar-border` | Sidebar border |
| `bg-sidebar-accent` | Active sidebar item |

### Attendance States (Punchless-specific)

| Variable | State | Usage |
|----------|-------|-------|
| `text-state-workshop` / `bg-state-workshop` | Workshop | Employee at workshop |
| `text-state-travel` / `bg-state-travel` | Travel | Employee traveling |
| `text-state-onsite` / `bg-state-onsite` | On-Site | Employee at job site |
| `text-state-offduty` / `bg-state-offduty` | Off Duty | Employee not working |

### Chart Colors (Reports)

| Variable | Usage |
|----------|-------|
| `chart-1` through `chart-5` | Graph/chart data colors |

---

## ❌ WRONG — Direct colors

```tsx
// BAD — hardcoded colors
<p className="text-blue-400">Hello</p>
<div className="bg-red-500">Error</div>
<span className="text-gray-400">Muted text</span>
<div className="bg-green-100 text-green-800">Active</div>
<div className="border-gray-700">Card</div>
```

## ✅ CORRECT — CSS variables

```tsx
// GOOD — semantic variables
<p className="text-primary">Hello</p>
<div className="bg-destructive">Error</div>
<span className="text-muted-foreground">Muted text</span>
<div className="bg-success/10 text-success">Active</div>
<div className="border-border">Card</div>
```

---

## How to Use with Opacity

```tsx
// Full color
<div className="bg-primary">Solid</div>

// With opacity (use /xx)
<div className="bg-primary/10">Very subtle background</div>
<div className="bg-destructive/20">Light red background</div>
<div className="bg-success/10">Light green background</div>
```

---

## Dark Mode

The app supports dark mode via the `.dark` class on a parent element.

- Light mode: `:root` variables apply
- Dark mode: `.dark` class variables override

Colors automatically adjust — brighter in dark mode, softer in light mode.

---

## Attendance State Usage Examples

```tsx
// Status badge
<span className="bg-state-workshop/10 text-state-workshop px-2 py-1 rounded-full">
  At Workshop
</span>

<span className="bg-state-travel/10 text-state-travel px-2 py-1 rounded-full">
  Traveling
</span>

<span className="bg-state-onsite/10 text-state-onsite px-2 py-1 rounded-full">
  On-Site
</span>

<span className="bg-state-offduty/10 text-state-offduty px-2 py-1 rounded-full">
  Off Duty
</span>
```

---

## Related Docs

- UI Components → `AGENT.md` (component rules section)
- Build Phases → `04_BUILD_PHASES.md`
