"use client";

import { useLanguage } from "@/components/LanguageProvider";

/** Shown while a page in this group loads its data on the server */
export default function Loading() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#136207]" />
        <p className="mt-4 text-slate-600">{t("Loading…")}</p>
      </div>
    </div>
  );
}
