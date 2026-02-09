import { z } from "zod";

export const createAdvanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  reason: z.string().optional().or(z.literal("")),
  salaryMonth: z.string().optional().or(z.literal("")),
});

export type CreateAdvanceInput = z.infer<typeof createAdvanceSchema>;
