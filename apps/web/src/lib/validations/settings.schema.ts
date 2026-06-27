import { z } from "zod";

export const companySettingsSchema = z.object({
  salaryMode: z.enum(["hourly", "fixed"]),
  workStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  gracePeriodMinutes: z.coerce.number().min(0).max(60, "Max 60 minutes"),
  dailyWorkHours: z.coerce.number().min(1, "Min 1 hour").max(24, "Max 24 hours"),
  workingDaysPerMonth: z.coerce.number().min(1, "Min 1 day").max(31, "Max 31 days"),
  otRateMultiplier: z.coerce
    .number()
    .refine((value) => [1, 1.5, 2].includes(value), "OT multiplier must be 1×, 1.5×, or 2×"),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

const optionalProfileString = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : null));

export const companyProfileSchema = z.object({
  tagline: optionalProfileString(200),
  address: optionalProfileString(500),
  phone: optionalProfileString(20),
  email: z
    .string()
    .max(120)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      if (!trimmed) return null;
      return trimmed;
    })
    .refine((value) => value === null || z.string().email().safeParse(value).success, {
      message: "Invalid email address",
    }),
  logoUrl: z
    .string()
    .max(500)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      if (!trimmed) return null;
      return trimmed;
    })
    .refine((value) => value === null || z.string().url().safeParse(value).success, {
      message: "Invalid logo URL",
    }),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
