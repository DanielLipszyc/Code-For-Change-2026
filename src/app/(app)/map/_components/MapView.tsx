"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import type { GeoJsonObject } from "geojson";
import alachuaBoundary from "@/data/alachua-boundary.json";
import { isInAlachua } from "@/lib/limits";
import type { MapPoint } from "@/types/submission";
import { buildPopupContent } from "./popup";
import { TILE_ATTRIBUTION, TILE_URL } from "./tiles";

/** Gainesville, where the map opens before (or without) the user's location */
const COUNTY_CENTER: [number, number] = [29.652, -82.325];
const ZOOM = 10;

const COLORS = { approved: "#16a34a", pending: "#dc2626" };

// Leaflet touches `window`, so it only loads in the browser. Starting the
// download when this module loads, rather than in an effect, lets it run
// alongside hydration instead of after it.
const leafletReady: Promise<typeof Leaflet> | null =
  typeof window === "undefined" ? null : import("leaflet").then((module) => module.default);

interface MapViewProps {
  points: MapPoint[];
  /** Draw pending sightings in red (for admins) */
  highlightPending: boolean;
  /** The visitor's location, once known. The map centers on it if it's in the county. */
  userLocation: { lat: number; lng: number } | null;
  /** False while the map is hidden behind the list view */
  visible: boolean;
  /** A sighting's popup opened (a good moment to start loading its details) */
  onPreview: (point: MapPoint) => void;
  /** "More details" was clicked */
  onSelect: (point: MapPoint) => void;
}

interface MarkerEntry {
  marker: Leaflet.CircleMarker;
  /** What the marker was drawn from, to tell when it needs redrawing */
  point: MapPoint;
  pending: boolean;
}

/**
 * The Leaflet map. It's created once; when the sightings or filters change,
 * only the markers that changed are added or removed, so the view, the zoom
 * and any open popup stay where they are.
 *
 * Markers are circles drawn in one shared SVG layer rather than an HTML
 * element and image per pin, and each popup is built only when it opens, so
 * the map stays smooth with thousands of sightings.
 */
export default function MapView({
  points,
  highlightPending,
  userLocation,
  visible,
  onPreview,
  onSelect,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{
    L: typeof Leaflet;
    map: Leaflet.Map;
    markers: Leaflet.LayerGroup;
  } | null>(null);
  const markersRef = useRef(new Map<string, MarkerEntry>());
  const userMovedRef = useRef(false);
  const [ready, setReady] = useState(false);

  // Marker events call the latest callbacks without redrawing every marker
  const callbacksRef = useRef({ onPreview, onSelect });
  useEffect(() => {
    callbacksRef.current = { onPreview, onSelect };
  });

  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;

    leafletReady?.then((L) => {
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current).setView(COUNTY_CENTER, ZOOM);
      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
        // Fewer tile requests mid-zoom and more tiles kept around the view,
        // so zooming and panning back don't flash empty squares
        updateWhenZooming: false,
        keepBuffer: 4,
      }).addTo(map);
      L.geoJSON(alachuaBoundary as GeoJsonObject, {
        style: { color: "#000000", weight: 2, fillOpacity: 0 },
        interactive: false,
      }).addTo(map);

      // Once the visitor moves the map, a late location fix doesn't move it back
      map.on("dragstart zoomstart", () => {
        userMovedRef.current = true;
      });

      leafletRef.current = { L, map, markers: L.layerGroup().addTo(map) };
      setReady(true);
    });

    return () => {
      cancelled = true;
      leafletRef.current?.map.remove();
      leafletRef.current = null;
      markers.clear();
    };
  }, []);

  // Add, update and remove only the markers that changed
  useEffect(() => {
    const leaflet = leafletRef.current;
    if (!ready || !leaflet) return;
    const { L, markers: layer } = leaflet;
    const markers = markersRef.current;

    const wanted = new Map(points.map((point) => [point.id, point]));
    for (const [id, entry] of markers) {
      const point = wanted.get(id);
      const pending = highlightPending && point?.status === "pending";
      if (!point || point !== entry.point || pending !== entry.pending) {
        layer.removeLayer(entry.marker);
        markers.delete(id);
      }
    }

    for (const point of points) {
      if (markers.has(point.id)) continue;
      const pending = highlightPending && point.status === "pending";
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: pending ? COLORS.pending : COLORS.approved,
        fillOpacity: 0.95,
      })
        // Built when the popup opens, not for every marker up front
        .bindPopup(() =>
          buildPopupContent(point, pending, () => callbacksRef.current.onSelect(point)),
        )
        .on("popupopen", () => callbacksRef.current.onPreview(point))
        .addTo(layer);
      markers.set(point.id, { marker, point, pending });
    }
  }, [ready, points, highlightPending]);

  // Center on the visitor if they're in the county and haven't moved the map yet
  useEffect(() => {
    const map = leafletRef.current?.map;
    if (!ready || !map || !userLocation || userMovedRef.current) return;
    if (isInAlachua(userLocation.lat, userLocation.lng)) {
      map.setView([userLocation.lat, userLocation.lng], ZOOM);
    }
  }, [ready, userLocation]);

  // A hidden map has no size; measure again when it's shown
  useEffect(() => {
    if (ready && visible) leafletRef.current?.map.invalidateSize();
  }, [ready, visible]);

  return (
    <div className="relative h-[500px] w-full sm:h-[600px]">
      <div
        ref={containerRef}
        className="h-full w-full"
        data-testid="map"
        aria-label="Map of invasive plant sightings"
      />
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-200">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      )}
    </div>
  );
}
