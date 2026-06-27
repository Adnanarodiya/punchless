import { redirect } from "next/navigation";

import { getCompanySettings } from "@/lib/queries/settings.queries";

export async function isFullDashboardExperience(): Promise<boolean> {
  const settings = await getCompanySettings();
  return settings?.dashboard_experience === "full";
}

/** Redirect Simple-mode owners away from Full-only pages. */
export async function redirectUnlessFullDashboard(redirectTo = "/dashboard") {
  if (!(await isFullDashboardExperience())) {
    redirect(redirectTo);
  }
}