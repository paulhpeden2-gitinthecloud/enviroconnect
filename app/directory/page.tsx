import { DirectoryClient } from "./DirectoryClient";

export const metadata = {
  title: "Vendor Directory — EnviroConnect",
  description:
    "Browse pre-vetted environmental compliance vendors across the Pacific Northwest.",
};

export default function DirectoryPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Vendor Directory</h1>
          <p className="text-gray-300">
            Browse and filter pre-vetted environmental compliance vendors across
            the Pacific Northwest.
          </p>
        </div>
      </div>
      <DirectoryClient />
    </main>
  );
}
