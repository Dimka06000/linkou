import { useState, useEffect, useRef } from "react";
import { useCalendar } from "../hooks/useCalendar";
import { useAuth } from "../hooks/useAuth";
import { createCalendarEvent } from "../lib/calendar";
import type { CalendarEvent } from "../types";

type View = "jour" | "semaine";

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 60; // px
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday = start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function timeToY(isoOrTime: string): number {
  let h: number, m: number;
  if (isoOrTime.includes("T")) {
    const d = new Date(isoOrTime);
    h = d.getHours();
    m = d.getMinutes();
  } else {
    [h, m] = isoOrTime.split(":").map(Number);
  }
  return (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
}

/** Convert a Y offset in the grid to a { hour, minutes } */
function yToTime(y: number): { hour: number; minutes: number } {
  const totalMins = (y / HOUR_HEIGHT) * 60;
  const snapped = Math.round(totalMins / 15) * 15; // snap to 15min
  const hour = Math.min(END_HOUR - 1, Math.max(START_HOUR, START_HOUR + Math.floor(snapped / 60)));
  const minutes = snapped % 60;
  return { hour, minutes };
}

function eventHeight(start: string, end: string): number {
  const h = timeToY(end) - timeToY(start);
  return Math.max(h, 20);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function currentTimeY(): number {
  const now = new Date();
  return (now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT;
}

function isSameDay(iso: string, date: Date): boolean {
  const d = new Date(iso);
  return d.toDateString() === date.toDateString();
}

const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_SHORT = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];

function formatDayHeader(date: Date): { short: string; num: number; month: string } {
  const dayIndex = (date.getDay() + 6) % 7; // Mon=0..Sun=6
  return {
    short: DAY_SHORT[dayIndex],
    num: date.getDate(),
    month: MONTH_SHORT[date.getMonth()],
  };
}

// Resolve overlapping events in a day column
function layoutEvents(events: CalendarEvent[]): Array<CalendarEvent & { col: number; cols: number }> {
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const result: Array<CalendarEvent & { col: number; cols: number }> = [];
  const groups: Array<Array<CalendarEvent & { col: number; cols: number }>> = [];

  for (const event of sorted) {
    const startY = timeToY(event.start);

    // Find a group that overlaps
    let placed = false;
    for (const group of groups) {
      const lastEnd = Math.max(...group.map((e) => timeToY(e.start) + eventHeight(e.start, e.end)));
      if (startY < lastEnd) {
        // overlaps — find a free column
        const usedCols = new Set(group.map((e) => e.col));
        let col = 0;
        while (usedCols.has(col)) col++;
        const entry = { ...event, col, cols: 1 };
        group.push(entry);
        result.push(entry);
        placed = true;
        break;
      }
    }
    if (!placed) {
      const entry = { ...event, col: 0, cols: 1 };
      groups.push([entry]);
      result.push(entry);
    }
  }

  // Set cols = max col count in each overlapping group
  for (const group of groups) {
    const maxCol = Math.max(...group.map((e) => e.col)) + 1;
    group.forEach((e) => { e.cols = maxCol; });
  }

  return result;
}

interface EventDetailModal {
  event: CalendarEvent;
  x: number;
  y: number;
}

interface CreateEventModal {
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

function toLocalISOString(dateStr: string, timeStr: string): string {
  // Returns something like "2024-03-28T14:30:00"
  return `${dateStr}T${timeStr}:00`;
}

export function Planning() {
  const [view, setView] = useState<View>("semaine");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [modal, setModal] = useState<EventDetailModal | null>(null);
  const [nowY, setNowY] = useState(currentTimeY);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // Create event modal state
  const [createModal, setCreateModal] = useState<CreateEventModal | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("10:00");
  const [newLocation, setNewLocation] = useState("");
  const [newTarget, setNewTarget] = useState<"google" | "outlook">("google");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { user } = useAuth();

  // Week range
  const weekStart = getWeekStart(selectedDate);
  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // For "jour" view — just the selected date
  const dayStart = toDateStr(selectedDate);

  const startStr = view === "semaine" ? toDateStr(weekStart) : dayStart;
  const endStr = view === "semaine" ? toDateStr(weekEnd) : dayStart;

  const { events, loading } = useCalendar(startStr, endStr, refreshSeed);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setNowY(currentTimeY()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (gridRef.current) {
      const scrollTo = Math.max(0, nowY - 120);
      gridRef.current.scrollTop = scrollTo;
    }
  }, []);

  function prevWeek() {
    setSelectedDate((d) => addDays(view === "semaine" ? getWeekStart(d) : d, view === "semaine" ? -7 : -1));
  }
  function nextWeek() {
    setSelectedDate((d) => addDays(view === "semaine" ? getWeekStart(d) : d, view === "semaine" ? 7 : 1));
  }
  function goToday() {
    setSelectedDate(new Date());
  }

  function handleEventClick(e: React.MouseEvent, event: CalendarEvent) {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setModal({ event, x: rect.left, y: rect.top });
  }

  function openCreateModal(dateStr: string, startTime: string) {
    const [h, m] = startTime.split(":").map(Number);
    const endH = h + 1 >= END_HOUR ? END_HOUR - 1 : h + 1;
    const endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    setNewTitle("");
    setNewStartTime(startTime);
    setNewEndTime(endTime);
    setNewLocation("");
    setNewTarget("google");
    setCreateError(null);
    setCreateModal({ dateStr, startTime, endTime });
    setModal(null);
  }

  function openCreateModalManual() {
    const now = new Date();
    const h = now.getHours();
    const m = Math.round(now.getMinutes() / 15) * 15 % 60;
    const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const endH = h + 1 >= END_HOUR ? END_HOUR - 1 : h + 1;
    const endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const dateStr = toDateStr(new Date());
    setNewTitle("");
    setNewStartTime(startTime);
    setNewEndTime(endTime);
    setNewLocation("");
    setNewTarget("google");
    setCreateError(null);
    setCreateModal({ dateStr, startTime, endTime });
    setModal(null);
  }

  function handleGridClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    // Don't trigger if clicking an event
    if ((e.target as HTMLElement).closest("[data-event]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top + (gridRef.current?.scrollTop || 0);
    const { hour, minutes } = yToTime(y);
    const startTime = `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    openCreateModal(toDateStr(day), startTime);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !createModal || !newTitle.trim()) return;

    setCreating(true);
    setCreateError(null);

    const start = toLocalISOString(createModal.dateStr, newStartTime);
    const end = toLocalISOString(createModal.dateStr, newEndTime);

    const result = await createCalendarEvent({
      userId: user.id,
      title: newTitle.trim(),
      start,
      end,
      location: newLocation.trim() || undefined,
      target: newTarget,
    });

    setCreating(false);

    if (result.success) {
      setCreateModal(null);
      setRefreshSeed((k) => k + 1); // trigger re-fetch
    } else {
      setCreateError(result.error || "Erreur lors de la création");
    }
  }

  const todayStr = new Date().toDateString();
  const nowVisible = nowY >= 0 && nowY <= TOTAL_HEIGHT;

  // Week label
  const weekLabel = `${weekStart.getDate()} ${MONTH_SHORT[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTH_SHORT[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  // Day view: events for selected date
  const dayEvents = events.filter((e) => isSameDay(e.start, selectedDate));

  return (
    <div className="flex flex-col h-full" onClick={() => { setModal(null); }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161616] border border-[#1e1e1e] text-gray-400 hover:text-white hover:border-indigo-500/50 transition-all text-sm">
            ‹
          </button>
          <button onClick={goToday}
            className="px-3 py-1.5 rounded-lg bg-[#161616] border border-[#1e1e1e] text-xs font-medium text-gray-300 hover:text-white hover:border-indigo-500/50 transition-all">
            Aujourd'hui
          </button>
          <button onClick={nextWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#161616] border border-[#1e1e1e] text-gray-400 hover:text-white hover:border-indigo-500/50 transition-all text-sm">
            ›
          </button>
          <span className="text-sm font-medium text-gray-300 ml-1">
            {view === "semaine" ? weekLabel : selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={toDateStr(selectedDate)}
            onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value + "T12:00:00"))}
            className="bg-[#161616] border border-[#1e1e1e] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 text-gray-300"
          />
          <div className="flex bg-[#161616] border border-[#1e1e1e] rounded-lg overflow-hidden">
            {(["jour", "semaine"] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  view === v ? "bg-indigo-500/20 text-indigo-400" : "text-gray-500 hover:text-gray-300"
                }`}>
                {v === "jour" ? "Jour" : "Semaine"}
              </button>
            ))}
          </div>
          {/* Add event button */}
          <button
            onClick={(e) => { e.stopPropagation(); openCreateModalManual(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors text-lg font-light leading-none"
            title="Nouvel événement">
            +
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Chargement...</div>
      )}

      {/* Week view */}
      {!loading && view === "semaine" && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#161616] border border-[#1e1e1e] rounded-2xl">
          {/* Day headers */}
          <div className="flex border-b border-[#1e1e1e] flex-shrink-0">
            <div className="w-14 flex-shrink-0" />
            {weekDays.map((day, i) => {
              const { short, num, month } = formatDayHeader(day);
              const today = day.toDateString() === todayStr;
              return (
                <div key={i}
                  className={`flex-1 text-center py-2 text-xs transition-colors ${today ? "bg-indigo-500/10" : ""}`}>
                  <span className="text-gray-500 block">{short}</span>
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-sm mt-0.5 ${
                      today ? "bg-indigo-500 text-white" : "text-gray-200"
                    }`}>
                    {num}
                  </span>
                  <span className="text-gray-600 block text-[10px]">{month}</span>
                </div>
              );
            })}
          </div>

          {/* Time grid — scrollable */}
          <div ref={gridRef} className="flex-1 overflow-y-auto overflow-x-auto">
            <div className="flex" style={{ minWidth: "640px" }}>
              {/* Hour labels */}
              <div className="w-14 flex-shrink-0 relative" style={{ height: TOTAL_HEIGHT }}>
                {HOURS.map((h) => (
                  <div key={h}
                    className="absolute left-0 right-0 flex items-start justify-end pr-2"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 8, height: HOUR_HEIGHT }}>
                    <span className="text-[10px] text-gray-600">{String(h).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day, di) => {
                const today = day.toDateString() === todayStr;
                const dayEventsRaw = events.filter((e) => isSameDay(e.start, day));
                const laid = layoutEvents(dayEventsRaw);

                return (
                  <div key={di}
                    className={`flex-1 relative border-l border-[#1e1e1e] cursor-pointer ${today ? "bg-indigo-500/5" : ""}`}
                    style={{ height: TOTAL_HEIGHT }}
                    onClick={(e) => handleGridClick(e, day)}>
                    {/* Hour lines */}
                    {HOURS.map((h) => (
                      <div key={h} className="absolute left-0 right-0 border-t border-[#1e1e1e]"
                        style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} />
                    ))}
                    {/* Half-hour lines */}
                    {HOURS.slice(0, -1).map((h) => (
                      <div key={h + 0.5} className="absolute left-0 right-0 border-t border-dashed border-[#1a1a1a]"
                        style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }} />
                    ))}

                    {/* Current time line */}
                    {today && nowVisible && (
                      <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{ top: nowY }}>
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                        <div className="flex-1 border-t border-red-500" />
                      </div>
                    )}

                    {/* Events */}
                    {laid.map((event) => {
                      const top = timeToY(event.start);
                      const height = eventHeight(event.start, event.end);
                      const colW = 100 / event.cols;
                      const isGoogle = event.source === "google";

                      if (top > TOTAL_HEIGHT || top + height < 0) return null;

                      return (
                        <div key={event.id}
                          data-event="true"
                          onClick={(e) => handleEventClick(e, event)}
                          className={`absolute rounded overflow-hidden cursor-pointer z-10 transition-opacity hover:opacity-90 ${
                            isGoogle
                              ? "bg-blue-500/15 border-l-2 border-blue-500"
                              : "bg-orange-500/15 border-l-2 border-orange-500"
                          }`}
                          style={{
                            top: Math.max(0, top),
                            height: Math.max(height, 20),
                            left: `${event.col * colW + 1}%`,
                            width: `${colW - 2}%`,
                          }}>
                          <div className="px-1 py-0.5 h-full overflow-hidden">
                            <p className={`text-[10px] font-semibold leading-tight truncate ${isGoogle ? "text-blue-300" : "text-orange-300"}`}>
                              {event.title}
                            </p>
                            {height >= 36 && (
                              <p className="text-[9px] text-gray-400 truncate">{formatTime(event.start)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Day view */}
      {!loading && view === "jour" && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#161616] border border-[#1e1e1e] rounded-2xl">
          {dayEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-8">
              <p className="text-2xl">📅</p>
              <p className="text-gray-400 text-sm">Aucun événement ce jour</p>
              <a href="/integrations" className="text-xs text-indigo-400 hover:underline">Connecter un calendrier →</a>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {dayEvents.map((event) => (
                <div key={event.id}
                  onClick={(e) => handleEventClick(e, event)}
                  className={`bg-[#1a1a1a] border border-[#1e1e1e] border-l-4 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#1e1e2e] transition-colors ${
                    event.source === "google" ? "border-l-blue-500" : "border-l-orange-500"
                  }`}>
                  <div className={`text-sm font-semibold w-14 flex-shrink-0 ${event.source === "google" ? "text-blue-400" : "text-orange-400"}`}>
                    {formatTime(event.start)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-100 truncate">{event.title}</div>
                    {event.location && <div className="text-xs text-gray-500 mt-0.5 truncate">📍 {event.location}</div>}
                    <div className="text-xs text-gray-600 mt-0.5">{formatTime(event.start)} → {formatTime(event.end)}</div>
                  </div>
                  <div className="text-xs text-gray-600 flex-shrink-0">{event.source === "google" ? "Google" : "Outlook"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event detail modal */}
      {modal && (
        <div
          className="fixed z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-4 w-64"
          style={{
            top: Math.min(modal.y, window.innerHeight - 220),
            left: Math.min(modal.x, window.innerWidth - 272),
          }}
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 mr-2 ${modal.event.source === "google" ? "bg-blue-500" : "bg-orange-500"}`} />
            <h4 className="flex-1 font-semibold text-sm text-gray-100 leading-tight">{modal.event.title}</h4>
            <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white ml-2 text-sm">✕</button>
          </div>
          <div className="space-y-1.5 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">🕐</span>
              <span>{formatTime(modal.event.start)} – {formatTime(modal.event.end)}</span>
            </div>
            {modal.event.location && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">📍</span>
                <span className="truncate">{modal.event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-600">📆</span>
              <span className={modal.event.source === "google" ? "text-blue-400" : "text-orange-400"}>
                {modal.event.source === "google" ? "Google Calendar" : "Outlook"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {createModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setCreateModal(null); }}>
          <div
            className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-100">Nouvel événement</h3>
              <button
                onClick={() => setCreateModal(null)}
                className="text-gray-500 hover:text-white text-sm transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Titre *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Réunion, rendez-vous..."
                  autoFocus
                  required
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Date</label>
                <input
                  type="date"
                  value={createModal.dateStr}
                  onChange={(e) => setCreateModal((m) => m ? { ...m, dateStr: e.target.value } : m)}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Start / End time */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1.5">Début</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1.5">Fin</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Lieu (optionnel)</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Paris, Zoom..."
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Target calendar */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Calendrier</label>
                <select
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value as "google" | "outlook")}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-indigo-500 transition-colors">
                  <option value="google">Google Calendar</option>
                  <option value="outlook">Outlook</option>
                </select>
              </div>

              {/* Error */}
              {createError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setCreateModal(null)}
                  className="text-sm text-gray-400 hover:text-white transition-colors">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors">
                  {creating ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
