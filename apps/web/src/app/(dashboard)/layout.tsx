import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/auth.queries";
import { getDashboardShellPrefs } from "@/lib/queries/settings.queries";
import { getSystemLedgerNavLinks } from "@/lib/queries/system-party.queries";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, shellPrefs, systemLedgerLinks] = await Promise.all([
    getCurrentUser(),
    getDashboardShellPrefs(),
    getSystemLedgerNavLinks(),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      role={user.role}
      userName={user.full_name}
      companyName={user.company?.name ?? ""}
      hasDataLockPin={shellPrefs.hasDataLockPin}
      dashboardExperience={shellPrefs.dashboardExperience}
      uiLanguage={shellPrefs.uiLanguage}
      systemLedgerLinks={systemLedgerLinks}
    >
      {children}
    </DashboardShell>
  );
}
