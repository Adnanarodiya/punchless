"use client";

import { useState } from "react";
import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { mapFingerprintEmployeeAlias } from "@/lib/actions/attendance-import.actions";
import { useAction } from "@/hooks/use-action";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fingerprintName: string;
  salaryMonth: string;
  employees: Array<{ id: string; fullName: string }>;
  onMapped?: () => void;
};

export function FingerprintNameMapModal({
  open,
  onOpenChange,
  fingerprintName,
  salaryMonth,
  employees,
  onMapped,
}: Props) {
  const [employeeId, setEmployeeId] = useState("");

  const { execute: handleMap, loading } = useAction(mapFingerprintEmployeeAlias, {
    successMessage: "Name mapped — salary report updated.",
    onSuccess: () => {
      onMapped?.();
      onOpenChange(false);
      setEmployeeId("");
    },
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Map fingerprint name">
      <p className="mb-4 text-sm text-muted-foreground">
        Link this fingerprint machine name to an employee in Punchless. We will remember it for
        next month.
      </p>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData();
          formData.set("fingerprintName", fingerprintName);
          formData.set("employeeId", employeeId);
          formData.set("salaryMonth", salaryMonth);
          void handleMap(formData);
        }}
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Fingerprint name</label>
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            {fingerprintName}
          </p>
        </div>

        <div>
          <label htmlFor="employeeId" className="mb-1 block text-sm font-medium">
            Employee in Punchless
          </label>
          <select
            id="employeeId"
            name="employeeId"
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Select employee…</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!employeeId || loading}>
            Save mapping
          </Button>
        </div>
      </form>
    </Modal>
  );
}