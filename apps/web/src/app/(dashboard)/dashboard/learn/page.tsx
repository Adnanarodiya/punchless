import { Suspense } from "react";

import { getCurrentUser } from "@/lib/queries/auth.queries";

import { LearnManager } from "./learn-manager";

export default async function LearnPage() {
  const user = await getCurrentUser();

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <LearnManager role={user?.role ?? "admin"} />
    </Suspense>
  );
}