import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { listSubmissions } from "@/server/submissions";
import LogClient from "./_components/LogClient";

/** /log: the signed-in user's own submissions, loaded on the server */
export default async function LogPage() {
  // The middleware already sends signed-out visitors to sign in
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Only their own submissions, so the role doesn't matter (and needs no Clerk call)
  const submissions = await listSubmissions({ userId, isAdmin: false }, { mine: true });

  return <LogClient initialSubmissions={submissions} />;
}
