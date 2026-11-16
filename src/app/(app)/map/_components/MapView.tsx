"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import type { GeoJsonObject } from "geojson";
import { useLanguage } from "@/components/LanguageProvider";
import alachuaBoundary from "@/data/alachua-boundary.json";
import { isInAlachua } from "@/lib/limits";
import type { ThreatLevel } from "@/types/plant";
import type { MapPoint } from "@/types/submission";
import { buildPopupContent } from "./popup";
import { TILE_ATTRIBUTION, TILE_URL } from "@/lib/mapTiles";

/** Gainesville, where the map opens before (or without) the user's location */
const COUNTY_CENTER: [number, number] = [29.652, -82.325];
const ZOOM = 10;

const THREAT_COLORS: Record<ThreatLevel, string> = {
  Low: "#16a34a",
  Moderate: "#f59e0b",
  Significant: "#dc2626",
};
const UNKNOWN_THREAT_COLOR = "#6b7280";
const PENDING_STROKE = "#7f1d1d";

// Leaflet touches `window`, so it only loads in the browser. Starting the
// download when this module loads, rather than in an effect, lets it run
// alongside hydration instead of after it.
const leafletReady: Promise<typeof Leaflet> | null =
  typeof window === "undefined" ? null : import("leaflet").then((module) => module.default);

interface MapViewProps {
  points: MapPoint[];
  threatByPlant: Record<string, ThreatLevel>;
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
  marker: Leaflet.LayerGroup;
  pin: Leaflet.Polygon;
  center: Leaflet.CircleMarker;
  /** What the marker was drawn from, to tell when it needs redrawing */
  point: MapPoint;
  pending: boolean;
  threatLevel: ThreatLevel | undefined;
}

const PIN_SHAPE: readonly [number, number][] = [
  [0, 0],
  [-5, -7],
  [-9, -12],
  [-9, -19],
  [-8, -23],
  [-5, -26],
  [0, -28],
  [5, -26],
  [8, -23],
  [9, -19],
  [9, -12],
  [5, -7],
];

function offsetFromPoint(
  map: Leaflet.Map,
  point: MapPoint,
  offset: [number, number],
): Leaflet.LatLng {
  const pixel = map.latLngToContainerPoint([point.lat, point.lng]);
  return map.containerPointToLatLng([pixel.x + offset[0], pixel.y + offset[1]]);
}

function pinCoordinates(map: Leaflet.Map, point: MapPoint): Leaflet.LatLng[] {
  return PIN_SHAPE.map((offset) => offsetFromPoint(map, point, offset));
}

/**
 * The Leaflet map. It's created once; when the sightings or filters change,
 * only the markers that changed are added or removed, so the view, the zoom
 * and any open popup stay where they are.
 *
 * Pins are vector paths in Leaflet's shared SVG layer, and each popup is built
 * only when it opens, so the map stays smooth with many sightings.
 */
export default function MapView({
  points,
  threatByPlant,
  highlightPending,
  userLocation,
  visible,
  onPreview,
  onSelect,
}: MapViewProps) {
  const { t } = useLanguage();
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

      const markerLayer = L.layerGroup().addTo(map);
      map.on("zoomend", () => {
        for (const entry of markers.values()) {
          entry.pin.setLatLngs(pinCoordinates(map, entry.point));
          entry.center.setLatLng(offsetFromPoint(map, entry.point, [0, -19]));
        }
      });

      leafletRef.current = { L, map, markers: markerLayer };
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
      const threatLevel = point ? threatByPlant[point.plantName] : undefined;
      if (
        !point ||
        point !== entry.point ||
        pending !== entry.pending ||
        threatLevel !== entry.threatLevel
      ) {
        layer.removeLayer(entry.marker);
        markers.delete(id);
      }
    }

    for (const point of points) {
      if (markers.has(point.id)) continue;
      const pending = highlightPending && point.status === "pending";
      const threatLevel = threatByPlant[point.plantName];
      const fillColor = threatLevel ? THREAT_COLORS[threatLevel] : UNKNOWN_THREAT_COLOR;
      const pin = L.polygon(pinCoordinates(leaflet.map, point), {
        color: pending ? PENDING_STROKE : "#ffffff",
        weight: 2,
        fillColor,
        fillOpacity: 0.95,
        className: `sighting-pin threat-${(threatLevel ?? "unknown").toLowerCase()}`,
      });
      pin.on("add", () => {
        pin.getElement()?.setAttribute("data-threat-level", threatLevel ?? "unknown");
        pin.getElement()?.setAttribute("data-plant-name", point.plantName);
        pin.getElement()?.setAttribute("aria-label", `${point.plantName} sighting`);
      });
      pin
        // Built when the popup opens, not for every marker up front
        .bindPopup(() =>
          buildPopupContent(point, pending, () => callbacksRef.current.onSelect(point)),
        )
        .on("popupopen", () => callbacksRef.current.onPreview(point));
      const center = L.circleMarker(offsetFromPoint(leaflet.map, point, [0, -19]), {
        radius: 3.5,
        color: "#ffffff",
        weight: 1,
        fillColor: "#ffffff",
        fillOpacity: 1,
        interactive: false,
      });
      const marker = L.layerGroup([pin, center]).addTo(layer);
      markers.set(point.id, { marker, pin, center, point, pending, threatLevel });
    }
  }, [ready, points, threatByPlant, highlightPending]);

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
        aria-label={t("Map of invasive plant sightings")}
      />
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-200">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      )}
    </div>
  );
}
