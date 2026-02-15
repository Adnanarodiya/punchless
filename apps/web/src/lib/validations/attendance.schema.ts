import { z } from "zod";

export const createAttendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  state: z.enum(["workshop", "travel", "on_site_job", "off_duty", "break"]),
  workshopId: z.string().optional().or(z.literal("")),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional().or(z.literal("")),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
