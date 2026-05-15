"use client";

import type { AgentStat, AgentMomentum } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

function fmtMin(sec: number) {
  return `${Math.floor(sec / 60)}m`;
}
function fmtHr(sec: number) {
  return `${(sec / 3600).toFixed(1)}h`;
}

const MOMENTUM_BADGE: Record<AgentMomentum["status"], { label: { es: string; en: string }; color: string; icon: string }> = {
  rising_star:     { label: { es: "Estrella en alza", en: "Rising star"     }, color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: "▲" },
  on_streak:       { label: { es: "En racha",         en: "Hot streak"      }, color: "bg-amber-500/15 text-amber-300 border-amber-500/30",       icon: "★" },
  stable:          { label: { es: "Estable",          en: "Stable"          }, color: "bg-zinc-700/40 text-zinc-400 border-zinc-700",             icon: "→" },
  cooling:         { label: { es: "Enfriándose",      en: "Cooling"         }, color: "bg-amber-500/10 text-amber-400 border-amber-500/20",       icon: "↘" },
  needs_attention: { label: { es: "Necesita atención",en: "Needs attention" }, color: "bg-red-500/15 text-red-300 border-red-500/30",             icon: "▼" },
};

export default function AgentsTab({ lang, agents, momentum }: { lang: Lang; agents: AgentStat[]; momentum: AgentMomentum[] }) {
  const tr = t[lang];
  const maxRate = Math.max(...agents.map(a => a.close_rate), 0.0001);
  const momMap = new Map(momentum.map(m => [m.user, m]));

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-medium">{tr.agentsHeader}</h2>

      {/* Leaderboard */}
      <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-800">
        {agents.map((a, i) => {
          const ratePct = a.close_rate * 100;
          const widthPct = (a.close_rate / maxRate) * 100;
          const isLeader = i === 0;
          const utilPct = ((a.utilization_rate ?? 0) * 100).toFixed(0);
          const cbRate = ((a.callback_conversion_rate ?? 0) * 100).toFixed(0);

          return (
            <div key={a.user} className="px-4 py-3 hover:bg-zinc-900/40">
              {/* Row 1: rank + name + momentum + sales */}
              <div className="flex items-center gap-3 mb-1">
                <span className={`w-6 text-center text-sm font-mono ${isLeader ? "text-amber-300" : "text-zinc-500"}`}>
                  #{i + 1}
                </span>
                <span className="font-medium">{a.full_name}</span>
                {(() => {
                  const m = momMap.get(a.user);
                  if (!m) return null;
                  const b = MOMENTUM_BADGE[m.status];
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] ${b.color}`}>
                      <span>{b.icon}</span>
                      <span>{b.label[lang]}</span>
                      <span className="font-mono ml-0.5">{m.change_pct >= 0 ? "+" : ""}{m.change_pct.toFixed(1)}%</span>
                    </span>
                  );
                })()}
                <span className="flex-1" />
                <span className="font-mono text-emerald-300 tabular-nums">{a.sales}</span>
                <span className="text-xs text-zinc-500 w-16 text-right">{tr.agentCol.sales.toLowerCase()}</span>
              </div>

              {/* Row 2: close-rate bar */}
              <div className="flex items-center gap-3 pl-9 mb-2">
                <div className="flex-1 h-2 bg-zinc-800 rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${isLeader ? "bg-amber-400" : "bg-emerald-500/70"}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 tabular-nums w-12 text-right">{ratePct.toFixed(1)}%</span>
                <span className="text-xs text-zinc-500 tabular-nums w-20 text-right">{a.calls_handled} {tr.callsLabel.toLowerCase()}</span>
                <span className="text-xs text-zinc-500 tabular-nums w-16 text-right">{a.avg_talk_sec}s avg</span>
              </div>

              {/* Row 3: efficiency chips */}
              <div className="flex flex-wrap gap-2 pl-9">
                <Chip
                  label={lang === "es" ? "Utilización" : "Utilization"}
                  value={`${utilPct}%`}
                  color={Number(utilPct) >= 70 ? "emerald" : Number(utilPct) >= 50 ? "amber" : "red"}
                />
                <Chip
                  label={lang === "es" ? "Marcaciones/h" : "Dials/hr"}
                  value={`${a.dials_per_hour ?? 0}`}
                  color="sky"
                />
                <Chip
                  label={lang === "es" ? "Espera media" : "Avg wait"}
                  value={fmtMin(a.avg_wait_sec ?? 0)}
                  color="zinc"
                />
                <Chip
                  label={lang === "es" ? "Callbacks" : "Callbacks"}
                  value={`${a.callbacks_converted ?? 0}/${a.callbacks_set ?? 0}`}
                  color="violet"
                />
                <Chip
                  label={lang === "es" ? "CB conv." : "CB rate"}
                  value={`${cbRate}%`}
                  color="violet"
                />
                <Chip
                  label={lang === "es" ? "Logueado" : "Login time"}
                  value={fmtHr(a.login_seconds ?? 0)}
                  color="zinc"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Efficiency table */}
      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-3">
          {lang === "es" ? "Eficiencia por agente" : "Agent efficiency"}
        </h3>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                <th className="px-4 py-2 text-left">{lang === "es" ? "Agente" : "Agent"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Utiliz." : "Utiliz."}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Marc./hr" : "Dials/hr"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Pausa" : "Pause"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "CB set" : "CB set"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "CB conv." : "CB conv."}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Cierre" : "Close %"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {agents.map((a) => (
                <tr key={a.user} className="hover:bg-zinc-900/30">
                  <td className="px-4 py-2 font-medium">{a.full_name}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    <span className={utilColor(a.utilization_rate)}>
                      {((a.utilization_rate ?? 0) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-sky-300">{a.dials_per_hour ?? 0}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-400">{fmtMin(a.pause_seconds ?? 0)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-300">{a.callbacks_set ?? 0}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-violet-300">{a.callbacks_converted ?? 0}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-emerald-300">
                    {(a.close_rate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function utilColor(rate: number) {
  if (rate >= 0.70) return "text-emerald-300";
  if (rate >= 0.50) return "text-amber-300";
  return "text-red-400";
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    amber:   "bg-amber-500/10 text-amber-300 border-amber-500/20",
    red:     "bg-red-500/10 text-red-400 border-red-500/20",
    sky:     "bg-sky-500/10 text-sky-300 border-sky-500/20",
    violet:  "bg-violet-500/10 text-violet-300 border-violet-500/20",
    zinc:    "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${colors[color] ?? colors.zinc}`}>
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono">{value}</span>
    </span>
  );
}
