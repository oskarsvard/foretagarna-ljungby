"use client";

import { useState } from "react";
import { CalendarEvent } from "@/lib/types";
import EventCard from "./EventCard";

const WEEKDAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function getEventsForDate(events: CalendarEvent[], dateStr: string): CalendarEvent[] {
  return events.filter((e) => {
    const start = e.date;
    const end = e.end_date || e.date;
    return dateStr >= start && dateStr <= end;
  });
}

function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString("sv-SE", { year: "numeric", month: "long" });
}

export default function CalendarGrid({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const todayStr = today.toISOString().split("T")[0];

  const selectedEvents = selectedDate ? getEventsForDate(events, selectedDate) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
          ←
        </button>
        <h2 className="text-lg font-semibold text-gray-700 capitalize">
          {formatMonthYear(year, month)}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-50 p-2 min-h-[3rem]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = getEventsForDate(events, dateStr);
          const hasEvents = dayEvents.length > 0;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={day}
              onClick={() => hasEvents ? setSelectedDate(isSelected ? null : dateStr) : undefined}
              className={`bg-white p-2 min-h-[3rem] text-left transition-colors ${
                hasEvents ? "cursor-pointer hover:bg-blue-50" : "cursor-default"
              } ${isSelected ? "bg-blue-50 ring-2 ring-blue-500 ring-inset" : ""}`}
            >
              <span className={`text-sm ${isToday ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center" : "text-gray-700"}`}>
                {day}
              </span>
              {hasEvents && (
                <div className="flex gap-0.5 mt-1">
                  {dayEvents.map((e) => (
                    <div key={e.id} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && selectedEvents.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-500">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("sv-SE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
          {selectedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
