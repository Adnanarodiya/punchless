import { getWorkshops } from "@/lib/queries/workshop.queries";
import { WorkshopManager } from "./workshop-manager";

export default async function WorkshopsPage() {
  const workshops = await getWorkshops();

  return <WorkshopManager workshops={workshops} />;
}