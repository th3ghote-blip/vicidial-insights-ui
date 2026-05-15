"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { SalesDay, CampaignStat, AgentStat, Lead } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

export default function SummaryTab({
  lang, salesTrend, campaigns, agents, leads, range,
}: {
  lang: Lang;
  salesTrend: SalesDay[];
  campaigns: CampaignStat[];
  agents: AgentStat[];
  leads: Lead[];
  range: 7 | 30 | 90;
}) {
  const tr = t[lang];

  // Calculate metrics
  const totalSales = salesTrend.reduce((s, d) => s + d.sales, 0);
  const totalCalls = agents.reduce((s, a) => s + a.calls_handled, 0);
  const conversion = totalCalls > 0 ? ((totalSales / totalCalls) * 100).toFixed(1) : "0";
  const avgDailySales = salesTrend.length > 0 ? (totalSales / salesTrend.length).toFixed(0) : "0";

  // Trend: compare first half to second half
  const midpoint = Math.floor(salesTrend.length / 2);
  const firstHalf = salesTrend.slice(0, midpoint).reduce((s, d) => s + d.sales, 0);
  const secondHalf = salesTrend.slice(midpoint).reduce((s, d) => s + d.sales, 0);
  const trendUp = secondHalf >= firstHalf;
  const trendDelta = firstHalf > 0 ? (((secondHalf - firstHalf) / firstHalf) * 100).toFixed(1) : "0";

  // Campaign ranking by sales
  const campaignsByRevenue = [...campaigns].sort((a, b) => b.sales - a.sales);

  // Chart data - daily sales
  const chartData = salesTrend.map((d) => ({
    date: new Date(d.date).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" }),
    sales: d.sales,
  }));

  // Chart sizing
  const chartHeight = 200;
  const chartWidth = 100;
  const maxSales = Math.max(...salesTrend.map(d => d.sales), 1);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {lang === "es" ? "Resumen ejecutivo" : "Executive Summary"}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
          {lang === "es" ? `Últimos ${range} días` : `Last ${range} days`}
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <MetricCard
          label={lang === "es" ? "Ventas totales" : "Total sales"}
          value={totalSales.toLocaleString()}
          sub={lang === "es" ? `${avgDailySales}/día promedio` : `${avgDailySales}/day avg`}
        />
        <MetricCard
          label={lang === "es" ? "Llamadas" : "Calls"}
          value={totalCalls.toLocaleString()}
          sub={lang === "es" ? "últimos " + range + " días" : `last ${range} days`}
        />
        <MetricCard
          label={lang === "es" ? "Tasa de cierre" : "Close rate"}
          value={`${conversion}%`}
          sub={lang === "es" ? `${totalSales} ventas` : `${totalSales} sales`}
        />
        <MetricCard
          label={lang === "es" ? "Tendencia" : "Trend"}
          value={`${trendUp ? "+" : ""}${trendDelta}%`}
          sub={lang === "es" ? "vs período anterior" : "vs prior period"}
          trend={trendUp}
        />
      </div>

      {/* Daily sales chart */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          {lang === "es" ? "Ventas diarias" : "Daily sales"}
        </h3>
        <div style={{ height: "280px", display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: "4px", padding: "16px 0" }}>
          {chartData.map((d, i) => {
            const barHeight = (d.sales / maxSales) * 240;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <div
                  style={{
                    width: "100%",
                    height: `${barHeight}px`,
                    backgroundColor: "rgb(34, 197, 94)",
                    borderRadius: "4px 4px 0 0",
                    opacity: 0.8,
                  }}
                  title={`${d.sales} sales`}
                />
                <div style={{ fontSize: "10px", marginTop: "8px", color: "#999", textAlign: "center", width: "100%" }}>
                  {d.date}
                </div>
              </div>
            );
          })}
        </div>
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
            <thead className="bg-zinc-50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-500">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{lang === "es" ? "Campaña" : "Campaign"}</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{lang === "es" ? "Ventas" : "Sales"}</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{lang === "es" ? "Llamadas" : "Calls"}</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{lang === "es" ? "% Cierre" : "Close %"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {campaignsByRevenue.map((c) => {
                const closeRate = c.calls_handled > 0 ? ((c.sales / c.calls_handled) * 100).toFixed(1) : "0";
                return (
                  <tr key={c.campaign_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">{c.campaign_id}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-300 font-semibold">
                      {c.sales.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                      {c.calls_handled.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-sky-700 dark:text-sky-300">
                      {closeRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  trend?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-3 sm:p-4">
      <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-500 font-semibold mb-1">
        {label}
      </div>
      <div className="flex items-end gap-2">
        <div className="text-xl sm:text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</div>
        {trend !== undefined && (
          trend ? <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
      </div>
      <div className="text-xs text-zinc-600 dark:text-zinc-500 mt-1">{sub}</div>
    </div>
  );
}
