import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/auth.queries";
import { getDataLockStatus } from "@/lib/queries/settings.queries";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, dataLock] = await Promise.all([getCurrentUser(), getDataLockStatus()]);

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      role={user.role}
      userName={user.full_name}
      companyName={user.company?.name ?? ""}
      hasDataLockPin={dataLock.hasPin}
    >
      {children}
    </DashboardShell>
  );
}
