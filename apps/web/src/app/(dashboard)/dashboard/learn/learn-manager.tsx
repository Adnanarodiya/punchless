"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  Lightbulb,
  ListOrdered,
  Search,
} from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@/components/page-header";
import { cn } from "@punchless/ui/lib/utils";

import { LearnIcon } from "@/lib/content/learn-icons";
import {
  getLearnCategoriesForRole,
  getLearnModuleById,
  getLearnModulesForRole,
} from "@/lib/content/learn-modules";
import type { LearnModule } from "@/lib/content/learn-types";

interface Props {
  role: string;
}

export function LearnManager({ role }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("module");

  const modules = useMemo(() => getLearnModulesForRole(role), [role]);
  const categories = useMemo(() => getLearnCategoriesForRole(role), [role]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter((m) => {
      const matchesCategory =
        categoryFilter === "all" || m.category === categoryFilter;
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.overview.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [modules, search, categoryFilter]);

  const selected =
    (selectedId ? getLearnModuleById(selectedId) : undefined) ??
    (filteredModules[0] ?? modules[0]);

  function selectModule(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("module", id);
    router.replace(`/dashboard/learn?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learn Punchless"
        description="Explore every module — what each page does, how to use it, and step-by-step testing guides with expected results."
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <BookOpen className="size-3.5" />
          {modules.length} modules
        </div>
      </PageHeader>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-0 lg:w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search modules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
              aria-label="Search learn modules"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <CategoryChip
              active={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
              label="All"
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                active={categoryFilter === cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                label={cat.label}
              />
            ))}
          </div>

          <nav
            className="max-h-[min(70vh,640px)] space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-2"
            aria-label="Learn modules"
          >
            {filteredModules.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No modules match your search.
              </p>
            ) : (
              filteredModules.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => selectModule(mod.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                    selected?.id === mod.id
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 rounded-md p-1.5",
                      selected?.id === mod.id
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <LearnIcon name={mod.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{mod.title}</span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {mod.summary}
                    </span>
                  </span>
                </button>
              ))
            )}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {selected ? (
            <ModuleDetail
              module={selected}
              role={role}
              onSelectModule={selectModule}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Select a module from the list to see the full guide.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function ModuleDetail({
  module,
  role,
  onSelectModule,
}: {
  module: LearnModule;
  role: string;
  onSelectModule: (id: string) => void;
}) {
  const related = module.relatedModuleIds
    .map((id) => getLearnModuleById(id))
    .filter((m): m is LearnModule => Boolean(m && m.roles.includes(role as "owner" | "admin")));

  return (
    <article className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <LearnIcon name={module.icon} className="size-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {module.category}
              </p>
              <h2 className="text-2xl font-bold">{module.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{module.summary}</p>
            </div>
          </div>
          <Button asChild>
            <Link href={module.href}>
              Open {module.title}
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <Section
        icon={BookOpen}
        title="Overview"
        description="What this module is for and when you use it."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">{module.overview}</p>
      </Section>

      <Section
        icon={ListOrdered}
        title="How it works"
        description="Core behaviour and rules behind the scenes."
      >
        <ol className="space-y-2">
          {module.howItWorks.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-muted-foreground">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        icon={LayoutSectionsIcon}
        title="Page sections"
        description="What you see on screen and what each area does."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {module.pageSections.map((section) => (
            <div
              key={section.title}
              className="rounded-lg border border-border bg-muted/30 p-4"
            >
              <h4 className="text-sm font-medium">{section.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {module.workflows.length > 0 ? (
        <Section
          icon={ArrowRight}
          title="Common workflows"
          description="Step-by-step paths for everyday tasks."
        >
          <div className="space-y-4">
            {module.workflows.map((flow) => (
              <div
                key={flow.title}
                className="rounded-lg border border-border bg-card p-4"
              >
                <h4 className="font-medium">{flow.title}</h4>
                <ol className="mt-3 space-y-2">
                  {flow.steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-muted-foreground"
                    >
                      <span className="font-medium text-primary">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {module.testing.length > 0 ? (
        <Section
          icon={FlaskConical}
          title="Testing guide"
          description="Manual test steps with expected output — use this to verify the module works correctly."
        >
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="w-12 p-3 font-medium">#</th>
                  <th className="p-3 font-medium">Action</th>
                  <th className="p-3 font-medium">Expected result</th>
                </tr>
              </thead>
              <tbody>
                {module.testing.map((test) => (
                  <tr
                    key={test.step}
                    className="border-b border-border last:border-0"
                  >
                    <td className="p-3 align-top">
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">
                        {test.step}
                      </span>
                    </td>
                    <td className="p-3 align-top text-foreground">{test.action}</td>
                    <td className="p-3 align-top">
                      <span className="inline-flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        {test.expected}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {module.tips.length > 0 ? (
        <Section
          icon={Lightbulb}
          title="Tips"
          description="Shortcuts and gotchas from real workshop usage."
        >
          <ul className="space-y-2">
            {module.tips.map((tip, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-lg bg-warning/5 px-3 py-2 text-sm text-muted-foreground"
              >
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {related.length > 0 ? (
        <section className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold">Related modules</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These pages connect to {module.title} — learn them next.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((rel) => (
              <button
                key={rel.id}
                type="button"
                onClick={() => onSelectModule(rel.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm transition hover:border-primary/30 hover:bg-primary/5"
              >
                <LearnIcon name={rel.icon} className="size-4 text-primary" />
                {rel.title}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function LayoutSectionsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="18" height="7" rx="1" />
    </svg>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}