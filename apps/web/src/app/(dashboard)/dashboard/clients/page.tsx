import { getClients, getClientsSummary } from "@/lib/queries/client.queries";
import { CommerceFlowPanel } from "@/components/commerce-flow-panel";
import { ClientManager } from "./client-manager";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; open?: string }>;
}) {
  const params = await searchParams;
  const [clients, summary] = await Promise.all([
    getClients({ includeDeleted: true }),
    getClientsSummary(),
  ]);

  return (
    <div className="space-y-6">
      <CommerceFlowPanel />
      <ClientManager
        clients={clients}
        summary={summary}
        initialClientId={params.client}
        initialOpen={params.open === "pay" || params.open === "invoice" ? params.open : undefined}
      />
    </div>
  );
}