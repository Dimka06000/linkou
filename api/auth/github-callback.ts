import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state: userId } = req.query;
  if (!code) return res.status(400).json({ error: "No code" });

  const baseUrl = process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app";

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code: code as string,
    }),
  });

  const tokens = await tokenRes.json();
  if (tokens.error) return res.redirect(302, `${baseUrl}/integrations?error=github`);

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (userId) {
    await supabase.from("integration_tokens").upsert({
      user_id: userId as string,
      provider: "github",
      access_token: tokens.access_token,
      refresh_token: null,
      expires_at: null, // GitHub OAuth tokens don't expire
      metadata: { scope: tokens.scope, token_type: tokens.token_type },
    });
  }

  res.redirect(302, `${baseUrl}/integrations?connected=github`);
}
