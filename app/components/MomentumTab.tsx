"use client";

import { useMemo } from "react";
import {
  Flame, Eye, AlertOctagon, TrendingUp, TrendingDown,
  Phone, Clock, RefreshCw, Zap, Coffee, Timer, Gauge,
} from "lucide-react";
import type { AgentStat, AgentMomentum } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

// ── Flag definitions ──────────────────────────────────────────────────────────
type FlagType =
  | "on_fire"       // rising_star or on_streak
  | "streak"        // change_pct > +15%
  | "cooling"       // status cooling + declining series
  | "needs_break"   // needs_attention status
  | "zoning_out"    // utilization < 40%
  | "short_calls"   // avg_talk < 90s — not pitching
  | "rushing"       // dials/h > 25 + close < 3%
  | "bad_callbacks" // set > 3 callbacks, < 20% converted

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

  // ── HOT ──────────────────────────────────────────────────────────────
  if (m?.status === "rising_star" || m?.status === "on_streak") {
    flags.push({
      type: "on_fire",
      label: { es: "En racha", en: "On fire" },
      reason: {
        es: `+${m.change_pct.toFixed(1)}% vs semana anterior`,
        en: `+${m.change_pct.toFixed(1)}% vs prior week`,
      },
      icon: Flame,
      tier: "hot",
      color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    });
  }
  if (m && m.change_pct >= 15 && m.status !== "rising_star" && m.status !== "on_streak") {
    flags.push({
      type: "streak",
      label: { es: "Subiendo", en: "Rising" },
      reason: {
        es: `+${m.change_pct.toFixed(1)}% esta semana`,
        en: `+${m.change_pct.toFixed(1)}% this week`,
      },
      icon: TrendingUp,
      tier: "hot",
      color: "text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/30",
    });
  }

  // ── WATCH ────────────────────────────────────────────────────────────
  if (m?.status === "cooling") {
    flags.push({
      type: "cooling",
      label: { es: "Enfriándose", en: "Cooling off" },
      reason: {
        es: `${m.change_pct.toFixed(1)}% vs semana anterior`,
        en: `${m.change_pct.toFixed(1)}% vs prior week`,
      },
      icon: TrendingDown,
      tier: "watch",
      color: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30",
    });
  }
  if (m?.status === "needs_attention") {
    flags.push({
      type: "needs_break",
      label: { es: "Dale un respiro", en: "Needs a break" },
      reason: {
        es: `${m.change_pct.toFixed(1)}% vs semana anterior`,
        en: `${m.change_pct.toFixed(1)}% vs prior week`,
      },
      icon: Coffee,
      tier: "watch",
      color: "text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/30",
    });
  }
  if ((a.utilization_rate ?? 0) < 0.40 && a.calls_handled > 5) {
    flags.push({
      type: "zoning_out",
      label: { es: "Desconectado", en: "Zoning out" },
      reason: {
        es: `Utilización ${((a.utilization_rate ?? 0) * 100).toFixed(0)}% — muchas pausas`,
        en: `${((a.utilization_rate ?? 0) * 100).toFixed(0)}% utilization — too many pauses`,
      },
      icon: Gauge,
      tier: "watch",
      color: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30",
    });
  }

  // ── FLAGGED BEHAVIOR ─────────────────────────────────────────────────
  if (a.avg_talk_sec > 0 && a.avg_talk_sec < 90 && a.calls_handled > 10) {
    flags.push({
      type: "short_calls",
      label: { es: "Llamadas cortas", en: "Short calls" },
      reason: {
        es: `Promedio ${Math.round(a.avg_talk_sec)}s — cuelga muy rápido`,
        en: `Avg ${Math.round(a.avg_talk_sec)}s — hanging up too fast`,
      },
      icon: Timer,
      tier: "flag",
      color: "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30",
    });
  }
  if ((a.dials_per_hour ?? 0) > 25 && a.close_rate < 0.03 && a.calls_handled > 10) {
    flags.push({
      type: "rushing",
      label: { es: "Apresurándose", en: "Rushing calls" },
      reason: {
        es: `${a.dials_per_hour}/h marcadas, solo ${(a.close_rate * 100).toFixed(1)}% cierre`,
        en: `${a.dials_per_hour}/h dials, only ${(a.close_rate * 100).toFixed(1)}% close`,
      },
      icon: Zap,
      tier: "flag",
      color: "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30",
    });
  }
  if ((a.callbacks_set ?? 0) >= 4 && (a.callback_conversion_rate ?? 0) < 0.20) {
    flags.push({
      type: "bad_callbacks",
      label: { es: "Callbacks perdidos", en: "Wasted callbacks" },
      reason: {
        es: `${a.callbacks_converted}/${a.callbacks_set} convertidos (${((a.callback_conversion_rate ?? 0) * 100).toFixed(0)}%)`,
        en: `${a.callbacks_converted}/${a.callbacks_set} converted (${((a.callback_conversion_rate ?? 0) * 100).toFixed(0)}%)`,
      },
      icon: RefreshCw,
      tier: "flag",
      color: "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30",
    });
  }

  return flags;
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 56, h = 18;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  const trend = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={pts} fill="none" stroke={trend ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Agent card ────────────────────────────────────────────────────────────────
function AgentFlagCard({ agent, momentum, flags, lang }: {
  agent: AgentStat;
  momentum: AgentMomentum | undefined;
  flags: Flag[];
  lang: Lang;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-3.5">
      {/* Name + sparkline */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{agent.full_name}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 tabular-nums">
            {agent.sales} {lang === "es" ? "ventas" : "sales"} · {(agent.close_rate * 100).toFixed(1)}%
          </div>
        </div>
        {momentum?.weekly_series && <Sparkline data={momentum.weekly_series} />}
      </div>

      {/* Flags */}
      <div className="space-y-1.5">
        {flags.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${f.color}`}>
              <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2.2} />
              <div>
                <span className="font-semibold">{f.label[lang]}</span>
                <span className="ml-1.5 opacity-75">{f.reason[lang]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key metrics strip */}
      <div className="flex gap-3 mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-500 flex-wrap">
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" />{agent.calls_handled}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />{Math.round(agent.avg_talk_sec)}s
        </span>
        <span className="flex items-center gap-1">
          <Gauge className="h-3 w-3" />{((agent.utilization_rate ?? 0) * 100).toFixed(0)}%
        </span>
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />{agent.callbacks_converted ?? 0}/{agent.callbacks_set ?? 0}
        </span>
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────
function Column({ title, icon: Icon, color, agents, emptyMsg }: {
  title: string;
  icon: React.ElementType;
  color: string;
  agents: React.ReactNode[];
  emptyMsg: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold uppercase tracking-wider ${color}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        {title}
        <span className="ml-auto font-mono opacity-70">{agents.length}</span>
      </div>
      {agents.length === 0 ? (
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/20 p-6 text-center text-xs text-zinc-500">
          {emptyMsg}
        </div>
      ) : (
        <div className="space-y-2">{agents}</div>
      )}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function MomentumTab({ lang, agents, momentum }: {
  lang: Lang;
  agents: AgentStat[];
  momentum: AgentMomentum[];
}) {
  const momMap = useMemo(() => new Map(momentum.map(m => [m.user, m])), [momentum]);

  const flagged = useMemo(() => agents.map(a => ({
    agent: a,
    momentum: momMap.get(a.user),
    flags: computeFlags(a, momMap.get(a.user)),
  })).filter(x => x.flags.length > 0), [agents, momMap]);

  const hot   = flagged.filter(x => x.flags.some(f => f.tier === "hot"));
  const watch = flagged.filter(x => x.flags.some(f => f.tier === "watch") && !x.flags.some(f => f.tier === "hot"));
  const flagBad = flagged.filter(x => x.flags.some(f => f.tier === "flag") && !x.flags.some(f => f.tier === "hot"));

  const makeCards = (items: typeof flagged, tier: Flag["tier"]) =>
    items.map(({ agent, momentum: m, flags }) => (
      <AgentFlagCard
        key={agent.user}
        agent={agent}
        momentum={m}
        flags={flags.filter(f => f.tier === tier || (tier === "flag" && f.tier === "watch" && items === flagBad))}
        lang={lang}
      />
    ));

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {lang === "es" ? "Momentum de agentes" : "Agent momentum"}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
          {lang === "es"
            ? "Quién necesita atención, un descanso o un reconocimiento ahora mismo"
            : "Who needs attention, a break, or a shout-out right now"}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Column
          title={lang === "es" ? "En racha" : "On fire"}
          icon={Flame}
          color="text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
          agents={hot.map(({ agent, momentum: m, flags }) => (
            <AgentFlagCard key={agent.user} agent={agent} momentum={m} flags={flags.filter(f => f.tier === "hot")} lang={lang} />
          ))}
          emptyMsg={lang === "es" ? "Nadie en racha aún" : "Nobody on fire yet"}
        />
        <Column
          title={lang === "es" ? "Vigilar" : "Watch"}
          icon={Eye}
          color="text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30"
          agents={watch.map(({ agent, momentum: m, flags }) => (
            <AgentFlagCard key={agent.user} agent={agent} momentum={m} flags={flags.filter(f => f.tier === "watch")} lang={lang} />
          ))}
          emptyMsg={lang === "es" ? "Todos rinden bien" : "Everyone performing well"}
        />
        <Column
          title={lang === "es" ? "Comportamiento" : "Behaviour flags"}
          icon={AlertOctagon}
          color="text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30"
          agents={flagBad.map(({ agent, momentum: m, flags }) => (
            <AgentFlagCard key={agent.user} agent={agent} momentum={m} flags={flags.filter(f => f.tier === "flag")} lang={lang} />
          ))}
          emptyMsg={lang === "es" ? "Sin comportamientos problemáticos" : "No problem behaviours"}
        />
      </div>

      {/* Summary row */}
      {flagged.length === 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-12 text-center">
          <Flame className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <div className="text-sm text-zinc-500">
            {lang === "es" ? "Sin señales destacables — equipo estable" : "No signals to highlight — team is stable"}
          </div>
        </div>
      )}
    </section>
  );
}
