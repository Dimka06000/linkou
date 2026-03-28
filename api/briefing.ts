import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon apres-midi" : "Bonsoir";
  const summary = "Bonne journee ! Connecte tes services dans Integrations pour un briefing personnalise.";
  res.json({ greeting, summary, events: 0 });
}
