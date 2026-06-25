import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/queries/auth.queries";
import { globalSearch } from "@/lib/queries/search.queries";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["owner", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const results = await globalSearch(q);
  return NextResponse.json({ results });
}