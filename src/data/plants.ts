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
  { name: "Wild Taro and Elephant Ear", scientificName: "Colocasia esculenta" },
  { name: "Japanese Climbing Fern", scientificName: "Lygodium japonicum" },
];

export const plantNames = plants.map((p) => p.name);
