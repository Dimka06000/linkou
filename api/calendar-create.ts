import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

async function createGoogleEvent(accessToken: string, event: any) {
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: event.title,
      location: event.location || "",
      start: { dateTime: event.start, timeZone: "Europe/Paris" },
      end: { dateTime: event.end, timeZone: "Europe/Paris" },
    }),
  });
  return res.json();
}

async function createOutlookEvent(accessToken: string, event: any) {
  const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: event.title,
      location: { displayName: event.location || "" },
      start: { dateTime: event.start, timeZone: "Europe/Paris" },
      end: { dateTime: event.end, timeZone: "Europe/Paris" },
    }),
  });
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { userId, title, start, end, location, target } = req.body;
  // target = "google" | "outlook"

  if (!userId || !title || !start || !end || !target) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const supabase = createClient(
    (process.env.VITE_SUPABASE_URL || "").trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
  );

  const { data: token } = await supabase
    .from("integration_tokens")
    .select("access_token")
    .eq("user_id", userId)
    .eq("provider", target)
    .single();

  if (!token?.access_token) {
    return res.status(400).json({ error: `${target} not connected` });
  }

  try {
    let result;
    if (target === "google") {
      result = await createGoogleEvent(token.access_token, { title, start, end, location });
    } else {
      result = await createOutlookEvent(token.access_token, { title, start, end, location });
    }

    if (result.error) {
      return res.status(400).json({ error: result.error.message || "Failed to create event" });
    }

    res.json({ success: true, event: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
