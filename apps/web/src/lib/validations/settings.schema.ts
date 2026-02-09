import { z } from "zod";

export const companySettingsSchema = z.object({
  workStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  gracePeriodMinutes: z.coerce.number().min(0).max(60, "Max 60 minutes"),
  dailyWorkHours: z.coerce.number().min(1, "Min 1 hour").max(24, "Max 24 hours"),
  workingDaysPerMonth: z.coerce.number().min(1, "Min 1 day").max(31, "Max 31 days"),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
