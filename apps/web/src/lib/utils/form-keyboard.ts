import type { KeyboardEvent } from "react";

export function focusField(fieldId?: string) {
  if (!fieldId) return false;
  const el = document.getElementById(fieldId);
  if (!el) return false;
  if ("focus" in el) {
    (el as HTMLElement).focus();
    return true;
  }
  return false;
}

export function handleEnterToNextField(
  event: KeyboardEvent,
  nextFieldId?: string
) {
  if (event.key !== "Enter") return false;
  event.preventDefault();
  return focusField(nextFieldId);
}

export function stopEnterSubmit(event: KeyboardEvent) {
  if (event.key !== "Enter") return;
  event.preventDefault();
}