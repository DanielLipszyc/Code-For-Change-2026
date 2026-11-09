import { Suspense } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { getPlants } from "@/server/plants";
import SubmitClient from "./SubmitClient";

export default async function Page() {
  const plants = await getPlants();
  return (
    <Suspense fallback={<div className="min-h-screen p-8">Loading…</div>}>
      <SubmitClient plants={plants} />
    </Suspense>
  );
}
