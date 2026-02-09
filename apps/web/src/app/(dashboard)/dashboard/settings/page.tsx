import { getCompanySettings } from "@/lib/queries/settings.queries";
import { getCurrentUser } from "@/lib/queries/auth.queries";
import { redirect } from "next/navigation";
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
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <p className="text-muted-foreground">Could not load company settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsManager settings={settings} />
    </div>
  );
}
