import { useEffect, useState } from "react";
import type { Briefing } from "../types";

export function useBriefing() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);

  useEffect(() => {
    fetch("/api/briefing")
      .then((r) => r.ok ? r.json() : null)
      .then(setBriefing)
      .catch(() => {
        // Fallback if API unavailable (e.g., dev mode without serverless)
        const hour = new Date().getHours();
        setBriefing({
          greeting: hour < 12 ? "Bonjour" : hour < 18 ? "Bon apres-midi" : "Bonsoir",
          summary: "Ton cockpit personnel est pret.",
          events: 0,
        });
      });
  }, []);

  return briefing;
}
