"use client";

import { Suspense } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import SubmitClient from "./SubmitClient";

export default function Page() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={<div className="min-h-screen p-8">{t("Loading…")}</div>}>
      <SubmitClient />
    </Suspense>
  );
}
