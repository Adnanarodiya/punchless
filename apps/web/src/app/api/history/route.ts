import { NextRequest, NextResponse } from "next/server";
import {
  getHistorySessions,
  getEmployeeSummaries,
  getEmployeeHistory,
} from "@/lib/queries/history.queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const employeeId = searchParams.get("employeeId");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end are required" }, { status: 400 });
  }

  try {
    if (employeeId) {
      // Fetch specific employee's sessions
      const sessions = await getEmployeeHistory(employeeId, start, end);
      return NextResponse.json({ sessions });
    } else {
      // Fetch all sessions + summaries
      const [sessions, summaries] = await Promise.all([
        getHistorySessions(start, end),
        getEmployeeSummaries(start, end),
      ]);
      return NextResponse.json({ sessions, summaries });
    }
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
