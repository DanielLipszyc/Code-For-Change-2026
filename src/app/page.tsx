export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-teal-600 to-cyan-700 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to <span className="bg-gradient-to-r from-orange-400 to-sky-400 bg-clip-text text-transparent">Swamp</span> Spotter 🌿
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
            Discover and document plants in swamps and wetlands
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/map"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 transition-colors"
              href="/submit"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-white hover:bg-green-50 transition-colors"
            >
              Explore Map
              🌱 Submit Plant
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white/10 transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Spot Plants",
                description:
                  "Find and photograph plants in swamps, wetlands, and marshes",
                icon: "🔍",
              },
              {
                title: "Submit Sightings",
                description: "Upload your discoveries with location and details",
                icon: "📸",
              },
              {
                title: "Track & Learn",
                description: "Build your collection and learn about wetland ecosystems",
                icon: "🌿",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
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
            Join our community of plant enthusiasts and help document wetland biodiversity
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            🐊 Get Started
          </a>
        </div>
      </section>
    </div>
  );
}
