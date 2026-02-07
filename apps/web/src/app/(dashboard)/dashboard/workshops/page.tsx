import { getWorkshops } from "@/lib/queries/workshop.queries";
import { WorkshopManager } from "./workshop-manager";

export default async function WorkshopsPage() {
  const workshops = await getWorkshops();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Workshops</h1>
      <WorkshopManager workshops={workshops} />
    </div>
  );
}
