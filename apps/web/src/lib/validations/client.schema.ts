import { z } from "zod";
import {
  bankSubModeSchema,
  paymentModeSchema,
  refineBankPaymentFields,
} from "@/lib/validations/payment-mode.schema";

/** Minimal customer for quick bill — name only, no opening balance. */
export const quickCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(200),
});

export const createClientSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(200),
  alias: z.string().max(100).optional().or(z.literal("")),
  contact: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  gstNumber: z.string().max(20).optional().or(z.literal("")),
  openingBalance: z.coerce.number().min(0, "Opening balance cannot be negative"),
});

export const updateClientSchema = createClientSchema.extend({
  clientId: z.string().uuid("Invalid client ID"),
});

export const receiveClientPaymentSchema = z
  .object({
    clientId: z.string().uuid("Invalid client ID"),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    paymentMode: paymentModeSchema,
    bankSubMode: bankSubModeSchema,
    bankId: z.string().optional(),
    paymentDate: z.string().min(1, "Payment date is required"),
    remark: z.string().max(500).optional().or(z.literal("")),
  })
  .superRefine(refineBankPaymentFields);

export const updateClientPaymentSchema = receiveClientPaymentSchema.extend({
  paymentId: z.string().uuid("Invalid payment ID"),
});

export const deleteClientPaymentSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  paymentId: z.string().uuid("Invalid payment ID"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ReceiveClientPaymentInput = z.infer<typeof receiveClientPaymentSchema>;