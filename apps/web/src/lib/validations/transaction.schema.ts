import { z } from "zod";

export const createTransactionSchema = z
  .object({
    particular: z.string().min(1, "Particular is required"),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    transactionType: z.enum(["income", "expense"]),
    paymentMode: z.enum(["cash", "bank"]),
    bankId: z.string().optional(),
    transactionDate: z.string().min(1, "Date is required"),
    remark: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode === "bank" && !data.bankId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a bank account for bank payments",
        path: ["bankId"],
      });
    }
  });