"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Stat = {
  label: string;
  value: string;
  detail: string;
  tone: "emerald" | "sky" | "orange" | "violet";
};

type Observer = {
  id: string;
  name: string;
  focus: string;
  sightings: number;
  following: boolean;
  avatar: string;
  imageUrl?: string;
};

type Achievement = {
  title: string;
  detail: string;
  progress: number;
  icon: string;
};

type FeedItem = {
  title: string;
  meta: string;
  type: "connection" | "species" | "challenge";
};

type DashboardPayload = {
  user: { id: string; name: string };
  stats: Stat[];
  observers: Observer[];
  achievements: Achievement[];
  feed: FeedItem[];
};

const toneStyles = {
  emerald: "bg-emerald-50 text-emerald-700",
  sky: "bg-sky-50 text-sky-700",
  orange: "bg-orange-50 text-orange-700",
  violet: "bg-violet-50 text-violet-700",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flashMessage, setFlashMessage] = useState("");

  const isDemoMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.location.search.includes("demo=1") || document.cookie.includes("demo_user=1");
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch(`/api/dashboard${isDemoMode ? "?demo=1" : ""}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          if (response.status === 401) {
            throw new Error("Unauthorized");
          }
          throw new Error(payload.error || "Dashboard is unavailable");
        }

        const payload = await response.json();
        setData(payload);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to load dashboard data right now.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const handleInviteFriend = async () => {
    const inviteText = "Join me on Swamp Spotter and help log invasive plants across Alachua County.";

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteText);
      }
      setFlashMessage("Invite copied to clipboard.");
    } catch {
      setFlashMessage(`Invite ready to share: ${inviteText}`);
    }
  };

  const handleConnectNetwork = () => {
    const panel = document.getElementById("observer-network");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setFlashMessage("Network panel opened.");
  };

  const handleFollowToggle = async (observerId: string) => {
    if (!data) return;

    const currentObserver = data.observers.find((observer) => observer.id === observerId);
    if (!currentObserver) return;

    const nextFollowing = !currentObserver.following;

    setData((current) => {
      if (!current) return current;
      return {
        ...current,
        observers: current.observers.map((observer) =>
          observer.id === observerId ? { ...observer, following: nextFollowing } : observer
        ),
      };
    });

    try {
      const response = await fetch(`/api/dashboard${isDemoMode ? "?demo=1" : ""}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: observerId }),
      });

      if (!response.ok) {
        throw new Error("Follow update failed");
      }

      const result = await response.json();
      setData((current) => {
        if (!current) return current;
        return {
          ...current,
          observers: current.observers.map((observer) =>
            observer.id === observerId ? { ...observer, following: result.following } : observer
          ),
        };
      });
      setFlashMessage(nextFollowing ? "Observer followed." : "Observer unfollowed.");
    } catch (error) {
      console.error(error);
      setData((current) => {
        if (!current) return current;
        return {
          ...current,
          observers: current.observers.map((observer) =>
            observer.id === observerId ? { ...observer, following: currentObserver.following } : observer
          ),
        };
      });
      setFlashMessage("Follow action saved locally. Backend sync will resume when the API is configured.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4">
        <div className="w-full max-w-5xl animate-pulse space-y-6">
          <div className="h-6 w-40 rounded-full bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            <div className="h-80 rounded-3xl bg-white shadow-sm" />
            <div className="h-80 rounded-3xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    const isAuthError = error === "Unauthorized" || error.toLowerCase().includes("unauthorized");

    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-6xl">{isAuthError ? "🔒" : "⚠️"}</div>
          <h1 className="mt-4 text-3xl font-black text-slate-900">
            {isAuthError ? "Sign in required" : "Dashboard unavailable"}
          </h1>
          <p className="mt-3 text-slate-600">
            {isAuthError
              ? "Please sign in to view your citizen scientist dashboard."
              : "The dashboard data is temporarily unavailable, but your session is still active."}
          </p>
          <Link
            href={isAuthError ? "/sign-in" : "/dashboard"}
            className="mt-6 inline-block rounded-xl bg-[#136207] px-5 py-3 text-sm font-bold text-white hover:bg-[#0f5006]"
          >
            {isAuthError ? "Go to sign in" : "Try again"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Citizen Scientist Dashboard
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Welcome back, {data.user.name.split(" ")[0] || "Observer"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Track field activity, follow collaborators, and grow your impact across the Alachua County observation network.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/submit"
              className="rounded-xl bg-[#136207] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0f5006] transition-colors"
            >
              + New Observation
            </Link>
            <Link
              href="/log"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              View Log
            </Link>
            <button
              type="button"
              onClick={handleInviteFriend}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 transition-colors"
            >
              Invite Friend
            </button>
          </div>
        </div>

        {flashMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {flashMessage}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{stat.label}</span>
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-lg ${toneStyles[stat.tone]}`}>
                  {stat.tone === "emerald" ? "🌿" : stat.tone === "sky" ? "🌎" : stat.tone === "orange" ? "🏆" : "🔥"}
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <span className="text-4xl font-black tracking-tight text-slate-900">{stat.value}</span>
                <span className="text-xs font-semibold text-slate-500">{stat.detail}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.8fr_1fr]">
          <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Community map</span>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Observation activity</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live network
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-950 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-300">Current week</span>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-5xl font-black">{Math.max(data.stats[0]?.value ? Number(data.stats[0].value) : 0, 1)}</span>
                      <span className="pb-2 text-sm text-slate-300">new reports</span>
                    </div>
                  </div>
                  <span className="text-4xl">🌎</span>
                </div>
                <div className="mt-6 h-2 rounded-full bg-white/10">
                  <div className="h-full w-[76%] rounded-full bg-emerald-300" />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                  <span>Week goal: 31</span>
                  <span>76%</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide text-emerald-800">Field milestone</span>
                  <span className="text-3xl">🏆</span>
                </div>
                <div className="mt-10">
                  <div className="text-5xl font-black text-slate-900">Level {Math.min(12, Math.max(3, Number(data.stats[0]?.value || 1) / 2 + 2))}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-600">Observer tier</div>
                </div>
                <div className="mt-6 h-2 rounded-full bg-emerald-100">
                  <div className="h-full w-[88%] rounded-full bg-emerald-600" />
                </div>
                <div className="mt-3 text-xs font-bold text-emerald-800">{Math.max(3, 12 - Number(data.stats[0]?.value || 0))} points to next badge</div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Recent field activity</h3>
                <Link href="/log" className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
                  View log →
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {data.feed.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                      {item.type === "connection" ? "👥" : item.type === "species" ? "🌱" : "🎯"}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">{item.meta}</div>
                    </div>
                    <span className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <article id="observer-network" className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Observers</span>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Your network</h2>
                </div>
                <button
                  type="button"
                  onClick={handleConnectNetwork}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  Connect
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {data.observers.map((observer) => (
                  <div key={observer.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 font-black text-white">
                      {observer.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-black text-slate-900">{observer.name}</div>
                          <div className="text-xs font-semibold text-slate-500">{observer.focus}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFollowToggle(observer.id)}
                          className={`rounded-full px-3 py-1 text-xs font-black ${observer.following ? "bg-emerald-700 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                        >
                          {observer.following ? "Following" : "Follow"}
                        </button>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-500">{observer.sightings} reports</div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">Contribution path</span>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Impact ladder</h2>
                </div>
                <span className="text-3xl">⚡</span>
              </div>

              <div className="mt-5 space-y-4">
                {data.achievements.map((achievement) => (
                  <div key={achievement.title}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-black text-slate-900">
                        <span>{achievement.icon}</span>
                        <span>{achievement.title}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-500">{Math.min(100, Math.round(achievement.progress))}%</span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-500">{achievement.detail}</div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-500" style={{ width: `${Math.min(100, Math.round(achievement.progress))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}
