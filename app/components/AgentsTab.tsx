"use client";

import type { AgentStat } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

export default function AgentsTab({ lang, agents }: { lang: Lang; agents: AgentStat[] }) {
  const tr = t[lang];
  const maxRate = Math.max(...agents.map(a => a.close_rate), 0.0001);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">{tr.agentsHeader}</h2>
      <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-800">
        {agents.map((a, i) => {
          const ratePct = a.close_rate * 100;
          const widthPct = (a.close_rate / maxRate) * 100;
          const isLeader = i === 0;
          return (
            <div key={a.user} className="px-4 py-3 hover:bg-zinc-900/40">
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-6 text-center text-sm font-mono ${isLeader ? "text-amber-300" : "text-zinc-500"}`}>
                  #{i + 1}
                </span>
                <span className="flex-1 font-medium">{a.full_name}</span>
                <span className="font-mono text-emerald-300 tabular-nums">{a.sales}</span>
                <span className="text-xs text-zinc-500 w-20 text-right">{tr.agentCol.sales.toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-3 pl-9">
                <div className="flex-1 h-2 bg-zinc-800 rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${isLeader ? "bg-amber-400" : "bg-emerald-500/70"}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 tabular-nums w-14 text-right">{ratePct.toFixed(1)}%</span>
                <span className="text-xs text-zinc-500 tabular-nums w-20 text-right">{a.calls_handled} {tr.callsLabel.toLowerCase()}</span>
                <span className="text-xs text-zinc-500 tabular-nums w-16 text-right">{a.avg_talk_sec}s avg</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
