"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { VisuallyHidden } from "./visually-hidden";
import { cn } from "../lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  headerAccessory?: React.ReactNode;
  hideCloseBtn?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

function Modal({
  open,
  onOpenChange,
  children,
  title,
  headerAccessory,
  hideCloseBtn = false,
  closeOnOverlayClick = true,
  className = "",
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("", className)}
        onInteractOutside={(e) => {
          if (!closeOnOverlayClick) {
            e.preventDefault();
          }
        }}
        hideCloseBtn={hideCloseBtn}
      >
        {title ? (
          <DialogHeader className="mb-1 flex-row items-center justify-between gap-3 space-y-0 border-b border-border/60 pb-3 pr-10">
            <DialogTitle className="px-0 text-left text-lg font-semibold">
              {title}
            </DialogTitle>
            {headerAccessory ? (
              <div className="shrink-0">{headerAccessory}</div>
            ) : null}
          </DialogHeader>
        ) : (
          <VisuallyHidden>
            <DialogTitle>Dialog</DialogTitle>
          </VisuallyHidden>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

export { Modal, type ModalProps };
