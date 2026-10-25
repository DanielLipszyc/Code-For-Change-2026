"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import type { Language } from "@/lib/translation";

type ThreatLevel = "Low" | "Moderate" | "Significant";

type Plant = {
  id: number;
  name: Record<Language, string>;
  scientificName: string;
  picUrl: string;
  threatLevel: Record<Language, string>;
  tip: Record<Language, string>;
};

const PLANTS: Plant[] = [
  {
    id: 1,
    name: { en: "Air Potato", es: "Papa del Aire", pt: "Cará-do-ar" },
    scientificName: "Dioscorea bulbifera",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Chinese_yam_-_air-potato_-_dioscorea_polystachya_IMG_8134.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "pointed, heart-shaped leaves and bulbs growing on the vine.", es: "Hojas puntiagudas en forma de corazón y bulbos creciendo en la enredadera.", pt: "Folhas pontudas em formato de coração e bulbos que crescem na trepadeira." },
  },
  {
    id: 2,
    name: { en: "Coral Adisia", es: "Adisia Coral", pt: "Ardísia-coral" },
    scientificName: "Ardisia crenata",
    picUrl: "https://www.floridamuseum.ufl.edu/wp-content/uploads/sites/23/2017/03/Ardisia-crenata-mature-fruit.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "wavy (crenate) leaves and small red berries.", es: "Hojas onduladas (crenadas) y pequeñas bayas rojas.", pt: "Folhas onduladas e pequenas bagas vermelhas." },
  },
  {
    id: 3,
    name: { en: "Spanish Gold", es: "Oro Español", pt: "Sesbânia-vermelha" },
    scientificName: "Sesbania punicea",
    picUrl: "https://www.picturethisai.com/wiki-image/1080/215992612534845440.jpeg",
    threatLevel: { en: "Low", es: "Baja", pt: "Baixa" },
    tip: { en: "dangling red-orange flowers. Their seed pods may make a rattling sound.", es: "Flores colgantes rojo-naranja. Sus vainas pueden hacer un sonido de traqueteo.", pt: "Flores pendentes vermelho-alaranjadas. As vagens podem fazer um som de chocalho." },
  },
  {
    id: 4,
    name: { en: "Torpedo Grass", es: "Hierba Torpedo", pt: "Capim-torpedo" },
    scientificName: "Panicum repens",
    picUrl: "https://fsus.ncbg.unc.edu/img/orig/jho/jho_01342f.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "silver-green leaves with defined points.", es: "Hojas verde plateadas con puntas definidas.", pt: "Folhas verde-prateadas com pontas bem definidas." },
  },
  {
    id: 5,
    name: { en: "Wedelia", es: "Wedelia", pt: "Vedélia" },
    scientificName: "Wedelia trilobata",
    picUrl: "https://apps.lucidcentral.org/pppw_v10/images/entities/wedelia_447/ronggy_sphagneticola_trilobata_in_singapore2017.jpg",
    threatLevel: { en: "Moderate", es: "Moderada", pt: "Moderada" },
    tip: { en: "flower heads resembling daisies and waxy, jagged leaves.", es: "Capítulos florales parecidos a margaritas y hojas cerosas y dentadas.", pt: "Flores parecidas a margaridas e folhas cerosas com bordas recortadas." },
  },
  {
    id: 6,
    name: { en: "Caesar's Weed", es: "Hierba de César", pt: "Malva-de-César" },
    scientificName: "Urena lobata",
    picUrl: "https://static.inaturalist.org/photos/163617275/large.jpeg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "pink-purple flowers and small burs covered in hooked bristles.", es: "Flores rosa-púrpura y pequeñas espinas cubiertas de cerdas ganchudas.", pt: "Flores rosa-arroxeadas e pequenos frutos cobertos por cerdas curvas." },
  },
  {
    id: 7,
    name: { en: "Small Leaf Spiderwort", es: "Tradescantia de hojas pequeñas", pt: "Trapoeraba-de-folhas-pequenas" },
    scientificName: "Tradescantia fluminensis",
    picUrl: "https://plant-directory.ifas.ufl.edu/site/assets/files/1157/tradescantia_fluminensis_flowers.0x1800.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "white flowers with three petals on hairless green stems.", es: "Flores blancas con tres pétalos sobre tallos verdes sin pelo.", pt: "Flores brancas com três pétalas em caules verdes sem pelos." },
  },
  {
    id: 8,
    name: { en: "Wild Taro", es: "Taro Silvestre", pt: "Taro-selvagem" },
    scientificName: "Colocasia esculenta",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Taimo_Okinawa.jpg",
    threatLevel: { en: "Moderate", es: "Moderada", pt: "Moderada" },
    tip: { en: "leaves attached at the underside rather than the edge. Stalks can be several feet tall.", es: "Hojas unidas por la parte inferior en lugar de por el borde. Los tallos pueden medir varios pies.", pt: "Folhas presas pela parte inferior, e não pela borda. Os caules podem atingir vários metros." },
  },
  {
    id: 9,
    name: { en: "Japanese Climbing Fern", es: "Helecho trepador japonés", pt: "Samambaia-trepadeira-japonesa" },
    scientificName: "Lygodium japonicum",
    picUrl: "https://fsus.ncbg.unc.edu/img/orig/amc/amc_04402.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "symmetrical, triangular leaflets.", es: "Foliolos simétricos y triangulares.", pt: "Folíolos simétricos e triangulares." },
  },
  {
    id: 10,
    name: { en: "Chinese Tallow", es: "Almacigo Chino", pt: "Árvore-de-sebo-chinesa" },
    scientificName: "Sapium sebiferum",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/6/66/ChineseTallowSeedpods.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "wide heart shaped leaves with quickly tapering tips.", es: "Hojas anchas en forma de corazón con puntas que se estrechan rápidamente.", pt: "Folhas largas em formato de coração com pontas que afinam rapidamente." },
  },
  {
    id: 11,
    name: { en: "Camphor", es: "Alcanfor", pt: "Cânfora" },
    scientificName: "Cinnamomum camphora",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Cinnamomum_camphora_Turramurra_railway.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "a distinct camphor smell from the twigs when crushed.", es: "Un olor a alcanfor distintivo de las ramitas al triturarlas.", pt: "Os ramos esmagados exalam um cheiro característico de cânfora." },
  },
  {
    id: 12,
    name: { en: "Mimosa", es: "Mimosa", pt: "Mimosa" },
    scientificName: "Albizia julibrissin",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c5/2018-07-08_11_10_27_Rosea_Mimosa_blossoms_along_the_ramp_from_southbound_Interstate_95_(New_Jersey_Turnpike_Eastern_Spur)_to_westbound_Interstate_280_(Essex_Freeway)_in_the_New_Jersey_Meadowlands%2C_within_Kearny%2C_Hudson_County%2C_New_Jersey.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "tree with prominent pink-white flowers over a canopy shaped like an umbrella.", es: "Árbol con flores rosadas-blancas prominentes sobre un dosel con forma de paraguas.", pt: "Árvore com flores rosa e brancas e copa em formato de guarda-chuva." },
  },
  {
    id: 13,
    name: { en: "Shrub Lantana", es: "Lantana Arbustiva", pt: "Lantana-arbustiva" },
    scientificName: "Lantana camara",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Starr_070221-4728_Lantana_montevidensis.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "red, orange, pink, or white densely packed flower clusters.", es: "Racimos de flores densamente agrupadas en rojo, naranja, rosa o blanco.", pt: "Cachos densos de flores vermelhas, laranjas, rosas ou brancas." },
  },
  {
    id: 14,
    name: { en: "Boston Fern", es: "Helecho de Boston", pt: "Samambaia-de-Boston" },
    scientificName: "Nephrolepis cordifolia",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/3/30/Boston_Fern_(2873392811).png",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "potato-like growths on roots.", es: "Crecimientos tipo patata en las raíces.", pt: "Estruturas semelhantes a batatas nas raízes." },
  },
  {
    id: 15,
    name: { en: "Winged Yam", es: "Ñame Alado", pt: "Inhame-alado" },
    scientificName: "Dioscorea alata",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/9/96/Dioscorea_balcanica_BotGardBln310505.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "rough brown growths growing along the leaves and stem.", es: "Crecimientos marrones rugosos a lo largo de las hojas y el tallo.", pt: "Crescimentos marrons e ásperos ao longo das folhas e do caule." },
  },
  {
    id: 16,
    name: { en: "Tropical Soda Apple", es: "Manzana Soda Tropical", pt: "Maçã-da-sodomia" },
    scientificName: "Solanum viarum",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Solanum_viarum_fruit.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "spines growing along stem and fruits resembling miniature yellow or green watermelons.", es: "Espinas a lo largo del tallo y frutos que parecen mini sandías amarillas o verdes.", pt: "Espinhos no caule e frutos parecidos com pequenas melancias amarelas ou verdes." },
  },
  {
    id: 17,
    name: { en: "Cogon Grass", es: "Hierba Cogon", pt: "Capim-cogon" },
    scientificName: "Imperata cylindrica",
    picUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/Imperata_cylindrica_tigaya_colony.jpg",
    threatLevel: { en: "Significant", es: "Significativa", pt: "Significativa" },
    tip: { en: "large white cylindrical plumes appearing during the spring season.", es: "Grandes penachos cilíndricos blancos que aparecen durante la primavera.", pt: "Grandes plumas cilíndricas brancas que surgem na primavera." },
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
  const { t } = useLanguage();
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
        aria-label={t("Close")}
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
            aria-label={t("Close")}
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
              {plant.threatLevel[lang]} {t("threat level")}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <h4 className="text-base font-bold text-slate-900">
              {t("Quick ID")}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              <span className="font-semibold text-slate-900">
              {t("Look for:")}
              </span>{" "}
              {plant.tip[lang]}
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("Why it matters")}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {t("Invasive plants can spread quickly, outcompete native species, and impact local ecosystems. Reporting helps prioritize removals and protect habitats.")}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("What to do if you find it")}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  <li>
                    {t("Take a clear photo (leaves + stem/flowers/fruit if possible).")}
                  </li>
                  <li>
                      {t("Note the location (trail name, nearest landmark, or address).")}
                  </li>
                  <li>
                     {t("Avoid spreading seeds/fragments on shoes or tools.")}
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/submit?plant=${encodeURIComponent(plant.name[lang])}`}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  onClick={onClose}
                >
                  {t("Report this plant")}
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
  const { t } = useLanguage();
  const [src, setSrc] = useState(plant.picUrl);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenInfo(plant)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenInfo(plant)}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
      title={t("View info about {plant}", { plant: plant.name[lang] })}
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
            {plant.threatLevel[lang]} {t("threat level")}
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
  const { language: lang, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [threat, setThreat] = useState<"All" | ThreatLevel>("All");
  const [sort, setSort] = useState<"Threat" | "Name">("Threat");
  const [activePlant, setActivePlant] = useState<Plant | null>(null);
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
        p.name[lang].toLowerCase().includes(q) ||
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
        {/* Header + Controls */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {t("Alachua County Invasive Plant ID Guide")}
            </h1>
            <p className="mt-2 text-slate-600">
              {t("Search by common or scientific name. Use the threat level to prioritize reporting.")}
            </p>
          </div>

          {/* Controls */}
          <div className="grid w-full gap-3 sm:w-auto sm:min-w-[420px]">
            <div className="flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search plants (e.g., air potato, Dioscorea)…")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>
            </div>

            <div className="flex gap-3">
              <select
                value={threat}
                onChange={(e) => setThreat(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="All">{t("All threat levels")}</option>
                <option value="Significant">{t("Significant")}</option>
                <option value="Moderate">{t("Moderate")}</option>
                <option value="Low">{t("Low")}</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="Threat">{t("Sort: Threat")}</option>
                <option value="Name">{t("Sort: Name")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Plant list */}
        <div className="mt-8">
          <p className="text-sm text-slate-600">
            {t("Showing {shown} of {total}", { shown: filtered.length, total: PLANTS.length })}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PlantCard key={p.id} plant={p} onOpenInfo={setActivePlant} lang={lang} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700">
              {t("No matches. Try a different search term.")}
            </div>
          )}
        </div>
      </div>

      {activePlant && <InfoModal plant={activePlant} onClose={() => setActivePlant(null)} lang={lang} />}
    </div>
  );
}