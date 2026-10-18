import { preconnect } from "react-dom";
import { listPublicMapPoints } from "@/server/submissions";
import CountyInfo from "./_components/CountyInfo";
import MapExplorer from "./_components/MapExplorer";
import { TILE_ORIGIN } from "./_components/tiles";

/**
 * /map: public, and the same for every visitor, so it's built ahead of time
 * from the approved sightings and served from cache. Any change to a
 * submission clears that cache (server/submissions.ts) and the next visit
 * rebuilds the page. The hourly rebuild only catches edits made outside the
 * app, such as in the Supabase dashboard.
 */
export const revalidate = 3600;

export default async function MapPage() {
  // Start connecting to the tile server while the page's scripts load
  preconnect(TILE_ORIGIN);
  const approvedPoints = await listPublicMapPoints();

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Alachua County Invasive Plant Map
          </h1>
        </div>

        <MapExplorer approvedPoints={approvedPoints} />
        <CountyInfo />
      </div>
    </div>
  );
}
