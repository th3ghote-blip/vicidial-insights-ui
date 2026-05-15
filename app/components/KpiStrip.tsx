"use client";

import { Flame, TrendingUp, Phone, Award, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Lead, AgentStat, SalesDay, PipelineForecast } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

export default function KpiStrip({
  lang, leads, agents, salesTrend, forecast,
}: { lang: Lang; leads: Lead[]; agents: AgentStat[]; salesTrend: SalesDay[]; forecast: PipelineForecast }) {
  const tr = t[lang].kpi;
  const hot = leads.filter(l => l.score >= 60).length;
  const totalSales = salesTrend.reduce((s, d) => s + d.sales, 0);
  const totalCalls = agents.reduce((s, a) => s + a.calls_handled, 0);
  const conv = totalCalls > 0 ? ((totalSales / totalCalls) * 100).toFixed(1) : "0";
  const top = agents[0];

  // Mini sparkline data — last 14 days
  const sparkData = salesTrend.slice(-14).map(d => d.sales);

  const subs = lang === "es"
    ? { of: "de", total: "totales", sales: "ventas", last7: "últimos 7 días", close: "cierre" }
    : { of: "of", total: "total", sales: "sales", last7: "last 7 days", close: "close rate" };

  const cards = [
    {
      label: tr.hotLeads,
      value: hot,
      sub: `${subs.of} ${leads.length} ${subs.total}`,
      icon: Flame,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-300",
    },
    {
      label: tr.conversion,
      value: `${conv}%`,
      sub: `${totalSales} ${subs.sales}`,
      icon: TrendingUp,
      iconBg: "bg-sky-500/10",
      iconColor: "text-sky-400",
      valueColor: "text-sky-600 dark:text-sky-300",
      sparkline: sparkData,
    },
    {
      label: tr.callsToday,
      value: totalCalls.toLocaleString(),
      sub: subs.last7,
      icon: Phone,
      iconBg: "bg-zinc-700/40",
      iconColor: "text-zinc-300",
      valueColor: "text-zinc-900 dark:text-zinc-100",
    },
    {
      label: tr.topCloser,
      value: top?.full_name?.split(" ")[0] ?? "—",
      sub: top ? `${(top.close_rate * 100).toFixed(1)}% ${subs.close}` : "",
      icon: Award,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      valueColor: "text-amber-600 dark:text-amber-300",
    },
  ];

  // Forecast strip — appears below KPIs
  const forecastUp = forecast.delta_vs_last_week_pct >= 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-3 sm:p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm dark:shadow-none"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${c.iconColor}`} strokeWidth={2} />
                </div>
                {c.sparkline && <Sparkline data={c.sparkline} />}
              </div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-500 font-semibold mb-0.5 sm:mb-1 truncate">{c.label}</div>
              <div className={`text-xl sm:text-2xl font-semibold tabular-nums truncate ${c.valueColor}`}>{c.value}</div>
              {c.sub && <div className="text-xs text-zinc-600 dark:text-zinc-500 mt-1">{c.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* Forecast strip */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 px-4 py-3 flex items-center gap-3 shadow-sm dark:shadow-none">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${forecastUp ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
          {forecastUp ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-red-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-500 font-semibold">
            {lang === "es" ? "Pronóstico próximos 7 días" : "Next 7 days forecast"}
          </div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{forecast.expected_total_sales}</span>
            {" "}{lang === "es" ? "ventas esperadas" : "expected sales"}
            <span className={`ml-2 font-medium tabular-nums ${forecastUp ? "text-emerald-400" : "text-red-400"}`}>
              {forecastUp ? "+" : ""}{forecast.delta_vs_last_week_pct.toFixed(1)}%
            </span>
            <span className="text-zinc-600 dark:text-zinc-500 text-xs ml-2">
              {lang === "es" ? `vs ${forecast.last_week_sales} la semana pasada` : `vs ${forecast.last_week_sales} last week`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60, h = 20;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  const trend = data[data.length - 1] >= data[0];
  const stroke = trend ? "#34d399" : "#f87171";

  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
