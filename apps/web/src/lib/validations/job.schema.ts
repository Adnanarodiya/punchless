import { z } from "zod";

export const jobSchema = z.object({
  title: z.string().min(1, "Job title is required").max(200),
  description: z.string().optional().or(z.literal("")),
  customerName: z.string().optional().or(z.literal("")),
  customerPhone: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
  status: z.enum(["pending", "assigned", "in_progress", "completed", "cancelled"]).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export type JobInput = z.infer<typeof jobSchema>;
