import { getCompanySettings } from "@/lib/queries/settings.queries";
import { getCurrentUser } from "@/lib/queries/auth.queries";
import { redirect } from "next/navigation";
import { DashboardPageTitle } from "@/components/dashboard-page-title";
import { SettingsManager } from "./settings-manager";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  // Only owner can access settings
  if (!user || user.role !== "owner") {
    redirect("/dashboard");
  }

  const settings = await getCompanySettings();

  if (!settings) {
    return (
      <div>
        <DashboardPageTitle title="Settings" />
        <p className="text-muted-foreground">Could not load company settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageTitle title="Settings" />
      <SettingsManager settings={settings} />
    </div>
  );
}
