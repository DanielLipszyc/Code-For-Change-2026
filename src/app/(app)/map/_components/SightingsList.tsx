"use client";

import { useMemo, useState } from "react";
import { distanceKm, formatDistance, type LatLng } from "@/lib/geo";
import { useLanguage } from "@/components/LanguageProvider";
import { photoUrl } from "@/lib/photos";
import type { MapPoint } from "@/types/submission";

/** Rows rendered at first; "Show more" adds this many again */
const PAGE_SIZE = 30;

interface SightingsListProps {
  points: MapPoint[];
  /** When known, sightings are sorted nearest first and show their distance */
  userLocation: LatLng | null;
  highlightPending: boolean;
  onSelect: (point: MapPoint) => void;
}

/**
 * The map's sightings as a list ("What people found"): the same sightings and
 * filters as the map, nearest first when the visitor's location is known,
 * newest first otherwise. Also the keyboard-friendly way to reach a sighting.
 */
export default function SightingsList({
  points,
  userLocation,
  highlightPending,
  onSelect,
}: SightingsListProps) {
  const { t } = useLanguage();
  const [limit, setLimit] = useState(PAGE_SIZE);

  const rows = useMemo(() => {
    const withDistance = points.map((point) => ({
      point,
      distance: userLocation ? distanceKm(userLocation, point) : null,
    }));
    return userLocation
      ? withDistance.sort((a, b) => a.distance! - b.distance!)
      : withDistance.sort((a, b) => b.point.timestamp - a.point.timestamp);
  }, [points, userLocation]);

  if (rows.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center p-8 text-center text-gray-600 dark:text-gray-400 sm:h-[600px]">
        {t("No sightings match these filters yet.")}
      </div>
    );
  }

  return (
    <div className="h-[500px] overflow-y-auto sm:h-[600px]">
      <p className="px-4 pt-4 text-sm text-gray-600 dark:text-gray-400 sm:px-6">
        {t(userLocation ? "Nearest first" : "Most recent first")}
      </p>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {rows.slice(0, limit).map(({ point, distance }) => (
          <li key={point.id}>
            <button
              type="button"
              onClick={() => onSelect(point)}
              className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:px-6"
            >
              {point.hasPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- photos come from an API route
                <img
                  src={photoUrl(point.id, "thumb")}
                  alt=""
                  loading="lazy"
                  width={64}
                  height={64}
                  className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-200 object-cover dark:bg-gray-700"
                />
              ) : (
                <span
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl dark:bg-gray-700"
                  aria-hidden="true"
                >
                  🌿
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-gray-900 dark:text-white">
                  {point.plantName}
                </span>
                {point.scientificName && (
                  <span className="block truncate text-xs italic text-gray-600 dark:text-gray-400">
                    {point.scientificName}
                  </span>
                )}
                <span className="mt-1 block text-xs text-gray-500">
                  {t("Spotted {date}", {
                    date: new Date(point.timestamp).toLocaleDateString(),
                  })}
                  {highlightPending && point.status === "pending" && (
                    <span className="ml-2 font-semibold text-red-600">{t("Pending approval")}</span>
                  )}
                </span>
              </span>
              {distance !== null && (
                <span className="flex-shrink-0 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  {formatDistance(distance)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {rows.length > limit && (
        <div className="p-4 text-center">
          <button
            type="button"
            onClick={() => setLimit(limit + PAGE_SIZE)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {t("Show more ({count} left)", { count: rows.length - limit })}
          </button>
        </div>
      )}
    </div>
  );
}
