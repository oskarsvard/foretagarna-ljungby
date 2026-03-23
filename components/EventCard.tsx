import { CalendarEvent } from "@/lib/types";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export default function EventCard({ event }: { event: CalendarEvent }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = new Date(event.date + "T00:00:00") < today;

  return (
    <div className={`flex gap-4 p-4 rounded-lg border ${isPast ? "opacity-50" : "bg-white"}`}>
      <div className="flex-shrink-0 text-sm font-medium text-blue-600 w-20">
        {formatDate(event.date)}
        {event.end_date && (
          <span className="text-gray-400"> – {formatDate(event.end_date)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900">{event.title}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
          {event.time && <span>{event.time}</span>}
          {event.location && <span>{event.location}</span>}
        </div>
        {event.description && (
          <p className="mt-1 text-sm text-gray-500">{event.description}</p>
        )}
      </div>
    </div>
  );
}
