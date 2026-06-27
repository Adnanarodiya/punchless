"use client";

import { create } from "zustand";
import type { DashboardExperience } from "@punchless/types";

interface DashboardExperienceStore {
  experience: DashboardExperience;
  setExperience: (experience: DashboardExperience) => void;
}

export const useDashboardExperienceStore = create<DashboardExperienceStore>((set) => ({
  experience: "simple",
  setExperience: (experience) => set({ experience }),
}));