"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function OfflineContent() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="text-5xl">📡</div>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">{t("You're offline")}</h1>
      <p className="mt-4 text-gray-600">
        {t(
          "This page hasn't been opened on this device before, so it isn't saved for offline use. Pages you've opened while online still work.",
        )}
      </p>
      <p className="mt-4 text-gray-600">
        {t(
          "You can still report a sighting: the submit page saves it on this device and sends it when you're back online.",
        )}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/submit"
          className="rounded-md bg-[#136207] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d4705]"
        >
          {t("Report a sighting")}
        </Link>
        <Link
          href="/drafts"
          className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          {t("My drafts")}
        </Link>
      </div>
    </div>
  );
}
