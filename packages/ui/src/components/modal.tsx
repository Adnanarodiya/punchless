"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@punchless/ui/components/dialog";
import { VisuallyHidden } from "@punchless/ui/components/visually-hidden";
import { cn } from "@punchless/ui/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  hideCloseBtn?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
  overlayClassName?: string;
}

function Modal({
  open,
  onOpenChange,
  children,
  title,
  hideCloseBtn = false,
  closeOnOverlayClick = true,
  className = "",
  overlayClassName = "",
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
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              {title}
            </DialogTitle>
          </DialogHeader>
        ) : (
          <VisuallyHidden>
            <DialogTitle>Dialog</DialogTitle>
          </VisuallyHidden>
        )}
        {children}
      </DialogContent>
      <DialogOverlay className={overlayClassName} />
    </Dialog>
  );
}

export { Modal, type ModalProps };
