import { getViewer } from "@/server/authz";
import { listSubmissions } from "@/server/submissions";
import CountyInfo from "./_components/CountyInfo";
import MapExplorer from "./_components/MapExplorer";

/**
 * /map: public. Sightings are loaded here on the server, already limited to
 * what this visitor may see, so the page arrives with its data.
 */
export default async function MapPage() {
  const viewer = await getViewer();
  const submissions = await listSubmissions(viewer);

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Alachua County Invasive Plant Map
          </h1>
        </div>

        <MapExplorer initialSubmissions={submissions} viewer={viewer} />
        <CountyInfo />
      </div>
    </div>
  );
}
