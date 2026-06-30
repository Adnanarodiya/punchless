import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/queries/auth.queries";
import { getOutstandingBillsForParty } from "@/lib/queries/party-bill.queries";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["owner", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const partyId = searchParams.get("partyId") ?? "";
  const side = searchParams.get("side") === "supplier" ? "supplier" : "client";

  if (!partyId) {
    return NextResponse.json({ error: "partyId is required" }, { status: 400 });
  }

  const bills = await getOutstandingBillsForParty(partyId, side);
  return NextResponse.json({ bills });
}