import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/queries/auth.queries";
import { getDashboardUsers } from "@/lib/queries/admin-user.queries";

import { UsersManager } from "./users-manager";

export default async function SettingsUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    redirect("/dashboard");
  }

  const users = await getDashboardUsers();

  return <UsersManager users={users} currentUserId={user.id} />;
}