"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { DashboardData } from "@/types/dashboard";

const toneStyles = {
  emerald: "bg-emerald-50 text-emerald-700",
  sky: "bg-sky-50 text-sky-700",
  orange: "bg-orange-50 text-orange-700",
  violet: "bg-violet-50 text-violet-700",
};

/** The dashboard UI. Its data is loaded on the server (see ../page.tsx). */
export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const toast = useToast();
  const [data, setData] = useState(initialData);

  // The next badge still to earn, shown in the milestone card
  const nextBadge = data.achievements.find((achievement) => achievement.progress < 100);

  const handleInviteFriend = async () => {
    const inviteText =
      "Join me on Swamp Spotter and help log invasive plants across Alachua County.";

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteText);
      }
      toast.success("Invite copied to clipboard.");
    } catch {
      toast.info(`Invite ready to share: ${inviteText}`);
    }
  };

  const handleConnectNetwork = () => {
    const panel = document.getElementById("observer-network");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleFollowToggle = async (observerId: string) => {
    const currentObserver = data.observers.find((observer) => observer.id === observerId);
    if (!currentObserver) return;

    const nextFollowing = !currentObserver.following;

    setData((current) => {
      return {
        ...current,
        observers: current.observers.map((observer) =>
          observer.id === observerId ? { ...observer, following: nextFollowing } : observer,
        ),
      };
    });

    try {
      const response = await fetch("/api/dashboard", {
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
        return {
          ...current,
          observers: current.observers.map((observer) =>
            observer.id === observerId ? { ...observer, following: result.following } : observer,
          ),
        };
      });
      toast.success(result.following ? "Observer followed." : "Observer unfollowed.");
    } catch (error) {
      console.error(error);
      setData((current) => {
        return {
          ...current,
          observers: current.observers.map((observer) =>
            observer.id === observerId
              ? { ...observer, following: currentObserver.following }
              : observer,
          ),
        };
      });
      toast.error("Couldn't update follow. Please try again.");
    }
  };

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
              Track field activity, follow collaborators, and grow your impact across the Alachua
              County observation network.
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

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-white bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {stat.label}
                </span>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-lg ${toneStyles[stat.tone]}`}
                >
                  {stat.tone === "emerald"
                    ? "🌿"
                    : stat.tone === "sky"
                      ? "🌎"
                      : stat.tone === "orange"
                        ? "🏆"
                        : "🔥"}
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <span className="text-4xl font-black tracking-tight text-slate-900">
                  {stat.value}
                </span>
                <span className="text-xs font-semibold text-slate-500">{stat.detail}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.8fr_1fr]">
          <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  Community map
                </span>
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
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-300">
                      Last 7 days
                    </span>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-5xl font-black">{data.summary.reportsThisWeek}</span>
                      <span className="pb-2 text-sm text-slate-300">
                        new report{data.summary.reportsThisWeek === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <span className="text-4xl">🌎</span>
                </div>
                <div className="mt-6 text-xs text-slate-300">
                  {data.summary.pendingReview > 0
                    ? `${data.summary.pendingReview} of your reports awaiting review`
                    : "All your reports have been reviewed"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide text-emerald-800">
                    Next badge
                  </span>
                  <span className="text-3xl">{nextBadge?.icon ?? "🏆"}</span>
                </div>
                <div className="mt-6">
                  <div className="text-3xl font-black text-slate-900">
                    {nextBadge ? nextBadge.title : "All badges earned"}
                  </div>
                  {nextBadge && (
                    <div className="mt-2 text-sm font-semibold text-slate-600">
                      {nextBadge.detail}
                    </div>
                  )}
                </div>
                <div className="mt-6 h-2 rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${Math.round(nextBadge?.progress ?? 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Recent field activity</h3>
                <Link
                  href="/log"
                  className="text-sm font-bold text-emerald-700 hover:text-emerald-800"
                >
                  View log →
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {data.feed.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                  >
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
            <article
              id="observer-network"
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">
                    Observers
                  </span>
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
                  <div
                    key={observer.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 font-black text-white">
                      {observer.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-black text-slate-900">{observer.name}</div>
                          <div className="text-xs font-semibold text-slate-500">
                            {observer.focus}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFollowToggle(observer.id)}
                          className={`rounded-full px-3 py-1 text-xs font-black ${observer.following ? "bg-emerald-700 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                        >
                          {observer.following ? "Following" : "Follow"}
                        </button>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-500">
                        {observer.sightings} reports
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
                    Contribution path
                  </span>
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
                      <span className="text-xs font-bold text-slate-500">
                        {Math.min(100, Math.round(achievement.progress))}%
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-500">
                      {achievement.detail}
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-500"
                        style={{ width: `${Math.min(100, Math.round(achievement.progress))}%` }}
                      />
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
