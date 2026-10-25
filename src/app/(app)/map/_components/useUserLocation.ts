"use client";

import { useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo";

const TIMEOUT_MS = 8000;
const MAX_AGE_MS = 5 * 60 * 1000;

/**
 * The visitor's location, asked for once. Null until it's known, and stays
 * null if they decline or don't answer: nothing waits on it.
 */
export function useUserLocation(): LatLng | null {
  const [location, setLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    let cancelled = false;
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        if (!cancelled) setLocation({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {},
      { timeout: TIMEOUT_MS, maximumAge: MAX_AGE_MS },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
