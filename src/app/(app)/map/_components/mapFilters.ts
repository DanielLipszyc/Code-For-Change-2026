import type { Submission } from "@/types/submission";

export interface MapFilters {
  /** Plant names to show; empty means all */
  plants: string[];
  /** Inclusive YYYY-MM-DD bounds in the viewer's time zone; "" for none */
  dateFrom: string;
  dateTo: string;
}

export const NO_FILTERS: MapFilters = { plants: [], dateFrom: "", dateTo: "" };

export function hasFilters(filters: MapFilters): boolean {
  return filters.plants.length > 0 || filters.dateFrom !== "" || filters.dateTo !== "";
}

/** The day a sighting happened in the viewer's time zone, as YYYY-MM-DD */
export function localDay(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function applyFilters(submissions: Submission[], filters: MapFilters): Submission[] {
  return submissions.filter((submission) => {
    if (filters.plants.length > 0 && !filters.plants.includes(submission.plantName)) return false;

    const day = localDay(submission.timestamp);
    if (filters.dateFrom && day < filters.dateFrom) return false;
    if (filters.dateTo && day > filters.dateTo) return false;
    return true;
  });
}
