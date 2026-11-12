"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { localizePlant, type Plant, type ThreatLevel } from "@/types/plant";
import PlantImageCarousel from "@/components/guide/PlantImageCarousel";
import { useLanguage } from "@/components/LanguageProvider";
import type { UiLanguage } from "@/lib/uiTranslations";

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

// Display only characteristics actually recorded in the plant catalog.
// This uses the JSONB-backed PlantFeatures fields, including reproductive_structure.
const FEATURE_GROUPS = [
  { key: "leaf", label: "Leaves" },
  { key: "flower", label: "Flowers" },
  { key: "reproductive_structure", label: "Reproductive structures" },
  { key: "form", label: "Growth form" },
] as const;

const FEATURE_LABELS: Record<string, string> = {
  shape: "Shape",
  margin: "Margin",
  arrangement: "Arrangement",
  venation: "Venation",
  texture: "Texture",
  color: "Color",
  petal_count: "Petal count",
  inflorescence: "Inflorescence",
  season: "Season",
  type: "Type",
  surface: "Surface",
  dispersal: "Dispersal",
  growth_habit: "Growth habit",
  height_m: "Height (m)",
  stem_type: "Stem type",
  habitat: "Habitat",
  notes: "Notes",
};

type FeatureGroupKey = (typeof FEATURE_GROUPS)[number]["key"];
type FeatureItem = { group: FeatureGroupKey; label: string; value: string };

function getPlantFeatureItems(plant: Plant): FeatureItem[] {
  return FEATURE_GROUPS.flatMap(({ key: group }) => {
    const features = plant[group];
    if (!features) return [];

    return Object.entries(features).flatMap(([attribute, rawValue]) => {
      const value = Array.isArray(rawValue)
        ? rawValue
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .join(", ")
        : typeof rawValue === "number"
          ? String(rawValue)
          : typeof rawValue === "string"
            ? rawValue.trim()
            : "";

      if (!value) return [];
      return [{ group, label: FEATURE_LABELS[attribute] ?? attribute.replace(/_/g, " "), value }];
    });
  });
}

function PlantFeatureDetails({ plant }: { plant: Plant }) {
  const { t } = useLanguage();
  const items = getPlantFeatureItems(plant);
  if (items.length === 0) return null;

  return (
    <section className="mt-5" aria-label={t("Identifying characteristics")}>
      <h4 className="text-base font-bold text-slate-900">{t("Identifying characteristics")}</h4>
      <div className="mt-3 grid gap-3">
        {FEATURE_GROUPS.map(({ key, label }) => {
          const groupItems = items.filter((item) => item.group === key);
          if (groupItems.length === 0) return null;
          return (
            <details key={key} className="group rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-emerald-800 [&::-webkit-details-marker]:hidden">
                {t(label)}
                <span aria-hidden="true" className="text-base transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <dl className="mt-3 space-y-1.5 border-t border-emerald-100 pt-3">
                {groupItems.map((item) => (
                  <div key={`${key}-${item.label}`} className="text-sm text-slate-700">
                    <dt className="inline font-semibold text-slate-900">{t(item.label)}: </dt>
                    <dd className="inline">
                      {item.value
                        .split(", ")
                        .map((value) => t(value))
                        .join(", ")}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          );
        })}
      </div>
    </section>
  );
}

// Filter against the existing JSONB-backed plant catalog. Each selected
// characteristic must match; an unknown/unrecorded value never counts as a match.
const LOOKUP_FIELDS = [
  { group: "leaf", key: "shape", label: "Leaf shape" },
  { group: "leaf", key: "margin", label: "Leaf margin" },
  { group: "leaf", key: "arrangement", label: "Leaf arrangement" },
  { group: "leaf", key: "venation", label: "Leaf venation" },
  { group: "leaf", key: "texture", label: "Leaf texture" },
  { group: "flower", key: "color", label: "Flower color" },
  { group: "flower", key: "shape", label: "Flower shape" },
  { group: "flower", key: "inflorescence", label: "Flower arrangement" },
  { group: "flower", key: "season", label: "Flowering season" },
  { group: "reproductive_structure", key: "type", label: "Reproductive structure type" },
  { group: "reproductive_structure", key: "color", label: "Reproductive structure color" },
  { group: "reproductive_structure", key: "shape", label: "Reproductive structure shape" },
  { group: "reproductive_structure", key: "surface", label: "Reproductive structure surface" },
  { group: "form", key: "growth_habit", label: "Growth habit" },
  { group: "form", key: "stem_type", label: "Stem type" },
  { group: "form", key: "habitat", label: "Habitat" },
] as const;

type LookupField = (typeof LOOKUP_FIELDS)[number];
type LookupFieldId = `${LookupField["group"]}.${LookupField["key"]}`;
type FeatureFilters = Partial<Record<LookupFieldId, string>>;

function fieldId(field: LookupField): LookupFieldId {
  return `${field.group}.${field.key}`;
}

function fieldValues(plant: Plant, field: LookupField): string[] {
  // PlantFeatures has distinct object shapes, so index through a narrow
  // runtime record rather than assuming every group supports every key.
  const group: unknown = plant[field.group];
  if (!group || typeof group !== "object") return [];
  const value = (group as Record<string, unknown>)[field.key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && !!item.trim());
  }
  return typeof value === "string" && value.trim() ? [value] : [];
}

function normalizeFeature(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function matchesFeatures(plant: Plant, filters: FeatureFilters): boolean {
  return LOOKUP_FIELDS.every((field) => {
    const selected = filters[fieldId(field)];
    return (
      !selected ||
      fieldValues(plant, field).some(
        (value) => normalizeFeature(value) === normalizeFeature(selected),
      )
    );
  });
}

function FeatureLookup({
  plants,
  filters,
  onChange,
  onClear,
}: {
  plants: Plant[];
  filters: FeatureFilters;
  onChange: (field: LookupFieldId, value: string) => void;
  onClear: () => void;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const options = useMemo(() => {
    const result = {} as Record<LookupFieldId, string[]>;
    for (const field of LOOKUP_FIELDS) {
      const values = new Map<string, string>();
      for (const plant of plants) {
        for (const value of fieldValues(plant, field)) {
          const normalized = normalizeFeature(value);
          if (normalized && !values.has(normalized)) values.set(normalized, value.trim());
        }
      }
      result[fieldId(field)] = [...values.values()].sort((a, b) => a.localeCompare(b));
    }
    return result;
  }, [plants]);

  const activeCount = Object.values(filters).filter(Boolean).length;
  const availableFields = LOOKUP_FIELDS.filter((field) => options[fieldId(field)].length > 0);

  return (
    <section
      className="mt-7 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5"
      aria-label={t("Find plants by characteristics")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t("Find plants by features")}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {t("Choose the characteristics you observe. All selected features must match.")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls="plant-feature-filters"
          className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {expanded ? t("Hide feature filters") : t("Browse by features")}
          {activeCount ? ` (${activeCount})` : ""}
        </button>
      </div>

      {activeCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {LOOKUP_FIELDS.filter((field) => filters[fieldId(field)]).map((field) => (
            <button
              key={fieldId(field)}
              type="button"
              onClick={() => onChange(fieldId(field), "")}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"
              aria-label={t("Remove {feature} filter", { feature: t(field.label) })}
            >
              {t(field.label)}: {t(filters[fieldId(field)] ?? "")} ×
            </button>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-semibold text-slate-600 underline hover:text-slate-900"
          >
            {t("Clear features")}
          </button>
        </div>
      )}

      {expanded && (
        <div id="plant-feature-filters" className="mt-5">
          {availableFields.length === 0 ? (
            <p className="text-sm text-slate-600">
              {t("No plant characteristics have been recorded yet.")}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableFields.map((field) => (
                <label key={fieldId(field)} className="block text-sm font-medium text-slate-700">
                  {t(field.label)}
                  <select
                    value={filters[fieldId(field)] ?? ""}
                    onChange={(event) => onChange(fieldId(field), event.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">{t("Any / not sure")}</option>
                    {options[fieldId(field)].map((option) => (
                      <option key={normalizeFeature(option)} value={option}>
                        {t(option)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function InfoModal({
  plant,
  onClose,
  lang,
}: {
  plant: Plant;
  onClose: () => void;
  lang: UiLanguage;
}) {
  const { t } = useLanguage();
  const { name, tip } = localizePlant(plant, lang);

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
        aria-label={t("Close")}
      />
      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
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

        <div className="min-h-0 overflow-y-auto overscroll-contain sm:grid sm:grid-cols-2">
          <div className="relative min-h-[320px] bg-slate-100 sm:min-h-[420px] sm:self-stretch">
            <PlantImageCarousel images={plant.images} name={name} thumbnail={plant.picUrl} />

            <div className="absolute left-4 top-4">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${threatBadgeClasses(
                  plant.threatLevel,
                )}`}
              >
                <span className={`h-2 w-2 rounded-full ${threatDotClasses(plant.threatLevel)}`} />
                {t(plant.threatLevel)} {t("threat level")}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <h4 className="text-base font-bold text-slate-900">{t("Quick ID")}</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              <span className="font-semibold text-slate-900">{t("Look for:")}</span> {tip}
            </p>

            <PlantFeatureDetails plant={plant} />

            <div className="mt-5 grid gap-3">
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/submit?plant=${encodeURIComponent(plant.name)}`}
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
  lang: UiLanguage;
}) {
  const { t } = useLanguage();
  const [src, setSrc] = useState(plant.picUrl ?? FALLBACK_IMG);
  const { name, tip } = localizePlant(plant, lang);

  return (
    <button
      type="button"
      onClick={() => onOpenInfo(plant)}
      className="group block w-full cursor-pointer overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
      aria-label={t("View info about {plant}", { plant: name })}
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
            {t(plant.threatLevel)} {t("threat level")}
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
    </button>
  );
}

export default function GuideClient({ plants }: { plants: Plant[] }) {
  const [query, setQuery] = useState("");
  const [threat, setThreat] = useState<"All" | ThreatLevel>("All");
  const [sort, setSort] = useState<"Threat" | "Name">("Threat");
  const [featureFilters, setFeatureFilters] = useState<FeatureFilters>({});
  const [activePlant, setActivePlant] = useState<Plant | null>(null);
  const { language: lang, t } = useLanguage();

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
          [p.name, p.es.name, p.pt.name, p.scientificName].some((text) =>
            text.toLowerCase().includes(q),
          );
        return matchesThreat && matchesQuery && matchesFeatures(p, featureFilters);
      })
      .sort((a, b) => {
        if (sort === "Name")
          return localizePlant(a, lang).name.localeCompare(localizePlant(b, lang).name);
        const d = (threatRank[b.threatLevel] ?? 0) - (threatRank[a.threatLevel] ?? 0);
        return d !== 0 ? d : localizePlant(a, lang).name.localeCompare(localizePlant(b, lang).name);
      });
  }, [query, threat, sort, lang, plants, featureFilters]);

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
              {t(
                "Search by common or scientific name. Use the threat level to prioritize reporting.",
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="grid w-full gap-3 sm:w-auto sm:min-w-[420px]">
            <div className="flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t("Search plants")}
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
                onChange={(e) => setThreat(e.target.value as "All" | ThreatLevel)}
                aria-label={t("Threat level")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="All">{t("All threats")}</option>
                <option value="Significant">{t("Significant")}</option>
                <option value="Moderate">{t("Moderate")}</option>
                <option value="Low">{t("Low")}</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "Threat" | "Name")}
                aria-label={t("Sort by")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="Threat">{t("Sort by threat")}</option>
                <option value="Name">{t("Sort by name")}</option>
              </select>
            </div>
          </div>
        </div>

        <FeatureLookup
          plants={plants}
          filters={featureFilters}
          onChange={(field, value) =>
            setFeatureFilters((current) => {
              const next = { ...current };
              if (value) next[field] = value;
              else delete next[field];
              return next;
            })
          }
          onClear={() => setFeatureFilters({})}
        />

        {/* Plant list */}
        <div className="mt-8">
          <p className="text-sm text-slate-600">
            {t("Showing {shown} of {total}", { shown: filtered.length, total: plants.length })}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PlantCard key={p.name} plant={p} onOpenInfo={setActivePlant} lang={lang} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700">
              {t(
                "No plants match these criteria. Try removing a feature filter or changing your search.",
              )}
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
