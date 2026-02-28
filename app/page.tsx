import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Browse the Directory",
    description:
      "Search by service type, region, or certification. Every vendor is pre-vetted.",
  },
  {
    number: "02",
    title: "Review Profiles",
    description:
      "See certifications, service areas, descriptions, and contact info — all in one place.",
  },
  {
    number: "03",
    title: "Connect Directly",
    description:
      "Reach out to qualified vendors without cold calls or middlemen.",
  },
];

const services = [
  "Stormwater Management",
  "Dangerous Waste Compliance",
  "Air Quality / Emissions",
  "Spill Prevention (SPCC)",
  "Refrigerant Management",
  "Environmental Site Assessments",
  "Asbestos / Lead Abatement",
  "Emergency Response / HAZMAT",
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Find Environmental Compliance Vendors You Can Trust
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            A curated directory of pre-vetted environmental consultants and
            service providers across the Pacific Northwest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/directory"
              className="bg-green hover:bg-green-light text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
            >
              Browse Vendors
            </Link>
            <Link
              href="/sign-up"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors border border-white/20"
            >
              List Your Services
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-navy text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Skip the Google rabbit holes and cold calls. Find qualified
            environmental vendors in minutes.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl font-bold text-green opacity-40 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-navy mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">
            Environmental Services Covered
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <div
                key={service}
                className="border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 text-center hover:border-green hover:text-green transition-colors"
              >
                {service}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="bg-navy py-16 px-4 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Are You a Vendor?</h2>
          <p className="text-gray-300 mb-8">
            Get in front of qualified facility managers who are actively
            looking for your services.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-green hover:bg-green-light text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Create Your Free Profile
          </Link>
        </div>
      </section>
    </main>
  );
}
