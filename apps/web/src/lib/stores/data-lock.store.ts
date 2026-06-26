"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface DataLockStore {
  hasPin: boolean;
  isUnlocked: boolean;
  setHasPin: (hasPin: boolean) => void;
  unlock: () => void;
  lock: () => void;
  reset: () => void;
}

export const useDataLockStore = create<DataLockStore>()(
  persist(
    (set) => ({
      hasPin: false,
      isUnlocked: false,
      setHasPin: (hasPin) => set({ hasPin }),
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

/** True when a PIN is set and the user has not unlocked this session. */
export function useFinancialLocked(hasDataLockPin?: boolean): boolean {
  const storeHasPin = useDataLockStore((s) => s.hasPin);
  const hasPin = hasDataLockPin ?? storeHasPin;
  const isUnlocked = useDataLockStore((s) => s.isUnlocked);
  return hasPin && !isUnlocked;
}