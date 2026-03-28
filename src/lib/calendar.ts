import type { CalendarEvent } from "../types";

export async function fetchCalendarEvents(date: string, userId: string): Promise<CalendarEvent[]> {
  const res = await fetch(`/api/calendar?date=${date}&userId=${userId}`);
  if (!res.ok) return [];
  return res.json();
}
