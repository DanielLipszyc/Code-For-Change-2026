"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { plants, type Plant, type ThreatLevel } from "@/data/plants";
import { translations } from "@/lib/translation";

type Language = "en" | "es";

const THREAT_LABELS: Record<ThreatLevel, Record<Language, string>> = {
  Low: { en: "Low", es: "Baja" },
  Moderate: { en: "Moderate", es: "Moderada" },
  Significant: { en: "Significant", es: "Significativa" },
};

/** The plant name and tip in the chosen language */
function localize(plant: Plant, lang: Language) {
  return lang === "es" ? plant.es : { name: plant.name, tip: plant.tip };
}

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
  const { name, tip } = localize(plant, lang);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
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
              {/* eslint-disable-next-line @next/next/no-img-element -- plant photos come from many outside sites */}
              <img
                src={src}
                alt={name}
                className="h-full w-full object-cover"
                onError={() => setSrc(FALLBACK_IMG)}
              />
            </div>

            <div className="absolute left-4 top-4">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${threatBadgeClasses(
                  plant.threatLevel,
                )}`}
              >
                <span className={`h-2 w-2 rounded-full ${threatDotClasses(plant.threatLevel)}`} />
                {THREAT_LABELS[plant.threatLevel][lang]}{" "}
                {translations[lang as Language]?.guide?.threatLevel ?? "Threat level"}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <h4 className="text-base font-bold text-slate-900">
              {translations[lang]?.guide?.quickId ??
                (lang === "en" ? "Quick ID" : "Identificación rápida")}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              <span className="font-semibold text-slate-900">
                {translations[lang]?.guide?.tip ??
                  (lang === "en" ? "Look for:" : "Identificar por:")}
              </span>{" "}
              {tip}
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {translations[lang]?.guide?.whyItMattersTitle ??
                    (lang === "en" ? "Why it matters" : "Por qué importa")}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {translations[lang]?.guide?.whyItMattersBody ??
                    (lang === "en"
                      ? "Invasive plants can spread quickly, outcompete native species, and impact local ecosystems. Reporting helps prioritize removals and protect habitats."
                      : "Las plantas invasoras pueden propagarse rápidamente, superar a las especies nativas y afectar los ecosistemas locales. Reportar ayuda a priorizar la eliminación y proteger los hábitats.")}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {translations[lang]?.guide?.whatToDoTitle ??
                    (lang === "en" ? "What to do if you find it" : "Qué hacer si la encuentra")}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  <li>
                    {translations[lang]?.guide?.photoTip ??
                      (lang === "en"
                        ? "Take a clear photo (leaves + stem/flowers/fruit if possible)."
                        : "Tome una foto clara (hojas + tallo/flores/fruta si es posible).")}
                  </li>
                  <li>
                    {translations[lang]?.guide?.locationTip ??
                      (lang === "en"
                        ? "Note the location (trail name, nearest landmark, or address)."
                        : "Anote la ubicación (nombre del sendero, punto de referencia más cercano o dirección).")}
                  </li>
                  <li>
                    {translations[lang]?.guide?.avoidSpreading ??
                      (lang === "en"
                        ? "Avoid spreading seeds/fragments on shoes or tools."
                        : "Evite propagar semillas o fragmentos en zapatos o herramientas.")}
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/submit?plant=${encodeURIComponent(plant.name)}`}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  onClick={onClose}
                >
                  {translations[lang]?.guide?.reportButton ??
                    (lang === "en" ? "Report this plant" : "Reportar esta planta")}
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
  const { name, tip } = localize(plant, lang);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenInfo(plant)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenInfo(plant)}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
      title={`View info about ${name}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- plant photos come from many outside sites */}
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
          onError={() => setSrc(FALLBACK_IMG)}
        />
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${threatBadgeClasses(
              plant.threatLevel,
            )}`}
          >
            {THREAT_LABELS[plant.threatLevel][lang]}{" "}
            {translations[lang as Language]?.guide?.threatLevel ?? "Threat level"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{name}</h3>
            <p className="text-sm italic text-slate-600">{plant.scientificName}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">{tip}</p>
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

    return plants
      .filter((p) => {
        const matchesThreat = threat === "All" ? true : p.threatLevel === threat;
        const matchesQuery =
          !q ||
          [p.name, p.es.name, p.scientificName].some((text) => text.toLowerCase().includes(q));
        return matchesThreat && matchesQuery;
      })
      .sort((a, b) => {
        if (sort === "Name") return localize(a, lang).name.localeCompare(localize(b, lang).name);
        const d = (threatRank[b.threatLevel] ?? 0) - (threatRank[a.threatLevel] ?? 0);
        return d !== 0 ? d : localize(a, lang).name.localeCompare(localize(b, lang).name);
      });
  }, [query, threat, sort, lang]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header + Controls */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {lang === "en"
                ? "Alachua County Invasive Plant ID Guide"
                : "Guía de Identificación de Plantas Invasoras del Condado de Alachua"}
            </h1>
            <p className="mt-2 text-slate-600">
              {lang === "en"
                ? "Search by common or scientific name. Use the threat level to prioritize reporting."
                : "Busca por nombre común o científico. Usa el nivel de amenaza para priorizar la notificación."}
            </p>
          </div>

          {/* Controls */}
          <div className="grid w-full gap-3 sm:w-auto sm:min-w-[420px]">
            <div className="flex gap-3">
              {/* Language selector on the left */}
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                aria-label={lang === "en" ? "Language" : "Idioma"}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={lang === "en" ? "Search plants" : "Buscar plantas"}
                placeholder={
                  lang === "en"
                    ? "Search plants (e.g., air potato, Dioscorea)…"
                    : "Buscar plantas (ej., air potato, Dioscorea)…"
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>
            </div>

            <div className="flex gap-3">
              <select
                value={threat}
                onChange={(e) => setThreat(e.target.value as "All" | ThreatLevel)}
                aria-label={lang === "en" ? "Threat level" : "Nivel de amenaza"}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="All">
                  {lang === "en" ? "All threat levels" : "Todos los niveles"}
                </option>
                <option value="Significant">
                  {lang === "en" ? "Significant" : "Significativa"}
                </option>
                <option value="Moderate">{lang === "en" ? "Moderate" : "Moderada"}</option>
                <option value="Low">{lang === "en" ? "Low" : "Baja"}</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "Threat" | "Name")}
                aria-label={lang === "en" ? "Sort by" : "Ordenar por"}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="Threat">{lang === "en" ? "Sort: Threat" : "Orden: Amenaza"}</option>
                <option value="Name">{lang === "en" ? "Sort: Name" : "Orden: Nombre"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Plant list */}
        <div className="mt-8">
          <p className="text-sm text-slate-600">
            {lang === "en"
              ? `Showing ${filtered.length} of ${plants.length}`
              : `Mostrando ${filtered.length} de ${plants.length}`}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PlantCard key={p.name} plant={p} onOpenInfo={setActivePlant} lang={lang} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700">
              {lang === "en"
                ? "No matches. Try a different search term."
                : "No hay resultados. Intenta otra búsqueda."}
            </div>
          )}
        </div>
      </div>

      {activePlant && (
        <InfoModal plant={activePlant} onClose={() => setActivePlant(null)} lang={lang} />
      )}
    </div>
  );
}
