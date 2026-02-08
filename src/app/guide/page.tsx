"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ThreatLevel = "Low" | "Moderate" | "Significant";

type Plant = {
  id: number;
  name: string;
  scientificName: string;
  picUrl: string;
  threatLevel: ThreatLevel;
  tip: string
};

const PLANTS: Plant[] = [
  {
    id: 1,
    name: "Air Potato",
    scientificName: "Dioscorea bulbifera",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/9b/Chinese_yam_-_air-potato_-_dioscorea_polystachya_IMG_8134.jpg",
    threatLevel: "Significant",
    tip: "pointed, heart-shaped leaves and bulbs growing on the vine."
  },
  {
    id: 2,
    name: "Coral Adicea",
    scientificName: "Ardisia Crenata",
    picUrl:
      "https://www.floridamuseum.ufl.edu/wp-content/uploads/sites/23/2017/03/Ardisia-crenata-mature-fruit.jpg",
    threatLevel: "Significant",
    tip: "wavy (crenate) leaves and small red berries."
  },
  {
    id: 3,
    name: "Spanish Gold",
    scientificName: "Sesbania Punicea",
    picUrl:
      "https://www.picturethisai.com/wiki-image/1080/215992612534845440.jpeg",
    threatLevel: "Low",
    tip: "dangling red-orange flowers. Their seed pods may make a rattling sound."
  },
  {
    id: 4,
    name: "Torpedo Grass",
    scientificName: "Panicum repens",
    picUrl: "https://fsus.ncbg.unc.edu/img/orig/jho/jho_01342f.jpg",
    threatLevel: "Significant",
    tip: "silver-green leaves with defined points."
  },
  {
    id: 5,
    name: "Wedelia",
    scientificName: "Wedelia Trilobata",
    picUrl:
      "https://apps.lucidcentral.org/pppw_v10/images/entities/wedelia_447/ronggy_sphagneticola_trilobata_in_singapore2017.jpg",
    threatLevel: "Moderate",
    tip: "flower heads resembling daisies and waxy, jagged leaves."
  },
  {
    id: 6,
    name: "Caeser's Weed",
    scientificName: "Urena Lobata",
    picUrl:
      "https://plant-directory.ifas.ufl.edu/site/assets/files/1163/urena_lobata_at_kadavoor.0x1800.jpg",
    threatLevel: "Low",
    tip: "pink-purple flowers and small burs covered in hooked bristles."
  },
  {
    id: 7,
    name: "Small Leaf Spiderwort",
    scientificName: "Tradescantia fluminensis",
    picUrl:
      "https://plant-directory.ifas.ufl.edu/site/assets/files/1157/tradescantia_fluminensis_flowers.0x1800.jpg",
    threatLevel: "Significant",
    tip: "white flowers with three petals on hairless green stems."
  },
  {
    id: 8,
    name: "Wild Taro",
    scientificName: "Colocasia esculenta",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/a5/Taimo_Okinawa.jpg",
    threatLevel: "Moderate",
    tip: "leaves attached at the underside rather than the edge. Stalks can be several feet tall."
  },
  {
    id: 9,
    name: "Japanese Climbing Fern",
    scientificName: "Lygodium japonicum",
    picUrl: "https://fsus.ncbg.unc.edu/img/orig/amc/amc_04402.jpg",
    threatLevel: "Significant",
    tip: "symmetrical, triangular leaflets."
  },
  {
    id: 10,
    name: "Chinese Tallow",
    scientificName: "Sapium sebiferum",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/13/UC_Davis_arboretum_-_Sapium_sebiferum.jpg",
    threatLevel: "Significant",
    tip: "wide heart shaped leaves with quickly tapering tips."
  },
  {
    id: 11,
    name: "Camphor",
    scientificName: "Cinnamomum camphora",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/ae/Cinnamomum_camphora20050314.jpg",
    threatLevel: "Significant",
    tip: "a distinct camphor smell from the twigs when crushed."
  },
  {
    id: 12,
    name: "Mimosa",
    scientificName: "Albizia julibrissin",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/c5/2018-07-08_11_10_27_Rosea_Mimosa_blossoms_along_the_ramp_from_southbound_Interstate_95_(New_Jersey_Turnpike_Eastern_Spur)_to_westbound_Interstate_280_(Essex_Freeway)_in_the_New_Jersey_Meadowlands%2C_within_Kearny%2C_Hudson_County%2C_New_Jersey.jpg",
    threatLevel: "Significant",
    tip: "tree with prominent pink-white flowers over a canopy shaped like an umbrella."
  },
  {
    id: 13,
    name: "Shrub Lantana",
    scientificName: "Lantana camara",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/ae/Starr_070221-4728_Lantana_montevidensis.jpg",
    threatLevel: "Significant",
    tip: "red, orange, pink, or white densely packed flower clusters."
  },
  {
    id: 14,
    name: "Boston Fern",
    scientificName: "Nephrolepis cordifolia",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/30/Boston_Fern_(2873392811).png",
    threatLevel: "Significant",
    tip: "potato-like growths on roots."
  },
  {
    id: 15,
    name: "Winged Yam",
    scientificName: "Dioscorea alata",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/96/Dioscorea_balcanica_BotGardBln310505.jpg",
    threatLevel: "Significant",
    tip: "rough brown growths growing along the leaves and stem."
  },
  {
    id: 16,
    name: "Tropical Soda Apple",
    scientificName: "Solanum viarum",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/ac/Solanum_viarum_fruit.jpg",
    threatLevel: "Significant",
    tip: "spines growing along stem and fruits resembling miniature yellow or green watermelons."
  },
  {
    id: 17,
    name: "Cogon Grass",
    scientificName: "Imperata cylindrica",
    picUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/51/Imperata_cylindrica_tigaya_colony.jpg",
    threatLevel: "Significant",
    tip: "large white cylindrical plumes appearing during the spring season."
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

function PlantCard({ plant }: { plant: Plant }) {
  const [src, setSrc] = useState(plant.picUrl);

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md transition">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={plant.name}
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
          onError={() => setSrc(FALLBACK_IMG)}
        />
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${threatBadgeClasses(
              plant.threatLevel
            )}`}
          >
            {plant.threatLevel} threat
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {plant.name}
            </h3>
            <p className="text-sm italic text-slate-600">{plant.scientificName}</p>
          </div>

          <div className="flex gap-2">
            <a
              href={plant.picUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              title="Open source image link"
            >
              Source
            </a>

            <Link
              href={`/submit?plant=${encodeURIComponent(plant.name)}`}
              className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              title={`Report a ${plant.name} sighting`}
            >
              Report
            </Link>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          Look for: {plant.tip}
        </p>
      </div>
    </div>
  );
}

export default function GuidePage() {
  const [query, setQuery] = useState("");
  const [threat, setThreat] = useState<"All" | ThreatLevel>("All");
  const [sort, setSort] = useState<"Threat" | "Name">("Threat");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const threatRank: Record<ThreatLevel, number> = {
      Low: 1,
      Moderate: 2,
      Significant: 3,
    };

    return PLANTS.filter((p) => {
      const matchesThreat = threat === "All" ? true : p.threatLevel === threat;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q);
      return matchesThreat && matchesQuery;
    }).sort((a, b) => {
      if (sort === "Name") return a.name.localeCompare(b.name);
      const d =
        (threatRank[b.threatLevel] ?? 0) - (threatRank[a.threatLevel] ?? 0);
      return d !== 0 ? d : a.name.localeCompare(b.name);
    });
  }, [query, threat, sort]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Alachua County Invasive Plant ID Guide
            </h1>
            <p className="mt-2 text-slate-600">
              Search by common or scientific name. Use the threat level to prioritize reporting.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:w-auto sm:min-w-[420px]">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search plants (e.g., air potato, Dioscorea)…"
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
                <option value="All">All threat levels</option>
                <option value="Significant">Significant</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="Threat">Sort: Threat</option>
                <option value="Name">Sort: Name</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-slate-600">
            Showing <b>{filtered.length}</b> of <b>{PLANTS.length}</b>
          </p>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PlantCard key={p.id} plant={p} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700">
              No matches. Try a different search term.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

