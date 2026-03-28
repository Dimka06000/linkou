import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import type { CalendarEvent } from "../types";

export function useCalendar(startDate: string, endDate?: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const end = endDate || startDate;

  useEffect(() => {
    if (!user) { setEvents([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/calendar?startDate=${startDate}&endDate=${end}&userId=${user.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [startDate, end, user]);

  return { events, loading };
}
