export interface Plant {
  name: string;
  scientificName: string;
}

export const plants: Plant[] = [
  { name: "Air Potato", scientificName: "Dioscorea bulbifera" },
  { name: "Coral Adicea", scientificName: "Ardisia Crenata" },
  { name: "Spanish Gold", scientificName: "Sesbania Punicea" },
  { name: "Torpedo Grass", scientificName: "Panicum repens" },
  { name: "Wedelia", scientificName: "Wedelia Trilobata" },
  { name: "Caeser's Weed", scientificName: "Urena Lobata" },
  { name: "Small Leaf Spiderwort", scientificName: "Tradescantia fluminensis" },
  { name: "Wild Taro", scientificName: "Colocasia esculenta" },
  { name: "Japanese Climbing Fern", scientificName: "Lygodium japonicum" },
  { name: "Chinese Tallow", scientificName: "Sapium sebiferum" },
  { name: "Camphor", scientificName: "Cinnamomum camphora" },
  { name: "Mimosa", scientificName: "Albizia julibrissin" },
  { name: "Shrub Lantana", scientificName: "Lantana camara" },
  { name: "Boston Fern", scientificName: "Nephrolepis cordifolia" },
  { name: "Winged Yam", scientificName: "Dioscorea alata" },
  { name: "Tropical Soda Apple", scientificName: "Solanum viarum" },
  { name: "Cogon Grass", scientificName: "Imperata cylindrica" },
];

export const plantNames = plants.map((p) => p.name);
