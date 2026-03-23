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

  await sql`DELETE FROM events`;

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
