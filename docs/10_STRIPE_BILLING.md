# 💳 10 — Stripe Billing (Phase 10 — LAST!)

> ⚠️ **DO NOT START THIS UNTIL ALL OTHER PHASES ARE COMPLETE.**

## Overview

Workshops pay **₹800 per active employee per month**. This is handled via Stripe's quantity-based subscriptions.

---

## How It Works

```
Owner signs up → Trial period (14 days free)
    ↓
Trial ends → Must add payment method
    ↓
Stripe subscription created → quantity = active employee count
    ↓
Employee added/deactivated → quantity updated automatically
    ↓
Monthly billing → ₹800 × active employees
```

---

## Stripe Setup

1. Create Stripe account
2. Create Product: "Workshop Attendance SaaS"
3. Create Price: ₹800/month (per unit)
4. Use `quantity` = number of active employees

---

## Key Stripe Entities

| Stripe Entity | Our Entity |
|---------------|-----------|
| Customer | Company |
| Subscription | Company subscription |
| Quantity | Active employee count |

---

## Webhooks to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Mark company as active |
| `invoice.paid` | Confirm payment, update status |
| `invoice.payment_failed` | Notify owner, grace period |
| `customer.subscription.deleted` | Mark company as cancelled |

---

## Dashboard Billing Page (Owner Only)

- Current plan: ₹800/employee/month
- Active employees: X
- Monthly cost: ₹X
- Payment method (card on file)
- Invoice history
- Cancel subscription

---

## Implementation Notes

- Use Stripe Checkout for initial payment setup
- Use Stripe Customer Portal for managing subscription
- Edge Function to sync active employee count → Stripe quantity
- Cron job or trigger: when employee is activated/deactivated → update Stripe

---

## Related Docs

- Build phases → `04_BUILD_PHASES.md`
- Database → `05_DATABASE_SCHEMA.md`
- Architecture → `02_ARCHITECTURE.md`
