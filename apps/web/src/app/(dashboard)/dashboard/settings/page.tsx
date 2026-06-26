import { getCompanySettings } from "@/lib/queries/settings.queries";
import { getCurrentUser } from "@/lib/queries/auth.queries";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { SettingsManager } from "./settings-manager";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "owner") {
    redirect("/dashboard");
  }

  const settings = await getCompanySettings();

  if (!settings) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Settings"
          description="Company profile, work schedule, salary mode, and data lock PIN."
        />
        <p className="text-muted-foreground">Could not load company settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Settings"
        description="Company letterhead, work hours, hourly vs fixed salary mode, and PIN to hide financial figures."
      />
      <SettingsManager settings={settings} />
    </div>
  );
}