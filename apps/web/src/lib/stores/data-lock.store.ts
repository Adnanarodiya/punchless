"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface DataLockStore {
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
  reset: () => void;
}

export const useDataLockStore = create<DataLockStore>()(
  persist(
    (set) => ({
      isUnlocked: false,
      unlock: () => set({ isUnlocked: true }),
      lock: () => set({ isUnlocked: false }),
      reset: () => set({ isUnlocked: false }),
    }),
    {
      name: "punchless-data-lock",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ isUnlocked: state.isUnlocked }),
    }
  )
);

export function useFinancialLocked(hasPin: boolean): boolean {
  const isUnlocked = useDataLockStore((s) => s.isUnlocked);
  return hasPin && !isUnlocked;
}