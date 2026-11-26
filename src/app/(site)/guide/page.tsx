import { getPlants } from "@/server/plants";
import GuideClient from "./GuideClient";

export const dynamic = "force-dynamic";

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ plant?: string | string[] }>;
}) {
  const plants = await getPlants();
  const requested = (await searchParams).plant;
  const plant = Array.isArray(requested) ? requested[0] : requested;
  return <GuideClient key={plant ?? ""} plants={plants} requestedPlant={plant} />;
}
