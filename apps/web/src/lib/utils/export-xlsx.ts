import { rowsToCsv } from "@/lib/utils/export-csv";

type XlsxModule = typeof import("xlsx");

let xlsxModule: XlsxModule | null = null;

async function loadXlsx(): Promise<XlsxModule> {
  if (!xlsxModule) {
    xlsxModule = await import("xlsx");
  }
  return xlsxModule;
}

export async function downloadXlsx(rows: string[][], filename: string) {
  const XLSX = await loadXlsx();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  const safeName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeName);
}

/** Fallback when xlsx fails to load — still gives user a file */
export function downloadCsvFallback(rows: string[][], filename: string) {
  const csv = rowsToCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}