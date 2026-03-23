export interface CalendarEvent {
  id: number;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  end_date: string | null;
  time: string | null;
  location: string | null;
  description: string | null;
}
