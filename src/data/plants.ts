/**
 * The invasive species Swamp Spotter tracks. This is the only copy of the list:
 * the guide, the submit and edit forms, server-side validation and plant ID all
 * read it.
 */

export type ThreatLevel = "Low" | "Moderate" | "Significant";

export interface Plant {
  /**
   * English common name. Submissions store this exact text, so renaming a plant
   * also needs an update to existing rows (see supabase/schema.sql).
   */
  name: string;
  scientificName: string;
  threatLevel: ThreatLevel;
  /** Photo shown on the guide */
  picUrl: string;
  /** What to look for; finishes the sentence "Look for: ..." */
  tip: string;
  /** Spanish text for the guide */
  es: { name: string; tip: string };
}

export const plants: Plant[] = [
  {
    name: "Air Potato",
    scientificName: "Dioscorea bulbifera",
    threatLevel: "Significant",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/9b/Chinese_yam_-_air-potato_-_dioscorea_polystachya_IMG_8134.jpg",
    tip: "pointed, heart-shaped leaves and bulbs growing on the vine.",
    es: {
      name: "Papa del Aire",
      tip: "Hojas puntiagudas en forma de corazón y bulbos creciendo en la enredadera.",
    },
  },
  {
    name: "Coral Ardisia",
    scientificName: "Ardisia crenata",
    threatLevel: "Significant",
    picUrl:
      "https://www.floridamuseum.ufl.edu/wp-content/uploads/sites/23/2017/03/Ardisia-crenata-mature-fruit.jpg",
    tip: "wavy (crenate) leaves and small red berries.",
    es: {
      name: "Ardisia coral",
      tip: "Hojas onduladas (crenadas) y pequeñas bayas rojas.",
    },
  },
  {
    name: "Spanish Gold",
    scientificName: "Sesbania punicea",
    threatLevel: "Low",
    picUrl: "https://www.picturethisai.com/wiki-image/1080/215992612534845440.jpeg",
    tip: "dangling red-orange flowers. Their seed pods may make a rattling sound.",
    es: {
      name: "Oro Español",
      tip: "Flores colgantes rojo-naranja. Sus vainas pueden hacer un sonido de traqueteo.",
    },
  },
  {
    name: "Torpedo Grass",
    scientificName: "Panicum repens",
    threatLevel: "Significant",
    picUrl: "https://fsus.ncbg.unc.edu/img/orig/jho/jho_01342f.jpg",
    tip: "silver-green leaves with defined points.",
    es: {
      name: "Hierba Torpedo",
      tip: "Hojas verde plateadas con puntas definidas.",
    },
  },
  {
    name: "Wedelia",
    scientificName: "Wedelia trilobata",
    threatLevel: "Moderate",
    picUrl:
      "https://apps.lucidcentral.org/pppw_v10/images/entities/wedelia_447/ronggy_sphagneticola_trilobata_in_singapore2017.jpg",
    tip: "flower heads resembling daisies and waxy, jagged leaves.",
    es: {
      name: "Wedelia",
      tip: "Capítulos florales parecidos a margaritas y hojas cerosas y dentadas.",
    },
  },
  {
    name: "Caesar's Weed",
    scientificName: "Urena lobata",
    threatLevel: "Significant",
    picUrl: "https://static.inaturalist.org/photos/163617275/large.jpeg",
    tip: "pink-purple flowers and small burs covered in hooked bristles.",
    es: {
      name: "Hierba de César",
      tip: "Flores rosa-púrpura y pequeñas espinas cubiertas de cerdas ganchudas.",
    },
  },
  {
    name: "Small Leaf Spiderwort",
    scientificName: "Tradescantia fluminensis",
    threatLevel: "Significant",
    picUrl:
      "https://plant-directory.ifas.ufl.edu/site/assets/files/1157/tradescantia_fluminensis_flowers.0x1800.jpg",
    tip: "white flowers with three petals on hairless green stems.",
    es: {
      name: "Tradescantia de hojas pequeñas",
      tip: "Flores blancas con tres pétalos sobre tallos verdes sin pelo.",
    },
  },
  {
    name: "Wild Taro",
    scientificName: "Colocasia esculenta",
    threatLevel: "Moderate",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Taimo_Okinawa.jpg",
    tip: "leaves attached at the underside rather than the edge. Stalks can be several feet tall.",
    es: {
      name: "Taro Silvestre",
      tip: "Hojas unidas por la parte inferior en lugar de por el borde. Los tallos pueden medir varios pies.",
    },
  },
  {
    name: "Japanese Climbing Fern",
    scientificName: "Lygodium japonicum",
    threatLevel: "Significant",
    picUrl: "https://fsus.ncbg.unc.edu/img/orig/amc/amc_04402.jpg",
    tip: "symmetrical, triangular leaflets.",
    es: {
      name: "Helecho trepador japonés",
      tip: "Foliolos simétricos y triangulares.",
    },
  },
  {
    name: "Chinese Tallow",
    scientificName: "Sapium sebiferum",
    threatLevel: "Significant",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/6/66/ChineseTallowSeedpods.jpg",
    tip: "wide heart shaped leaves with quickly tapering tips.",
    es: {
      name: "Almacigo Chino",
      tip: "Hojas anchas en forma de corazón con puntas que se estrechan rápidamente.",
    },
  },
  {
    name: "Camphor",
    scientificName: "Cinnamomum camphora",
    threatLevel: "Significant",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/a2/Cinnamomum_camphora_Turramurra_railway.jpg",
    tip: "a distinct camphor smell from the twigs when crushed.",
    es: {
      name: "Alcanfor",
      tip: "Un olor a alcanfor distintivo de las ramitas al triturarlas.",
    },
  },
  {
    name: "Mimosa",
    scientificName: "Albizia julibrissin",
    threatLevel: "Significant",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/c5/2018-07-08_11_10_27_Rosea_Mimosa_blossoms_along_the_ramp_from_southbound_Interstate_95_(New_Jersey_Turnpike_Eastern_Spur)_to_westbound_Interstate_280_(Essex_Freeway)_in_the_New_Jersey_Meadowlands%2C_within_Kearny%2C_Hudson_County%2C_New_Jersey.jpg",
    tip: "tree with prominent pink-white flowers over a canopy shaped like an umbrella.",
    es: {
      name: "Mimosa",
      tip: "Árbol con flores rosadas-blancas prominentes sobre un dosel con forma de paraguas.",
    },
  },
  {
    name: "Shrub Lantana",
    scientificName: "Lantana camara",
    threatLevel: "Significant",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/ae/Starr_070221-4728_Lantana_montevidensis.jpg",
    tip: "red, orange, pink, or white densely packed flower clusters.",
    es: {
      name: "Lantana Arbustiva",
      tip: "Racimos de flores densamente agrupadas en rojo, naranja, rosa o blanco.",
    },
  },
  {
    name: "Boston Fern",
    scientificName: "Nephrolepis cordifolia",
    threatLevel: "Significant",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/3/30/Boston_Fern_(2873392811).png",
    tip: "potato-like growths on roots.",
    es: {
      name: "Helecho de Boston",
      tip: "Crecimientos tipo patata en las raíces.",
    },
  },
  {
    name: "Winged Yam",
    scientificName: "Dioscorea alata",
    threatLevel: "Significant",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/96/Dioscorea_balcanica_BotGardBln310505.jpg",
    tip: "rough brown growths growing along the leaves and stem.",
    es: {
      name: "Ñame Alado",
      tip: "Crecimientos marrones rugosos a lo largo de las hojas y el tallo.",
    },
  },
  {
    name: "Tropical Soda Apple",
    scientificName: "Solanum viarum",
    threatLevel: "Significant",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Solanum_viarum_fruit.jpg",
    tip: "spines growing along stem and fruits resembling miniature yellow or green watermelons.",
    es: {
      name: "Manzana Soda Tropical",
      tip: "Espinas a lo largo del tallo y frutos que parecen mini sandías amarillas o verdes.",
    },
  },
  {
    name: "Cogon Grass",
    scientificName: "Imperata cylindrica",
    threatLevel: "Significant",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/51/Imperata_cylindrica_tigaya_colony.jpg",
    tip: "large white cylindrical plumes appearing during the spring season.",
    es: {
      name: "Hierba Cogon",
      tip: "Grandes penachos cilíndricos blancos que aparecen durante la primavera.",
    },
  },
];

export const plantNames = plants.map((p) => p.name);
