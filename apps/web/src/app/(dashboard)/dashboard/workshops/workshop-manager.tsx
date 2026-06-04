"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@punchless/ui/components/button";
import { MapPin, Pencil, Power, Trash2, Plus, X } from "lucide-react";
import {
  createWorkshop,
  updateWorkshop,
  toggleWorkshopStatus,
  deleteWorkshop,
  resolveGoogleMapsUrl,
} from "@/lib/actions/workshop.actions";
import type { Database } from "@punchless/types/database.types";
import { useAction, toastAction } from "@/hooks/use-action";

type WorkshopRow = Database["public"]["Tables"]["workshops"]["Row"];

const MapPicker = dynamic(() => import("@/components/map-picker").then((m) => m.MapPicker), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-muted rounded-lg animate-pulse" />,
});

export function WorkshopManager({ workshops }: { workshops: WorkshopRow[] }) {
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingWorkshop, setEditingWorkshop] = useState<WorkshopRow | null>(null);
  const [lat, setLat] = useState(21.1081059);
  const [lng, setLng] = useState(73.1213093);
  const [radius, setRadius] = useState(100);
  const [urlInput, setUrlInput] = useState("");
  const [resolvingUrl, setResolvingUrl] = useState(false);

  const parseCoords = (input: string) => {
    const directMatch = input.match(/^\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s*$/);
    if (directMatch) {
      return { lat: parseFloat(directMatch[1]), lng: parseFloat(directMatch[2]) };
    }

    const patterns = [
      /@([0-9.-]+),([0-9.-]+)/,
      /\/place\/([0-9.-]+)[,+]([0-9.-]+)/,
      /[?&]q=([0-9.-]+),([0-9.-]+)/,
      /query=([0-9.-]+),([0-9.-]+)/,
      /ll=([0-9.-]+),([0-9.-]+)/
    ];

    for (const p of patterns) {
      const match = input.match(p);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    }
    return null;
  };

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

  function startAdd() {
    setMode("add");
    setEditingWorkshop(null);
    setLat(21.1081059);
    setLng(73.1213093);
    setRadius(100);
    setUrlInput("");
  }

  function startEdit(w: WorkshopRow) {
    setMode("edit");
    setEditingWorkshop(w);
    setLat(w.lat ?? 21.1081059);
    setLng(w.lng ?? 73.1213093);
    setRadius(w.radius ?? 100);
    setUrlInput("");
  }

  function cancel() {
    setMode("list");
    setEditingWorkshop(null);
    setUrlInput("");
  }

  const { execute: execCreate } = useAction(createWorkshop, {
    successMessage: "Workshop created!",
    onSuccess: () => setMode("list"),
  });

  const { execute: execUpdate } = useAction(updateWorkshop, {
    successMessage: "Workshop updated!",
    onSuccess: () => { setMode("list"); setEditingWorkshop(null); },
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel: form */}
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5">
        {mode === "list" && (
          <Button onClick={startAdd} className="w-full">
            <Plus className="size-4" /> Add Workshop
          </Button>
        )}

        {(mode === "add" || mode === "edit") && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {mode === "add" ? "Add Workshop" : "Edit Workshop"}
              </h2>
              <Button variant="ghost" size="icon" onClick={cancel}>
                <X className="size-4" />
              </Button>
            </div>

            <form action={mode === "add" ? handleCreate : handleUpdate} className="space-y-3">
              <input
                name="name"
                placeholder="Workshop name"
                required
                defaultValue={editingWorkshop?.name || ""}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
              />
              <input
                name="address"
                placeholder="Address (optional)"
                defaultValue={editingWorkshop?.address || ""}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Import from Google Maps Link</label>
                <input
                  type="text"
                  placeholder={resolvingUrl ? "Resolving link..." : "Paste Maps URL (e.g., https://maps.app.goo.gl/...)"}
                  value={urlInput}
                  disabled={resolvingUrl}
                  onChange={(e) => handleMapUrlChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
                />
              </div>

              {/* Map picker */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Click on the map or drag the marker to set location
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
                    className="w-full h-9 px-2 rounded-lg border border-input bg-background text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Lng</label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    className="w-full h-9 px-2 rounded-lg border border-input bg-background text-foreground text-xs"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                {mode === "add" ? "Create Workshop" : "Save Changes"}
              </Button>
            </form>
          </>
        )}
      </div>

      {/* Right panel: list */}
      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Workshop List</h2>

        {workshops.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workshops yet.</p>
        ) : (
          <div className="space-y-3">
            {workshops.map((w) => (
              <div
                key={w.id}
                className="border border-border rounded-lg p-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-primary shrink-0" />
                    <p className="font-medium">{w.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {w.address || "No address"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {w.lat.toFixed(6)}, {w.lng.toFixed(6)} · {w.radius}m
                  </p>
                  <p className={`text-xs font-medium ${w.is_active ? "text-success" : "text-state-offduty"}`}>
                    {w.is_active ? "● Active" : "● Inactive"}
                  </p>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(w)} title="Edit">
                    <Pencil className="size-4" />
                  </Button>
                  <form action={toastAction(toggleWorkshopStatus, "Workshop status updated")}>
                    <input type="hidden" name="workshopId" value={w.id} />
                    <input type="hidden" name="nextStatus" value={String(!w.is_active)} />
                    <Button variant="ghost" size="icon" type="submit" title={w.is_active ? "Deactivate" : "Activate"}>
                      <Power className={`size-4 ${w.is_active ? "text-success" : "text-state-offduty"}`} />
                    </Button>
                  </form>
                  <form action={toastAction(deleteWorkshop, "Workshop deleted")}>
                    <input type="hidden" name="workshopId" value={w.id} />
                    <Button variant="ghost" size="icon" type="submit" title="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
