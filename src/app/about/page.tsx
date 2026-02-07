export default function About() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            About Us
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Learn more about our mission and values
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              At Code For Change, we believe in the power of technology to
              transform lives and communities. Our mission is to develop
              innovative solutions that address real-world challenges and create
              positive social impact. We are committed to building accessible,
              sustainable, and impactful digital products.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Integrity",
                description:
                  "We uphold the highest standards of honesty and transparency in everything we do.",
              },
              {
                title: "Innovation",
                description:
                  "We constantly push boundaries and embrace new ideas to solve complex problems.",
              },
              {
                title: "Inclusivity",
                description:
                  "We design solutions that are accessible to everyone, regardless of their background.",
              },
              {
                title: "Impact",
                description:
                  "We measure success by the positive change we create in people's lives.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-400 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Our Team
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We are a diverse team of passionate developers, designers, and
              change-makers united by a common goal: using technology for good.
              Together, we bring a wealth of experience and a shared commitment
              to excellence.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
