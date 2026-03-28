import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

async function fetchGoogleEvents(accessToken: string, startDate: string, endDate: string) {
  const timeMin = new Date(startDate + "T00:00:00").toISOString();
  const timeMax = new Date(endDate + "T23:59:59").toISOString();
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

async function fetchOutlookEvents(accessToken: string, startDate: string, endDate: string) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${startDate}T00:00:00&endDateTime=${endDate}T23:59:59&$orderby=start/dateTime`,
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
  // Support both legacy `date` param and new `startDate`/`endDate` params
  const today = new Date().toISOString().split("T")[0];
  const legacyDate = req.query.date as string | undefined;
  const startDate = (req.query.startDate as string) || legacyDate || today;
  const endDate = (req.query.endDate as string) || legacyDate || startDate;
  const userId = req.query.userId as string;
  if (!userId) return res.json([]);

  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: tokens } = await supabase
    .from("integration_tokens").select("*")
    .eq("user_id", userId).in("provider", ["google", "outlook"]);

  const events: any[] = [];
  for (const token of tokens || []) {
    if (token.provider === "google") events.push(...await fetchGoogleEvents(token.access_token, startDate, endDate));
    else if (token.provider === "outlook") events.push(...await fetchOutlookEvents(token.access_token, startDate, endDate));
  }

  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  res.json(events);
}
