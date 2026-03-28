import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state: userId } = req.query;
  if (!code) return res.status(400).json({ error: "No code" });

  const baseUrl = process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app";
  const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: code as string,
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      redirect_uri: `${baseUrl}/api/auth/outlook-callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();
  if (tokens.error) return res.redirect(302, `${baseUrl}/integrations?error=outlook`);

  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  if (userId) {
    await supabase.from("integration_tokens").upsert({
      user_id: userId as string,
      provider: "outlook",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    });
  }

  res.redirect(302, `${baseUrl}/integrations?connected=outlook`);
}
