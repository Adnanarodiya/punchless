import { z } from "zod";

export const dashboardExperienceSchema = z.object({
  experience: z.enum(["simple", "full"], {
    message: "Experience must be Simple or Full",
  }),
});

export type DashboardExperienceInput = z.infer<typeof dashboardExperienceSchema>;