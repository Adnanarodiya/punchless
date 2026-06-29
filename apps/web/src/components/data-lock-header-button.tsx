"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";

import { verifyDataLockPinAction } from "@/lib/actions/settings.actions";
import { useDataLockStore } from "@/lib/stores/data-lock.store";
import { useAction } from "@/hooks/use-action";

type Props = {
  hasDataLockPin: boolean;
};

/** Lock/unlock control for the dashboard header (all pages). */
export function DataLockHeaderButton({ hasDataLockPin }: Props) {
  const { isUnlocked, unlock, lock } = useDataLockStore();
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

  if (!hasDataLockPin) return null;

  const locked = !isUnlocked;

  async function handleUnlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("pin", pin);
    await verifyPin(formData);
  }

  return (
    <>
      {locked ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setUnlockOpen(true)}
          className={cn(
            "shrink-0 gap-2 border-warning/60 bg-warning/10 text-warning hover:bg-warning/15 hover:text-warning"
          )}
          title="Unlock financial amounts"
          aria-label="Unlock financial amounts"
        >
          <Unlock className="size-4 shrink-0" />
          <span className="hidden sm:inline">Unlock financials</span>
          <span className="sm:hidden">Unlock</span>
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={lock}
          className="shrink-0 gap-2"
          title="Lock financial amounts"
          aria-label="Lock financial amounts"
        >
          <Lock className="size-4 shrink-0" />
          <span className="hidden sm:inline">Lock financials</span>
          <span className="sm:hidden">Lock</span>
        </Button>
      )}

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