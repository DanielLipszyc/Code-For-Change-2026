/**
 * Writes services/plant-id/species.json from the active Supabase plant catalog.
 * Run after editing the catalog, then redeploy the model:
 *
 *   npm run plant-id:species
 */
import { writeFileSync } from "node:fs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from("plants")
  .select("name, scientific_name")
  .eq("is_active", true)
  .order("sort_order", { ascending: true })
  .order("name", { ascending: true });

if (error) throw new Error(`Could not load plant catalog: ${error.message}`);
if (!data?.length) throw new Error("The active Supabase plant catalog is empty.");

const species = data.map((plant) => ({
  name: plant.name,
  scientific: plant.scientific_name,
}));
const path = new URL("../services/plant-id/species.json", import.meta.url);
writeFileSync(path, JSON.stringify(species, null, 2) + "\n");
console.log(`Wrote ${species.length} active species to services/plant-id/species.json`);
