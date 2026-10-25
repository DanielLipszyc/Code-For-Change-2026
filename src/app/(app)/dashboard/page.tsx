import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DEMO_ENABLED, demoDashboard } from "@/lib/demo";
import { getDashboard } from "@/server/dashboard";
import DashboardClient from "./_components/DashboardClient";

/** /dashboard: the signed-in user's stats and observer network, loaded on the server */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  // The middleware already sends signed-out visitors to sign in
  const { userId } = await auth();
  if (!userId) {
    const { demo } = await searchParams;
    if (DEMO_ENABLED && demo === "1") {
      return <DashboardClient initialData={demoDashboard} isDemo />;
    }
    redirect("/sign-in");
  }

  return <DashboardClient initialData={await getDashboard(userId)} />;
}
