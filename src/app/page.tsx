import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#136207] to-[#1B3FAB] text-white py-16 px-4 sm:px-6 lg:px-8">
        {/* Subtle background blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Animated Logo */}
          <div className="flex justify-center mb-6">
            <div
              className="relative 
                h-32 w-32 
                sm:h-36 sm:w-36 
                lg:h-40 lg:w-40 
                rounded-full
                shadow-[0_0_0_6px_rgba(255,255,255,0.12),0_18px_40px_rgba(0,0,0,0.25)]
                animate-[float_6s_ease-in-out_infinite]
                transition-transform duration-300 hover:scale-[1.03]
                motion-reduce:animate-none"
            >
              {/* Glow layer */}
              <div
                className="absolute inset-0 rounded-full bg-white/10 blur-lg
                animate-[pulseGlow_4.5s_ease-in-out_infinite]
                motion-reduce:animate-none"
              />

              <Image
                src="/logo.png"
                alt="Swamp Spotter logo"
                fill
                sizes="(max-width: 640px) 128px, (max-width: 1024px) 144px, 160px"
                className="rounded-full object-cover"
                priority
              />
            </div>
          </div>


          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-orange-400 to-sky-400 bg-clip-text text-transparent">
              Swamp
            </span>{" "}
            Spotter 🌿
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
            Discover and document plants in swamps and wetlands
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/submit"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-white hover:bg-green-50 transition-colors"
            >
              🌱 Submit Plant
            </Link>

            <Link
              href="/about"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white/10 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              {
                title: "Spot Plants",
                description:
                  "Find and photograph plants in swamps, wetlands, and marshes",
                icon: "🔍",
                href: "/guide",
              },
              {
                title: "Submit Sightings",
                description: "Upload your discoveries with location and details",
                icon: "📸",
                href: "/submit",
              },
            ].map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                aria-label={feature.title}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:underline">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Ready to Explore the Swamp?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Join our community of plant enthusiasts and help document wetland
            biodiversity
          </p>

          <Link
            href="/map"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            🐊 Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
