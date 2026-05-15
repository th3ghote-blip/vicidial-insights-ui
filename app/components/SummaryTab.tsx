"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { SalesDay, CallHour, CampaignStat, AgentStat, Lead } from "@/lib/api";
import { type Lang } from "@/lib/i18n";

type RangeLabel = "today" | 7 | 30 | 90 | "custom" | number;

export default function SummaryTab({
  lang, salesTrend, callTimes, campaigns, agents, range, rangeLabel,
}: {
  lang: Lang;
  salesTrend: SalesDay[];
  callTimes: CallHour[];
  campaigns: CampaignStat[];
  agents: AgentStat[];
  leads: Lead[];
  range: number;
  rangeLabel: RangeLabel;
}) {
  const isToday = rangeLabel === "today";

  // ── Metrics ──────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const periodSales = isToday
    ? salesTrend.filter(d => d.date.startsWith(today)).reduce((s, d) => s + d.sales, 0)
    : salesTrend.reduce((s, d) => s + d.sales, 0);

  const prevSales = isToday
    ? salesTrend.filter(d => d.date.startsWith(yesterday)).reduce((s, d) => s + d.sales, 0)
    : (() => {
        const mid = Math.floor(salesTrend.length / 2);
        return salesTrend.slice(0, mid).reduce((s, d) => s + d.sales, 0);
      })();

  const totalCalls = isToday
    ? callTimes.reduce((s, h) => s + h.calls, 0)
    : agents.reduce((s, a) => s + a.calls_handled, 0);

  const conversion = totalCalls > 0 ? ((periodSales / totalCalls) * 100).toFixed(1) : "0";
  const trendUp = periodSales >= prevSales;
  const trendDelta = prevSales > 0 ? (((periodSales - prevSales) / prevSales) * 100).toFixed(1) : "0";

  // ── Chart data ───────────────────────────────────────────────────────
  // Today → hourly bars; other ranges → daily bars (last 14 or all)
  const hourlyBars: { label: string; value: number; highlight: boolean }[] = isToday
    ? callTimes.map(h => ({
        label: `${h.hour.toString().padStart(2, "0")}h`,
        value: h.sales,
        highlight: h.hour === new Date().getHours(),
      }))
    : salesTrend.slice(-14).map((d, i, arr) => ({
        label: new Date(d.date).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" }),
        value: d.sales,
        highlight: i === arr.length - 1,
      }));

  const maxBar = Math.max(...hourlyBars.map(b => b.value), 1);

  // ── Campaign table ───────────────────────────────────────────────────
  const campaignsByRevenue = [...campaigns].sort((a, b) => b.total_sales - a.total_sales);

  // ── Period label ─────────────────────────────────────────────────────
  const periodLabel = isToday
    ? (lang === "es" ? "Hoy" : "Today")
    : rangeLabel === "custom"
      ? (lang === "es" ? "Rango personalizado" : "Custom range")
      : (lang === "es" ? `Últimos ${range} días` : `Last ${range} days`);

  const chartTitle = isToday
    ? (lang === "es" ? "Ventas por hora — hoy" : "Sales by hour — today")
    : (lang === "es" ? `Últimos ${Math.min(salesTrend.length, 14)} días` : `Last ${Math.min(salesTrend.length, 14)} days`);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {lang === "es" ? "Resumen ejecutivo" : "Executive Summary"}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{periodLabel}</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <MetricCard
          label={lang === "es" ? "Ventas" : "Sales"}
          value={periodSales.toLocaleString()}
          sub={lang === "es" ? `vs ${isToday ? "ayer" : "período ant."}: ${trendUp ? "+" : ""}${trendDelta}%` : `vs ${isToday ? "yesterday" : "prior period"}: ${trendUp ? "+" : ""}${trendDelta}%`}
        />
        <MetricCard
          label={lang === "es" ? "Llamadas" : "Calls"}
          value={totalCalls.toLocaleString()}
          sub={periodLabel}
        />
        <MetricCard
          label={lang === "es" ? "Tasa de cierre" : "Close rate"}
          value={`${conversion}%`}
          sub={lang === "es" ? `${periodSales} ventas` : `${periodSales} sales`}
        />
        <MetricCard
          label={lang === "es" ? "Tendencia" : "Trend"}
          value={`${trendUp ? "+" : ""}${trendDelta}%`}
          sub={lang === "es" ? "vs período anterior" : "vs prior period"}
          trend={trendUp}
        />
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{chartTitle}</h3>
        {hourlyBars.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-zinc-500">
            {lang === "es" ? "Sin datos" : "No data"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{
              minWidth: isToday ? "600px" : "auto",
              height: "220px",
              display: "flex",
              alignItems: "flex-end",
              gap: "3px",
              paddingBottom: "28px",
              position: "relative",
            }}>
              {hourlyBars.map((b, i) => {
                const barH = maxBar > 0 ? (b.value / maxBar) * 180 : 0;
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: isToday ? "22px" : "auto" }}>
                    {b.value > 0 && (
                      <div style={{ fontSize: "9px", color: b.highlight ? "#10b981" : "#9ca3af", marginBottom: "2px", fontWeight: 600 }}>
                        {b.value}
                      </div>
                    )}
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max(barH, b.value > 0 ? 3 : 0)}px`,
                        backgroundColor: b.highlight ? "rgb(16, 185, 129)" : "rgb(52, 211, 153)",
                        borderRadius: "3px 3px 0 0",
                        opacity: b.highlight ? 1 : 0.55,
                        boxShadow: b.highlight ? "0 0 8px rgba(16, 185, 129, 0.4)" : "none",
                        transition: "height 0.3s ease",
                      }}
                      title={`${b.label}: ${b.value}`}
                    />
                    <div style={{ fontSize: "9px", marginTop: "6px", color: b.highlight ? "#10b981" : "#9ca3af", fontWeight: b.highlight ? 700 : 400, whiteSpace: "nowrap" }}>
                      {b.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Campaign breakdown */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800/60">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {lang === "es" ? "Ventas por campaña" : "Sales by campaign"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/40">
              <tr className="text-zinc-700 dark:text-zinc-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium">{lang === "es" ? "Campaña" : "Campaign"}</th>
                <th className="text-right px-4 py-2.5 font-medium">{lang === "es" ? "Ventas" : "Sales"}</th>
                <th className="text-right px-4 py-2.5 font-medium">{lang === "es" ? "Llamadas" : "Calls"}</th>
                <th className="text-right px-4 py-2.5 font-medium">{lang === "es" ? "% Cierre" : "Close %"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {campaignsByRevenue.map((c) => (
                <tr key={c.campaign_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">{c.campaign_name || c.campaign_id}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-300 font-semibold">{c.total_sales.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{c.total_dials.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sky-700 dark:text-sky-300">{(c.conversion_rate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, sub, trend }: { label: string; value: string; sub: string; trend?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-3 sm:p-4">
      <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-500 font-semibold mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <div className="text-xl sm:text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</div>
        {trend !== undefined && (trend
          ? <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
          : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 mb-1" />
        )}
      </div>
      <div className="text-xs text-zinc-600 dark:text-zinc-500 mt-1">{sub}</div>
    </div>
  );
}
