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
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "50");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end are required" }, { status: 400 });
  }

  try {
    if (employeeId) {
      // Fetch specific employee's sessions
      const sessions = await getEmployeeHistory(employeeId, start, end, page, limit);
      return NextResponse.json({ sessions });
    } else {
      // Fetch all sessions + summaries
      const [sessions, summaries] = await Promise.all([
        getHistorySessions(start, end, page, limit),
        getEmployeeSummaries(start, end), // summaries don't need pagination as they group per active employee
      ]);
      return NextResponse.json({ sessions, summaries });
    }
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
