import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
// type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type JobWithDetails = JobRow & {
  assigned_to_name: string | null;
  assigned_to_email: string | null;
};

export async function getJobs(): Promise<JobWithDetails[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("jobs")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false });

  type RawRow = JobRow & {
    users: { full_name: string; email: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((j) => ({
    ...j,
    assigned_to_name: j.users?.full_name ?? null,
    assigned_to_email: j.users?.email ?? null,
  }));
}

export async function getJobById(jobId: string): Promise<JobWithDetails | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("jobs")
    .select("*, users(full_name, email)")
    .eq("id", jobId)
    .single();

  if (!data) return null;

  type RawRow = JobRow & {
    users: { full_name: string; email: string } | null;
  };

  const job = data as unknown as RawRow;

  return {
    ...job,
    assigned_to_name: job.users?.full_name ?? null,
    assigned_to_email: job.users?.email ?? null,
  };
}
