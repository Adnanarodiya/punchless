import { z } from "zod";

import {
  calculateGstAmount,
  calculatePurchaseTotal,
} from "@/lib/validations/purchase.schema";

const gstPercentSchema = z.coerce
  .number()
  .refine((v) => [0, 5, 12, 18, 28].includes(v), "Invalid GST slab");

const paymentModeSchema = z.enum(["cash", "bank", "credit", "split"]);

export const createInvoiceSchema = z
  .object({
    clientId: z.string().uuid("Customer is required"),
    jobId: z.string().optional().or(z.literal("")),
    invoiceNumber: z.string().max(50).optional().or(z.literal("")),
    invoiceDate: z.string().min(1, "Invoice date is required"),
    vehicleNumber: z.string().max(30).optional().or(z.literal("")),
    description: z.string().min(1, "Description is required").max(500),
    taxableAmount: z.coerce.number().positive("Amount must be greater than 0"),
    gstPercent: gstPercentSchema,
    paymentMode: paymentModeSchema,
    cashAmount: z.coerce.number().min(0).default(0),
    bankAmount: z.coerce.number().min(0).default(0),
    remark: z.string().max(500).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const total = calculatePurchaseTotal(data.taxableAmount, data.gstPercent);

    if (data.paymentMode === "split") {
      if (data.cashAmount <= 0 && data.bankAmount <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a cash and/or bank amount for split payment",
          path: ["cashAmount"],
        });
      }
      return;
    }

    const breakdown = resolvePaymentBreakdown(
      data.paymentMode,
      data.taxableAmount,
      data.gstPercent,
      data.cashAmount,
      data.bankAmount
    );

    if (
      Math.abs(
        breakdown.cashAmount +
          breakdown.bankAmount +
          breakdown.creditAmount -
          total
      ) > 0.01
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Payment breakdown must equal invoice total",
        path: ["paymentMode"],
      });
    }
  });

export const updateInvoiceSchema = createInvoiceSchema.extend({
  invoiceId: z.string().uuid("Invalid invoice ID"),
});

/** V3 — Sales bill: ISHABA suffix, date, party, amount (credit / udhar). */
export const salesBillSchema = z.object({
  clientId: z.string().uuid("Customer is required"),
  invoiceSuffix: z.string().min(1, "Invoice number is required").max(40),
  invoiceDate: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  gstNumber: z.string().max(20).optional().or(z.literal("")),
  remark: z.string().max(500).optional().or(z.literal("")),
});

/** Legacy quick bill — kept for statement corrections. */
export const quickBillSchema = z
  .object({
    clientId: z.string().uuid("Customer is required"),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    paymentMode: paymentModeSchema,
    cashAmount: z.coerce.number().min(0).default(0),
    bankAmount: z.coerce.number().min(0).default(0),
    invoiceDate: z.string().min(1, "Date is required"),
    description: z.string().max(200).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode === "split") {
      if (data.cashAmount <= 0 && data.bankAmount <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a cash and/or bank amount for split payment",
          path: ["cashAmount"],
        });
      }
      return;
    }

    const breakdown = resolvePaymentBreakdown(
      data.paymentMode,
      data.amount,
      0,
      data.cashAmount,
      data.bankAmount
    );

    if (
      Math.abs(
        breakdown.cashAmount +
          breakdown.bankAmount +
          breakdown.creditAmount -
          data.amount
      ) > 0.01
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Payment breakdown must equal bill amount",
        path: ["paymentMode"],
      });
    }
  });

/** Correct a quick bill from customer statement. */
export const updateStatementQuickBillSchema = z
  .object({
    invoiceId: z.string().uuid("Invalid invoice ID"),
    clientId: z.string().uuid("Customer is required"),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    paymentMode: paymentModeSchema,
    cashAmount: z.coerce.number().min(0).default(0),
    bankAmount: z.coerce.number().min(0).default(0),
    invoiceDate: z.string().min(1, "Date is required"),
    description: z.string().max(200).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode === "split") {
      if (data.cashAmount <= 0 && data.bankAmount <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a cash and/or bank amount for split payment",
          path: ["cashAmount"],
        });
      }
      return;
    }

    const breakdown = resolvePaymentBreakdown(
      data.paymentMode,
      data.amount,
      0,
      data.cashAmount,
      data.bankAmount
    );

    if (
      Math.abs(
        breakdown.cashAmount +
          breakdown.bankAmount +
          breakdown.creditAmount -
          data.amount
      ) > 0.01
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Payment breakdown must equal bill amount",
        path: ["paymentMode"],
      });
    }
  });

export function resolvePaymentBreakdown(
  paymentMode: z.infer<typeof paymentModeSchema>,
  taxableAmount: number,
  gstPercent: number,
  cashAmount: number,
  bankAmount: number
) {
  const totalAmount = calculatePurchaseTotal(taxableAmount, gstPercent);

  if (paymentMode === "cash") {
    return { cashAmount: totalAmount, bankAmount: 0, creditAmount: 0, totalAmount };
  }
  if (paymentMode === "bank") {
    return { cashAmount: 0, bankAmount: totalAmount, creditAmount: 0, totalAmount };
  }
  if (paymentMode === "credit") {
    return { cashAmount: 0, bankAmount: 0, creditAmount: totalAmount, totalAmount };
  }

  const creditAmount = Math.max(
    0,
    Math.round((totalAmount - cashAmount - bankAmount) * 100) / 100
  );
  return { cashAmount, bankAmount, creditAmount, totalAmount };
}

/** Net change to client due from this invoice (negative = overpayment). */
export function calculateInvoiceDueEffect(
  totalAmount: number,
  cashAmount: number,
  bankAmount: number
) {
  return Math.round((totalAmount - cashAmount - bankAmount) * 100) / 100;
}

export { calculateGstAmount, calculatePurchaseTotal };