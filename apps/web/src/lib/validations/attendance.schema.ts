import { z } from "zod";

export const createAttendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  state: z.enum(["workshop", "travel", "on_site_job", "off_duty", "break"]),
  workshopId: z.string().optional().or(z.literal("")),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional().or(z.literal("")),
});

export const bulkAttendanceSchema = z.object({
  attendanceDate: z.string().min(1, "Date is required"),
  workshopId: z.string().uuid("Select a workshop"),
  employeeIds: z.array(z.string().uuid()).min(1, "Select at least one employee"),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
