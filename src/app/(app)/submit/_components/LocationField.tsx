"use client";

import dynamic from "next/dynamic";
import type { LatLng } from "@/lib/geo";

// Leaflet only runs in the browser, and only loads if someone opens the map
const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-gray-200" />,
});

export interface ReportLocation extends LatLng {
  /** GPS accuracy radius in meters; null for a pin placed by hand */
  accuracyM: number | null;
  source: "gps" | "map" | "saved";
}

interface LocationFieldProps {
  value: ReportLocation | null;
  onChange: (location: ReportLocation) => void;
  locating: boolean;
  onUseGps: () => void;
  showMap: boolean;
  onShowMap: (show: boolean) => void;
}

function describe(location: ReportLocation): string {
  const where = `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
  if (location.source === "gps") {
    return `From your GPS: ${where}${location.accuracyM ? ` (within about ${Math.round(location.accuracyM)} m)` : ""}`;
  }
  if (location.source === "saved") return `Saved with the draft: ${where}`;
  return `Pin on the map: ${where}`;
}

/**
 * Where the plant was. Uses GPS by default (asked for when the report is
 * sent if it hasn't been yet); the map is for when GPS is off or inaccurate.
 */
export default function LocationField({
  value,
  onChange,
  locating,
  onUseGps,
  showMap,
  onShowMap,
}: LocationFieldProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-lg sm:p-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">📍 Location *</h2>
        <p className="mt-1 text-sm text-gray-600">
          {value
            ? describe(value)
            : "Your GPS location is added when you submit. Allow location access when your browser asks, or place a pin on the map."}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onUseGps}
          disabled={locating}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {locating
            ? "Getting your location…"
            : value?.source === "gps"
              ? "Update my location"
              : "Use my location"}
        </button>
        <button
          type="button"
          onClick={() => onShowMap(!showMap)}
          aria-expanded={showMap}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {showMap ? "Hide the map" : "Place a pin on the map"}
        </button>
      </div>

      {showMap && (
        <div className="space-y-2">
          <LocationPicker
            value={value}
            onChange={(where) => onChange({ ...where, accuracyM: null, source: "map" })}
          />
          <p className="text-xs text-gray-500">
            Tap where you saw the plant. The map needs a connection to show streets; the pin works
            either way.
          </p>
        </div>
      )}
    </div>
  );
}
