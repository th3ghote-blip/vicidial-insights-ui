"use client";

import { Sparkles } from "lucide-react";
import type { WeeklyInsight } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

export default function AiBanner({ lang, weekly, compact = false }: { lang: Lang; weekly: WeeklyInsight; compact?: boolean }) {
  const tr = t[lang];
  const cleaned = weekly.summary.replace(/^#+\s*/gm, "").replace(/\*\*(.+?)\*\*/g, "$1");
  const text = compact ? cleaned.split("\n").filter(Boolean).slice(0, 2).join(" ") : cleaned;

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/15 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-400" strokeWidth={2.2} />
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{tr.weeklyHeader}</h3>
          </div>
          <p className={`text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap ${compact ? "line-clamp-3" : ""}`}>{text}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-300 tabular-nums">{weekly.top_leads_count}</div>
          <div className="text-xs text-zinc-500 max-w-[8rem]">{tr.topLeadsCount}</div>
        </div>
      </div>
    </div>
  );
}
