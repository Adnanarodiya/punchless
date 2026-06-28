import * as XLSX from "xlsx";

export type SalesRegisterRow = {
  date: string;
  particular: string;
  invoiceNo: string | null;
  gstin: string | null;
  grossAmount: number;
};

export type ParsedSalesRegisterFile = {
  rows: SalesRegisterRow[];
  dates: string[];
};

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export function parseSalesRegisterDate(raw: string): string | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return text;

  const dmy = text.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (!dmy) return null;

  const day = Number(dmy[1]);
  const monthKey = dmy[2].toLowerCase().slice(0, 3);
  const month = MONTHS[monthKey];
  if (!month) return null;

  let year = Number(dmy[3]);
  if (dmy[3].length === 2) year = 2000 + year;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseGrossAmount(raw: unknown): number | null {
  const text = String(raw ?? "")
    .replace(/,/g, "")
    .replace(/\s*dr\s*$/i, "")
    .replace(/\s*cr\s*$/i, "")
    .trim();
  const value = parseFloat(text);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const cells = (rows[i] ?? []).map((cell) =>
      String(cell ?? "")
        .trim()
        .toLowerCase()
    );
    if (cells.includes("date") && cells.some((c) => c.includes("particular"))) {
      return i;
    }
  }
  return 7;
}

function columnIndex(headerRow: unknown[], matchers: string[]): number {
  const normalized = headerRow.map((cell) =>
    String(cell ?? "")
      .trim()
      .toLowerCase()
  );
  for (const matcher of matchers) {
    const index = normalized.findIndex((cell) => cell.includes(matcher));
    if (index >= 0) return index;
  }
  return -1;
}

/** Pick the bill date to import when the requested day has no rows in the export. */
export function resolveSalesRegisterEntryDate(
  requested: string,
  availableDates: string[]
): { date: string; adjusted: boolean } | null {
  if (!requested || availableDates.length === 0) return null;

  if (availableDates.includes(requested)) {
    return { date: requested, adjusted: false };
  }

  const first = availableDates[0];
  if (requested < first) return null;

  const onOrBefore = availableDates.filter((d) => d <= requested);
  const fallback = onOrBefore.at(-1);
  if (fallback) return { date: fallback, adjusted: true };

  return null;
}

export function parseSalesRegisterRows(matrix: unknown[][]): SalesRegisterRow[] {
  if (matrix.length === 0) return [];

  const headerIndex = findHeaderRowIndex(matrix);
  const header = matrix[headerIndex] ?? [];
  const dateCol = columnIndex(header, ["date"]);
  const particularCol = columnIndex(header, ["particular"]);
  const invoiceCol = columnIndex(header, ["invoice"]);
  const gstCol = columnIndex(header, ["gstin", "gst", "uin"]);
  const amountCol = columnIndex(header, ["gross", "total", "amount"]);

  if (dateCol < 0 || particularCol < 0 || amountCol < 0) {
    throw new Error(
      "Could not find Date, Particulars, and Gross Total columns in the sales register file."
    );
  }

  const parsed: SalesRegisterRow[] = [];

  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const date = parseSalesRegisterDate(String(row[dateCol] ?? ""));
    const particular = String(row[particularCol] ?? "")
      .replace(/\r/g, "")
      .trim();
    const grossAmount = parseGrossAmount(row[amountCol]);

    if (!date || !particular || grossAmount == null) continue;

    const invoiceNo = String(row[invoiceCol] ?? "").trim() || null;
    const gstinRaw = String(row[gstCol] ?? "").trim().toUpperCase();
    const gstin = /^[0-9A-Z]{15}$/.test(gstinRaw) ? gstinRaw : null;

    parsed.push({
      date,
      particular,
      invoiceNo,
      gstin,
      grossAmount,
    });
  }

  return parsed;
}

export function parseSalesRegisterFile(buffer: ArrayBuffer, fileName: string): ParsedSalesRegisterFile {
  const lower = fileName.toLowerCase();
  let matrix: unknown[][];

  if (lower.endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    matrix = text.split(/\r?\n/).map((line) => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === "," && !inQuotes) {
          cells.push(current);
          current = "";
          continue;
        }
        current += ch;
      }
      cells.push(current);
      return cells;
    });
  } else {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet =
      workbook.Sheets["Sales Register"] ??
      workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      throw new Error("No worksheet found in the uploaded file.");
    }
    matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
  }

  const rows = parseSalesRegisterRows(matrix);
  const dates = [...new Set(rows.map((row) => row.date))].sort();

  if (rows.length === 0) {
    throw new Error("No invoice rows found in the sales register file.");
  }

  return { rows, dates };
}