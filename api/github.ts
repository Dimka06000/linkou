import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(404).json({ error: "GitHub not configured" });

  const response = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=5",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  const data = await response.json();

  const repos = data.map((r: any) => ({
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
