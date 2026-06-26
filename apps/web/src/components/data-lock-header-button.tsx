"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";

import { verifyDataLockPinAction } from "@/lib/actions/settings.actions";
import { useDataLockStore, useFinancialLocked } from "@/lib/stores/data-lock.store";
import { useAction } from "@/hooks/use-action";

/** Compact lock/unlock control for the dashboard header (all pages). */
export function DataLockHeaderButton() {
  const hasPin = useDataLockStore((s) => s.hasPin);
  const { isUnlocked, unlock, lock } = useDataLockStore();
  const locked = useFinancialLocked();
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [pin, setPin] = useState("");

  const { execute: verifyPin, loading } = useAction(verifyDataLockPinAction, {
    successMessage: "Financial data unlocked",
    onSuccess: () => {
      unlock();
      setUnlockOpen(false);
      setPin("");
    },
  });

  if (!hasPin) return null;

  async function handleUnlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("pin", pin);
    await verifyPin(formData);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => (isUnlocked ? lock() : setUnlockOpen(true))}
        title={locked ? "Unlock financial amounts" : "Lock financial amounts"}
        aria-label={locked ? "Unlock financial amounts" : "Lock financial amounts"}
      >
        {locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
      </Button>

      <Modal
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        title="Unlock financial data"
      >
        <form onSubmit={handleUnlock} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your data lock PIN to show amounts across the dashboard.
          </p>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="4–6 digit PIN"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            required
          />
          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading || pin.length < 4}
          >
            Unlock
          </Button>
        </form>
      </Modal>
    </>
  );
}