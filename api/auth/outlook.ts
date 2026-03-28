import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = (process.env.OUTLOOK_CLIENT_ID || "").trim();
  if (!clientId) return res.status(500).json({ error: "Outlook not configured" });
  const baseUrl = (process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app").trim();
  const redirectUri = `${baseUrl}/api/auth/outlook-callback`;
  const scope = encodeURIComponent("Calendars.Read offline_access User.Read");
  const state = ((req.query.userId as string) || "").trim();
  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;
  res.redirect(302, url);
}
