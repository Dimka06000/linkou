import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import type { CalendarEvent } from "../types";

export function useCalendar(date: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setEvents([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/calendar?date=${date}&userId=${user.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [date, user]);

  return { events, loading };
}
