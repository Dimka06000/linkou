import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

const INTEGRATIONS = [
  { id: "google", name: "Google Calendar", icon: "📅", description: "Sync tes rdv Google", status: "oauth" as const },
  { id: "outlook", name: "Outlook", icon: "📧", description: "Sync tes rdv Outlook", status: "oauth" as const },
  { id: "github", name: "GitHub", icon: "🐙", description: "Repos et commits", status: "oauth" as const },
  { id: "vercel", name: "Vercel", icon: "▲", description: "Status des deployments", status: "available" as const },
  { id: "railway", name: "Railway", icon: "🚂", description: "Services et logs", status: "available" as const },
  { id: "elevenlabs", name: "ElevenLabs", icon: "🔊", description: "Briefing vocal", status: "coming" as const },
  { id: "summeria", name: "Summeria", icon: "💳", description: "Suivi depenses", status: "coming" as const },
];

export function Integrations() {
  const { user } = useAuth();
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [localTokens, setLocalTokens] = useState<Record<string, string>>(() =>
    JSON.parse(localStorage.getItem("linkou-api-tokens") || "{}")
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load connected OAuth providers from Supabase
  useEffect(() => {
    async function loadConnected() {
      if (supabase && user) {
        const { data } = await supabase
          .from("integration_tokens")
          .select("provider")
          .eq("user_id", user.id);
        if (data) {
          setConnectedProviders(new Set(data.map((t) => t.provider)));
        }
      }
      setLoading(false);
    }
    loadConnected();
  }, [user]);

  // Handle OAuth callback ?connected=xxx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (connected) {
      setConnectedProviders((prev) => new Set([...prev, connected]));
      setToast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connecte avec succes !`);
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
      setTimeout(() => setToast(null), 4000);
    }
    const error = params.get("error");
    if (error) {
      setToast(`Erreur de connexion ${error}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  function isConnected(providerId: string): boolean {
    return connectedProviders.has(providerId) || !!localTokens[providerId];
  }

  function saveLocalToken(provider: string) {
    const updated = { ...localTokens, [provider]: inputValue };
    setLocalTokens(updated);
    localStorage.setItem("linkou-api-tokens", JSON.stringify(updated));
    setEditing(null);
    setInputValue("");
  }

  async function disconnect(provider: string) {
    // Remove from Supabase
    if (supabase && user) {
      await supabase
        .from("integration_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", provider);
    }
    setConnectedProviders((prev) => {
      const next = new Set(prev);
      next.delete(provider);
      return next;
    });
    // Remove from localStorage
    const updated = { ...localTokens };
    delete updated[provider];
    setLocalTokens(updated);
    localStorage.setItem("linkou-api-tokens", JSON.stringify(updated));
  }

  function handleOAuth(provider: string) {
    window.location.href = `/api/auth/${provider}?userId=${user?.id ?? "anon"}`;
  }

  if (loading) {
    return <p className="text-gray-500 text-center py-12">Chargement...</p>;
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 ${toast.startsWith("Erreur") ? "bg-red-500" : "bg-green-500"} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium`}>
          {toast}
        </div>
      )}
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
            ) : isConnected(integration.id) ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-lg">Connecte</span>
                <button onClick={() => disconnect(integration.id)} className="text-xs text-red-400 hover:underline">Retirer</button>
              </div>
            ) : integration.status === "oauth" ? (
              <button
                onClick={() => handleOAuth(integration.id)}
                className="text-xs text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-lg hover:bg-indigo-400/20"
              >
                Connecter
              </button>
            ) : editing === integration.id ? (
              <div className="flex items-center gap-2">
                <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Token API"
                  className="px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-xs outline-none focus:border-indigo-500 w-48" />
                <button onClick={() => saveLocalToken(integration.id)} className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg">OK</button>
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
