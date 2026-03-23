import { getEvents } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import CalendarPage from "@/components/CalendarPage";

export const dynamic = "force-dynamic";

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
