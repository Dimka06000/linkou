import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

async function getGitHubToken(userId?: string): Promise<string | null> {
  // Try OAuth token from Supabase first
  if (userId && process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await supabase
      .from("integration_tokens")
      .select("access_token")
      .eq("user_id", userId)
      .eq("provider", "github")
      .single();
    if (data?.access_token) return data.access_token;
  }
  // Fallback to env var (for template mode or if no OAuth)
  return process.env.GITHUB_TOKEN || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = req.query.userId as string | undefined;
  const token = await getGitHubToken(userId);
  if (!token) return res.status(404).json({ error: "GitHub not configured" });

  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" };

  if (req.query.type === "commits" && req.query.repo) {
    const repo = req.query.repo as string;
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, { headers });
    const commits = await commitRes.json();
    return res.json((commits || []).map((c: any) => ({
      sha: c.sha?.substring(0, 7),
      message: c.commit?.message?.split("\n")[0] || "",
      date: c.commit?.author?.date || "",
      author: c.commit?.author?.name || "",
    })));
  }

  const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=10", { headers });
  const data = await response.json();

  const repos = (data || []).map((r: any) => ({
    name: r.name,
    url: r.html_url,
    description: r.description || "",
    language: r.language || "",
    stars: r.stargazers_count,
    updatedAt: r.updated_at,
    isPrivate: r.private,
  }));

  res.json(repos);
}
