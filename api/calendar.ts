import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

async function fetchGoogleEvents(accessToken: string, date: string) {
  const timeMin = new Date(date + "T00:00:00").toISOString();
  const timeMax = new Date(date + "T23:59:59").toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items || []).map((e: any) => ({
    id: e.id, title: e.summary || "(Sans titre)",
    start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date,
    location: e.location || "", source: "google" as const,
  }));
}

async function fetchOutlookEvents(accessToken: string, date: string) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${date}T00:00:00&endDateTime=${date}T23:59:59&$orderby=start/dateTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.value || []).map((e: any) => ({
    id: e.id, title: e.subject || "(Sans titre)",
    start: e.start?.dateTime, end: e.end?.dateTime,
    location: e.location?.displayName || "", source: "outlook" as const,
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
  const userId = req.query.userId as string;
  if (!userId) return res.json([]);

  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: tokens } = await supabase
    .from("integration_tokens").select("*")
    .eq("user_id", userId).in("provider", ["google", "outlook"]);

  const events: any[] = [];
  for (const token of tokens || []) {
    if (token.provider === "google") events.push(...await fetchGoogleEvents(token.access_token, date));
    else if (token.provider === "outlook") events.push(...await fetchOutlookEvents(token.access_token, date));
  }

  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  res.json(events);
}
