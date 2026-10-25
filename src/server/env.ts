import "server-only";

/**
 * Server-side environment variables, checked when first imported so a missing
 * value fails at startup with a clear message. See .env.example.
 * (Clerk reads and checks its own keys.)
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required("SUPABASE_URL"),
  supabaseSecretKey: required("SUPABASE_SECRET_KEY"),
  /** The plant ID model (services/plant-id). Only needed while PLANT_ID_ENABLED is on */
  plantId: {
    url: process.env.MODAL_BIO_CLIP_URL,
    /** Modal proxy auth token, required once the endpoint is deployed with auth */
    proxyKey: process.env.MODAL_PROXY_KEY,
    proxySecret: process.env.MODAL_PROXY_SECRET,
  },
};
