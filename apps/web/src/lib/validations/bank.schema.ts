import { z } from "zod";

export const createBankSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  openingBalance: z.coerce.number().min(0, "Opening balance cannot be negative"),
});

export const updateBankSchema = createBankSchema.extend({
  bankId: z.string().uuid("Invalid bank ID"),
});

export const bankTransactionSchema = z.object({
  bankId: z.string().uuid("Select a bank account"),
  transactionType: z.enum(["deposit", "withdraw"]),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  transactionDate: z.string().min(1, "Date is required"),
  remark: z.string().optional(),
});

export const bankTransferSchema = z
  .object({
    fromBankId: z.string().uuid("Select source bank"),
    toBankId: z.string().uuid("Select destination bank"),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    transferDate: z.string().min(1, "Date is required"),
    remark: z.string().optional(),
  })
  .refine((data) => data.fromBankId !== data.toBankId, {
    message: "Source and destination bank must be different",
    path: ["toBankId"],
  });