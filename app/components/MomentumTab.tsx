"use client";

import { useMemo } from "react";
import {
  Flame, Eye, AlertOctagon, TrendingUp, TrendingDown,
  Phone, Clock, RefreshCw, Zap, Coffee, Timer, Gauge,
} from "lucide-react";
import type { AgentStat, AgentMomentum, CallHour, SalesDay } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

// ── Flag definitions ──────────────────────────────────────────────────────────
type FlagType =
  | "on_fire" | "streak"                       // HOT
  | "cooling" | "needs_break" | "zoning_out"   // WATCH (trend/energy)
  | "short_calls" | "rushing" | "bad_callbacks" // BEHAVIOUR (pattern)

type Flag = {
  type: FlagType;
  label: { es: string; en: string };
  reason: { es: string; en: string };
  icon: React.ElementType;
  tier: "hot" | "watch" | "flag";
  color: string;
}

function computeFlags(a: AgentStat, m: AgentMomentum | undefined): Flag[] {
  const flags: Flag[] = [];

  // HOT
  if (m?.status === "rising_star" || m?.status === "on_streak") {
    flags.push({
      type: "on_fire",
      label: { es: "En racha 🔥", en: "On fire 🔥" },
      reason: { es: `+${m.change_pct.toFixed(1)}% vs semana anterior`, en: `+${m.change_pct.toFixed(1)}% vs prior week` },
      icon: Flame, tier: "hot",
      color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    });
  }
  if (m && m.change_pct >= 15 && m.status !== "rising_star" && m.status !== "on_streak") {
    flags.push({
      type: "streak",
      label: { es: "Subiendo", en: "Rising" },
      reason: { es: `+${m.change_pct.toFixed(1)}% esta semana`, en: `+${m.change_pct.toFixed(1)}% this week` },
      icon: TrendingUp, tier: "hot",
      color: "text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/30",
    });
  }

  // WATCH — trend / energy
  if (m?.status === "cooling") {
    flags.push({
      type: "cooling",
      label: { es: "Perdiendo ritmo", en: "Losing momentum" },
      reason: { es: `${m.change_pct.toFixed(1)}% vs semana anterior`, en: `${m.change_pct.toFixed(1)}% vs prior week` },
      icon: TrendingDown, tier: "watch",
      color: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30",
    });
  }
  if (m?.status === "needs_attention") {
    flags.push({
      type: "needs_break",
      label: { es: "Dale un respiro", en: "Needs a break" },
      reason: { es: `${m.change_pct.toFixed(1)}% — rendimiento en caída`, en: `${m.change_pct.toFixed(1)}% — performance sliding` },
      icon: Coffee, tier: "watch",
      color: "text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/30",
    });
  }
  if ((a.utilization_rate ?? 0) < 0.40 && a.calls_handled > 5) {
    flags.push({
      type: "zoning_out",
      label: { es: "Desconectado", en: "Zoning out" },
      reason: { es: `${((a.utilization_rate ?? 0) * 100).toFixed(0)}% utilización — pausas largas`, en: `${((a.utilization_rate ?? 0) * 100).toFixed(0)}% utilization — long pauses` },
      icon: Gauge, tier: "watch",
      color: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30",
    });
  }

  // BEHAVIOUR — patterns
  if (a.avg_talk_sec > 0 && a.avg_talk_sec < 90 && a.calls_handled > 10) {
    flags.push({
      type: "short_calls",
      label: { es: "Llamadas muy cortas", en: "Short calls" },
      reason: { es: `Promedio ${Math.round(a.avg_talk_sec)}s — no llega al pitch`, en: `Avg ${Math.round(a.avg_talk_sec)}s — not reaching the pitch` },
      icon: Timer, tier: "flag",
      color: "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30",
    });
  }
  if ((a.dials_per_hour ?? 0) > 25 && a.close_rate < 0.03 && a.calls_handled > 10) {
    flags.push({
      type: "rushing",
      label: { es: "Marcando sin cerrar", en: "Dialing without closing" },
      reason: { es: `${a.dials_per_hour}/h marcadas, ${(a.close_rate * 100).toFixed(1)}% cierre`, en: `${a.dials_per_hour}/h dials, ${(a.close_rate * 100).toFixed(1)}% close` },
      icon: Zap, tier: "flag",
      color: "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30",
    });
  }
  if ((a.callbacks_set ?? 0) >= 4 && (a.callback_conversion_rate ?? 0) < 0.20) {
    flags.push({
      type: "bad_callbacks",
      label: { es: "Callbacks sin convertir", en: "Callbacks not converting" },
      reason: { es: `${a.callbacks_converted}/${a.callbacks_set} cerrados (${((a.callback_conversion_rate ?? 0) * 100).toFixed(0)}%)`, en: `${a.callbacks_converted}/${a.callbacks_set} closed (${((a.callback_conversion_rate ?? 0) * 100).toFixed(0)}%)` },
      icon: RefreshCw, tier: "flag",
      color: "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30",
    });
  }

  return flags;
}

// ── Calls trend line chart ────────────────────────────────────────────────────
function CallsTrendChart({ callTimes, salesTrend, lang }: {
  callTimes: CallHour[];
  salesTrend: SalesDay[];
  lang: Lang;
}) {
  // Use hourly call data. If empty fall back to daily sales as proxy.
  const points = callTimes.length > 0
    ? callTimes.map(h => ({ label: `${String(h.hour).padStart(2, "0")}h`, value: h.calls }))
    : salesTrend.slice(-14).map(d => ({
        label: new Date(d.date).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" }),
        value: d.sales,
      }));

  if (points.length < 2) return null;

  const W = 800, H = 120, PAD = { t: 16, r: 8, b: 28, l: 36 };
  const vals = points.map(p => p.value);
  const maxV = Math.max(...vals, 1);
  const minV = Math.min(...vals, 0);
  const range = maxV - minV || 1;

  const cx = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
  const cy = (v: number) => PAD.t + (1 - (v - minV) / range) * (H - PAD.t - PAD.b);

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${cx(i).toFixed(1)},${cy(p.value).toFixed(1)}`).join(" ");

  // Detect drops: consecutive pairs where value falls > 20%
  const drops = points.map((p, i) => {
    if (i === 0) return false;
    const prev = points[i - 1].value;
    return prev > 0 && (p.value - prev) / prev < -0.2;
  });

  const isHourly = callTimes.length > 0;
  const title = isHourly
    ? (lang === "es" ? "Llamadas por hora — hoy" : "Calls by hour — today")
    : (lang === "es" ? `Llamadas — últimos ${points.length} días` : `Calls — last ${points.length} days`);

  // tick labels: show every Nth to avoid crowding
  const tickEvery = points.length > 20 ? 4 : points.length > 10 ? 2 : 1;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-500 inline-block rounded" /> {lang === "es" ? "llamadas" : "calls"}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> {lang === "es" ? "caída &gt;20%" : "drop &gt;20%"}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ minWidth: isHourly ? 480 : 320 }}>
          {/* Y-axis gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = PAD.t + f * (H - PAD.t - PAD.b);
            const v = Math.round(maxV - f * range);
            return (
              <g key={f}>
                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#e4e4e7" strokeWidth="0.5" className="dark:stroke-zinc-800" />
                <text x={PAD.l - 4} y={y + 4} fontSize="9" fill="#a1a1aa" textAnchor="end">{v}</text>
              </g>
            );
          })}

          {/* Area fill */}
          <path
            d={`${pathD} L${cx(points.length - 1).toFixed(1)},${(H - PAD.b).toFixed(1)} L${cx(0).toFixed(1)},${(H - PAD.b).toFixed(1)} Z`}
            fill="url(#callsGrad)" opacity="0.3"
          />
          <defs>
            <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line */}
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* Dots + drop markers */}
          {points.map((p, i) => {
            const x = cx(i), y = cy(p.value);
            const isDrop = drops[i];
            return (
              <g key={i}>
                {isDrop && (
                  <>
                    <line x1={x} y1={PAD.t} x2={x} y2={H - PAD.b} stroke="#f87171" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
                    <circle cx={x} cy={y} r="5" fill="#fef2f2" stroke="#f87171" strokeWidth="1.5" className="dark:fill-red-950" />
                  </>
                )}
                {!isDrop && (
                  <circle cx={x} cy={y} r="3" fill="#10b981" stroke="white" strokeWidth="1.5" className="dark:stroke-zinc-900" />
                )}
                {/* Tooltip value on hover via title */}
                <title>{p.label}: {p.value}</title>
                <rect x={x - 10} y={PAD.t} width="20" height={H - PAD.t - PAD.b} fill="transparent" />
              </g>
            );
          })}

          {/* X-axis labels */}
          {points.map((p, i) => {
            if (i % tickEvery !== 0) return null;
            return (
              <text key={i} x={cx(i)} y={H - 4} fontSize="9" fill="#a1a1aa" textAnchor="middle">{p.label}</text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── Per-agent activity chart ──────────────────────────────────────────────────
function AgentWeekChart({ data, lang }: { data: number[]; lang: Lang }) {
  if (!data || data.length < 2) return null;

  const maxV = Math.max(...data, 0.001);
  const up = data[data.length - 1] >= data[0];
  const BAR_H = 64; // px height of bar area
  const LABEL_H = 16;
  const H = BAR_H + LABEL_H;

  // Week labels: oldest first — "S-3", "S-2", "S-1", "Esta sem."
  const weekLabels = data.map((_, i) => {
    const weeksAgo = data.length - 1 - i;
    if (weeksAgo === 0) return lang === "es" ? "Hoy" : "Now";
    if (weeksAgo === 1) return lang === "es" ? "S-1" : "W-1";
    return lang === "es" ? `S-${weeksAgo}` : `W-${weeksAgo}`;
  });

  return (
    <div className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60 px-2 pt-2 pb-0 overflow-hidden" style={{ height: H + 8 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: BAR_H }}>
        {data.map((v, i) => {
          const isLast = i === data.length - 1;
          const barH = maxV > 0 ? Math.max((v / maxV) * (BAR_H - 14), 2) : 2;
          const barColor = isLast
            ? (up ? "#10b981" : "#f87171")
            : (up ? "rgb(52,211,153)" : "rgb(252,165,165)");
          const opacity = isLast ? 1 : 0.45 + (i / (data.length - 1)) * 0.35;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              {v > 0 && (
                <div style={{ fontSize: "8px", color: isLast ? barColor : "#a1a1aa", marginBottom: "2px", fontWeight: isLast ? 700 : 400 }}>
                  {(v * 100).toFixed(0)}%
                </div>
              )}
              <div
                style={{
                  width: "100%",
                  height: `${barH}px`,
                  backgroundColor: barColor,
                  opacity,
                  borderRadius: "3px 3px 0 0",
                  boxShadow: isLast ? `0 0 6px ${barColor}66` : "none",
                  transition: "height 0.3s ease",
                }}
                title={`${weekLabels[i]}: ${(v * 100).toFixed(1)}%`}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "3px", height: LABEL_H, alignItems: "center" }}>
        {weekLabels.map((l, i) => {
          const isLast = i === data.length - 1;
          return (
            <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "8px", color: isLast ? (up ? "#10b981" : "#f87171") : "#a1a1aa", fontWeight: isLast ? 700 : 400 }}>
              {l}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Agent card ────────────────────────────────────────────────────────────────
function AgentFlagCard({ agent, momentum, flags, lang }: {
  agent: AgentStat; momentum: AgentMomentum | undefined; flags: Flag[]; lang: Lang;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-3.5 space-y-2.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{agent.full_name}</div>
          <div className="text-xs text-zinc-500 tabular-nums mt-0.5">{agent.sales} {lang === "es" ? "ventas" : "sales"} · {(agent.close_rate * 100).toFixed(1)}% {lang === "es" ? "cierre" : "close"}</div>
        </div>
        {momentum && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0 ${
            momentum.change_pct >= 0
              ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
              : "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30"
          }`}>
            {momentum.change_pct >= 0 ? "+" : ""}{momentum.change_pct.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Weekly activity chart */}
      {momentum?.weekly_series && momentum.weekly_series.length >= 2 && (
        <AgentWeekChart data={momentum.weekly_series} lang={lang} />
      )}

      {/* Flag chips */}
      <div className="space-y-1.5">
        {flags.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${f.color}`}>
              <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2.2} />
              <div><span className="font-semibold">{f.label[lang]}</span><span className="ml-1.5 opacity-75">{f.reason[lang]}</span></div>
            </div>
          );
        })}
      </div>

      {/* Metrics strip */}
      <div className="flex gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-500 flex-wrap">
        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{agent.calls_handled}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.round(agent.avg_talk_sec)}s</span>
        <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{((agent.utilization_rate ?? 0) * 100).toFixed(0)}%</span>
        <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />{agent.callbacks_converted ?? 0}/{agent.callbacks_set ?? 0} cb</span>
      </div>
    </div>
  );
}

function Column({ title, icon: Icon, color, children, emptyMsg }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode[]; emptyMsg: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold uppercase tracking-wider ${color}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />{title}
        <span className="ml-auto font-mono opacity-70">{children.length}</span>
      </div>
      {children.length === 0
        ? <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/20 p-6 text-center text-xs text-zinc-500">{emptyMsg}</div>
        : <div className="space-y-2">{children}</div>
      }
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MomentumTab({ lang, agents, momentum, callTimes, salesTrend }: {
  lang: Lang;
  agents: AgentStat[];
  momentum: AgentMomentum[];
  callTimes: CallHour[];
  salesTrend: SalesDay[];
}) {
  const momMap = useMemo(() => new Map(momentum.map(m => [m.user, m])), [momentum]);

  const withFlags = useMemo(() => agents.map(a => ({
    agent: a, mom: momMap.get(a.user),
    flags: computeFlags(a, momMap.get(a.user)),
  })), [agents, momMap]);

  const hot      = withFlags.filter(x => x.flags.some(f => f.tier === "hot"));
  const watch    = withFlags.filter(x => x.flags.some(f => f.tier === "watch") && !x.flags.some(f => f.tier === "hot"));
  const badBehav = withFlags.filter(x => x.flags.some(f => f.tier === "flag"));

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {lang === "es" ? "Momentum del equipo" : "Team momentum"}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
          {lang === "es" ? "Quién está en racha, quién necesita un empujón, y qué patrones vigilar" : "Who's on fire, who needs a nudge, and what patterns to watch"}
        </p>
      </div>

      {/* Calls trend chart */}
      <CallsTrendChart callTimes={callTimes} salesTrend={salesTrend} lang={lang} />

      {/* Three columns */}
      <div className="grid md:grid-cols-3 gap-4">
        <Column
          title={lang === "es" ? "En racha" : "On fire"}
          icon={Flame}
          color="text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
          emptyMsg={lang === "es" ? "Nadie en racha aún" : "Nobody on fire yet"}
        >
          {hot.map(({ agent, mom, flags }) => (
            <AgentFlagCard key={agent.user} agent={agent} momentum={mom} flags={flags.filter(f => f.tier === "hot")} lang={lang} />
          ))}
        </Column>

        <Column
          title={lang === "es" ? "Vigilar" : "Watch"}
          icon={Eye}
          color="text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30"
          emptyMsg={lang === "es" ? "Todos rinden bien" : "Everyone performing well"}
        >
          {watch.map(({ agent, mom, flags }) => (
            <AgentFlagCard key={agent.user} agent={agent} momentum={mom} flags={flags.filter(f => f.tier === "watch")} lang={lang} />
          ))}
        </Column>

        <Column
          title={lang === "es" ? "Comportamiento" : "Behaviour"}
          icon={AlertOctagon}
          color="text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30"
          emptyMsg={lang === "es" ? "Sin patrones problemáticos" : "No problem patterns"}
        >
          {badBehav.map(({ agent, mom, flags }) => (
            <AgentFlagCard key={agent.user} agent={agent} momentum={mom} flags={flags.filter(f => f.tier === "flag")} lang={lang} />
          ))}
        </Column>
      </div>
    </section>
  );
}
