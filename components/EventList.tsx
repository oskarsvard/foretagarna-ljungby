import { CalendarEvent } from "@/lib/types";
import EventCard from "./EventCard";

function groupByMonth(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const date = new Date(event.date + "T00:00:00");
    const key = date.toLocaleDateString("sv-SE", { year: "numeric", month: "long" });
    const group = groups.get(key) || [];
    group.push(event);
    groups.set(key, group);
  }
  return groups;
}

export default function EventList({ events }: { events: CalendarEvent[] }) {
  const grouped = groupByMonth(events);

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([month, monthEvents]) => (
        <section key={month}>
          <h2 className="text-lg font-semibold text-gray-700 mb-3 capitalize">{month}</h2>
          <div className="space-y-2">
            {monthEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
