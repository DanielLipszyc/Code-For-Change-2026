"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import type { GeoJsonObject } from "geojson";
import alachuaBoundary from "@/data/alachua-boundary.json";
import { isInAlachua } from "@/lib/limits";
import type { Submission } from "@/types/submission";
import { buildPopupContent } from "./popup";

/** Gainesville, where the map opens before (or without) the user's location */
const COUNTY_CENTER: [number, number] = [29.652, -82.325];
const ZOOM = 10;
const LOCATION_TIMEOUT_MS = 8000;

const PIN_COLORS = { approved: "#16a34a", pending: "#dc2626" };

/** A map pin drawn as inline SVG, so no marker images load from other sites */
function pinIcon(L: typeof Leaflet, color: string) {
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,.45))"><path fill="${color}" d="M12.5 0C5.6 0 0 5.6 0 12.5 0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"/><circle cx="12.5" cy="12.5" r="4.5" fill="#fff"/></svg>`,
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -36],
  });
}

interface MapViewProps {
  submissions: Submission[];
  /** Draw pending submissions in red (for admins) */
  highlightPending: boolean;
  onSelect: (submission: Submission) => void;
}

/**
 * The Leaflet map. It's created once; when the submissions or filters change,
 * only the markers are redrawn, so the view and zoom stay where they are.
 */
export default function MapView({ submissions, highlightPending, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{
    L: typeof Leaflet;
    map: Leaflet.Map;
    markers: Leaflet.LayerGroup;
  } | null>(null);
  const [ready, setReady] = useState(false);

  // Marker popups call the latest onSelect without redrawing every marker
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Leaflet touches `window`, so it's only loaded in the browser
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current).setView(COUNTY_CENTER, ZOOM);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      L.geoJSON(alachuaBoundary as GeoJsonObject, {
        style: { color: "#000000", fillOpacity: 0 },
      }).addTo(map);
      const markers = L.layerGroup().addTo(map);

      leafletRef.current = { L, map, markers };
      setReady(true);

      // Center on the user if they're in the county. The map is already
      // usable, so a slow or ignored location prompt doesn't hold it up.
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          if (!cancelled && isInAlachua(coords.latitude, coords.longitude)) {
            map.setView([coords.latitude, coords.longitude], ZOOM);
          }
        },
        () => {},
        { timeout: LOCATION_TIMEOUT_MS, maximumAge: 5 * 60 * 1000 },
      );
    })();

    return () => {
      cancelled = true;
      leafletRef.current?.map.remove();
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    if (!ready || !leaflet) return;

    const { L, markers } = leaflet;
    const icons = {
      approved: pinIcon(L, PIN_COLORS.approved),
      pending: pinIcon(L, PIN_COLORS.pending),
    };

    markers.clearLayers();
    for (const submission of submissions) {
      const showPending = highlightPending && submission.status === "pending";
      L.marker([submission.lat, submission.lng], {
        icon: showPending ? icons.pending : icons.approved,
        title: submission.plantName,
      })
        .bindPopup(
          buildPopupContent(submission, showPending, () => onSelectRef.current(submission)),
        )
        .addTo(markers);
    }
  }, [ready, submissions, highlightPending]);

  return (
    <div className="relative h-[500px] w-full sm:h-[600px]">
      <div ref={containerRef} className="h-full w-full" data-testid="map" />
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-200">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      )}
    </div>
  );
}
