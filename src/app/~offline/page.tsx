import Link from "next/link";

export const metadata = { title: "Offline · Swamp Spotter" };

/**
 * Shown by the service worker (app/sw.ts) for a page that was never opened
 * with a connection. Static, so it's precached when the app installs.
 */
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="text-5xl">📡</div>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">You&apos;re offline</h1>
      <p className="mt-4 text-gray-600">
        This page hasn&apos;t been opened on this device before, so it isn&apos;t saved for offline
        use. Pages you&apos;ve opened while online still work.
      </p>
      <p className="mt-4 text-gray-600">
        You can still report a sighting: the submit page saves it on this device and sends it when
        you&apos;re back online.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/submit"
          className="rounded-md bg-[#136207] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d4705]"
        >
          Report a sighting
        </Link>
        <Link
          href="/drafts"
          className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          My drafts
        </Link>
      </div>
    </div>
  );
}
