import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) return res.status(404).json({ error: "Railway not configured" });

  const response = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{ me { projects { edges { node { id name services { edges { node { name } } } } } } } }`,
    }),
  });
  const data = await response.json();

  const projects = (data.data?.me?.projects?.edges || []).map((e: any) => ({
    name: e.node.name,
    status: "active",
    services: (e.node.services?.edges || []).map((s: any) => s.node.name),
  }));

  res.json(projects);
}
