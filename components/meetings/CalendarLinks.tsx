"use client";

interface CalendarLinksProps {
  subject: string;
  date: number;
  startTime: string;
  endTime: string;
  note?: string;
  location?: string;
  meetingLink?: string;
}

function toISODateTime(dateMs: number, time: string): string {
  const d = new Date(dateMs);
  const [hours, minutes] = time.split(":").map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatDateForOutlook(dateMs: number, time: string): string {
  const d = new Date(dateMs);
  const [hours, minutes] = time.split(":").map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function CalendarLinks({ subject, date, startTime, endTime, note, location, meetingLink }: CalendarLinksProps) {
  const start = toISODateTime(date, startTime);
  const end = toISODateTime(date, endTime);
  const detailParts = [note, location ? `Location: ${location}` : "", meetingLink ? `Meeting Link: ${meetingLink}` : ""].filter(Boolean).join("\n");
  const details = encodeURIComponent(detailParts);
  const encodedSubject = encodeURIComponent(`EnviroConnect: ${subject}`);

  const googleUrl = `https://calendar.google.com/calendar/event?action=TEMPLATE&text=${encodedSubject}&dates=${start}/${end}&details=${details}&location=${encodeURIComponent(location || meetingLink || "")}`;

  const outlookStart = formatDateForOutlook(date, startTime);
  const outlookEnd = formatDateForOutlook(date, endTime);
  const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${encodedSubject}&startdt=${outlookStart}&enddt=${outlookEnd}&body=${details}`;

  const handleIcs = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EnviroConnect//Meeting//EN",
      "BEGIN:VEVENT",
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:EnviroConnect: ${subject}`,
      location ? `LOCATION:${location}` : "",
      meetingLink ? `URL:${meetingLink}` : "",
      note ? `DESCRIPTION:${note}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-${new Date(date).toISOString().split("T")[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ghostLinkClass =
    "text-xs font-medium border border-mist text-primary hover:bg-cloud rounded-lg px-2.5 py-1 transition-colors";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-custom">Add to:</span>
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={ghostLinkClass}
      >
        Google Calendar
      </a>
      <a
        href={outlookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={ghostLinkClass}
      >
        Outlook
      </a>
      <button
        onClick={handleIcs}
        className={ghostLinkClass}
      >
        Download .ics
      </button>
    </div>
  );
}
