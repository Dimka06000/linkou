import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state: userId } = req.query;
  const trimmedCode = ((code as string) || "").trim();
  const trimmedUserId = ((userId as string) || "").trim();
  if (!trimmedCode) return res.status(400).json({ error: "No code" });

  const baseUrl = (process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app").trim();

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: (process.env.GITHUB_OAUTH_CLIENT_ID || "").trim(),
      client_secret: (process.env.GITHUB_OAUTH_CLIENT_SECRET || "").trim(),
      code: trimmedCode,
    }),
  });

  const tokens = await tokenRes.json();
  if (tokens.error) return res.redirect(302, `${baseUrl}/integrations?error=github`);

  const supabase = createClient(
    (process.env.VITE_SUPABASE_URL || "").trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
  );

  if (trimmedUserId) {
    await supabase.from("integration_tokens").upsert({
      user_id: trimmedUserId,
      provider: "github",
      access_token: tokens.access_token,
      refresh_token: null,
      expires_at: null, // GitHub OAuth tokens don't expire
      metadata: { scope: tokens.scope, token_type: tokens.token_type },
    });
  }

  res.redirect(302, `${baseUrl}/integrations?connected=github`);
}
