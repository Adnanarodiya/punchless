"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { protectedAction } from "@/lib/server/protected-action";
import {
  matchEmployeeForFingerprintName,
  type FingerprintEmployeeRecord,
} from "@/lib/utils/fingerprint-salary-report";
import {
  parseDurationHours,
  parseFingerprintWorkbook,
} from "@/lib/utils/fingerprint-attendance-parser";

const mapAliasSchema = z.object({
  fingerprintName: z.string().min(1),
  employeeId: z.string().uuid(),
  salaryMonth: z.string().regex(/^\d{4}-\d{2}$/),
});

async function fetchEmployeesForMatching(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  companyId: string
): Promise<FingerprintEmployeeRecord[]> {
  const { data } = await supabase
    .from("users")
    .select("id, full_name, monthly_salary, posts(name)")
    .eq("company_id", companyId)
    .eq("role", "employee")
    .eq("is_active", true);

  return ((data as Array<{
    id: string;
    full_name: string;
    monthly_salary: number | null;
    posts: { name: string } | null;
  }> | null) ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    monthlySalary: Number(row.monthly_salary ?? 0),
    designation: row.posts?.name ?? null,
  }));
}

async function fetchAliases(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  companyId: string
) {
  const { data } = await supabase
    .from("employee_fingerprint_aliases")
    .select("fingerprint_name, employee_id")
    .eq("company_id", companyId);

  return (data as Array<{ fingerprint_name: string; employee_id: string }> | null) ?? [];
}

export const uploadFingerprintAttendance = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "upload_fingerprint_attendance", entityType: "attendance_import" },
})(async (formData, { supabase, me }) => {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose a fingerprint attendance .xlsx file to upload." };
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { success: false, error: "Only .xlsx fingerprint exports are supported." };
  }

  let parsed;
  try {
    const buffer = await file.arrayBuffer();
    parsed = parseFingerprintWorkbook(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse attendance file.";
    return { success: false, error: message };
  }

  // Month always comes from the fingerprint file (e.g. May 2026 export → 2026-05)
  const salaryMonth = parsed.salaryMonth;

  const { data: company } = await supabase
    .from("companies")
    .select("working_days_per_month, ot_rate_multiplier")
    .eq("id", me.company_id)
    .single();

  const companyRow = company as {
    working_days_per_month: number | null;
    ot_rate_multiplier: number | null;
  } | null;

  const otRateMultiplier = Number(companyRow?.ot_rate_multiplier ?? 1);
  const eligibleDays = Number(companyRow?.working_days_per_month ?? parsed.eligibleDays);

  const [employees, aliases] = await Promise.all([
    fetchEmployeesForMatching(supabase, me.company_id),
    fetchAliases(supabase, me.company_id),
  ]);

  const { data: existingImport } = await supabase
    .from("attendance_imports")
    .select("id")
    .eq("company_id", me.company_id)
    .eq("salary_month", salaryMonth)
    .maybeSingle();

  if (existingImport) {
    const { error: deleteRowsError } = await supabase
      .from("attendance_import_rows")
      .delete()
      .eq("import_id", (existingImport as { id: string }).id);

    if (deleteRowsError) {
      return { success: false, error: deleteRowsError.message };
    }

    const { error: deleteImportError } = await supabase
      .from("attendance_imports")
      .delete()
      .eq("id", (existingImport as { id: string }).id);

    if (deleteImportError) {
      return { success: false, error: deleteImportError.message };
    }
  }

  const { data: importRecord, error: importError } = await supabase
    .from("attendance_imports")
    .insert({
      company_id: me.company_id,
      salary_month: salaryMonth,
      file_name: file.name,
      year: parsed.year,
      month: parsed.month,
      eligible_days: eligibleDays,
      ot_rate_multiplier: otRateMultiplier,
      uploaded_by: me.id,
    } as never)
    .select("id")
    .single();

  if (importError || !importRecord) {
    return { success: false, error: importError?.message ?? "Could not save attendance import." };
  }

  const importId = (importRecord as { id: string }).id;
  const rowPayload = parsed.employees.map((employee) => {
    const matched = matchEmployeeForFingerprintName(
      employee.fingerprintName,
      employees,
      aliases
    );

    return {
      import_id: importId,
      company_id: me.company_id,
      fingerprint_name: employee.fingerprintName,
      fingerprint_emp_id: employee.fingerprintEmpId,
      employee_id: matched?.id ?? null,
      days_worked: employee.daysWorked,
      summary_present: employee.summary.present,
      summary_absent: employee.summary.absent,
      summary_half: employee.summary.half,
      ot_hours: parseDurationHours(employee.summary.otHours),
      total_hours: parseDurationHours(employee.summary.totalHours),
      sundays_excluded: employee.sundaysExcluded,
      weekday_absents: employee.weekdayAbsents,
      daily_statuses: employee.dailyStatuses,
      raw_summary: employee.rawSummaryCells,
    };
  });

  const { error: rowsError } = await supabase
    .from("attendance_import_rows")
    .insert(rowPayload as never);

  if (rowsError) {
    await supabase.from("attendance_imports").delete().eq("id", importId);
    return { success: false, error: rowsError.message };
  }

  const unmatchedCount = rowPayload.filter((row) => !row.employee_id).length;

  revalidatePath("/dashboard/salary");
  return {
    success: true,
    data: {
      salaryMonth,
      employeeCount: rowPayload.length,
      skippedNonameCount: parsed.skippedNonameCount,
      unmatchedCount,
    },
  };
});

export const mapFingerprintEmployeeAlias = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "map_fingerprint_alias", entityType: "employee_fingerprint_alias" },
})(async (formData, { supabase, me }) => {
  const parsed = mapAliasSchema.safeParse({
    fingerprintName: formData.get("fingerprintName"),
    employeeId: formData.get("employeeId"),
    salaryMonth: formData.get("salaryMonth"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message ?? "Invalid mapping data." };
  }

  const { fingerprintName, employeeId, salaryMonth } = parsed.data;

  const { data: employee } = await supabase
    .from("users")
    .select("id")
    .eq("id", employeeId)
    .eq("company_id", me.company_id)
    .eq("role", "employee")
    .maybeSingle();

  if (!employee) {
    return { success: false, error: "Employee not found." };
  }

  const normalizedName = fingerprintName.trim();

  const { error: deleteAliasError } = await supabase
    .from("employee_fingerprint_aliases")
    .delete()
    .eq("company_id", me.company_id)
    .eq("fingerprint_name", normalizedName);

  if (deleteAliasError) {
    return { success: false, error: deleteAliasError.message };
  }

  const { error: aliasError } = await supabase.from("employee_fingerprint_aliases").insert({
    company_id: me.company_id,
    fingerprint_name: normalizedName,
    employee_id: employeeId,
  } as never);

  if (aliasError) {
    return { success: false, error: aliasError.message };
  }

  const { data: importRecord } = await supabase
    .from("attendance_imports")
    .select("id")
    .eq("company_id", me.company_id)
    .eq("salary_month", salaryMonth)
    .maybeSingle();

  if (importRecord) {
    await supabase
      .from("attendance_import_rows")
      .update({ employee_id: employeeId } as never)
      .eq("import_id", (importRecord as { id: string }).id)
      .eq("fingerprint_name", fingerprintName.trim());
  }

  revalidatePath("/dashboard/salary");
  return { success: true };
});