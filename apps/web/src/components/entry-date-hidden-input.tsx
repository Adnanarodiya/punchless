"use client";

import { useEntryDateStore } from "@/lib/stores/entry-date.store";

type Props = {
  name: string;
};

/** Submits the global entry date with a form field (paymentDate, invoiceDate, etc.). */
export function EntryDateHiddenInput({ name }: Props) {
  const entryDate = useEntryDateStore((s) => s.entryDate);
  return <input type="hidden" name={name} value={entryDate} />;
}