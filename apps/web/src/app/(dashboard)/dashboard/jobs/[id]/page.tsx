import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Pencil,
  Phone,
  User,
} from "lucide-react";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@punchless/ui/components/page-header";
import { cn } from "@punchless/ui/lib/utils";

import { getJobById } from "@/lib/queries/job.queries";
import { formatDate } from "@/lib/utils/formatting";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  assigned: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) notFound();

  const statusClass =
    STATUS_STYLES[job.status ?? "pending"] ?? STATUS_STYLES.pending;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        linkComponent={({ href, children: label, className }) => (
          <Link href={href} className={className}>
            {label}
          </Link>
        )}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs", href: "/dashboard/jobs" },
          { label: job.title },
        ]}
      />

      <PageHeader title={job.title} description="Job details and assignment">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/jobs">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/jobs?job=${job.id}`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Overview
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-muted-foreground" />
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                    statusClass
                  )}
                >
                  {(job.status ?? "pending").replace(/_/g, " ")}
                </span>
              </div>
              {job.description ? (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {job.description}
                </p>
              ) : (
                <p className="text-muted-foreground">No description provided.</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Customer
            </h2>
            <div className="space-y-2 text-sm">
              {job.customer_name ? (
                <p className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  {job.customer_name}
                </p>
              ) : (
                <p className="text-muted-foreground">No customer name</p>
              )}
              {job.customer_phone ? (
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <a
                    href={`tel:${job.customer_phone}`}
                    className="text-primary hover:underline"
                  >
                    {job.customer_phone}
                  </a>
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Assignment
            </h2>
            <p className="text-sm font-medium">
              {job.assigned_to_name ?? "Unassigned"}
            </p>
            {job.assigned_to_email ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {job.assigned_to_email}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </h2>
            <div className="space-y-2 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  {job.lat != null && job.lng != null
                    ? `${job.lat.toFixed(5)}, ${job.lng.toFixed(5)}`
                    : "Not set"}
                </span>
              </p>
              {job.radius != null ? (
                <p className="text-muted-foreground">
                  Geofence radius: {job.radius}m
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <p>Created {job.created_at ? formatDate(job.created_at) : "—"}</p>
            {job.updated_at ? (
              <p className="mt-1">Updated {formatDate(job.updated_at)}</p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}