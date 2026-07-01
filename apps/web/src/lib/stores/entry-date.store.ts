"use client";

import { create } from "zustand";

const STORAGE_KEY = "punchless-entry-date";

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isValidIsoDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function loadStoredEntryDate(): string {
  if (typeof window === "undefined") return todayIsoDate();
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return isValidIsoDate(stored) ? stored : todayIsoDate();
}

interface EntryDateStore {
  entryDate: string;
  hydrated: boolean;
  hydrate: () => void;
  setEntryDate: (entryDate: string) => void;
  resetToToday: () => void;
}

export const useEntryDateStore = create<EntryDateStore>((set) => ({
  entryDate: todayIsoDate(),
  hydrated: false,
  hydrate: () => {
    const entryDate = loadStoredEntryDate();
    set({ entryDate, hydrated: true });
  },
  setEntryDate: (entryDate) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, entryDate);
    }
    set({ entryDate });
  },
  resetToToday: () => {
    const entryDate = todayIsoDate();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, entryDate);
    }
    set({ entryDate });
  },
}));