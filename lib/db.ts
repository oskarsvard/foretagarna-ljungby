import { sql } from "@vercel/postgres";
import { CalendarEvent } from "./types";

export async function createEventsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date DATE NOT NULL,
      end_date DATE,
      time TEXT,
      location TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function getEvents(): Promise<CalendarEvent[]> {
  const { rows } = await sql<CalendarEvent>`
    SELECT id, title, date::text, end_date::text, time, location, description
    FROM events
    ORDER BY date ASC
  `;
  return rows;
}
