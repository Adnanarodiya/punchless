import { getClients, getClientsSummary } from "@/lib/queries/client.queries";
import { ClientManager } from "./client-manager";

export default async function ClientsPage() {
  const [clients, summary] = await Promise.all([
    getClients({ includeDeleted: true }),
    getClientsSummary(),
  ]);

  return <ClientManager clients={clients} summary={summary} />;
}