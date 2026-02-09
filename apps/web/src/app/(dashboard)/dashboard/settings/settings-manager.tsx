"use client";

import { Button } from "@punchless/ui/components/button";
import {
  Clock,
  Timer,
  CalendarDays,
  Hourglass,
  Save,
  Building2,
} from "lucide-react";
import { updateCompanySettings } from "@/lib/actions/settings.actions";
import type { CompanySettings } from "@/lib/queries/settings.queries";
import { useAction } from "@/hooks/use-action";

interface Props {
  settings: CompanySettings;
}

export function SettingsManager({ settings }: Props) {
  const { execute: handleSubmit, loading: saving } = useAction(updateCompanySettings, {
    successMessage: "Settings saved! Employee hourly rates have been recalculated.",
  });

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";

  // Calculate example: if someone earns ₹30,000/month
  const exampleSalary = 30000;
  const totalHours = settings.daily_work_hours * settings.working_days_per_month;
  const exampleHourly = totalHours > 0 ? Math.round((exampleSalary / totalHours) * 100) / 100 : 0;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Company Info */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
            <Building2 className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Company</h2>
            <p className="text-sm text-muted-foreground">{settings.name}</p>
          </div>
        </div>
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
        <Button type="submit" disabled={saving} className="w-full md:w-auto">
          <Save className="size-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
