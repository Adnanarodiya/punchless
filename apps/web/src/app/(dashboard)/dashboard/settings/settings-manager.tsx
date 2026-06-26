"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@punchless/ui/components/button";
import {
  Clock,
  Timer,
  CalendarDays,
  Hourglass,
  Save,
  Building2,
  Users,
  KeyRound,
  Lock,
  Trash2,
} from "lucide-react";
import {
  removeDataLockPin,
  setDataLockPin,
  updateCompanyProfile,
  updateCompanySettings,
} from "@/lib/actions/settings.actions";
import { useDataLockStore } from "@/lib/stores/data-lock.store";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import type { CompanySettings } from "@/lib/queries/settings.queries";
import { useAction } from "@/hooks/use-action";

interface Props {
  settings: CompanySettings;
}

export function SettingsManager({ settings }: Props) {
  const resetDataLock = useDataLockStore((s) => s.reset);
  const [removePinOpen, setRemovePinOpen] = useState(false);

  const { execute: handleSubmit, loading: saving } = useAction(updateCompanySettings, {
    successMessage: "Settings saved! Employee hourly rates have been recalculated.",
  });

  const { execute: handleProfileSubmit, loading: savingProfile } = useAction(
    updateCompanyProfile,
    { successMessage: "Company profile saved for statements and letterhead." }
  );

  const { execute: handleSetPin, loading: savingPin } = useAction(setDataLockPin, {
    successMessage: "Data lock PIN saved",
    onSuccess: () => resetDataLock(),
  });

  const { execute: handleRemovePin, loading: removingPin } = useAction(removeDataLockPin, {
    successMessage: "Data lock removed",
    onSuccess: () => resetDataLock(),
  });

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";

  // Calculate example: if someone earns ₹30,000/month
  const exampleSalary = 30000;
  const totalHours = settings.daily_work_hours * settings.working_days_per_month;
  const exampleHourly = totalHours > 0 ? Math.round((exampleSalary / totalHours) * 100) / 100 : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/settings/users"
          className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:bg-accent/30"
        >
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Users className="size-4" />
            <span className="font-medium">Dashboard Users</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Invite admin accounts for the web dashboard.
          </p>
        </Link>
        <Link
          href="/dashboard/settings/password"
          className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:bg-accent/30"
        >
          <div className="mb-2 flex items-center gap-2 text-primary">
            <KeyRound className="size-4" />
            <span className="font-medium">Change Password</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Update your login password.
          </p>
        </Link>
      </div>

      <form action={handleProfileSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Company Profile</h2>
            <p className="text-sm text-muted-foreground">
              Shown on client and supplier statement letterheads.
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Company Name</label>
          <p className="text-sm text-muted-foreground">{settings.name}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Tagline</label>
            <input
              name="tagline"
              type="text"
              defaultValue={settings.tagline ?? ""}
              placeholder="e.g. Premium Auto Workshop"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Address</label>
            <textarea
              name="address"
              rows={3}
              defaultValue={settings.address ?? ""}
              placeholder="Full business address"
              className={`${inputClass} min-h-[80px] py-2`}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input
              name="phone"
              type="text"
              defaultValue={settings.phone ?? ""}
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={settings.email ?? ""}
              placeholder="contact@workshop.com"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Logo URL</label>
            <input
              name="logoUrl"
              type="url"
              defaultValue={settings.logo_url ?? ""}
              placeholder="https://example.com/logo.png"
              className={inputClass}
            />
          </div>
        </div>

        <Button type="submit" loading={savingProfile} disabled={savingProfile}>
          <Save className="size-4" />
          Save Company Profile
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lock className="size-5 text-primary" />
          Data lock PIN
        </h2>
        <p className="text-sm text-muted-foreground">
          Hide income, expenses, bank balances, and dues on the dashboard until
          the PIN is entered. Useful on a shared office PC.
        </p>

        {settings.has_data_lock_pin ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              PIN is set
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRemovePinOpen(true)}
            >
              <Trash2 className="size-4" />
              Remove PIN
            </Button>
          </div>
        ) : null}

        <form action={handleSetPin} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">New PIN</label>
            <input
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              minLength={4}
              maxLength={6}
              required
              placeholder="4–6 digits"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirm PIN</label>
            <input
              name="confirmPin"
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              minLength={4}
              maxLength={6}
              required
              placeholder="Repeat PIN"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={savingPin} disabled={savingPin}>
              {settings.has_data_lock_pin ? "Change PIN" : "Set PIN"}
            </Button>
          </div>
        </form>
      </div>

      {/* Work Schedule Settings */}
      <form action={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            Work Schedule Settings
          </h2>

          <p className="text-sm text-muted-foreground">
            These settings are used to calculate employee hourly rates from monthly salary,
            and to determine late arrivals.
          </p>

          {/* Punch-in Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                Punch-in Time
              </label>
              <input
                name="workStartTime"
                type="time"
                defaultValue={settings.work_start_time}
                required
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground mt-1">
                When the work day starts (e.g., 10:00 AM)
              </p>
            </div>

            {/* Grace Period */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                <Timer className="size-4 text-muted-foreground" />
                Grace Period (minutes)
              </label>
              <input
                name="gracePeriodMinutes"
                type="number"
                min={0}
                max={60}
                defaultValue={settings.grace_period_minutes}
                required
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Arriving within this time after punch-in is still counted as on-time
                (e.g., 5 min → arriving at 10:05 is OK)
              </p>
            </div>

            {/* Daily Work Hours */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                <Hourglass className="size-4 text-muted-foreground" />
                Daily Work Hours
              </label>
              <input
                name="dailyWorkHours"
                type="number"
                step="0.5"
                min={1}
                max={24}
                defaultValue={settings.daily_work_hours}
                required
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground mt-1">
                How many hours per day employees are expected to work (e.g., 8 or 9)
              </p>
            </div>

            {/* Working Days per Month */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                Working Days per Month
              </label>
              <input
                name="workingDaysPerMonth"
                type="number"
                min={1}
                max={31}
                defaultValue={settings.working_days_per_month}
                required
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Average working days used for salary calculation (e.g., 26)
              </p>
            </div>
          </div>
        </div>

        {/* Calculation Preview */}
        <div className="bg-muted/50 border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">💡 How Salary Calculation Works</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Total monthly hours = <strong>{settings.daily_work_hours}h/day</strong> × <strong>{settings.working_days_per_month} days</strong> = <strong>{totalHours}h</strong>
            </p>
            <p>
              Example: Employee with ₹{exampleSalary.toLocaleString("en-IN")} monthly salary → <strong>₹{exampleHourly}/hr</strong>
            </p>
            <p className="text-xs mt-2">
              When you set an employee&apos;s monthly salary, we automatically calculate their per-hour rate using these settings.
              If you change these settings, all employee hourly rates will be recalculated.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button type="submit" loading={saving} disabled={saving} className="w-full md:w-auto">
          <Save className="size-4" />
          Save Settings
        </Button>
      </form>

      <ConfirmModal
        open={removePinOpen}
        onOpenChange={setRemovePinOpen}
        title="Remove data lock PIN?"
        description="Financial figures will always be visible on the dashboard."
        confirmText="Remove PIN"
        variant="destructive"
        loading={removingPin}
        onConfirm={async () => {
          await handleRemovePin(new FormData());
          setRemovePinOpen(false);
        }}
      />
    </div>
  );
}
