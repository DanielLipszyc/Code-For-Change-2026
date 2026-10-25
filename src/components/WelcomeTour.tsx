"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

function Frame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-inner">
      <div className="flex items-center gap-1.5 border-b border-gray-200 bg-white px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-300" />
        <span className="h-2 w-2 rounded-full bg-yellow-300" />
        <span className="h-2 w-2 rounded-full bg-green-300" />
        <span className="ml-2 flex-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{url}</span>
      </div>
      <div className="relative p-4">{children}</div>
    </div>
  );
}

function Callout({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span
      className={`absolute flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow ${className}`}
    >
      {n}
    </span>
  );
}

function WelcomeArt() {
  return (
    <div className="flex h-44 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-lime-100 text-7xl">
      🌿🐊🔍
    </div>
  );
}

function GuideArt() {
  const { t } = useLanguage();
  return (
    <Frame url="swampspotter / guide">
      <div className="grid grid-cols-3 gap-2">
        {[["🌱", "Air Potato"], ["🌾", "Cogongrass"], ["🪴", "Tropical Soda Apple"]].map(([icon, name], i) => (
          <div key={name} className={`rounded-lg border bg-white p-2 text-center ${i === 0 ? "border-emerald-500 ring-2 ring-emerald-300" : "border-gray-200"}`}>
            <div className="flex h-12 items-center justify-center rounded bg-emerald-50 text-2xl">{icon}</div>
            <div className="mt-1 text-[10px] font-semibold text-gray-700">{name}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-md bg-emerald-600 py-1.5 text-center text-[11px] font-semibold text-white">{t("Report this plant")}</div>
      <Callout n={1} className="left-3 top-14" />
      <Callout n={2} className="bottom-2 right-6" />
    </Frame>
  );
}

function PhotoArt() {
  const { t } = useLanguage();
  return (
    <Frame url="swampspotter / submit">
      <div className="mb-1 text-[11px] font-semibold text-gray-800">{t("Plant Photo *")}</div>
      <div className="flex h-28 flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-400 bg-white text-gray-500">
        <span className="text-3xl">📷</span>
        <span className="text-[10px]">{t("Tap to take or upload a photo")}</span>
      </div>
      <Callout n={1} className="right-6 top-10" />
    </Frame>
  );
}

function DetailsArt() {
  const { t } = useLanguage();
  return (
    <Frame url="swampspotter / submit">
      <div className="text-[10px] font-medium text-gray-700">{t("Select Plant Species *")}</div>
      <div className="mt-1 flex items-center justify-between rounded-md border border-emerald-500 bg-white px-2 py-1.5 text-[11px] text-gray-800 ring-2 ring-emerald-200">
        Air Potato <span>▾</span>
      </div>
      <div className="mt-3 text-[10px] font-medium text-gray-700">{t("Notes")}</div>
      <div className="mt-1 h-10 rounded-md border border-gray-300 bg-white px-2 py-1 text-[10px] text-gray-400">
        {t("Describe the habitat, water conditions, nearby plants...")}
      </div>
      <Callout n={2} className="right-6 top-8" />
      <Callout n={3} className="bottom-3 right-6" />
    </Frame>
  );
}

function SubmitArt() {
  const { t } = useLanguage();
  return (
    <Frame url="swampspotter / submit">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-50 text-xl">🌱</div>
        <div className="text-[11px] text-gray-700">
          <div className="font-semibold">Air Potato</div>
          <div className="text-gray-400">{t("photo attached")}</div>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-[#136207] py-2.5 text-center text-xs font-semibold text-white">{t("🌿 Submit Plant")}</div>
      <div className="mt-2 text-center text-[10px] text-emerald-700">✓ {t("Sent for review!")}</div>
      <Callout n={1} className="bottom-8 right-6" />
    </Frame>
  );
}

function LogArt() {
  const rows = [["Air Potato", "Approved", "bg-green-100 text-green-700"], ["Cogongrass", "Pending", "bg-yellow-100 text-yellow-700"]];
  return (
    <Frame url="swampspotter / log">
      <div className="space-y-2">
        {rows.map(([name, status, tone]) => (
          <div key={name} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700"><span className="text-lg">🌱</span>{name}</div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>{status}</span>
          </div>
        ))}
      </div>
      <Callout n={1} className="right-3 top-4" />
    </Frame>
  );
}

function MapArt() {
  const { t } = useLanguage();
  return (
    <Frame url="swampspotter / map">
      <div className="relative h-32 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-100 via-sky-100 to-emerald-200">
        <div className="absolute left-8 top-6 text-xl">📍</div>
        <div className="absolute left-24 top-16 text-xl">📍</div>
        <div className="absolute right-10 top-8 text-xl">📍</div>
        <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-700">{t("Alachua County")}</div>
      </div>
      <Callout n={1} className="left-10 top-6" />
    </Frame>
  );
}

function DashboardArt() {
  const { t } = useLanguage();
  return (
    <Frame url="swampspotter / dashboard">
      <div className="grid grid-cols-3 gap-2">
        {[["7", "Observations"], ["4", "Species"], ["2", "Pending"]].map(([v, l]) => (
          <div key={l} className="rounded-lg bg-white p-2 text-center shadow-sm">
            <div className="text-lg font-black text-gray-900">{v}</div>
            <div className="text-[9px] font-semibold uppercase text-gray-500">{t(l)}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-lg bg-white p-2 text-[10px] text-gray-600 shadow-sm">
        <span>👥</span> {t("Follow observers and see their latest reports")}
      </div>
      <Callout n={1} className="left-4 top-2" />
    </Frame>
  );
}

type Step = { title: string; body: string; art: ReactNode; tips?: string[]; href?: string; cta?: string };

const steps: Step[] = [
  { title: "Welcome to Swamp Spotter", body: "Help track invasive plants across Alachua County. This short tour walks you through reporting a plant, step by step.", art: <WelcomeArt /> },
  { title: "1. Identify the plant", body: "Not sure what you found? Browse the Invasive Plant Guide to match it.", tips: ["Pick a plant card to see how to recognize it", "Press “Report this plant” to start a report with it prefilled"], art: <GuideArt />, href: "/guide", cta: "Open the guide" },
  { title: "2. Add a photo", body: "Open the Submit page and add a clear photo of the plant.", tips: ["Tap the box to take a photo or upload one", "Include leaves, flowers, or fruit if you can"], art: <PhotoArt />, href: "/submit", cta: "Open Submit" },
  { title: "3. Fill in the details", body: "Choose the species and add notes about where you found it.", tips: ["Select the species from the list", "Describe the habitat, water conditions, and nearby plants"], art: <DetailsArt /> },
  { title: "4. Send it in", body: "Press Submit Plant. An admin reviews every report before it appears publicly.", tips: ["You'll see a confirmation once it's sent"], art: <SubmitArt /> },
  { title: "5. Track your reports", body: "My Log shows every report you've sent and whether it's pending or approved. You can edit them there too.", tips: ["Status badges show review progress"], art: <LogArt />, href: "/log", cta: "Open My Log" },
  { title: "Explore the map", body: "See approved sightings across the county to learn where invasives are spreading.", tips: ["Each pin is one reported plant"], art: <MapArt />, href: "/map", cta: "Open the map" },
  { title: "Your dashboard", body: "This page tracks your stats and achievements, and lets you follow other observers. You're ready to go!", art: <DashboardArt /> },
];

export default function WelcomeTour({ alwaysShow = false }: { alwaysShow?: boolean }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (alwaysShow) {
      setOpen(true);
      return;
    }

    let cancelled = false;
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (!cancelled && user && user.welcomeTourSeen === false) setOpen(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [alwaysShow]);

  const close = () => {
    setOpen(false);
    if (alwaysShow) return;
    fetch("/api/users/me", { method: "PATCH" }).catch(() => {});
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-tour-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {t("Step {current} of {total}", { current: step + 1, total: steps.length })}
        </div>
        <div aria-hidden="true">{current.art}</div>
        <h2 id="welcome-tour-title" className="mt-4 text-xl font-bold text-gray-900">{t(current.title)}</h2>
        <p className="mt-2 text-gray-600">{t(current.body)}</p>
        {current.tips && (
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            {current.tips.map((tip) => (
              <li key={tip} className="flex gap-2"><span className="text-emerald-600">✓</span>{t(tip)}</li>
            ))}
          </ul>
        )}
        {current.href && (
          <Link href={current.href} onClick={close} className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline">
            {t(current.cta ?? "")} →
          </Link>
        )}
        <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
          {steps.map((_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i === step ? "bg-emerald-600" : "bg-gray-300"}`} />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <button type="button" onClick={close} className="text-sm text-gray-500 hover:text-gray-700">
            {t("Skip")}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {t("Back")}
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? close() : setStep(step + 1))}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {last ? t("Get started") : t("Next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
