import { NextResponse } from "next/server";

import { getSalaryReport } from "@/lib/queries/salary.queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Valid month (YYYY-MM) is required" }, { status: 400 });
  }

  const { reports, salaryMode } = await getSalaryReport(month, 1, 5000);

  return NextResponse.json({ reports, salaryMode, month });
}