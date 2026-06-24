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

export function calculateGstAmount(taxableAmount: number, gstPercent: number) {
  return Math.round(taxableAmount * (gstPercent / 100) * 100) / 100;
}

export function calculatePurchaseTotal(taxableAmount: number, gstPercent: number) {
  return taxableAmount + calculateGstAmount(taxableAmount, gstPercent);
}