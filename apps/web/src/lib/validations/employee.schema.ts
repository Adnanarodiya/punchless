import { z } from "zod";

const optionalText = z.string().max(500).optional().or(z.literal(""));
const optionalPostId = z.string().uuid().optional().or(z.literal(""));
const optionalDate = z.string().optional().or(z.literal(""));

export const createEmployeeSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional().or(z.literal("")),
  address: optionalText,
  postId: optionalPostId,
  joiningDate: optionalDate,
  accountNo: z.string().max(30).optional().or(z.literal("")),
  ifscCode: z.string().max(20).optional().or(z.literal("")),
  monthlySalary: z.coerce.number().min(0, "Salary cannot be negative"),
  workshopId: z.string().optional().or(z.literal("")),
});

export const updateEmployeeSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().optional().or(z.literal("")),
  address: optionalText,
  postId: optionalPostId,
  joiningDate: optionalDate,
  accountNo: z.string().max(30).optional().or(z.literal("")),
  ifscCode: z.string().max(20).optional().or(z.literal("")),
  monthlySalary: z.coerce.number().min(0, "Salary cannot be negative"),
  workshopId: z.string().optional().or(z.literal("")),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
