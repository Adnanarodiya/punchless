"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { cn } from "@punchless/ui/lib/utils";

interface DeleteConfirmButtonProps {
  entityName: string;
  entityType?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  className?: string;
  title?: string;
}

export function DeleteConfirmButton({
  entityName,
  entityType = "item",
  onConfirm,
  loading = false,
  size = "icon",
  className,
  title = "Delete",
}: DeleteConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size}
        className={cn("text-destructive hover:text-destructive", className)}
        title={title}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
      </Button>

      <ConfirmModal
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${entityType}?`}
        description={`Are you sure you want to delete "${entityName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={loading}
        onConfirm={async () => {
          await onConfirm();
          setOpen(false);
        }}
      />
    </>
  );
}