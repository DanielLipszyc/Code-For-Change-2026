import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SightingEditClient from "./SightingEditClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // Check authentication
  const authResult = await auth();
  const userId = authResult.userId;

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  return (
    <Suspense fallback={<div className="min-h-screen p-8">Loading…</div>}>
      <SightingEditClient sightingId={id} />
    </Suspense>
  );
}
