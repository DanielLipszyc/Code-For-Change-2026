/** Data for the dashboard page (built by server/dashboard.ts) */

export type StatTone = "emerald" | "sky" | "orange" | "violet";

export interface Stat {
  label: string;
  value: string;
  detail: string;
  tone: StatTone;
}

export interface Observer {
  id: string;
  name: string;
  /** The plant they reported most recently */
  focus: string;
  /** Approved reports */
  sightings: number;
  following: boolean;
  avatar: string;
  imageUrl: string;
}

export interface Achievement {
  title: string;
  detail: string;
  /** 0 to 100 */
  progress: number;
  icon: string;
}

export interface FeedItem {
  title: string;
  meta: string;
  type: "connection" | "species";
}

export interface DashboardData {
  user: { id: string; name: string };
  stats: Stat[];
  /** The signed-in user's reports in the last 7 days, and how many await review */
  summary: { reportsThisWeek: number; pendingReview: number };
  observers: Observer[];
  achievements: Achievement[];
  feed: FeedItem[];
}
