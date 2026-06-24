import { z } from "zod";

const paymentModeSchema = z.enum(["cash", "bank", "credit"]);

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(200),
  alias: z.string().max(100).optional().or(z.literal("")),
  contact: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  gstNumber: z.string().max(20).optional().or(z.literal("")),
  openingBalance: z.coerce.number().min(0, "Opening balance cannot be negative"),
});

export const updateSupplierSchema = createSupplierSchema.extend({
  supplierId: z.string().uuid("Invalid supplier ID"),
});

export const paySupplierSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier ID"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMode: paymentModeSchema,
  paymentDate: z.string().min(1, "Payment date is required"),
  remark: z.string().max(500).optional().or(z.literal("")),
});