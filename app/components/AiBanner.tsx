"use client";

import type { WeeklyInsight } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

export default function AiBanner({ lang, weekly, compact = false }: { lang: Lang; weekly: WeeklyInsight; compact?: boolean }) {
  const tr = t[lang];
  // Strip leading markdown headers / bold markers for compact display
  const cleaned = weekly.summary.replace(/^#+\s*/gm, "").replace(/\*\*(.+?)\*\*/g, "$1");
  const text = compact ? cleaned.split("\n").filter(Boolean).slice(0, 2).join(" ") : cleaned;

  return (
    <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-900/15 via-zinc-900 to-zinc-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-400">✦</span>
            <h3 className="text-sm font-medium">{tr.weeklyHeader}</h3>
          </div>
          <p className={`text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap ${compact ? "line-clamp-3" : ""}`}>{text}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-semibold text-emerald-300">{weekly.top_leads_count}</div>
          <div className="text-xs text-zinc-500 max-w-[8rem]">{tr.topLeadsCount}</div>
        </div>
      </div>
    </div>
  );
}
