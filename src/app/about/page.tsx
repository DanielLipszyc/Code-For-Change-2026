// About page with Team Member cards + Tech Stack section

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  avatarSrc?: string; // put images in /public/team/...
  links?: { label: string; href: string }[];
};

type StackItem = {
  name: string;
  detail: string;
  badge?: "Frontend" | "Backend" | "Database" | "Infra" | "Auth" | "Tools";
};

const TEAM: TeamMember[] = [
  {
    name: "Mia Camacho",
    role: "Full-Stack Developer",
    bio: "Focused on building a clean reporting flow, improving UX, and keeping the app lightweight and deploy-ready.",
    avatarSrc: "/team/team.jpg", // optional
    links: [
      { label: "GitHub", href: "https://github.com/camachom26" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/mia-camacho-27a2b3255/" },
    ],
  },
  {
    name: "Daniel Lipszyc",
    role: "Backend / Data",
    bio: "Designed data models and API routes to store sightings, images, and user submissions reliably.",
    avatarSrc: "/team/team.jpg", // optional
    links: [
      { label: "GitHub", href: "https://github.com/DanielLipszyc" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/daniellipszyc" },
    ],
  },
  {
    name: "Jonathan Kissil",
    role: "Design / Product",
    bio: "Created the visual system, page layouts, mapping system, and UI components to keep the experience approachable.",
    avatarSrc: "/team/team.jpg", // optional
    links: [
      { label: "GitHub", href: "https://github.com/JonKissil" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/jkissil" },
    ],
  },
  {
    name: "Rawan Hussain",
    role: "Design / Product",
    bio: "Created the visual system, page layouts, and UI components to keep the experience approachable.",
    avatarSrc: "/team/team.jpg", // optional
    links: [
      { label: "GitHub", href: "https://github.com/Rawanh04" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/rawan-hussain/" },
    ],
  }
];

const STACK: StackItem[] = [
  { name: "Next.js (App Router)", detail: "Routing, server rendering, and deployment-friendly architecture.", badge: "Frontend" },
  { name: "React + TypeScript", detail: "Type-safe UI components and reliable iteration.", badge: "Frontend" },
  { name: "Tailwind CSS", detail: "Consistent spacing, typography, and responsive design.", badge: "Frontend" },
  { name: "Clerk", detail: "Authentication for sign-in/sign-up and user sessions.", badge: "Auth" },
  { name: "MongoDB", detail: "Stores submissions and metadata for sightings.", badge: "Database" },
  { name: "API Routes", detail: "Server endpoints for submissions and user workflows.", badge: "Backend" },
  { name: "Vercel", detail: "Deployments with environment-based configuration.", badge: "Infra" },
  { name: "Git + GitHub", detail: "Version control and team collaboration.", badge: "Tools" },
];

function Badge({ label }: { label: NonNullable<StackItem["badge"]> }) {
  const cls =
    label === "Frontend"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : label === "Backend"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : label === "Database"
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : label === "Infra"
      ? "bg-slate-50 text-slate-700 ring-slate-200"
      : label === "Auth"
      ? "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>
      {label}
    </span>
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    // Using <img> keeps this file drop-in friendly even if you haven't configured next/image remote patterns.
    // If these are local images in /public, feel free to switch to next/image.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className="h-12 w-12 rounded-2xl object-cover ring-1 ring-black/5" />;
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 text-white font-bold flex items-center justify-center ring-1 ring-black/5">
      {initials || "?"}
    </div>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={member.name} src={member.avatarSrc} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-900">{member.name}</p>
            <p className="truncate text-sm text-gray-600">{member.role}</p>
          </div>
        </div>

        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 ring-1 ring-slate-200/70 opacity-0 transition group-hover:opacity-100" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-gray-600">{member.bio}</p>

      {member.links?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {member.links.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StackCard({ item }: { item: StackItem }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-gray-900">{item.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.detail}</p>
        </div>
        {item.badge ? <Badge label={item.badge} /> : null}
      </div>
    </div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            About <span className="text-[#136207]">Swamp Spotter</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Making conservation accessible to everyone through simple, community-powered environmental reporting.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-12">
          <div className="rounded-3xl bg-white shadow-xl ring-1 ring-black/5 p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-lg">
                🌿
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            </div>

            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Swamp Spotter is designed to make environmental reporting accessible to the general public. Anyone in the
                county can submit plant observations; no scientific or technical background required.
              </p>
              <p>
                By focusing on a small group of high-impact invasive species within a local area, the app stays simple,
                approachable, and easy to understand.
              </p>
              <p>
                This targeted approach helps communities contribute meaningful data without the complexity of traditional
                reporting tools, supporting real conservation work through everyday participation.
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-12">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Our Team</h2>
              <p className="mt-2 text-gray-600">
                A small group of builders focused on clarity, usability, and real-world impact.
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((m) => (
              <TeamCard key={m.name} member={m} />
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tech Stack</h2>
              <p className="mt-2 text-gray-600">
                The tools and frameworks powering a lightweight, deploy-friendly experience.
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {STACK.map((s) => (
              <StackCard key={s.name} item={s} />
            ))}
          </div>
        </section>

        <div className="mt-14 text-center text-sm text-gray-500">
          Built with care for the environment and the community.
        </div>
      </div>
    </div>
  );
}
