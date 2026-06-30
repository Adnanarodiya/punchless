import { z } from "zod";

export const settlementTypeSchema = z.enum(["direct", "against_bill"]);

export type SettlementType = z.infer<typeof settlementTypeSchema>;

export function parseBillIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter((id) => id.trim().length > 0);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }
  return [];
}

export function parseBillIdsFromForm(formData: FormData): string[] {
  return formData
    .getAll("billIds")
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

export function refineSettlementFields(
  data: {
    settlementType?: SettlementType | "";
    billIds?: string[];
  },
  ctx: z.RefinementCtx
) {
  if (data.settlementType === "against_bill" && (data.billIds?.length ?? 0) === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Select at least one bill to settle against",
      path: ["billIds"],
    });
  }
}

export function buildAgainstBillRemark(
  remark: string | undefined,
  invoiceNumbers: string[]
): string {
  const numbers = invoiceNumbers.filter(Boolean);
  if (numbers.length === 0) return remark?.trim() || "";

  const tag =
    numbers.length === 1
      ? `Against bill #${numbers[0]}`
      : `Against bills #${numbers.join(", #")}`;

  const base = remark?.trim() || "";
  return base ? `${base} (${tag})` : tag;
}