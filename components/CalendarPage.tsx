"use client";

import { useState } from "react";
import { CalendarEvent } from "@/lib/types";
import EventList from "./EventList";
import CalendarGrid from "./CalendarGrid";

type View = "list" | "calendar";

export default function CalendarPage({ events }: { events: CalendarEvent[] }) {
  const [view, setView] = useState<View>("list");

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setView("list")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === "list"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Lista
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === "calendar"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Kalender
        </button>
      </div>

      {view === "list" ? (
        <EventList events={events} />
      ) : (
        <CalendarGrid events={events} />
      )}
    </div>
  );
}
