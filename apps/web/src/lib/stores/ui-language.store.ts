"use client";

import { create } from "zustand";
import type { UiLanguage } from "@punchless/types";

interface UiLanguageStore {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
}

export const useUiLanguageStore = create<UiLanguageStore>((set) => ({
  language: "en",
  setLanguage: (language) => set({ language }),
}));