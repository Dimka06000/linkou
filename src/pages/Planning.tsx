import { useState } from "react";
import { useCalendar } from "../hooks/useCalendar";

type View = "jour" | "semaine" | "mois";

export function Planning() {
  const [view, setView] = useState<View>("jour");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const { events, loading } = useCalendar(date);

  const views: { id: View; label: string }[] = [
    { id: "jour", label: "Jour" },
    { id: "semaine", label: "Semaine" },
    { id: "mois", label: "Mois" },
  ];

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  const SOURCE_COLORS = { google: "border-l-blue-500", outlook: "border-l-orange-500" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">📅 Planning</h2>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500" />
        </div>
        <div className="flex bg-[#161616] border border-[#1e1e1e] rounded-lg overflow-hidden">
          {views.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                view === v.id ? "bg-indigo-500/20 text-indigo-400" : "text-gray-500 hover:text-gray-300"}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Chargement...</div>
      ) : events.length === 0 ? (
        <div className="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-8 text-center">
          <p className="text-2xl mb-3">📅</p>
          <p className="text-gray-400 mb-2">Aucun evenement pour cette date</p>
          <a href="/integrations" className="text-sm text-indigo-400 hover:underline">Connecter un calendrier →</a>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id}
              className={`bg-[#161616] border border-[#1e1e1e] border-l-4 ${SOURCE_COLORS[event.source]} rounded-xl p-4 flex items-center gap-4`}>
              <div className="text-sm text-indigo-400 font-semibold w-14 flex-shrink-0">{formatTime(event.start)}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{event.title}</div>
                {event.location && <div className="text-xs text-gray-500 mt-0.5">📍 {event.location}</div>}
              </div>
              <div className="text-xs text-gray-600">{event.source === "google" ? "Google" : "Outlook"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
