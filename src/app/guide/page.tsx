"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { translations } from "@/lib/translation";

type ThreatLevel = "Low" | "Moderate" | "Significant";
type Language = "en" | "es";

type Plant = {
  id: number;
  name: Record<Language, string>;
  scientificName: string;
  picUrl: string;
  threatLevel: Record<"en", ThreatLevel> & Record<"es", string>; 
  tip: Record<Language, string>;
};

const PLANTS: Plant[] = [
  {
    id: 1,
    name: { en: "Air Potato", es: "Papa del Aire" },
    scientificName: "Dioscorea bulbifera",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Chinese_yam_-_air-potato_-_dioscorea_polystachya_IMG_8134.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "pointed, heart-shaped leaves and bulbs growing on the vine.", es: "Hojas puntiagudas en forma de corazón y bulbos creciendo en la enredadera." },
  },
  {
    id: 2,
    name: { en: "Coral Adisia", es: "Adisia Coral" },
    scientificName: "Ardisia crenata",
    picUrl: "https://www.floridamuseum.ufl.edu/wp-content/uploads/sites/23/2017/03/Ardisia-crenata-mature-fruit.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "wavy (crenate) leaves and small red berries.", es: "Hojas onduladas (crenadas) y pequeñas bayas rojas." },
  },
  {
    id: 3,
    name: { en: "Spanish Gold", es: "Oro Español" },
    scientificName: "Sesbania punicea",
    picUrl: "https://www.picturethisai.com/wiki-image/1080/215992612534845440.jpeg",
    threatLevel: { en: "Low", es: "Baja" },
    tip: { en: "dangling red-orange flowers. Their seed pods may make a rattling sound.", es: "Flores colgantes rojo-naranja. Sus vainas pueden hacer un sonido de traqueteo." },
  },
  {
    id: 4,
    name: { en: "Torpedo Grass", es: "Hierba Torpedo" },
    scientificName: "Panicum repens",
    picUrl: "https://fsus.ncbg.unc.edu/img/orig/jho/jho_01342f.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "silver-green leaves with defined points.", es: "Hojas verde plateadas con puntas definidas." },
  },
  {
    id: 5,
    name: { en: "Wedelia", es: "Wedelia" },
    scientificName: "Wedelia trilobata",
    picUrl: "https://apps.lucidcentral.org/pppw_v10/images/entities/wedelia_447/ronggy_sphagneticola_trilobata_in_singapore2017.jpg",
    threatLevel: { en: "Moderate", es: "Moderada" },
    tip: { en: "flower heads resembling daisies and waxy, jagged leaves.", es: "Capítulos florales parecidos a margaritas y hojas cerosas y dentadas." },
  },
  {
    id: 6,
    name: { en: "Caesar's Weed", es: "Hierba de César" },
    scientificName: "Urena lobata",
    picUrl: "https://static.inaturalist.org/photos/163617275/large.jpeg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "pink-purple flowers and small burs covered in hooked bristles.", es: "Flores rosa-púrpura y pequeñas espinas cubiertas de cerdas ganchudas." },
  },
  {
    id: 7,
    name: { en: "Small Leaf Spiderwort", es: "Tradescantia de hojas pequeñas" },
    scientificName: "Tradescantia fluminensis",
    picUrl: "https://plant-directory.ifas.ufl.edu/site/assets/files/1157/tradescantia_fluminensis_flowers.0x1800.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "white flowers with three petals on hairless green stems.", es: "Flores blancas con tres pétalos sobre tallos verdes sin pelo." },
  },
  {
    id: 8,
    name: { en: "Wild Taro", es: "Taro Silvestre" },
    scientificName: "Colocasia esculenta",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Taimo_Okinawa.jpg",
    threatLevel: { en: "Moderate", es: "Moderada" },
    tip: { en: "leaves attached at the underside rather than the edge. Stalks can be several feet tall.", es: "Hojas unidas por la parte inferior en lugar de por el borde. Los tallos pueden medir varios pies." },
  },
  {
    id: 9,
    name: { en: "Japanese Climbing Fern", es: "Helecho trepador japonés" },
    scientificName: "Lygodium japonicum",
    picUrl: "https://fsus.ncbg.unc.edu/img/orig/amc/amc_04402.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "symmetrical, triangular leaflets.", es: "Foliolos simétricos y triangulares." },
  },
  {
    id: 10,
    name: { en: "Chinese Tallow", es: "Almacigo Chino" },
    scientificName: "Sapium sebiferum",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/6/66/ChineseTallowSeedpods.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "wide heart shaped leaves with quickly tapering tips.", es: "Hojas anchas en forma de corazón con puntas que se estrechan rápidamente." },
  },
  {
    id: 11,
    name: { en: "Camphor", es: "Alcanfor" },
    scientificName: "Cinnamomum camphora",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Cinnamomum_camphora_Turramurra_railway.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "a distinct camphor smell from the twigs when crushed.", es: "Un olor a alcanfor distintivo de las ramitas al triturarlas." },
  },
  {
    id: 12,
    name: { en: "Mimosa", es: "Mimosa" },
    scientificName: "Albizia julibrissin",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c5/2018-07-08_11_10_27_Rosea_Mimosa_blossoms_along_the_ramp_from_southbound_Interstate_95_(New_Jersey_Turnpike_Eastern_Spur)_to_westbound_Interstate_280_(Essex_Freeway)_in_the_New_Jersey_Meadowlands%2C_within_Kearny%2C_Hudson_County%2C_New_Jersey.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "tree with prominent pink-white flowers over a canopy shaped like an umbrella.", es: "Árbol con flores rosadas-blancas prominentes sobre un dosel con forma de paraguas." },
  },
  {
    id: 13,
    name: { en: "Shrub Lantana", es: "Lantana Arbustiva" },
    scientificName: "Lantana camara",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Starr_070221-4728_Lantana_montevidensis.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "red, orange, pink, or white densely packed flower clusters.", es: "Racimos de flores densamente agrupadas en rojo, naranja, rosa o blanco." },
  },
  {
    id: 14,
    name: { en: "Boston Fern", es: "Helecho de Boston" },
    scientificName: "Nephrolepis cordifolia",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/3/30/Boston_Fern_(2873392811).png",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "potato-like growths on roots.", es: "Crecimientos tipo patata en las raíces." },
  },
  {
    id: 15,
    name: { en: "Winged Yam", es: "Ñame Alado" },
    scientificName: "Dioscorea alata",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/9/96/Dioscorea_balcanica_BotGardBln310505.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "rough brown growths growing along the leaves and stem.", es: "Crecimientos marrones rugosos a lo largo de las hojas y el tallo." },
  },
  {
    id: 16,
    name: { en: "Tropical Soda Apple", es: "Manzana Soda Tropical" },
    scientificName: "Solanum viarum",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Solanum_viarum_fruit.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "spines growing along stem and fruits resembling miniature yellow or green watermelons.", es: "Espinas a lo largo del tallo y frutos que parecen mini sandías amarillas o verdes." },
  },
  {
    id: 17,
    name: { en: "Cogon Grass", es: "Hierba Cogon" },
    scientificName: "Imperata cylindrica",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/Imperata_cylindrica_tigaya_colony.jpg",
    threatLevel: { en: "Significant", es: "Significativa" },
    tip: { en: "large white cylindrical plumes appearing during the spring season.", es: "Grandes penachos cilíndricos blancos que aparecen durante la primavera." },
  },
];

function threatBadgeClasses(level: ThreatLevel) {
  switch (level) {
    case "Low":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Moderate":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "Significant":
      return "bg-rose-50 text-rose-800 ring-rose-200";
  }
}

function threatDotClasses(level: ThreatLevel) {
  switch (level) {
    case "Low":
      return "bg-emerald-500";
    case "Moderate":
      return "bg-amber-500";
    case "Significant":
      return "bg-rose-500";
  }
}

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0" stop-color="#eef2ff"/>
        <stop offset="1" stop-color="#ecfdf5"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="50%" font-family="system-ui, -apple-system, Segoe UI" font-size="28" fill="#334155" text-anchor="middle">
      Image unavailable
    </text>
  </svg>
`);

function InfoModal({
  plant,
  onClose,
  lang,
}: {
  plant: Plant;
  onClose: () => void;
  lang: Language;
}) {
  const [src, setSrc] = useState(plant.picUrl);
  const levelEn = plant.threatLevel.en as ThreatLevel || "Low";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{plant.name[lang]}</p>
            <p className="truncate text-xs italic text-slate-600">{plant.scientificName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="grid sm:grid-cols-2">
          <div className="relative bg-slate-100">
            <div className="relative aspect-[16/11] sm:aspect-auto sm:h-full">
              <img
                src={src}
                alt={plant.name[lang]}
                className="h-full w-full object-cover"
                onError={() => setSrc(FALLBACK_IMG)}
              />
            </div>

            <div className="absolute left-4 top-4">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${threatBadgeClasses(
                  plant.threatLevel.en as ThreatLevel
                )}`}
              >
                <span className={`h-2 w-2 rounded-full ${threatDotClasses(plant.threatLevel.en as ThreatLevel)}`} />
              {plant.threatLevel[lang as keyof typeof plant.threatLevel]} {translations[lang as Language]?.guide?.threatLevel ?? "Threat level"}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <h4 className="text-base font-bold text-slate-900">
              {translations[lang]?.guide?.quickId ?? (lang === "en" ? "Quick ID" : "Identificación rápida")}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              <span className="font-semibold text-slate-900">
              {translations[lang]?.guide?.tip ?? (lang === "en" ? "Look for:" : "Identificar por:")}
              </span>{" "}
              {plant.tip[lang]}
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {translations[lang]?.guide?.whyItMattersTitle ?? (lang === "en" ? "Why it matters" : "Por qué importa")}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {translations[lang]?.guide?.whyItMattersBody ?? (lang === "en" ? "Invasive plants can spread quickly, outcompete native species, and impact local ecosystems. Reporting helps prioritize removals and protect habitats." : "Las plantas invasoras pueden propagarse rápidamente, superar a las especies nativas y afectar los ecosistemas locales. Reportar ayuda a priorizar la eliminación y proteger los hábitats.")}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {translations[lang]?.guide?.whatToDoTitle ?? (lang === "en" ? "What to do if you find it" : "Qué hacer si la encuentra")}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  <li>
                    {translations[lang]?.guide?.photoTip ?? (lang === "en" ? "Take a clear photo (leaves + stem/flowers/fruit if possible)." : "Tome una foto clara (hojas + tallo/flores/fruta si es posible).")}
                  </li>
                  <li>
                      {translations[lang]?.guide?.locationTip ?? (lang === "en" ? "Note the location (trail name, nearest landmark, or address)." : "Anote la ubicación (nombre del sendero, punto de referencia más cercano o dirección).")}
                  </li>
                  <li>
                     {translations[lang]?.guide?.avoidSpreading ?? (lang === "en" ? "Avoid spreading seeds/fragments on shoes or tools." : "Evite propagar semillas o fragmentos en zapatos o herramientas.")}
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/submit?plant=${encodeURIComponent(plant.name[lang])}`}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  onClick={onClose}
                >
                  {translations[lang]?.guide?.reportButton ?? (lang === "en" ? "Report this plant" : "Reportar esta planta")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlantCard({
  plant,
  onOpenInfo,
  lang,
}: {
  plant: Plant;
  onOpenInfo: (plant: Plant) => void;
  lang: Language;
}) {
  const [src, setSrc] = useState(plant.picUrl);
  console.log("lang:", lang);
  console.log("translations[lang]:", translations[lang]);


  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenInfo(plant)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenInfo(plant)}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
      title={`View info about ${plant.name[lang]}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={src}
          alt={plant.name[lang]}
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
          onError={() => setSrc(FALLBACK_IMG)}
        />
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${threatBadgeClasses(
              plant.threatLevel.en as ThreatLevel
            )}`}
          >
            {plant.threatLevel[lang]} {translations[lang as Language]?.guide?.threatLevel ?? "Threat level"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{plant.name[lang]}</h3>
            <p className="text-sm italic text-slate-600">{plant.scientificName}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">{plant.tip[lang]}</p>
      </div>
    </div>
  );
}

export default function GuidePage() {
  const [query, setQuery] = useState("");
  const [threat, setThreat] = useState<"All" | ThreatLevel>("All");
  const [sort, setSort] = useState<"Threat" | "Name">("Threat");
  const [activePlant, setActivePlant] = useState<Plant | null>(null);
  const [lang, setLang] = useState<Language>("en");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const threatRank: Record<ThreatLevel, number> = {
      Low: 1,
      Moderate: 2,
      Significant: 3,
    };

    return PLANTS.filter((p) => {
      const matchesThreat = threat === "All" ? true : p.threatLevel.en === threat;
      const matchesQuery =
        !q ||
        p.name.en.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q);
      return matchesThreat && matchesQuery;
    }).sort((a, b) => {
      if (sort === "Name") return a.name[lang].localeCompare(b.name[lang]);
      const d =
        (threatRank[b.threatLevel.en as ThreatLevel] ?? 0) -
        (threatRank[a.threatLevel.en as ThreatLevel] ?? 0);
      return d !== 0 ? d : a.name[lang].localeCompare(b.name[lang]);
    });
  }, [query, threat, sort, lang]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex justify-end mb-4">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          {lang === "en"
            ? "Alachua County Invasive Plant ID Guide"
            : "Guía de Identificación de Plantas Invasoras del Condado de Alachua"}
        </h1>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PlantCard key={p.id} plant={p} onOpenInfo={setActivePlant} lang={lang} />
          ))}
        </div>

        {activePlant && <InfoModal plant={activePlant} onClose={() => setActivePlant(null)} lang={lang} />}
      </div>
    </div>
  );
}