import OfflineContent from "./OfflineContent";

export const metadata = { title: "Offline · Swamp Spotter" };

/**
 * Shown by the service worker (app/sw.ts) for a page that was never opened
 * with a connection. Static, so it's precached when the app installs.
 */
export default function OfflinePage() {
  return <OfflineContent />;
}
