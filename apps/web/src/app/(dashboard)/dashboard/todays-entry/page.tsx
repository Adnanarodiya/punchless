import {
  getSalesRegisterImportDays,
  getTodaysEntryReport,
} from "@/lib/queries/sales-register-import.queries";

import { TodaysEntryManager } from "./todays-entry-manager";

export default async function TodaysEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const entryDate = params.date?.trim() || yesterday.toISOString().slice(0, 10);

  const [report, savedDays] = await Promise.all([
    getTodaysEntryReport(entryDate),
    getSalesRegisterImportDays(),
  ]);

  return (
    <TodaysEntryManager
      entryDate={entryDate}
      report={report}
      savedDays={savedDays}
    />
  );
}