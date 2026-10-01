import "server-only";
import type { Plant } from "@/data/plants";
import { env } from "@/server/env";
import { scoreWithBioclip } from "./bioclip";
import { matchPlant } from "./match";

/**
 * Identify the plant in a photo, given as a base64 data URL. Returns the
 * species from the plant list, or null if the model's best guess isn't on it.
 * Throws if the model isn't configured or can't be reached.
 */
export async function identifyPlant(imageDataUrl: string): Promise<Plant | null> {
  const { url, proxyKey, proxySecret } = env.plantId;
  if (!url) {
    throw new Error("MODAL_BIO_CLIP_URL is not set");
  }

  const [best] = await scoreWithBioclip({ url, proxyKey, proxySecret }, imageDataUrl);
  return best ? matchPlant(best) : null;
}
