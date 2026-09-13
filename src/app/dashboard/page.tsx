import Link from "next/link";

const stats = [
  { label: "Observations", value: "128", detail: "+14 this month", tone: "emerald" },
  { label: "Species logged", value: "36", detail: "12 new IDs", tone: "sky" },
  { label: "Community rank", value: "#08", detail: "Top 15%", tone: "orange" },
  { label: "Streak", value: "09d", detail: "Healthy habitats", tone: "violet" },
];

const observers = [
  { name: "Mara Rivers", focus: "Wetland grasses", sightings: 42, following: true, avatar: "MR" },
  { name: "Theo Palm", focus: "Invasive trees", sightings: 28, following: false, avatar: "TP" },
  { name: "Iris North", focus: "Aquatic plants", sightings: 33, following: true, avatar: "IN" },
  { name: "Kai Marsh", focus: "Trail corridors", sightings: 19, following: false, avatar: "KM" },
];

const achievements = [
  { title: "Trail Recon", detail: "5 field checks logged", progress: 84, icon: "🥾" },
  { title: "Wetland Watcher", detail: "12 water-site reports", progress: 67, icon: "💧" },
  { title: "Plant Detective", detail: "18 species confirmed", progress: 91, icon: "🔍" },
];

const feed = [
  { title: "Mara Rivers added a new upland wetland site", meta: "2h ago · 4 new observations", type: "connection" },
  { title: "Kai Marsh identified a new cluster of cattails", meta: "5h ago · sighting confirmed", type: "species" },
  { title: "Community challenge: map all invasive plots", meta: "Today · 28 observers active", type: "challenge" },
];

export default function DashboardPage() {
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
              Welcome back, Observing Partner
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
            <button className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
              Invite Friend
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{stat.label}</span>
                <span className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-lg">
                  {stat.tone === "emerald" ? "🌿" : stat.tone === "sky" ? "🌎" : stat.tone === "orange" ? "🏆" : "🔥"}
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between">
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
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-300">Current Week</span>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-5xl font-black">24</span>
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
                  <span className="text-xs font-black uppercase tracking-wide text-emerald-800">Field Milestone</span>
                  <span className="text-3xl">🏆</span>
                </div>
                <div className="mt-10">
                  <div className="text-5xl font-black text-slate-900">Level 08</div>
                  <div className="mt-2 text-sm font-semibold text-slate-600">Observer tier</div>
                </div>
                <div className="mt-6 h-2 rounded-full bg-emerald-100">
                  <div className="h-full w-[88%] rounded-full bg-emerald-600" />
                </div>
                <div className="mt-3 text-xs font-bold text-emerald-800">8 points to next badge</div>
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
                {feed.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
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
            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Observers</span>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Your network</h2>
                </div>
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                  Connect
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {observers.map((observer) => (
                  <div key={observer.name} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 font-black text-white">
                      {observer.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-black text-slate-900">{observer.name}</div>
                          <div className="text-xs font-semibold text-slate-500">{observer.focus}</div>
                        </div>
                        <button className={`rounded-full px-3 py-1 text-xs font-black ${observer.following ? "bg-emerald-700 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
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
                {achievements.map((achievement) => (
                  <div key={achievement.title}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-black text-slate-900">
                        <span>{achievement.icon}</span>
                        <span>{achievement.title}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-500">{achievement.progress}%</span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-500">{achievement.detail}</div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-500" style={{ width: `${achievement.progress}%` }} />
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
