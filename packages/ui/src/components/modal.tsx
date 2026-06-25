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
  hideCloseBtn?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

function Modal({
  open,
  onOpenChange,
  children,
  title,
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
    </Dialog>
  );
}

export { Modal, type ModalProps };
