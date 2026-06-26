"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { PageHeader } from "@punchless/ui/components/page-header";
import { cn } from "@punchless/ui/lib/utils";
import {
  MapPin,
  Pencil,
  Power,
  Plus,
  Search,
  Warehouse,
  CircleDot,
  Crosshair,
} from "lucide-react";
import { toast } from "sonner";
import {
  createWorkshop,
  updateWorkshop,
  toggleWorkshopStatus,
  deleteWorkshop,
  resolveGoogleMapsUrl,
} from "@/lib/actions/workshop.actions";
import type { Database } from "@punchless/types/database.types";
import { useAction, toastAction } from "@/hooks/use-action";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";

type WorkshopRow = Database["public"]["Tables"]["workshops"]["Row"];

const MapPicker = dynamic(
  () => import("@/components/map-picker").then((m) => m.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
    ),
  }
);

const DEFAULT_LAT = 21.1081059;
const DEFAULT_LNG = 73.1213093;
const DEFAULT_RADIUS = 100;

export function WorkshopManager({ workshops }: { workshops: WorkshopRow[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<WorkshopRow | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [urlInput, setUrlInput] = useState("");
  const [resolvingUrl, setResolvingUrl] = useState(false);
  const [locating, setLocating] = useState(false);

  const isEdit = editingWorkshop !== null;
  const activeCount = workshops.filter((w) => w.is_active).length;

  const filteredWorkshops = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return workshops;
    return workshops.filter((w) =>
      [w.name, w.address, String(w.radius)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [workshops, search]);

  const parseCoords = (input: string) => {
    const directMatch = input.match(/^\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s*$/);
    if (directMatch) {
      return {
        lat: parseFloat(directMatch[1]),
        lng: parseFloat(directMatch[2]),
      };
    }

    const patterns = [
      /@([0-9.-]+),([0-9.-]+)/,
      /\/place\/([0-9.-]+)[,+]([0-9.-]+)/,
      /[?&]q=([0-9.-]+),([0-9.-]+)/,
      /query=([0-9.-]+),([0-9.-]+)/,
      /ll=([0-9.-]+),([0-9.-]+)/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    }
    return null;
  };

  function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setUrlInput("");
        toast.success("Current location applied to the map.");
        setLocating(false);
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Location permission denied. Allow access in your browser settings.",
          2: "Unable to detect your location.",
          3: "Location request timed out. Try again.",
        };
        toast.error(messages[error.code] ?? "Could not get current location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function handleMapUrlChange(val: string) {
    setUrlInput(val);
    if (!val.trim()) return;

    const localCoords = parseCoords(val);
    if (localCoords) {
      setLat(localCoords.lat);
      setLng(localCoords.lng);
      return;
    }

    if (val.includes("maps.app.goo.gl") || val.includes("goo.gl/maps")) {
      setResolvingUrl(true);
      try {
        const resolved = await resolveGoogleMapsUrl(val);
        const resolvedCoords = parseCoords(resolved);
        if (resolvedCoords) {
          setLat(resolvedCoords.lat);
          setLng(resolvedCoords.lng);
        }
      } catch (err) {
        console.error("Failed to resolve URL:", err);
      } finally {
        setResolvingUrl(false);
      }
    }
  }

  function resetMapState(workshop?: WorkshopRow | null) {
    setLat(workshop?.lat ?? DEFAULT_LAT);
    setLng(workshop?.lng ?? DEFAULT_LNG);
    setRadius(workshop?.radius ?? DEFAULT_RADIUS);
    setUrlInput("");
  }

  function openAdd() {
    setEditingWorkshop(null);
    resetMapState(null);
    setFormOpen(true);
  }

  function openEdit(workshop: WorkshopRow) {
    setEditingWorkshop(workshop);
    resetMapState(workshop);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingWorkshop(null);
    setUrlInput("");
  }

  const { execute: execCreate, loading: creating } = useAction(createWorkshop, {
    successMessage: "Workshop created!",
    onSuccess: () => closeForm(),
  });

  const { execute: execUpdate, loading: updating } = useAction(updateWorkshop, {
    successMessage: "Workshop updated!",
    onSuccess: () => closeForm(),
  });

  const { execute: execDelete, loading: deleting } = useAction(deleteWorkshop, {
    successMessage: "Workshop deleted",
  });

  async function handleCreate(formData: FormData) {
    formData.set("lat", String(lat));
    formData.set("lng", String(lng));
    formData.set("radius", String(radius));
    await execCreate(formData);
  }

  async function handleUpdate(formData: FormData) {
    if (!editingWorkshop) return;
    formData.set("workshopId", editingWorkshop.id);
    formData.set("lat", String(lat));
    formData.set("lng", String(lng));
    formData.set("radius", String(radius));
    await execUpdate(formData);
  }

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workshops"
        description="Manage workshop locations, geofence radius, and GPS attendance zones."
      >
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add Workshop
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Workshops</p>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Warehouse className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-bold">{workshops.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Active</p>
            <div className="rounded-lg bg-success/10 p-2 text-success">
              <CircleDot className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-bold">{activeCount}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workshops…"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>

        {filteredWorkshops.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <MapPin className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-medium text-foreground">
              {workshops.length === 0 ? "No workshops yet" : "No matches found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {workshops.length === 0
                ? "Add a workshop location to enable GPS attendance."
                : "Try a different search term."}
            </p>
            {workshops.length === 0 ? (
              <Button className="mt-4" onClick={openAdd}>
                <Plus className="size-4" />
                Add Workshop
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredWorkshops.map((workshop) => (
              <WorkshopCard
                key={workshop.id}
                workshop={workshop}
                deleting={deleting}
                onEdit={() => openEdit(workshop)}
                onDelete={async () => {
                  const fd = new FormData();
                  fd.set("workshopId", workshop.id);
                  await execDelete(fd);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
          else setFormOpen(true);
        }}
        title={isEdit ? "Edit Workshop" : "Add Workshop"}
        className="max-h-[92vh] max-w-2xl overflow-y-auto"
      >
        <form
          action={isEdit ? handleUpdate : handleCreate}
          className="space-y-3"
        >
          <input
            name="name"
            placeholder="Workshop name"
            required
            defaultValue={editingWorkshop?.name || ""}
            className={inputClass}
          />
          <input
            name="address"
            placeholder="Address (optional)"
            defaultValue={editingWorkshop?.address || ""}
            className={inputClass}
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Set location
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder={
                  resolvingUrl
                    ? "Resolving link…"
                    : "Paste Google Maps URL (optional)"
                }
                value={urlInput}
                disabled={resolvingUrl || locating}
                onChange={(e) => handleMapUrlChange(e.target.value)}
                className={cn(inputClass, "sm:flex-1")}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                loading={locating}
                disabled={locating || resolvingUrl}
                onClick={handleGetCurrentLocation}
              >
                <Crosshair className="size-4" />
                Current location
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a Maps link or use your device GPS to place the marker.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Click the map or drag the marker to set location
            </p>
            <MapPicker
              lat={lat}
              lng={lng}
              radius={radius}
              onLocationChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
              onRadiusChange={setRadius}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Lat</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Lng</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs text-foreground"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isEdit ? updating : creating}
            disabled={isEdit ? updating : creating}
          >
            {isEdit ? "Save Changes" : "Create Workshop"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function WorkshopCard({
  workshop,
  deleting,
  onEdit,
  onDelete,
}: {
  workshop: WorkshopRow;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm",
        !workshop.is_active && "opacity-75"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {workshop.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {workshop.radius}m geofence
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            workshop.is_active
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          )}
        >
          {workshop.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mb-3 flex-1 space-y-1 text-xs text-muted-foreground">
        <p className="line-clamp-2">
          {workshop.address || "No address set"}
        </p>
        <p className="font-mono text-[11px]">
          {workshop.lat.toFixed(5)}, {workshop.lng.toFixed(5)}
        </p>
      </div>

      <div className="flex items-center justify-end gap-0.5 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onEdit}
          title="Edit"
        >
          <Pencil className="size-3.5" />
        </Button>
        <form
          action={toastAction(
            toggleWorkshopStatus,
            "Workshop status updated"
          )}
        >
          <input type="hidden" name="workshopId" value={workshop.id} />
          <input
            type="hidden"
            name="nextStatus"
            value={String(!workshop.is_active)}
          />
          <Button
            variant="ghost"
            size="icon"
            type="submit"
            className="size-8"
            title={workshop.is_active ? "Deactivate" : "Activate"}
          >
            <Power
              className={cn(
                "size-3.5",
                workshop.is_active ? "text-success" : "text-muted-foreground"
              )}
            />
          </Button>
        </form>
        <DeleteConfirmButton
          entityName={workshop.name}
          entityType="workshop"
          loading={deleting}
          onConfirm={onDelete}
        />
      </div>
    </article>
  );
}