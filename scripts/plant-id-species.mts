/**
 * Writes services/plant-id/species.json from src/data/plants.ts, the app's
 * only plant list. Run after changing the list, then redeploy the model:
 *
 *   npm run plant-id:species
 */
import { writeFileSync } from "node:fs";
import { plants } from "../src/data/plants.ts";

const species = plants.map((plant) => ({ name: plant.name, scientific: plant.scientificName }));
const path = new URL("../services/plant-id/species.json", import.meta.url);
writeFileSync(path, JSON.stringify(species, null, 2) + "\n");
console.log(`Wrote ${species.length} species to services/plant-id/species.json`);
