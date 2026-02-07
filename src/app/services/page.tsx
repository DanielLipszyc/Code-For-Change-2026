export default function Services() {
  const services = [
    {
      title: "Web Development",
      description:
        "Custom web applications built with modern frameworks and best practices. Responsive, fast, and user-friendly.",
      icon: "🌐",
      features: ["React & Next.js", "Progressive Web Apps", "API Development"],
    },
    {
      title: "Mobile Solutions",
      description:
        "Cross-platform mobile applications that deliver native-like experiences on iOS and Android.",
      icon: "📱",
      features: [
        "React Native",
        "Mobile-First Design",
        "Offline Capabilities",
      ],
    },
    {
      title: "Cloud Services",
      description:
        "Scalable cloud infrastructure and deployment solutions to power your applications.",
      icon: "☁️",
      features: ["AWS & Azure", "Serverless Architecture", "Auto-scaling"],
    },
    {
      title: "Data Analytics",
      description:
        "Transform your data into actionable insights with our analytics and visualization services.",
      icon: "📊",
      features: ["Data Visualization", "Business Intelligence", "Reporting"],
    },
    {
      title: "UI/UX Design",
      description:
        "User-centered design that creates intuitive and engaging digital experiences.",
      icon: "🎨",
      features: ["User Research", "Prototyping", "Design Systems"],
    },
    {
      title: "Consulting",
      description:
        "Expert guidance to help you navigate technology decisions and digital transformation.",
      icon: "💼",
      features: [
        "Technology Strategy",
        "Architecture Review",
        "Team Training",
      ],
    },
  ];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Our Services
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Comprehensive technology solutions tailored to your needs
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm text-gray-500 dark:text-gray-500"
                    >
                      <svg
                        className="w-4 h-4 mr-2 text-primary-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 pb-6">
                <button className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            Let&apos;s discuss how we can help bring your ideas to life
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-medium rounded-md text-white hover:bg-white hover:text-primary-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
