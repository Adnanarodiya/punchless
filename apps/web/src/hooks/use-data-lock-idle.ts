"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { DATA_LOCK_IDLE_MS } from "@/lib/constants/data-lock";
import { useDataLockStore } from "@/lib/stores/data-lock.store";

const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
] as const;

/** Auto-lock financials after idle when a PIN is set and data is unlocked. */
export function useDataLockIdle(hasDataLockPin: boolean) {
  const hasPin = useDataLockStore((s) => s.hasPin);
  const isUnlocked = useDataLockStore((s) => s.isUnlocked);
  const lock = useDataLockStore((s) => s.lock);

  useEffect(() => {
    if (!hasDataLockPin || !hasPin || !isUnlocked) return;

    let timer: number | undefined;

    const scheduleLock = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        lock();
        toast.message("Financial data locked — idle timeout");
      }, DATA_LOCK_IDLE_MS);
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, scheduleLock, { passive: true });
    }
    scheduleLock();

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, scheduleLock);
      }
    };
  }, [hasDataLockPin, hasPin, isUnlocked, lock]);
}