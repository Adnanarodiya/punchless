"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Shield, Trash2 } from "lucide-react";

import { PageHeader } from "@punchless/ui/components/page-header";
import { Button } from "@punchless/ui/components/button";
import { DataTable } from "@punchless/ui/components/data-table";

import {
  deactivateAdminUser,
  inviteAdminUser,
} from "@/lib/actions/admin.actions";
import type { DashboardUser } from "@/lib/queries/admin-user.queries";
import { useAction } from "@/hooks/use-action";

interface Props {
  users: DashboardUser[];
  currentUserId: string;
}

export function UsersManager({ users, currentUserId }: Props) {
  const [showForm, setShowForm] = useState(false);

  const { execute: execInvite, loading: inviting } = useAction(inviteAdminUser, {
    successMessage: "Admin user invited!",
    onSuccess: () => setShowForm(false),
  });

  const { execute: execDeactivate } = useAction(deactivateAdminUser, {
    successMessage: "Admin deactivated",
  });

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Users"
        description="Owner and admin accounts for the web dashboard (email login)."
      >
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> Invite Admin
        </Button>
      </PageHeader>

      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard/settings" className="text-primary hover:underline">
          ← Back to Settings
        </Link>
      </p>

      {showForm ? (
        <div className="max-w-lg rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">Invite Admin</h2>
          <form action={execInvite} className="space-y-3">
            <input name="fullName" placeholder="Full name" required className={inputClass} />
            <input name="email" type="email" placeholder="Email" required className={inputClass} />
            <input name="password" type="password" placeholder="Temporary password (min 6)" minLength={6} required className={inputClass} />
            <input name="phone" type="tel" placeholder="Phone (optional)" className={inputClass} />
            <div className="flex justify-end">
              <Button type="submit" loading={inviting} disabled={inviting}>Create Admin</Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5">
        <DataTable
          data={users}
          getRowKey={(row) => row.id}
          emptyMessage="No dashboard users."
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (row) => (
                <span className="font-medium">{row.full_name}</span>
              ),
            },
            { key: "email", header: "Email", cell: (row) => row.email },
            {
              key: "role",
              header: "Role",
              cell: (row) => (
                <span className="inline-flex items-center gap-1 capitalize">
                  {row.role === "owner" ? (
                    <Shield className="size-3 text-primary" />
                  ) : null}
                  {row.role}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => (row.is_active ? "Active" : "Inactive"),
            },
            {
              key: "actions",
              header: "",
              cell: (row) =>
                row.role === "admin" && row.is_active ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Deactivate"
                    disabled={row.id === currentUserId}
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("adminUserId", row.id);
                      void execDeactivate(fd);
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                ) : null,
            },
          ]}
        />
      </div>
    </div>
  );
}