import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SubmitClient from "./SubmitClient";

export default async function Page() {
  // Check authentication
  const authResult = await auth();
  const userId = authResult.userId;

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <Suspense fallback={<div className="min-h-screen p-8">Loading…</div>}>
      <SubmitClient />
    </Suspense>
  );
}
