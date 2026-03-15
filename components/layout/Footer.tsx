import Link from "next/link";

const columns = [
  {
    title: "Directory",
    links: [
      { label: "Browse All", href: "/directory" },
      { label: "By Service", href: "/directory" },
      { label: "By Region", href: "/directory" },
    ],
  },
  {
    title: "For Vendors",
    links: [
      { label: "Create Profile", href: "/sign-up" },
      { label: "Vendor Dashboard", href: "/dashboard/vendor" },
      { label: "RFQ Board", href: "/rfq" },
      { label: "How It Works", href: "/#how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/about#contact" },
      { label: "FAQ", href: "/about#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-primary border-t-2 border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              EnviroConnect
            </Link>
            <p className="text-slate-custom text-sm mt-3 leading-relaxed">
              PNW Environmental Vendor Directory
            </p>
            <p className="text-slate-custom text-sm mt-4">
              contact@enviroconnect.com
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-white font-semibold text-sm mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-custom hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-slate-custom text-sm text-center">
            &copy; {new Date().getFullYear()} EnviroConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
