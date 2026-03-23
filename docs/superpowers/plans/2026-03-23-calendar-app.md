# Företagarna Ljungby Kalenderapp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a password-protected calendar web app for Ljungby Företagarna showing important dates for 2026.

**Architecture:** Next.js 15 App Router with Vercel Postgres. Shared password auth via JWT cookie checked in middleware. Two calendar views (list and grid) rendered as client components, data fetched server-side.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, @vercel/postgres, jose (JWT)

**Spec:** `docs/superpowers/specs/2026-03-23-calendar-app-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `app/layout.tsx` | Root layout, global styles, font |
| `app/page.tsx` | Main calendar page (server component, fetches events, renders client view) |
| `app/login/page.tsx` | Login form page |
| `app/actions/auth.ts` | Server Actions: login, logout |
| `components/CalendarPage.tsx` | Client component: manages view toggle state, renders list or grid |
| `components/EventList.tsx` | List view: events grouped by month |
| `components/CalendarGrid.tsx` | Calendar grid view: month navigation, day cells with event indicators |
| `components/EventCard.tsx` | Single event display (shared by both views) |
| `lib/auth.ts` | JWT sign/verify helpers using jose |
| `lib/db.ts` | Database queries (getEvents, etc.) |
| `lib/types.ts` | Shared TypeScript types (Event interface) |
| `middleware.ts` | Auth check on all protected routes |
| `scripts/seed.ts` | Idempotent seed script with all 18 events |
| `.env.local.example` | Template for required env vars |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`, `.env.local.example`, `.gitignore`

- [ ] **Step 1: Create Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Run from project root. Since files already exist (README, docs), accept overwrites for generated files.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install jose @vercel/postgres
```

- [ ] **Step 3: Create `.env.local.example`**

Create `.env.local.example` with:
```
APP_PASSWORD=your-shared-password-here
JWT_SECRET=generate-a-random-secret-here
POSTGRES_URL=your-vercel-postgres-url
```

- [ ] **Step 4: Update `.gitignore`**

Ensure `.env.local` is in `.gitignore` (create-next-app should handle this).

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js dev server starts on localhost:3000, default page renders.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js project with dependencies"
```

---

### Task 2: Types & Auth Helpers

**Files:**
- Create: `lib/types.ts`, `lib/auth.ts`

- [ ] **Step 1: Create shared types**

Create `lib/types.ts`:
```typescript
export interface CalendarEvent {
  id: number;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  end_date: string | null;
  time: string | null;
  location: string | null;
  description: string | null;
}
```

- [ ] **Step 2: Create auth helpers**

Create `lib/auth.ts`:
```typescript
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = "session";

export async function createSession() {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/ && git commit -m "feat: add types and JWT auth helpers"
```

---

### Task 3: Auth Middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware**

Create `middleware.ts` in project root:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - /_next (Next.js internals)
     * - /favicon.ico, /icons, etc.
     */
    "/((?!login|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

Note: Middleware runs on the Edge runtime and cannot use `cookies()` from `next/headers`. It reads cookies from `NextRequest` directly and uses `jose` (which is Edge-compatible) for JWT verification.

- [ ] **Step 2: Commit**

```bash
git add middleware.ts && git commit -m "feat: add auth middleware for route protection"
```

---

### Task 4: Login Page & Auth Actions

**Files:**
- Create: `app/actions/auth.ts`, `app/login/page.tsx`

- [ ] **Step 1: Create server actions for login/logout**

Create `app/actions/auth.ts`:
```typescript
"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth";

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const password = formData.get("password") as string;
  if (password !== process.env.APP_PASSWORD) {
    return { error: "Fel lösenord. Försök igen." };
  }
  await createSession();
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
```

- [ ] **Step 2: Create login page**

Create `app/login/page.tsx`:
```tsx
"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-2">
          Företagarna Ljungby
        </h1>
        <p className="text-gray-500 text-center mb-6">
          Logga in för att se kalendern
        </p>
        <form action={formAction}>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Lösenord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          {state?.error && (
            <p className="text-red-600 text-sm mb-4">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Loggar in..." : "Logga in"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify login flow manually**

1. Set `APP_PASSWORD=test123` and `JWT_SECRET=dev-secret-at-least-32-chars-long` in `.env.local`
2. Run `npm run dev`
3. Visit `http://localhost:3000` → should redirect to `/login`
4. Enter wrong password → error message shown
5. Enter `test123` → redirect to `/` (will show default Next.js page for now)

- [ ] **Step 4: Commit**

```bash
git add app/actions/ app/login/ && git commit -m "feat: add login page and auth server actions"
```

---

### Task 5: Database Schema & Seed Script

**Files:**
- Create: `lib/db.ts`, `scripts/seed.ts`

- [ ] **Step 1: Create database query layer**

Create `lib/db.ts`:
```typescript
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
```

Note: `date::text` casts the DATE column to text (ISO format) to avoid timezone issues with JS Date objects.

- [ ] **Step 2: Create seed script**

Create `scripts/seed.ts`:
```typescript
import { sql } from "@vercel/postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const events = [
  { date: "2026-03-31", end_date: null, title: "Sista dag att skicka in årsmötesprotokoll till regionkontoret", time: null, location: null, description: "En del för att få engagemangsbonus" },
  { date: "2026-04-16", end_date: null, title: "On-boarding för nya förtroendevalda GÖS", time: "kl. 07:00, 12:00 och 18:00", location: null, description: null },
  { date: "2026-04-27", end_date: null, title: "Regional valaktivitet Kronoberg", time: null, location: null, description: null },
  { date: "2026-04-30", end_date: null, title: "Lokala vinnare Årets Unga Företagare och Årets Företagare skickade till regionkontoret", time: null, location: null, description: null },
  { date: "2026-05-04", end_date: null, title: "Regional valaktivitet Östergötland", time: null, location: null, description: null },
  { date: "2026-05-08", end_date: null, title: "Regional valaktivitet Kalmar län", time: null, location: null, description: null },
  { date: "2026-05-11", end_date: null, title: "Regional valaktivitet Jönköpings län", time: null, location: null, description: null },
  { date: "2026-05-19", end_date: "2026-05-20", title: "Digitala utskott inför kongressen", time: null, location: null, description: null },
  { date: "2026-05-28", end_date: "2026-05-29", title: "Kongress i Borås", time: null, location: "Borås", description: null },
  { date: "2026-06-04", end_date: "2026-06-05", title: "Golftävling GÖS", time: null, location: "Ombergs Golf & Resort", description: "Ett samarbete Volvo & Rejmes" },
  { date: "2026-06-08", end_date: null, title: "Utdelning Årets Unga Företagare & Årets Företagare i Kronoberg", time: null, location: "Residenset, Växjö", description: null },
  { date: "2026-08-14", end_date: null, title: "Utdelning Årets Företagare Jönköpings län", time: "kl. 12:00-14:00", location: "Residenset, Jönköping", description: null },
  { date: "2026-08-25", end_date: null, title: "Årets Företagare Kalmar län", time: "lunch", location: "Residenset, Kalmar", description: null },
  { date: "2026-08-26", end_date: null, title: "Gerillakampanjdagen, Valet 2026", time: null, location: null, description: null },
  { date: "2026-09-03", end_date: null, title: "Årets Företagare Östergötland", time: "middag kl. 19:00", location: "Slottet", description: null },
  { date: "2026-10-09", end_date: null, title: "Höstkonferens för förtroendevalda", time: null, location: "Stockholm", description: null },
  { date: "2026-10-10", end_date: null, title: "Årets Företagare Sverige", time: null, location: null, description: null },
  { date: "2026-11-20", end_date: "2026-11-21", title: "Storregional kickoff GÖS", time: null, location: "Isaberg Mountain Resort", description: null },
];

async function seed() {
  // Create table
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

  // Clear existing data
  await sql`DELETE FROM events`;

  // Insert all events
  for (const e of events) {
    await sql`
      INSERT INTO events (title, date, end_date, time, location, description)
      VALUES (${e.title}, ${e.date}, ${e.end_date}, ${e.time}, ${e.location}, ${e.description})
    `;
  }

  console.log(`Seeded ${events.length} events`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
```

- [ ] **Step 3: Install dotenv for seed script**

```bash
npm install --save-dev dotenv tsx
```

- [ ] **Step 4: Add seed script to package.json**

Add to `scripts` in `package.json`:
```json
"seed": "tsx scripts/seed.ts"
```

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts scripts/ package.json package-lock.json && git commit -m "feat: add database layer and seed script with 18 events"
```

---

### Task 6: Main Page with List View

**Files:**
- Create: `components/EventCard.tsx`, `components/EventList.tsx`, `components/CalendarPage.tsx`
- Modify: `app/page.tsx`, `app/layout.tsx`

- [ ] **Step 1: Create EventCard component**

Create `components/EventCard.tsx`:
```tsx
import { CalendarEvent } from "@/lib/types";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export default function EventCard({ event }: { event: CalendarEvent }) {
  const isPast = new Date(event.date + "T00:00:00") < new Date(new Date().toDateString());

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
```

- [ ] **Step 2: Create EventList component**

Create `components/EventList.tsx`:
```tsx
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
```

- [ ] **Step 3: Create CalendarPage client component**

Create `components/CalendarPage.tsx`:
```tsx
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
      {/* View Toggle */}
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
```

Note: `CalendarGrid` is created in Task 7. For now, create a placeholder so this compiles:

Create `components/CalendarGrid.tsx` (placeholder):
```tsx
import { CalendarEvent } from "@/lib/types";

export default function CalendarGrid({ events }: { events: CalendarEvent[] }) {
  return <div className="text-gray-500">Kalendervy kommer snart...</div>;
}
```

- [ ] **Step 4: Update root layout**

Replace `app/layout.tsx` content with:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Företagarna Ljungby",
  description: "Viktiga datum och aktiviteter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Update main page**

Replace `app/page.tsx` with:
```tsx
import { getEvents } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import CalendarPage from "@/components/CalendarPage";

export default async function Home() {
  const events = await getEvents();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Företagarna Ljungby</h1>
          <p className="text-gray-500">Viktiga datum 2026</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logga ut
          </button>
        </form>
      </header>
      <CalendarPage events={events} />
    </div>
  );
}
```

- [ ] **Step 6: Verify list view renders locally**

Requires a database connection. If no Vercel Postgres yet, verify at least that the dev server starts without runtime errors. The page will error on DB fetch — that's expected until the database is connected.

```bash
npm run dev
```

- [ ] **Step 7: Commit**

```bash
git add app/ components/ && git commit -m "feat: add main page with event list view and logout"
```

---

### Task 7: Calendar Grid View

**Files:**
- Modify: `components/CalendarGrid.tsx`

- [ ] **Step 1: Implement CalendarGrid**

Replace the placeholder `components/CalendarGrid.tsx` with:
```tsx
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
      {/* Month Navigation */}
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

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-50 p-2 min-h-[3rem]" />
        ))}

        {/* Day cells */}
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

      {/* Selected Date Events */}
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
```

- [ ] **Step 2: Verify calendar renders**

```bash
npm run dev
```

Visit localhost:3000, toggle to "Kalender" view. Verify:
- Month grid renders with correct weekday alignment
- Navigation between months works
- Events show dots on their dates (requires DB connection)

- [ ] **Step 3: Commit**

```bash
git add components/CalendarGrid.tsx && git commit -m "feat: add calendar grid view with month navigation"
```

---

### Task 8: Clean Up & Global Styles

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Clean up globals.css**

Replace `app/globals.css` with minimal Tailwind setup (remove any default Next.js demo styles):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Verify everything looks right**

```bash
npm run dev
```

Check both login page and main page (both views). Everything should render cleanly.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css && git commit -m "chore: clean up global styles"
```

---

### Task 9: Deploy Setup

**Files:**
- No new files, Vercel config

- [ ] **Step 1: Build check**

```bash
npm run build
```

Should build without errors (DB calls will fail at build time — that's fine, the page uses dynamic rendering by default since it calls `cookies()`).

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 3: Connect to Vercel**

1. Go to vercel.com → Import project → select `oskarsvard/foretagarna-ljungby`
2. Add Vercel Postgres integration (Storage → Create → Postgres)
3. Set environment variables: `APP_PASSWORD`, `JWT_SECRET`
4. Deploy

- [ ] **Step 4: Run seed script**

After Vercel Postgres is connected, copy the `POSTGRES_URL` to `.env.local` and run:
```bash
npm run seed
```

Expected output: `Seeded 18 events`

- [ ] **Step 5: Verify production**

Visit the Vercel deployment URL:
1. Should redirect to `/login`
2. Enter password → see calendar with all 18 events
3. Both list and calendar views work
4. Logout works
