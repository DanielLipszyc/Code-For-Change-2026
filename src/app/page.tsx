"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Slide = {
  src: string;
  alt: string;
  kicker?: string;
  headline?: string;
  body?: string;
};

export default function Home() {
  // ✅ Replace these with your own images (put them in /public)
  const slides: Slide[] = useMemo(
    () => [
      {
        src: "/slides/slide-3.jpg",
        alt: "Wetland boardwalk at sunrise",
        kicker: "Explore",
        headline: "Spot plants in Florida wetlands",
        body: "Use the guide to quickly identify invasive and native species while you’re out on trails.",
      },
      {
        src: "/slides/slide-2.jpg",
        alt: "Close-up plant photo",
        kicker: "Document",
        headline: "Capture what you find",
        body: "Upload a photo with notes and location—so sightings become useful data, not just memories.",
      },
      {
        src: "/slides/slide-1.png",
        alt: "Map pins of sightings",
        kicker: "Share",
        headline: "Power a community map",
        body: "Help create a clearer picture of biodiversity by contributing sightings to a shared view.",
      },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance slideshow
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* HERO + SLIDESHOW */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#136207] to-[#1B3FAB] text-white">
        {/* background blobs */}
        <div className="pointer-events-none absolute inset-0">
          <img style = {{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center"
          }} src="/forest.jpg" alt="forest"/>
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Community-powered wetland observations
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-orange-300 to-sky-300 bg-clip-text text-transparent">
                Swamp
              </span>{" "}
              Spotter 🌿
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-green-100/90 sm:text-lg">
              Discover, identify, and document plants in swamps and wetlands—then submit sightings
              that help teams and communities understand what’s spreading and what’s thriving.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/submit"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-lg shadow-black/10 hover:bg-green-50 hover:scale-[1.03]"
              >
                🌱 Submit a Sighting
              </Link>
              <Link
                href="/guide"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15 hover:scale-[1.03]"
              >
                Browse the ID Guide
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/75">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Fast submissions
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-300" />
                Clean plant guide
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-300" />
                Map-ready data
              </div>
            </div>
          </div>

          {/* Right slideshow */}
          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="absolute -inset-4 rounded-3xl bg-white/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl">
              {/* Slides */}
              <div className="relative h-[340px] sm:h-[420px] lg:h-[520px]">
                {slides.map((s, idx) => (
                  <div
                    key={s.src}
                    className={[
                      "absolute inset-0 transition-opacity duration-700",
                      idx === active ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                    aria-hidden={idx !== active}
                  >
                    <Image
                      src={s.src}
                      alt={s.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 520px"
                      priority={idx === 0}
                    />
                    {/* overlay gradient for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  </div>
                ))}
              </div>

              {/* Caption */}
              <div className="border-t border-white/15 bg-black/20 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                      {slides[active].kicker}
                    </p>
                    <p className="mt-1 text-base font-semibold">{slides[active].headline}</p>
                    <p className="mt-1 text-sm text-white/80">{slides[active].body}</p>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActive((i) => (i - 1 + slides.length) % slides.length)}
                        className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                        aria-label="Previous slide"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => setActive((i) => (i + 1) % slides.length)}
                        className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                        aria-label="Next slide"
                      >
                        →
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPaused((p) => !p)}
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                      aria-label={paused ? "Resume slideshow" : "Pause slideshow"}
                      title={paused ? "Resume" : "Pause"}
                    >
                      {paused ? "Play" : "Pause"}
                    </button>
                  </div>
                </div>

                {/* Dots */}
                <div className="mt-4 flex items-center gap-2">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActive(idx)}
                      className={[
                        "h-2.5 rounded-full transition-all",
                        idx === active ? "w-7 bg-white" : "w-2.5 bg-white/40 hover:bg-white/60",
                      ].join(" ")}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <p className="mt-3 text-xs text-white/60">
                  Tip: hover to pause the slideshow.
                </p>
              </div>
            </div>

            {/* Small logo badge */}
            <div className="pointer-events-none absolute -left-3 -top-3 hidden sm:block">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-black/10">
                Swamp Spotter
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / STATS */}
      <section id="impact" className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <StatCard title="ID-first workflow" body="Guide → photo → submission. Fewer dead-end reports." />
          <StatCard title="Structured sightings" body="Consistent fields make data searchable and usable." />
          <StatCard title="Map-ready" body="Designed for a community view of locations over time." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-slate-600">
              A lightweight flow that feels friendly for users and useful for reviewers.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <StepCard n="01" title="Spot" body="Find a plant and take clear photos of leaves, stem, and fruit/flowers." />
            <StepCard n="02" title="Identify" body="Use the guide to compare key traits and confirm your best match." />
            <StepCard n="03" title="Submit" body="Upload the sighting with location and notes—then it’s ready for review." />
          </div>

          {/* Image placeholders row */}
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <ImagePlaceholder label="Placeholder: 'Spotting' photo" />
            <ImagePlaceholder label="Placeholder: 'Guide' screenshot" />
            <ImagePlaceholder label="Placeholder: 'Submission' screenshot" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Built to feel like a real product
              </h2>
              <p className="mt-3 text-slate-600">
                Clean hierarchy, consistent UI, and an experience you can demo confidently.
              </p>
            </div>

            <Link
              href="/map"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              🐊 Open the Map
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard title="Fast submissions" body="Optimized input flow with strong defaults and minimal friction." />
            <FeatureCard title="Plant guide UX" body="Search, filter, and open info without leaving the page." />
            <FeatureCard title="Quality signals" body="Threat level + tips help users prioritize what matters." />
            <FeatureCard title="Accessible UI" body="Keyboard-friendly patterns and readable contrast." />
            <FeatureCard title="Deploy-friendly" body="Works cleanly in Next.js with modern best practices." />
            <FeatureCard title="Extensible" body="Easy to add more plants, metadata, or moderation tools." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to explore the swamp?
              </h2>
              <p className="mt-3 text-white/75">
                Join a community effort to document wetland biodiversity—and help spot invasive
                plants early.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-white/90"
                >
                  🌱 Submit a Sighting
                </Link>
                <Link
                  href="/guide"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Browse the Guide
                </Link>
              </div>
            </div>

            {/* CTA image placeholder */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-white/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <div className="relative h-[260px] sm:h-[320px]">
                  {/* Replace with a real CTA image when ready */}
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                    <p className="text-sm font-semibold text-white/70">
                      Insert image: team/community in the field
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 px-5 py-4">
                  <p className="text-sm font-semibold">Make sightings count</p>
                  <p className="mt-1 text-sm text-white/70">
                    Strong photos + notes = better identification and faster action.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-14 border-t border-white/10 pt-8 text-sm text-white/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} Swamp Spotter</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
                <Link href="/privacy" className="hover:text-white">
                  Privacy
                </Link>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}

function StatCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function StepCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-extrabold text-white">
          {n}
        </div>
        <p className="text-lg font-bold text-slate-900">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-sky-100 ring-1 ring-slate-200" />
      <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
      <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <p className="mt-4 text-xs text-slate-500">
        Replace placeholders with real screenshots for an instant “product” feel.
      </p>
    </div>
  );
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white">
      <div className="flex h-44 items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      </div>
      <div className="border-t border-slate-200 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">Drop-in image slot</p>
        <p className="mt-1 text-sm text-slate-600">
          Put a real photo or screenshot here to elevate the page instantly.
        </p>
      </div>
    </div>
  );
}
