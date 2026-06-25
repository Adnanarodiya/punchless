"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Unlock } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";

import { verifyDataLockPinAction } from "@/lib/actions/settings.actions";
import { useDataLockStore } from "@/lib/stores/data-lock.store";
import { useAction } from "@/hooks/use-action";

interface Props {
  hasDataLockPin: boolean;
}

export function DashboardDataLockControls({ hasDataLockPin }: Props) {
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

  if (!hasDataLockPin) {
    return (
      <p className="text-xs text-muted-foreground">
        Set a data lock PIN in{" "}
        <a href="/dashboard/settings" className="text-primary hover:underline">
          Settings
        </a>{" "}
        to hide financial figures on shared PCs.
      </p>
    );
  }

  const locked = !isUnlocked;

  async function handleUnlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("pin", pin);
    await verifyPin(formData);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {locked ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setUnlockOpen(true)}
          >
            <Unlock className="size-4" />
            Unlock financials
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={lock}>
            <Lock className="size-4" />
            Lock financials
          </Button>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {locked ? (
            <>
              <EyeOff className="size-3.5" />
              Hidden
            </>
          ) : (
            <>
              <Eye className="size-3.5" />
              Visible
            </>
          )}
        </span>
      </div>

      <Modal
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        title="Unlock financial data"
      >
        <form onSubmit={handleUnlock} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your company data lock PIN to show income, expenses, and dues.
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