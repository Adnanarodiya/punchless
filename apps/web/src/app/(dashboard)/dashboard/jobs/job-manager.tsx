"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@punchless/ui/components/button";
import { Plus, X, Pencil, MapPin, User, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { createJob, updateJob } from "@/lib/actions/job.actions";
import type { JobWithDetails } from "@/lib/queries/job.queries";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import { useAction } from "@/hooks/use-action";

const MapPicker = dynamic(() => import("@/components/map-picker").then((m) => m.MapPicker), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-muted rounded-lg animate-pulse" />,
});

interface Props {
  jobs: JobWithDetails[];
  employees: EmployeeWithWorkshop[];
}

export function JobManager({ jobs, employees }: Props) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingJob, setEditingJob] = useState<JobWithDetails | null>(null);
  const [highlightJobId, setHighlightJobId] = useState<string | null>(null);

  // Form state
  const [lat, setLat] = useState(21.1081059);
  const [lng, setLng] = useState(73.1213093);
  const [radius, setRadius] = useState(50);

  function startAdd() {
    setMode("add");
    setEditingJob(null);
    setLat(21.1081059);
    setLng(73.1213093);
    setRadius(50);
  }

  function startEdit(job: JobWithDetails) {
    setMode("edit");
    setEditingJob(job);
    setLat(job.lat || 21.1081059);
    setLng(job.lng || 73.1213093);
    setRadius(job.radius || 50);
  }

  useEffect(() => {
    const jobId = searchParams.get("job");
    if (!jobId) return;

    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    setHighlightJobId(jobId);
    startEdit(job);

    const timer = window.setTimeout(() => {
      document
        .getElementById(`job-card-${jobId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);

    const clearTimer = window.setTimeout(() => setHighlightJobId(null), 4000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  }, [searchParams, jobs]);

  function cancel() {
    setMode("list");
    setEditingJob(null);
  }

  const { execute: execCreate } = useAction(createJob, {
    successMessage: "Job created!",
    onSuccess: () => setMode("list"),
  });

  const { execute: execUpdate } = useAction(updateJob, {
    successMessage: "Job updated!",
    onSuccess: () => { setMode("list"); setEditingJob(null); },
  });

  async function handleCreate(formData: FormData) {
    formData.set("lat", String(lat));
    formData.set("lng", String(lng));
    formData.set("radius", String(radius));
    await execCreate(formData);
  }

  async function handleUpdate(formData: FormData) {
    if (!editingJob) return;
    formData.set("jobId", editingJob.id);
    formData.set("lat", String(lat));
    formData.set("lng", String(lng));
    formData.set("radius", String(radius));
    await execUpdate(formData);
  }

  const inputClass = "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";
  const selectClass = "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";
  const textareaClass = "w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm resize-none";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel: Form */}
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 h-fit sticky top-6">
        {mode === "list" && (
          <Button onClick={startAdd} className="w-full">
            <Plus className="size-4" /> Add Job
          </Button>
        )}

        {(mode === "add" || mode === "edit") && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{mode === "add" ? "New Job" : "Edit Job"}</h2>
              <Button variant="ghost" size="icon" onClick={cancel}>
                <X className="size-4" />
              </Button>
            </div>

            <form action={mode === "add" ? handleCreate : handleUpdate} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Title</label>
                <input
                  name="title"
                  placeholder="e.g. AC Installation @ Sharma's"
                  required
                  defaultValue={editingJob?.title}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Description (Optional)</label>
                <textarea
                  name="description"
                  placeholder="Details about the job..."
                  defaultValue={editingJob?.description || ""}
                  className={textareaClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Customer Name</label>
                  <input
                    name="customerName"
                    placeholder="John Doe"
                    defaultValue={editingJob?.customer_name || ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Phone</label>
                  <input
                    name="customerPhone"
                    type="tel"
                    placeholder="+91..."
                    defaultValue={editingJob?.customer_phone || ""}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Assign To</label>
                <select
                  name="assignedTo"
                  defaultValue={editingJob?.assigned_to || ""}
                  className={selectClass}
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {mode === "edit" && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingJob?.status || "pending"}
                    className={selectClass}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              {/* Map Picker */}
              <div className="pt-2">
                <label className="text-xs text-muted-foreground block mb-1">Location & Geofence</label>
                <MapPicker
                  lat={lat}
                  lng={lng}
                  radius={radius}
                  onLocationChange={(newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                  }}
                  onRadiusChange={setRadius}
                  height="200px"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Drag marker to set job location. Geofence radius: {radius}m
                </p>
              </div>

              <Button type="submit" className="w-full mt-4">
                {mode === "add" ? "Create Job" : "Save Changes"}
              </Button>
            </form>
          </>
        )}
      </div>

      {/* Right Panel: List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Jobs ({jobs.length})</h2>
          
          {/* Simple status filter could go here */}
        </div>

        {jobs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No jobs created yet.</p>
            <Button variant="link" onClick={startAdd}>Create your first job</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div
                id={`job-card-${job.id}`}
                key={job.id}
                className={`bg-card border rounded-xl p-4 flex flex-col md:flex-row gap-4 hover:border-primary/50 transition-colors group ${
                  highlightJobId === job.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                }`}
              >
                {/* Job Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-base">{job.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {job.description || "No description"}
                      </p>
                    </div>
                    <JobStatusBadge status={job.status} />
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                    {job.customer_name && (
                      <span className="flex items-center gap-1">
                        <User className="size-3" /> {job.customer_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" /> {job.lat?.toFixed(5)}, {job.lng?.toFixed(5)}
                    </span>
                    {job.assigned_to_name ? (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <User className="size-3" /> Assigned to: {job.assigned_to_name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-warning">
                        <AlertCircle className="size-3" /> Unassigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(job)} className="justify-start">
                    <Pencil className="size-3.5 mr-2" /> Edit
                  </Button>
                  {/* Delete (Hidden for now, maybe only allow if status is pending/cancelled?) */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobStatusBadge({ status }: { status: string | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: Record<string, { label: string; className: string; icon: any }> = {
    pending: { label: "Pending", className: "bg-muted text-muted-foreground", icon: Clock },
    assigned: { label: "Assigned", className: "bg-blue-500/10 text-blue-500", icon: User },
    in_progress: { label: "In Progress", className: "bg-amber-500/10 text-amber-500", icon: Clock },
    completed: { label: "Completed", className: "bg-green-500/10 text-green-500", icon: CheckCircle },
    cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-500", icon: X },
  };

  const { label, className, icon: Icon } = config[status || "pending"] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="size-3" />
      {label}
    </span>
  );
}
