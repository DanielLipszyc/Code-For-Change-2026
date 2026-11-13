import { Suspense } from "react";
import { getPlants } from "@/server/plants";
import { getViewer } from "@/server/authz";
import SubmitClient from "./SubmitClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [plants, viewer] = await Promise.all([getPlants(), getViewer()]);
  return (
    <Suspense fallback={<div className="min-h-screen p-8">Loading…</div>}>
      <SubmitClient plants={plants} isAdmin={viewer.isAdmin} />
    </Suspense>
  );
}
