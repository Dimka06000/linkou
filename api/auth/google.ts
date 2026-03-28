import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: "Google not configured" });
  const baseUrl = process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app";
  const redirectUri = `${baseUrl}/api/auth/google-callback`;
  const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.readonly");
  const state = (req.query.userId as string) || "";
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
  res.redirect(302, url);
}
