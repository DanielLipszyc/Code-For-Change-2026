"use client";

import { useState } from "react";
import { NO_FILTERS, hasFilters, type MapFilters } from "./mapFilters";

interface FiltersProps {
  plantOptions: string[];
  value: MapFilters;
  onChange: (filters: MapFilters) => void;
  shown: number;
  total: number;
}

/** Collapsible plant and date filters for the map */
export default function Filters({ plantOptions, value, onChange, shown, total }: FiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const togglePlant = (plant: string) =>
    onChange({
      ...value,
      plants: value.plants.includes(plant)
        ? value.plants.filter((p) => p !== plant)
        : [...value.plants, plant],
    });

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
      >
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filter Sightings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {expanded ? "Click to collapse" : "Click to expand filters"}
          </p>
        </div>
        <div
          className={`text-2xl text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          ▼
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/50">
          <fieldset className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <legend className="text-sm font-semibold text-gray-900 dark:text-white">
                🌿 Filter by Plant Species
              </legend>
              {plantOptions.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, plants: plantOptions })}
                    className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, plants: [] })}
                    className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            {plantOptions.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {plantOptions.map((plant) => (
                  <label key={plant} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value.plants.includes(plant)}
                      onChange={() => togglePlant(plant)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{plant}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No plants to filter</p>
            )}
          </fieldset>

          <fieldset className="mb-4">
            <legend className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white">
              📅 Filter by Date Range
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs text-gray-600 dark:text-gray-400">
                <span className="mb-1 block">From</span>
                <input
                  type="date"
                  value={value.dateFrom}
                  onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </label>
              <label className="block text-xs text-gray-600 dark:text-gray-400">
                <span className="mb-1 block">To</span>
                <input
                  type="date"
                  value={value.dateTo}
                  onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </label>
            </div>
          </fieldset>

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            {hasFilters(value) && (
              <button
                type="button"
                onClick={() => onChange(NO_FILTERS)}
                className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
              >
                ✕ Clear All Filters
              </button>
            )}
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Showing {shown} of {total} sightings
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
