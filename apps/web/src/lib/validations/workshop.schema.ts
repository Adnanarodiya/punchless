import { z } from "zod";

export const workshopSchema = z.object({
  name: z.string().min(1, "Workshop name is required").max(100),
  address: z.string().optional().or(z.literal("")),
  lat: z.coerce.number().refine((v) => v !== 0, "Location is required"),
  lng: z.coerce.number().refine((v) => v !== 0, "Location is required"),
  radius: z.coerce.number().min(10, "Minimum 10m radius").max(5000, "Maximum 5000m radius"),
});

export type WorkshopInput = z.infer<typeof workshopSchema>;
