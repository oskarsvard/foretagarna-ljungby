# Ljungby Företagarna — Kalenderapp

## Syfte

En enkel, lösenordsskyddad webbapp för Ljungby Företagarna där medlemmar kan se kommande datum och aktiviteter. Appen deployas till Vercel.

## Tech stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- Vercel Postgres (`@vercel/postgres`)
- `jose` för JWT-signering av session-cookie
- Deploy: Vercel

## Autentisering

Delat lösenord — alla medlemmar använder samma kod.

### Flöde

1. Middleware (`middleware.ts`) körs på alla requests utom `/login` och statiska filer.
2. Middleware kontrollerar om en giltig JWT-cookie (`session`) finns.
3. Om inte → redirect till `/login`.
4. På `/login` skickar användaren lösenordet via ett formulär (POST till en Server Action).
5. Server Action jämför mot `APP_PASSWORD` (env-variabel).
6. Vid rätt lösenord: skapar en JWT (signerad med `JWT_SECRET` env-variabel), sätter den som httpOnly-cookie, redirect till `/`.
7. JWT har 30 dagars utgångstid.

### Env-variabler (auth)

- `APP_PASSWORD` — det delade lösenordet
- `JWT_SECRET` — hemlig nyckel för JWT-signering

## Databas

Vercel Postgres (Neon). En tabell.

### Schema: `events`

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  end_date DATE,
  time TEXT,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

- `date`: startdatum (obligatoriskt)
- `end_date`: slutdatum för flerdagarsevents (valfritt, NULL för endagars)
- `time`: fritext för klockslag, t.ex. "kl. 12:00-14:00"
- `location`: plats, t.ex. "Residenset Växjö"
- `description`: extra detaljer

## Sidor

### `/login`

- Centrerat formulär med lösenordsfält och "Logga in"-knapp.
- Visar felmeddelande vid fel lösenord.
- Enkel, ren design med Företagarna-känsla.

### `/` (Kalendersida)

Huvudsidan. Toggle mellan två vyer:

#### Listvy (default)

- Kronologisk lista med alla kommande events.
- Grupperade per månad (rubrik: "Mars 2026", "April 2026" etc.).
- Varje event visar: datum, titel, tid (om finns), plats (om finns).
- Passerade events döljs eller tonas ner.

#### Kalendervy

- Månadsgrid (mån–sön).
- Navigering framåt/bakåt mellan månader.
- Dagar med events markeras med en prick/indikator.
- Klick på en dag med event visar detaljer (inline eller modal).

### Toggle

En enkel knappgrupp (List | Kalender) högst upp på sidan för att växla vy. State hålls client-side.

## Seed-data

Ett seed-script (`scripts/seed.ts`) som körs manuellt för att populera databasen med de 18 datumen:

| Datum | Titel | Tid | Plats |
|-------|-------|-----|-------|
| 2026-03-31 | Sista dag att skicka in årsmötesprotokoll till regionkontoret | | |
| 2026-04-16 | On-boarding för nya förtroendevalda GÖS | kl. 07:00, 12:00 och 18:00 | |
| 2026-04-27 | Regional valaktivitet Kronoberg | | |
| 2026-04-30 | Lokala vinnare Årets Unga Företagare och Årets Företagare skickade till regionkontoret | | |
| 2026-05-04 | Regional valaktivitet Östergötland | | |
| 2026-05-08 | Regional valaktivitet Kalmar län | | |
| 2026-05-11 | Regional valaktivitet Jönköpings län | | |
| 2026-05-19 | Digitala utskott inför kongressen | | |
| 2026-05-20 | Digitala utskott inför kongressen (dag 2) | | |
| 2026-05-28 | Kongress i Borås | | Borås |
| 2026-05-29 | Kongress i Borås (dag 2) | | Borås |
| 2026-06-04 | Golftävling GÖS, Ombergs Golf & Resort | | Ombergs Golf & Resort |
| 2026-06-05 | Golftävling GÖS, Ombergs Golf & Resort (dag 2) | | Ombergs Golf & Resort |
| 2026-06-08 | Utdelning Årets Unga Företagare & Årets Företagare i Kronoberg | | Residenset, Växjö |
| 2026-08-14 | Utdelning Årets Företagare Jönköpings län | kl. 12:00-14:00 | Residenset, Jönköping |
| 2026-08-25 | Årets Företagare Kalmar län | lunch | Residenset, Kalmar |
| 2026-08-26 | Gerillakampanjdagen, Valet 2026 | | |
| 2026-09-03 | Årets Företagare Östergötland | middag kl. 19:00 | Slottet |
| 2026-10-09 | Höstkonferens för förtroendevalda | | Stockholm |
| 2026-10-10 | Årets Företagare Sverige | | |
| 2026-11-20 | Storregional kickoff GÖS | | Isaberg Mountain Resort |
| 2026-11-21 | Storregional kickoff GÖS (dag 2) | | Isaberg Mountain Resort |

Flerdagarsevents (kongress, golf, kickoff, utskott) modelleras med `end_date` istället för separata rader. Det ger 18 rader i databasen:

| Datum | End date | Titel |
|-------|----------|-------|
| 2026-03-31 | | Sista dag att skicka in årsmötesprotokoll... |
| 2026-04-16 | | On-boarding för nya förtroendevalda GÖS |
| 2026-04-27 | | Regional valaktivitet Kronoberg |
| 2026-04-30 | | Lokala vinnare Årets Unga Företagare... |
| 2026-05-04 | | Regional valaktivitet Östergötland |
| 2026-05-08 | | Regional valaktivitet Kalmar län |
| 2026-05-11 | | Regional valaktivitet Jönköpings län |
| 2026-05-19 | 2026-05-20 | Digitala utskott inför kongressen |
| 2026-05-28 | 2026-05-29 | Kongress i Borås |
| 2026-06-04 | 2026-06-05 | Golftävling GÖS |
| 2026-06-08 | | Utdelning Årets Unga Företagare & Årets Företagare i Kronoberg |
| 2026-08-14 | | Utdelning Årets Företagare Jönköpings län |
| 2026-08-25 | | Årets Företagare Kalmar län |
| 2026-08-26 | | Gerillakampanjdagen, Valet 2026 |
| 2026-09-03 | | Årets Företagare Östergötland |
| 2026-10-09 | | Höstkonferens för förtroendevalda |
| 2026-10-10 | | Årets Företagare Sverige |
| 2026-11-20 | 2026-11-21 | Storregional kickoff GÖS |

## Projektstruktur

```
foretagarna-ljungby/
├── app/
│   ├── layout.tsx          # Root layout med Tailwind
│   ├── page.tsx            # Kalendersida (skyddad)
│   ├── login/
│   │   └── page.tsx        # Login-sida
│   └── actions/
│       └── auth.ts         # Server Actions för login/logout
├── components/
│   ├── EventList.tsx       # Listvyn
│   ├── CalendarGrid.tsx    # Kalendervyn
│   ├── EventCard.tsx       # Enskilt event (delas av båda vyer)
│   └── ViewToggle.tsx      # List/Kalender-toggle
├── lib/
│   ├── db.ts               # Databasanslutning och queries
│   └── auth.ts             # JWT-hjälpfunktioner
├── middleware.ts            # Auth-middleware
├── scripts/
│   └── seed.ts             # Seed-script för initial data
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Avgränsningar (v1)

- Ingen admin-sida för att lägga till/redigera events (görs direkt i DB eller via seed-script).
- Ingen sökning eller filtrering.
- Inga notifikationer.
- Ingen responsiv mobilmeny (Tailwind responsive räcker).
