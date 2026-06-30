"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { cn } from "../lib/utils";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: "default" | "destructive";
  loading?: boolean;
  className?: string;
}

function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
  className,
}: ConfirmModalProps) {
  const onConfirmRef = React.useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  React.useEffect(() => {
    if (!open || loading) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      void onConfirmRef.current();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading]);

  return (
    <AlertDialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <AlertDialogContent className={cn("", className)}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            onClick={() => {
              onCancel?.();
            }}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            className={cn(
              variant === "destructive" &&
                "bg-destructive text-white hover:bg-destructive/90"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Please wait…
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { ConfirmModal, type ConfirmModalProps };