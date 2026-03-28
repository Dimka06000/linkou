import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return res.status(404).json({ error: "Vercel not configured" });

  const response = await fetch("https://api.vercel.com/v6/deployments?limit=10&target=production", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();

  const deployments = (data.deployments || []).map((d: any) => ({
    id: d.uid,
    name: d.name,
    url: d.url ? `https://${d.url}` : "",
    state: d.readyState || d.state,
    created: d.created,
  }));

  res.json(deployments);
}
