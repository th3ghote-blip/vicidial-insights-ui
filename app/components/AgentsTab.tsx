"use client";

import { useMemo, useState } from "react";
import {
  Search, X, Phone, Clock, RefreshCw, TrendingUp, TrendingDown, Minus,
  Star, AlertTriangle, ArrowUpDown, Trophy,
} from "lucide-react";
import type { AgentStat, AgentMomentum } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

type SortKey = "rank" | "close_rate" | "sales" | "calls" | "utilization" | "callbacks";

const MOMENTUM_META: Record<AgentMomentum["status"], {
  labelEs: string; labelEn: string; color: string; ring: string; icon: React.ElementType;
}> = {
  rising_star:     { labelEs: "Estrella en alza", labelEn: "Rising star",     color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", ring: "ring-emerald-500/40", icon: Star },
  on_streak:       { labelEs: "En racha",         labelEn: "Hot streak",      color: "bg-amber-500/15 text-amber-300 border-amber-500/30",       ring: "ring-amber-500/40",   icon: TrendingUp },
  stable:          { labelEs: "Estable",          labelEn: "Stable",          color: "bg-zinc-700/40 text-zinc-400 border-zinc-700",             ring: "ring-zinc-700",       icon: Minus },
  cooling:         { labelEs: "Enfriándose",      labelEn: "Cooling",         color: "bg-amber-500/10 text-amber-400 border-amber-500/20",       ring: "ring-amber-500/20",   icon: TrendingDown },
  needs_attention: { labelEs: "Necesita atención",labelEn: "Needs attention", color: "bg-red-500/15 text-red-300 border-red-500/30",             ring: "ring-red-500/40",     icon: AlertTriangle },
};

export default function AgentsTab({
  lang, agents, momentum,
}: { lang: Lang; agents: AgentStat[]; momentum: AgentMomentum[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");

  const momMap = useMemo(() => new Map(momentum.map(m => [m.user, m])), [momentum]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter(a => !q || a.full_name.toLowerCase().includes(q));
  }, [agents, search]);

  const sorted = useMemo(() => {
    if (sortKey === "rank") return filtered;  // already sorted by close_rate from API
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let av = 0, bv = 0;
      switch (sortKey) {
        case "close_rate":  av = a.close_rate; bv = b.close_rate; break;
        case "sales":       av = a.sales; bv = b.sales; break;
        case "calls":       av = a.calls_handled; bv = b.calls_handled; break;
        case "utilization": av = a.utilization_rate ?? 0; bv = b.utilization_rate ?? 0; break;
        case "callbacks":   av = a.callbacks_converted ?? 0; bv = b.callbacks_converted ?? 0; break;
      }
      return (av - bv) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const maxRate = Math.max(...agents.map(a => a.close_rate), 0.0001);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {lang === "es" ? "Agentes" : "Agents"}
        </h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {lang === "es"
            ? `${agents.length} agentes activos · últimos 30 días`
            : `${agents.length} active agents · last 30 days`}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === "es" ? "Buscar agente…" : "Search agent…"}
          className="w-full pl-9 pr-9 py-2 text-sm bg-zinc-900/60 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-colors placeholder:text-zinc-600"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded hover:bg-zinc-800 flex items-center justify-center text-zinc-500">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Leaderboard cards */}
      <div className="space-y-2">
        {sorted.map((a, i) => {
          const m = momMap.get(a.user);
          const ratePct = a.close_rate * 100;
          const widthPct = (a.close_rate / maxRate) * 100;
          const rank = sortKey === "rank" ? i : agents.findIndex(x => x.user === a.user);
          const isLeader = rank === 0;

          return (
            <div
              key={a.user}
              className="group rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/40 to-zinc-900/10 p-4 hover:border-zinc-700 hover:from-zinc-900/60 transition-all"
            >
              {/* Header row */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-semibold text-sm border ${
                  isLeader
                    ? "bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 border-amber-500/50 shadow-lg shadow-amber-500/20"
                    : "bg-zinc-800/60 text-zinc-400 border-zinc-700"
                }`}>
                  {isLeader ? <Trophy className="h-4 w-4" /> : `#${rank + 1}`}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-zinc-100">{a.full_name}</span>
                    {m && <MomentumBadge momentum={m} lang={lang} />}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-3">
                    <span>{a.user}</span>
                    {m?.weekly_series && <Sparkline data={m.weekly_series} />}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-semibold tabular-nums text-emerald-300">{a.sales}</div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {lang === "es" ? "ventas" : "sales"}
                  </div>
                </div>
              </div>

              {/* Close rate bar */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLeader
                        ? "bg-gradient-to-r from-amber-400 to-amber-500"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-sm font-mono tabular-nums text-zinc-200 w-14 text-right">
                  {ratePct.toFixed(1)}%
                </span>
              </div>

              {/* Metric chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <Metric icon={Phone} label={lang === "es" ? "Llamadas" : "Calls"} value={a.calls_handled.toLocaleString()} />
                <Metric icon={TrendingUp} label={lang === "es" ? "Utiliz." : "Utiliz."}
                  value={`${((a.utilization_rate ?? 0) * 100).toFixed(0)}%`}
                  color={(a.utilization_rate ?? 0) >= 0.7 ? "emerald" : (a.utilization_rate ?? 0) >= 0.5 ? "amber" : "red"} />
                <Metric icon={Phone} label={lang === "es" ? "Marc/h" : "Dials/h"} value={`${a.dials_per_hour ?? 0}`} />
                <Metric icon={Clock} label={lang === "es" ? "Espera" : "Wait"} value={`${Math.floor((a.avg_wait_sec ?? 0) / 60)}m`} />
                <Metric icon={RefreshCw} label="Callbacks" value={`${a.callbacks_converted ?? 0}/${a.callbacks_set ?? 0}`} color="violet" />
                <Metric icon={Clock} label={lang === "es" ? "Prom." : "Avg"} value={`${Math.round(a.avg_talk_sec)}s`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Efficiency table */}
      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-3">
          {lang === "es" ? "Comparativa de eficiencia" : "Efficiency comparison"}
        </h3>
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-2.5 text-left">{lang === "es" ? "Agente" : "Agent"}</th>
                  <SortHeader k="utilization" cur={sortKey} dir={sortDir} onClick={() => toggleSort("utilization")} label={lang === "es" ? "Utiliz." : "Utiliz."} />
                  <SortHeader k="calls"       cur={sortKey} dir={sortDir} onClick={() => toggleSort("calls")}       label={lang === "es" ? "Marc./hr" : "Dials/hr"} />
                  <th className="px-4 py-2.5 text-right">{lang === "es" ? "Pausa" : "Pause"}</th>
                  <SortHeader k="callbacks"   cur={sortKey} dir={sortDir} onClick={() => toggleSort("callbacks")}   label={lang === "es" ? "CB conv." : "CB conv."} />
                  <SortHeader k="close_rate"  cur={sortKey} dir={sortDir} onClick={() => toggleSort("close_rate")}  label={lang === "es" ? "Cierre" : "Close %"} />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sorted.map((a) => (
                  <tr key={a.user} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-zinc-200">{a.full_name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <span className={utilColor(a.utilization_rate)}>{((a.utilization_rate ?? 0) * 100).toFixed(0)}%</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-sky-300">{a.dials_per_hour ?? 0}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">{Math.floor((a.pause_seconds ?? 0) / 60)}m</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-violet-300">{a.callbacks_converted ?? 0}/{a.callbacks_set ?? 0}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-emerald-300 font-medium">{(a.close_rate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function MomentumBadge({ momentum: m, lang }: { momentum: AgentMomentum; lang: Lang }) {
  const meta = MOMENTUM_META[m.status];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] ${meta.color}`}>
      <Icon className="h-3 w-3" strokeWidth={2.2} />
      <span>{lang === "es" ? meta.labelEs : meta.labelEn}</span>
      <span className="font-mono ml-0.5 opacity-90">{m.change_pct >= 0 ? "+" : ""}{m.change_pct.toFixed(1)}%</span>
    </span>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 50, h = 14;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  const trend = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={trend ? "#34d399" : "#f87171"} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Metric({ icon: Icon, label, value, color = "zinc" }: {
  icon: React.ElementType; label: string; value: string; color?: string;
}) {
  const colors: Record<string, string> = {
    zinc:    "text-zinc-300",
    emerald: "text-emerald-300",
    amber:   "text-amber-300",
    red:     "text-red-400",
    violet:  "text-violet-300",
  };
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
      <Icon className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 leading-none">{label}</div>
        <div className={`text-xs font-mono tabular-nums leading-tight mt-0.5 ${colors[color] ?? colors.zinc}`}>{value}</div>
      </div>
    </div>
  );
}

function SortHeader({ k, cur, dir, onClick, label }: {
  k: SortKey; cur: SortKey; dir: "asc"|"desc"; onClick: () => void; label: string;
}) {
  const active = cur === k;
  return (
    <th className="px-4 py-2.5 text-right">
      <button onClick={onClick} className={`inline-flex items-center gap-1 hover:text-zinc-200 transition-colors ${active ? "text-zinc-200" : ""}`}>
        <span>{label}</span>
        <ArrowUpDown className="h-3 w-3" strokeWidth={2} />
      </button>
    </th>
  );
}

function utilColor(rate: number) {
  if (rate >= 0.70) return "text-emerald-300";
  if (rate >= 0.50) return "text-amber-300";
  return "text-red-400";
}
