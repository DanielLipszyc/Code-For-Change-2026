import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getDashboard } from "@/server/dashboard";
import DashboardClient from "./_components/DashboardClient";

/** /dashboard: the signed-in user's stats and observer network, loaded on the server */
export default async function DashboardPage() {
  // The middleware already sends signed-out visitors to sign in
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <DashboardClient initialData={await getDashboard(userId)} />;
}
