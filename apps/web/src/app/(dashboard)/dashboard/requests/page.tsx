import { getCorrectionRequests } from "@/lib/queries/correction.queries";
import { RequestsManager } from "./requests-manager";

export default async function RequestsPage() {
  const requests = await getCorrectionRequests();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Correction Requests</h1>
      <RequestsManager initialRequests={requests} />
    </div>
  );
}
