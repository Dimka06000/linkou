import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: "GitHub OAuth not configured" });

  const baseUrl = process.env.VITE_APP_URL || "https://linkou-lemon.vercel.app";
  const redirectUri = `${baseUrl}/api/auth/github-callback`;
  const scope = "repo,read:user,read:org";
  const state = (req.query.userId as string) || "";

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  res.redirect(302, url);
}
