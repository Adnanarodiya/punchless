"use client";

import Link from "next/link";

import { PageHeader } from "@punchless/ui/components/page-header";
import { Button } from "@punchless/ui/components/button";

import { changePassword } from "@/lib/actions/admin.actions";
import { useAction } from "@/hooks/use-action";

export function PasswordManager() {
  const { execute: execChange, loading } = useAction(changePassword, {
    successMessage: "Password updated successfully!",
  });

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change Password"
        description="Update your dashboard login password."
      />

      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard/settings" className="text-primary hover:underline">
          ← Back to Settings
        </Link>
      </p>

      <div className="max-w-md rounded-xl border border-border bg-card p-5">
        <form action={execChange} className="space-y-3">
          <div>
            <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium">
              Current password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-medium">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <Button type="submit" loading={loading} disabled={loading}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}