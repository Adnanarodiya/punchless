import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/queries/auth.queries";
import { searchPartiesAndBills } from "@/lib/queries/party-bill.queries";

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
  const side = searchParams.get("side") === "supplier" ? "supplier" : "client";

  const results = await searchPartiesAndBills(q, side);
  return NextResponse.json({ results });
}