import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/auth.queries";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar
        role={user.role}
        userName={user.full_name}
        companyName={user.company?.name ?? ""}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <DashboardHeader userName={user.full_name} role={user.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
