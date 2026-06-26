import { z } from "zod";
import { entityId } from "@/lib/validations/common";

const paymentTypeSchema = z.enum(["advance", "salary_paid", "deduction"]);
const paymentModeSchema = z.enum(["cash", "bank"]);

export const createStaffPaymentSchema = z
  .object({
    employeeId: entityId("Select an employee"),
    paymentType: paymentTypeSchema,
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    paymentMode: paymentModeSchema.optional(),
    bankId: z.string().optional(),
    paymentDate: z.string().min(1, "Date is required"),
    remark: z.string().max(500).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.paymentType === "deduction") return;

    if (!data.paymentMode) {
      ctx.addIssue({
        code: "custom",
        message: "Payment mode is required",
        path: ["paymentMode"],
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

export const createSalaryDepositSchema = z.object({
  employeeId: entityId("Select an employee"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  depositDate: z.string().min(1, "Date is required"),
  remark: z.string().max(500).optional().or(z.literal("")),
});

export type CreateStaffPaymentInput = z.infer<typeof createStaffPaymentSchema>;
export type CreateSalaryDepositInput = z.infer<typeof createSalaryDepositSchema>;