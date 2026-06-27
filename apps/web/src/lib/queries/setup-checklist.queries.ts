import { createClient } from "@/lib/supabase/server";

export type SetupChecklistStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
};

export type SetupChecklistStatus = {
  steps: SetupChecklistStep[];
  completedCount: number;
  totalCount: number;
  allDone: boolean;
};

export async function getSetupChecklistStatus(): Promise<SetupChecklistStatus> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { steps: [], completedCount: 0, totalCount: 0, allDone: true };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { steps: [], completedCount: 0, totalCount: 0, allDone: true };
  }

  const companyId = (profile as { company_id: string }).company_id;
  const role = (profile as { role: string }).role;

  const [
    { data: company },
    { count: postCount },
    { count: employeeCount },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("name, address, phone, work_start_time")
      .eq("id", companyId)
      .single(),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_deleted", false),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("role", "employee")
      .eq("is_active", true),
  ]);

  const c = company as {
    name: string;
    address: string | null;
    phone: string | null;
    work_start_time: string | null;
  } | null;

  const profileDone = Boolean(
    c?.address?.trim() || c?.phone?.trim()
  );
  const postsDone = (postCount ?? 0) > 0;
  const employeesDone = (employeeCount ?? 0) > 0;

  const steps: SetupChecklistStep[] = [
    {
      id: "profile",
      label: "Company profile",
      description: "Add address and phone for invoices and statements.",
      href: role === "owner" ? "/dashboard/settings" : "/dashboard/learn?module=settings",
      done: profileDone,
    },
    // GPS workshop geofence — paused (fingerprint payroll)
    // { id: "workshop", label: "Workshop location", ... href: "/dashboard/workshops" },
    {
      id: "posts",
      label: "Job posts",
      description: "Designations like TECH, DRIVER, WM (used on salary report).",
      href: "/dashboard/posts",
      done: postsDone,
    },
    {
      id: "employees",
      label: "Add employees",
      description: "Staff names, designation, and monthly salary.",
      href: "/dashboard/employees",
      done: employeesDone,
    },
    {
      id: "learn",
      label: "Learn the system",
      description: "Read how fingerprint salary, customers, and suppliers work.",
      href: "/dashboard/learn",
      done: false,
    },
  ];

  const completedCount = steps.filter((s) => s.id !== "learn" && s.done).length;
  const setupTotal = steps.length - 1;

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    allDone: completedCount >= setupTotal,
  };
}