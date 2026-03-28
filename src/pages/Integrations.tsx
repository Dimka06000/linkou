import { useState } from "react";

const INTEGRATIONS = [
  { id: "google", name: "Google Calendar", icon: "📅", description: "Sync tes rdv Google", status: "coming" as const },
  { id: "outlook", name: "Outlook", icon: "📧", description: "Sync tes rdv Outlook", status: "coming" as const },
  { id: "github", name: "GitHub", icon: "🐙", description: "Repos et commits", status: "available" as const },
  { id: "vercel", name: "Vercel", icon: "▲", description: "Status des deployments", status: "available" as const },
  { id: "railway", name: "Railway", icon: "🚂", description: "Services et logs", status: "available" as const },
  { id: "elevenlabs", name: "ElevenLabs", icon: "🔊", description: "Briefing vocal", status: "coming" as const },
  { id: "summeria", name: "Summeria", icon: "💳", description: "Suivi depenses", status: "coming" as const },
];

export function Integrations() {
  const [tokens, setTokens] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem("linkou-api-tokens") || "{}"));
  const [editing, setEditing] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  function saveToken(provider: string) {
    const updated = { ...tokens, [provider]: inputValue };
    setTokens(updated);
    localStorage.setItem("linkou-api-tokens", JSON.stringify(updated));
    setEditing(null);
    setInputValue("");
  }

  function removeToken(provider: string) {
    const updated = { ...tokens };
    delete updated[provider];
    setTokens(updated);
    localStorage.setItem("linkou-api-tokens", JSON.stringify(updated));
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Integrations</h2>
      <p className="text-sm text-gray-500 mb-6">Connecte tes services pour alimenter le dashboard.</p>
      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => (
          <div key={integration.id} className="bg-[#161616] border border-[#1e1e1e] rounded-xl p-4 flex items-center gap-4">
            <span className="text-2xl">{integration.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-sm">{integration.name}</div>
              <div className="text-xs text-gray-500">{integration.description}</div>
            </div>
            {integration.status === "coming" ? (
              <span className="text-xs text-gray-600 bg-[#1e1e1e] px-3 py-1 rounded-lg">Bientot</span>
            ) : tokens[integration.id] ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-lg">Connecte</span>
                <button onClick={() => removeToken(integration.id)} className="text-xs text-red-400 hover:underline">Retirer</button>
              </div>
            ) : editing === integration.id ? (
              <div className="flex items-center gap-2">
                <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Token API"
                  className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-xs outline-none focus:border-indigo-500 w-48" />
                <button onClick={() => saveToken(integration.id)} className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg">OK</button>
              </div>
            ) : (
              <button onClick={() => { setEditing(integration.id); setInputValue(""); }}
                className="text-xs text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-lg hover:bg-indigo-400/20">Connecter</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
