import { preconnect } from "react-dom";
import { getPlants } from "@/server/plants";
import { listPublicMapPoints } from "@/server/submissions";
import type { ThreatLevel } from "@/types/plant";
import CountyInfo from "./_components/CountyInfo";
import MapExplorer from "./_components/MapExplorer";
import { TILE_ORIGIN } from "@/lib/mapTiles";

/**
 * /map: public, and the same for every visitor, so it's served from cache.
 * Submission changes invalidate that cache; the one-minute rebuild also
 * catches edits made directly in Supabase.
 */
export const revalidate = 60;

export default async function MapPage() {
  // Start connecting to the tile server while the page's scripts load
  preconnect(TILE_ORIGIN);
  const [approvedPoints, plants] = await Promise.all([listPublicMapPoints(), getPlants()]);
  const threatByPlant: Record<string, ThreatLevel> = Object.fromEntries(
    plants.map(({ name, threatLevel }) => [name, threatLevel]),
  );

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <MapExplorer approvedPoints={approvedPoints} threatByPlant={threatByPlant} />
        <CountyInfo />
      </div>
    </div>
  );
}
