"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import type { LatLng } from "@/lib/geo";
import { TILE_ATTRIBUTION, TILE_URL } from "@/lib/mapTiles";

const GAINESVILLE: [number, number] = [29.6516, -82.3248];

const leafletReady: Promise<typeof Leaflet> | null =
  typeof window === "undefined" ? null : import("leaflet").then((module) => module.default);

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (location: LatLng) => void;
}

/**
 * A map to place the sighting's pin by tapping or dragging, for when GPS is
 * off or inaccurate under tree cover. Created once; the pin moves in place.
 * Tiles need a connection, so offline the map is blank but the pin still works.
 */
export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{ map: Leaflet.Map; marker: Leaflet.CircleMarker } | null>(null);
  const [ready, setReady] = useState(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Where the map first opens; later changes move the pin, not the map
  const initialRef = useRef(value);

  useEffect(() => {
    let cancelled = false;
    leafletReady?.then((L) => {
      if (cancelled || !containerRef.current) return;
      const start: [number, number] = initialRef.current
        ? [initialRef.current.lat, initialRef.current.lng]
        : GAINESVILLE;

      const map = L.map(containerRef.current).setView(start, initialRef.current ? 16 : 12);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
      const marker = L.circleMarker(start, {
        radius: 10,
        color: "#ffffff",
        weight: 3,
        fillColor: "#16a34a",
        fillOpacity: initialRef.current ? 1 : 0,
        opacity: initialRef.current ? 1 : 0,
      }).addTo(map);

      map.on("click", (event: Leaflet.LeafletMouseEvent) =>
        onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng }),
      );

      leafletRef.current = { map, marker };
      setReady(true);
    });

    return () => {
      cancelled = true;
      leafletRef.current?.map.remove();
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    if (!ready || !leaflet || !value) return;
    leaflet.marker.setLatLng([value.lat, value.lng]).setStyle({ opacity: 1, fillOpacity: 1 });
    if (!leaflet.map.getBounds().contains([value.lat, value.lng])) {
      leaflet.map.panTo([value.lat, value.lng]);
    }
  }, [ready, value]);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-gray-300">
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="Map: tap where you saw the plant"
      />
      {!ready && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
    </div>
  );
}
