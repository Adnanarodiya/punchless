import { z } from "zod";

export const stickyNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  noteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

export const dataLockPinSchema = z
  .object({
    pin: z
      .string()
      .regex(/^\d{4,6}$/, "PIN must be 4–6 digits"),
    confirmPin: z.string(),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

export const verifyDataLockPinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4–6 digits"),
});