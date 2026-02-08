import { Suspense } from "react";
import SubmitClient from "./SubmitClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8">Loading…</div>}>
      <SubmitClient />
    </Suspense>
  );
}
