import type { CalendarEvent } from "../types";

export async function fetchCalendarEvents(date: string, userId: string): Promise<CalendarEvent[]> {
  const res = await fetch(`/api/calendar?date=${date}&userId=${userId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createCalendarEvent(params: {
  userId: string;
  title: string;
  start: string; // ISO datetime
  end: string;
  location?: string;
  target: "google" | "outlook";
}): Promise<{ success: boolean; error?: string }> {
  const res = await fetch("/api/calendar-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}
