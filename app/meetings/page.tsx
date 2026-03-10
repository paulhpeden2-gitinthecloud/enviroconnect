import { MeetingsClient } from "./MeetingsClient";

export default function MeetingsPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="bg-navy text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Meetings</h1>
          <p className="text-gray-300 text-sm mt-1">
            Schedule and manage your meetings
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <MeetingsClient />
      </div>
    </main>
  );
}
