import { z } from "zod";

const paymentModeSchema = z.enum(["cash", "bank"]);
const bankSubModeSchema = z.enum(["upi", "net_banking"]).optional();

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export const discountSettlementSchema = z
  .object({
    settlementKind: z.enum(["given", "received"]),
    partySide: z.enum(["client", "supplier"]),
    partyId: z.string().uuid("Select a party"),
    billId: z.string().uuid("Select a bill"),
    billAmount: z.coerce.number().positive("Bill amount is required"),
    discountAmount: z.coerce.number().positive("Enter a discount amount"),
    paymentMode: paymentModeSchema,
    bankSubMode: bankSubModeSchema,
    bankId: z.string().optional(),
    entryDate: z.string().min(1, "Date is required"),
    remark: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discountAmount >= data.billAmount) {
      ctx.addIssue({
        code: "custom",
        message: "Discount must be less than the bill due amount",
        path: ["discountAmount"],
      });
    }

    const paymentAmount = roundMoney(data.billAmount - data.discountAmount);
    if (paymentAmount < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Discount cannot exceed bill due",
        path: ["discountAmount"],
      });
    }

    if (data.paymentMode === "bank" && !data.bankId?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Select a bank account",
        path: ["bankId"],
      });
    }
  });

export const creditNoteSchema = z.object({
  clientId: z.string().uuid("Select a customer"),
  invoiceId: z.string().uuid("Select a bill"),
  amount: z.coerce.number().positive("Enter an amount"),
  entryDate: z.string().min(1, "Date is required"),
  remark: z.string().max(500).optional(),
});

export const debitNoteSchema = creditNoteSchema;

export const supplierCreditNoteSchema = z.object({
  supplierId: z.string().uuid("Select a supplier"),
  purchaseInvoiceId: z.string().uuid("Select a bill"),
  amount: z.coerce.number().positive("Enter an amount"),
  entryDate: z.string().min(1, "Date is required"),
  remark: z.string().max(500).optional(),
});

export const supplierDebitNoteSchema = supplierCreditNoteSchema;

export const updateDiscountSettlementSchema = z
  .object({
    settlementId: z.string().uuid(),
    discountAmount: z.coerce.number().positive("Enter a discount amount"),
    paymentMode: paymentModeSchema,
    bankSubMode: bankSubModeSchema,
    bankId: z.string().optional(),
    entryDate: z.string().min(1, "Date is required"),
    remark: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode === "bank" && !data.bankId?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Select a bank account",
        path: ["bankId"],
      });
    }
  });

export const deleteJournalEntrySchema = z.object({
  entryId: z.string().uuid(),
});

export const updateJournalNoteSchema = z.object({
  noteId: z.string().uuid(),
  amount: z.coerce.number().positive("Enter an amount"),
  entryDate: z.string().min(1, "Date is required"),
  remark: z.string().max(500).optional(),
});

export type DiscountSettlementInput = z.infer<typeof discountSettlementSchema>;
export type CreditNoteInput = z.infer<typeof creditNoteSchema>;
export type SupplierCreditNoteInput = z.infer<typeof supplierCreditNoteSchema>;