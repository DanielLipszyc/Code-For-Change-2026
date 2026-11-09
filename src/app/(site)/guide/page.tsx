import { getPlants } from "@/server/plants";
import GuideClient from "./GuideClient";

export default async function GuidePage() {
  const plants = await getPlants();
  return <GuideClient plants={plants} />;
}
