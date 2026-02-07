"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  lat?: number;
  lng?: number;
  radius?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  onRadiusChange?: (radius: number) => void;
  height?: string;
  readOnly?: boolean;
}

export function MapPicker({
  lat = 21.1081059,
  lng = 73.1213093,
  radius = 100,
  onLocationChange,
  onRadiusChange,
  height = "300px",
  readOnly = false,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [currentRadius, setCurrentRadius] = useState(radius);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Fix leaflet default icon issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const map = L.map(mapRef.current).setView([lat, lng], 16);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: !readOnly }).addTo(map);
    markerRef.current = marker;

    const circle = L.circle([lat, lng], {
      radius: currentRadius,
      color: "hsl(217, 91%, 60%)",
      fillColor: "hsl(217, 91%, 60%)",
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map);
    circleRef.current = circle;

    if (!readOnly) {
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        circle.setLatLng(pos);
        onLocationChange?.(pos.lat, pos.lng);
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        circle.setLatLng(e.latlng);
        onLocationChange?.(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(currentRadius);
    }
  }, [currentRadius]);

  function handleRadiusChange(newRadius: number) {
    setCurrentRadius(newRadius);
    onRadiusChange?.(newRadius);
  }

  return (
    <div className="space-y-2">
      <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-lg border border-border overflow-hidden z-0" />
      {!readOnly && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Radius: {currentRadius}m</label>
          <input
            type="range"
            min={20}
            max={500}
            value={currentRadius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="flex-1"
          />
        </div>
      )}
    </div>
  );
}
