import { z } from "zod";

const gstPercentSchema = z.coerce
  .number()
  .refine((v) => [0, 5, 12, 18, 28].includes(v), "Invalid GST slab");

export const createPurchaseInvoiceSchema = z.object({
  supplierId: z.string().uuid("Supplier is required"),
  invoiceType: z.enum(["purchase", "sales"]),
  invoiceNumber: z.string().max(50).optional().or(z.literal("")),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  taxableAmount: z.coerce.number().positive("Amount must be greater than 0"),
  gstPercent: gstPercentSchema,
  remark: z.string().max(500).optional().or(z.literal("")),
});

export const updatePurchaseInvoiceSchema = createPurchaseInvoiceSchema.extend({
  purchaseId: z.string().uuid("Invalid purchase ID"),
});

/** V3 — Purchase bill: invoice #, date, supplier, amount (no GST slab). */
export const quickPurchaseBillSchema = z.object({
  supplierId: z.string().uuid("Supplier is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required").max(50),
  invoiceDate: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  gstNumber: z.string().max(20).optional().or(z.literal("")),
  remark: z.string().max(500).optional().or(z.literal("")),
});

export function calculateGstAmount(taxableAmount: number, gstPercent: number) {
  return Math.round(taxableAmount * (gstPercent / 100) * 100) / 100;
}

export function calculatePurchaseTotal(taxableAmount: number, gstPercent: number) {
  return taxableAmount + calculateGstAmount(taxableAmount, gstPercent);
}