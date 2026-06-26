import { getCorrectionRequests } from "@/lib/queries/correction.queries";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { RequestsManager } from "./requests-manager";

export default async function RequestsPage() {
  const requests = await getCorrectionRequests();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Correction Requests"
        description="Staff ask to fix wrong hours — approve or reject before you run monthly payroll."
      />
      <RequestsManager initialRequests={requests} />
    </div>
  );
}