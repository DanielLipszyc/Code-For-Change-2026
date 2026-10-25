import type { DashboardData } from "@/types/dashboard";

/** Demo mode exists only for local development; it is inert in production builds. */
export function isDemoEnabled(environment: string | undefined = process.env.NODE_ENV) {
  return environment === "development";
}

export const DEMO_ENABLED = isDemoEnabled();
export const DEMO_USER_ID = "demo-user";

/** Sample data shown only to the demo session, which needs no Clerk account or database. */
export const demoDashboard: DashboardData = {
  user: { id: DEMO_USER_ID, name: "Demo" },
  stats: [
    { label: "Observations", value: "7", detail: "5 approved", tone: "emerald" },
    { label: "Species logged", value: "4", detail: "4 unique plants", tone: "sky" },
    { label: "Pending review", value: "2", detail: "Awaiting approval", tone: "orange" },
    { label: "Active days", value: "3", detail: "Days with a report", tone: "violet" },
  ],
  summary: { reportsThisWeek: 3, pendingReview: 2 },
  observers: [
    {
      id: "obs-1",
      name: "Mara Rivers",
      focus: "Wetland grasses",
      sightings: 18,
      following: true,
      avatar: "MR",
      imageUrl: "",
    },
    {
      id: "obs-2",
      name: "Theo Palm",
      focus: "Invasive trees",
      sightings: 13,
      following: false,
      avatar: "TP",
      imageUrl: "",
    },
    {
      id: "obs-3",
      name: "Iris North",
      focus: "Aquatic plants",
      sightings: 9,
      following: true,
      avatar: "IN",
      imageUrl: "",
    },
  ],
  achievements: [
    { title: "Trail Recon", detail: "5 of 5 field checks logged", progress: 100, icon: "🥾" },
    {
      title: "Wetland Watcher",
      detail: "5 of 12 water-site reports",
      progress: (5 / 12) * 100,
      icon: "💧",
    },
    {
      title: "Plant Detective",
      detail: "4 of 18 species confirmed",
      progress: (4 / 18) * 100,
      icon: "🔍",
    },
  ],
  feed: [
    { title: "Demo logged Air Potato", meta: "Approved", type: "connection" },
    { title: "Mara Rivers logged Water Hyacinth", meta: "Approved", type: "species" },
  ],
};
