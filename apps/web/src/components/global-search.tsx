"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  FileText,
  Receipt,
  Search,
  UserCircle,
  Users,
} from "lucide-react";

import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";

import type { SearchResultItem } from "@/lib/queries/search.queries";
import { useNavigationStore } from "@/lib/stores/navigation.store";

const TYPE_META: Record<
  SearchResultItem["type"],
  { label: string; icon: typeof Users }
> = {
  client: { label: "Client", icon: Building2 },
  employee: { label: "Employee", icon: Users },
  invoice: { label: "Invoice", icon: FileText },
  supplier: { label: "Supplier", icon: UserCircle },
  job: { label: "Job", icon: Briefcase },
  purchase: { label: "Purchase", icon: Receipt },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = (await res.json()) as { results: SearchResultItem[] };
      setResults(data.results ?? []);
      setActiveIndex(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void fetchResults(query);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, open, fetchResults]);

  function navigate(item: SearchResultItem) {
    onOpenChange(false);
    useNavigationStore.getState().startNavigation();
    router.push(item.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      navigate(results[activeIndex]);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-lg gap-0 overflow-hidden p-0"
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Search className="size-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search clients, invoices, purchases, jobs…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="max-h-80 overflow-y-auto p-2">
        {query.trim().length < 2 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </p>
        ) : loading ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Searching…
          </p>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No results for &ldquo;{query}&rdquo;
          </p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((item, index) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;
              return (
                <li key={`${item.type}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => navigate(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                      index === activeIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {meta.label}
                        {item.subtitle ? ` · ${item.subtitle}` : ""}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}