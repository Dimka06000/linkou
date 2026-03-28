import type { Briefing } from "../types";

interface Props { briefing: Briefing | null; }

export function BriefingCard({ briefing }: Props) {
  if (!briefing) {
    return (
      <div className="col-span-full bg-gradient-to-br from-[#161616] to-[#1a1a2e] border border-indigo-500/20 rounded-2xl p-6 animate-pulse">
        <div className="h-5 bg-white/5 rounded w-48 mb-3" />
        <div className="h-4 bg-white/5 rounded w-full" />
      </div>
    );
  }
  return (
    <div className="col-span-full bg-gradient-to-br from-[#161616] to-[#1a1a2e] border border-indigo-500/20 rounded-2xl p-6 flex items-center gap-5">
      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0">🤖</div>
      <div className="flex-1">
        <div className="text-lg font-semibold">{briefing.greeting}</div>
        <div className="text-sm text-gray-400 mt-1 leading-relaxed">{briefing.summary}</div>
      </div>
    </div>
  );
}
