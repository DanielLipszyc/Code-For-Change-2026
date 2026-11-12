import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/server/authz";
import { redirect } from "next/navigation";
import SpeciesReviewClient from "./SpeciesReviewClient";

export const dynamic = "force-dynamic";

export default async function SpeciesReviewPage() {
  const { userId } = await auth();
  if (!userId || !(await isAdmin(userId))) redirect("/guide");
  return <SpeciesReviewClient />;
}
