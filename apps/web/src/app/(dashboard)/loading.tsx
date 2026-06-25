import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium">Loading page…</p>
    </div>
  );
}