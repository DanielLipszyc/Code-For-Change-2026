import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { plants } from "../src/data/plants";

// Load local environment variables.
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Check your .env.local file.");
}

// This script runs locally, outside the Next.js application.
// Never import this client into browser-facing code.
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Converts a plant's English common name into a stable URL-friendly slug.
 * Example: "Caesar's Weed" -> "caesars-weed"
 */
function createSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seedPlants() {
  console.log(`Preparing to import ${plants.length} plants...`);

  const records = plants.map((plant, index) => ({
    slug: createSlug(plant.name),
    name: plant.name,
    scientific_name: plant.scientificName,
    threat_level: plant.threatLevel,
    pic_url: plant.picUrl || null,
    tip: plant.tip,

    // Preserve the existing Spanish and Portuguese translations.
    translations: {
      es: {
        name: plant.es.name,
        tip: plant.es.tip,
      },
      pt: {
        name: plant.pt.name,
        tip: plant.pt.tip,
      },
    },

    // Preserve the ordering used by the existing plant catalog.
    sort_order: index,
  }));

  // Check for duplicate slugs before attempting the database operation.
  const slugs = records.map((record) => record.slug);
  if (new Set(slugs).size !== slugs.length) {
    throw new Error("Duplicate plant slugs detected. Check src/data/plants.ts.");
  }

  // Upsert means matching slugs are updated instead of duplicated.
  const { data, error } = await supabase
    .from("plants")
    .upsert(records, { onConflict: "slug" })
    .select("id, slug, name");

  if (error) {
    throw new Error(`Plant import failed: ${error.message}`);
  }

  console.log("\nPlant import successful!");
  console.log(`Records returned by Supabase: ${data?.length ?? 0}`);

  data?.forEach((plant) => {
    console.log(`✓ ${plant.name} (${plant.slug})`);
  });

  // Independently verify the total number of active catalog records.
  const { count, error: countError } = await supabase
    .from("plants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (countError) {
    throw new Error(`Verification failed: ${countError.message}`);
  }

  console.log(`\nTotal active plants in database: ${count}`);
}

seedPlants().catch((error: unknown) => {
  console.error("\nSeed script failed:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
