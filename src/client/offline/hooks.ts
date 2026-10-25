"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useUser } from "@clerk/nextjs";
import { isVisibleTo, listSavedReports, onSavedReportsChange, type SavedReport } from "./reports";

function subscribeToConnection(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Whether the browser thinks it's online. "Online" can still mean a signal
 * too weak to send anything, so senders also handle failed requests.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeToConnection,
    () => navigator.onLine,
    // The server renders the online state
    () => true,
  );
}

/**
 * The reports saved on this device that the current user may see (see
 * isVisibleTo), oldest first. Null until they've been read.
 */
export function useSavedReports(): SavedReport[] | null {
  const { isLoaded, user } = useUser();
  const userId = user?.id ?? null;
  const [all, setAll] = useState<SavedReport[] | null>(null);

  const refresh = useCallback(() => {
    listSavedReports()
      .then(setAll)
      // Storage unavailable (private browsing in some browsers): nothing saved
      .catch(() => setAll([]));
  }, []);

  useEffect(() => {
    refresh();
    return onSavedReportsChange(refresh);
  }, [refresh]);

  return all && all.filter((report) => isVisibleTo(report, { loaded: isLoaded, userId }));
}
