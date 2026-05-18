"use client";

import { Flame, TrendingUp, Phone, Award, ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, Minus } from "lucide-react";
import type { Lead, AgentStat, SalesDay, PipelineForecast } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";
import { type Targets, vsTarget } from "@/lib/targets";

export default function KpiStrip({
  lang, leads, agents, salesTrend, forecast, range, targets,
}: { lang: Lang; leads: Lead[]; agents: AgentStat[]; salesTrend: SalesDay[]; forecast: PipelineForecast; range: number; targets?: Targets }) {
  const tr = t[lang].kpi;
  const hot = leads.filter(l => l.score >= 60).length;
  const totalSales = salesTrend.reduce((s, d) => s + d.sales, 0);
  const totalCalls = agents.reduce((s, a) => s + a.calls_handled, 0);
  const convRate = totalCalls > 0 ? totalSales / totalCalls : 0;
  const conv = (convRate * 100).toFixed(1);
  const top = agents[0];

  const convStatus  = vsTarget(convRate,   targets?.close_rate ?? null);
  const callsStatus = vsTarget(totalCalls, targets?.calls      ?? null);

  const lastNLabel = lang === "es" ? `últ. ${range}d` : `last ${range}d`;
  const forecastUp = forecast.delta_vs_last_week_pct >= 0;

  return (
    <div className="space-y-2">
      {/* ── Single compact stat bar ── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex divide-x divide-zinc-200 dark:divide-zinc-800/80">

          {/* Hot leads */}
          <StatCell
            icon={Flame}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10"
            label={tr.hotLeads}
            value={`${hot}`}
            sub={`${lang === "es" ? "de" : "of"} ${leads.length}`}
          />

          {/* Conversion */}
          <StatCell
            icon={TrendingUp}
            iconColor="text-sky-400"
            iconBg="bg-sky-500/10"
            label={tr.conversion}
            value={`${conv}%`}
            sub={`${totalSales} ${lang === "es" ? "ventas" : "sales"}`}
            sparkData={salesTrend.slice(-14).map(d => d.sales)}
            status={convStatus}
            targetLabel={targets?.close_rate ? `${(targets.close_rate * 100).toFixed(0)}%` : null}
          />

          {/* Calls */}
          <StatCell
            icon={Phone}
            iconColor="text-zinc-400"
            iconBg="bg-zinc-700/30"
            label={tr.callsToday}
            value={totalCalls.toLocaleString()}
            sub={lastNLabel}
            status={callsStatus}
            targetLabel={targets?.calls ? targets.calls.toLocaleString() : null}
          />

          {/* Top closer */}
          <StatCell
            icon={Award}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
            label={tr.topCloser}
            value={top?.full_name?.split(" ")[0] ?? "—"}
            sub={top ? `${(top.close_rate * 100).toFixed(1)}% ${lang === "es" ? "cierre" : "close"}` : ""}
          />
        </div>
      </div>

      {/* ── Forecast strip ── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 px-4 py-2.5 flex items-center gap-3 shadow-sm dark:shadow-none">
        <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${forecastUp ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
          {forecastUp
            ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            : <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold whitespace-nowrap">
            {lang === "es" ? "Próx. 7 días" : "Next 7 days"}
          </span>
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{forecast.expected_total_sales}</span>
            {" "}{lang === "es" ? "ventas esperadas" : "expected sales"}
          </span>
          <span className={`text-sm font-semibold tabular-nums ${forecastUp ? "text-emerald-400" : "text-red-400"}`}>
            {forecastUp ? "+" : ""}{forecast.delta_vs_last_week_pct.toFixed(1)}%
          </span>
          <span className="text-xs text-zinc-500">
            {lang === "es" ? `vs ${forecast.last_week_sales} sem. ant.` : `vs ${forecast.last_week_sales} last week`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({ icon: Icon, iconColor, iconBg, label, value, sub, sparkData, status, targetLabel }: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  sparkData?: number[];
  status?: "above" | "below" | "on" | null;
  targetLabel?: string | null;
}) {
  return (
    <div className="flex-1 flex items-center gap-2.5 px-3 sm:px-4 py-2.5 min-w-0">
      <div className={`h-7 w-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 font-semibold truncate leading-none mb-0.5">{label}</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm sm:text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100 leading-none">{value}</span>
          {status && <VsTargetChip status={status} label={targetLabel ?? ""} />}
        </div>
        {sub && <div className="text-[10px] text-zinc-500 mt-0.5 truncate leading-none">{sub}</div>}
      </div>
      {sparkData && sparkData.length >= 2 && <Sparkline data={sparkData} />}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function VsTargetChip({ status, label }: { status: "above" | "below" | "on"; label: string }) {
  if (status === "above") return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 leading-none">
      <ChevronUp className="h-2 w-2" strokeWidth={3} />{label || "▲"}
    </span>
  );
  if (status === "below") return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/25 leading-none">
      <ChevronDown className="h-2 w-2" strokeWidth={3} />{label || "▼"}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 leading-none">
      <Minus className="h-2 w-2" strokeWidth={3} />{label}
    </span>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 48, h = 18;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  const trend = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} className="opacity-80 shrink-0">
      <polyline points={pts} fill="none" stroke={trend ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
