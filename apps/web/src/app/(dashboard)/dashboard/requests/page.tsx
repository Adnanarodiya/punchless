import { getCorrectionRequests } from "@/lib/queries/correction.queries";
import { DashboardPageTitle } from "@/components/dashboard-page-title";
import { RequestsManager } from "./requests-manager";

export default async function RequestsPage() {
  const requests = await getCorrectionRequests();

  return (
    <div className="space-y-6">
      <DashboardPageTitle title="Correction Requests" />
      <RequestsManager initialRequests={requests} />
    </div>
  );
}
