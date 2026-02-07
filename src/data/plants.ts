export interface Plant {
  name: string;
  scientificName: string;
}

export const plants: Plant[] = [
  { name: "Air Potato", scientificName: "Dioscorea bulbifera" },
  { name: "Coral Adicea", scientificName: "Ardicia Crenata" },
  { name: "Spanish Gold", scientificName: "Sesbania Punicea" },
  { name: "Torpedo Grass", scientificName: "Panicum repens" },
  { name: "Wedelia", scientificName: "Wedelia Trilobata" },
  { name: "Caeser's Weed", scientificName: "Urena Lobata" },
  { name: "Wandering Jew / Small Leaf", scientificName: "Tradescantia fluminensis" },
  { name: "Wild Taro and Elephant Ear", scientificName: "Colocasia esculenta & Xanthosoma" },
  { name: "Japanese Climbing Fern", scientificName: "Lygodium japonicum" },
  { name: "Chinese Tallow", scientificName: "Sapium sebiferum" },
  { name: "Camphor", scientificName: "Cinnamomum camphora" },
  { name: "Mimosa", scientificName: "Albizia julibrissin" },
  { name: "Shrub Lantana", scientificName: "Lantana camara" },
  { name: "Boston or Sword Fern", scientificName: "Nephrolepis cordifolia" },
  { name: "Winged Yam", scientificName: "Dioscorea alata" },
  { name: "Tropical Soda Apple", scientificName: "Solanum viarum" },
  { name: "Cogon Grass", scientificName: "Imperata cylindrica" },
];

export const plantNames = plants.map((p) => p.name);
