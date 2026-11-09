import { getPlants } from "@/server/plants";
import GuideClient from "./GuideClient";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const plants = await getPlants();
  return <GuideClient plants={plants} />;
}
