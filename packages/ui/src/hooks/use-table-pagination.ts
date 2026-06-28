"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_TABLE_PAGE_SIZE,
  paginateItems,
  type PaginatedSlice,
} from "../lib/paginate";

type Options = {
  pageSize?: number;
  resetKey?: string | number;
};

export function useTablePagination<T>(
  items: T[],
  { pageSize = DEFAULT_TABLE_PAGE_SIZE, resetKey }: Options = {}
): PaginatedSlice<T> & {
  setPage: (page: number) => void;
} {
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [items.length, resetKey]);

  useEffect(() => {
    function handleBeforePrint() {
      setShowAll(true);
    }

    function handleAfterPrint() {
      setShowAll(false);
    }

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const slice = useMemo(
    () =>
      paginateItems(
        items,
        showAll ? 1 : page,
        showAll ? Math.max(items.length, 1) : pageSize
      ),
    [items, page, pageSize, showAll]
  );

  return {
    ...slice,
    setPage,
  };
}