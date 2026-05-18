"use client";

import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import type { SalesDay, CallHour, CampaignStat, AgentStat, Lead, WeeklyInsight, AgentMomentum } from "@/lib/api";
import { type Lang } from "@/lib/i18n";

type RangeLabel = "today" | 7 | 30 | 90 | "custom" | number;

const STATUS_BADGE: Record<string, { es: string; en: string; color: string }> = {
  rising_star:     { es: "En racha 🔥",       en: "On fire 🔥",        color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  on_streak:       { es: "Subiendo",           en: "Rising",            color: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  stable:          { es: "Estable",            en: "Stable",            color: "bg-zinc-200/60 text-zinc-600 dark:text-zinc-400" },
  cooling:         { es: "Vigilar",            en: "Watch",             color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  needs_attention: { es: "Atención",           en: "Attention",         color: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

export default function SummaryTab({
  lang, salesTrend, callTimes, campaigns, agents, leads: _leads,
  range, rangeLabel, weekly, momentum,
}: {
  lang: Lang;
  salesTrend: SalesDay[];
  callTimes: CallHour[];
  campaigns: CampaignStat[];
  agents: AgentStat[];
  leads: Lead[];
  range: number;
  rangeLabel: RangeLabel;
  weekly?: WeeklyInsight;
  momentum?: AgentMomentum[];
}) {
  const isToday = rangeLabel === "today";

  // ── Metrics ───────────────────────────────────────────────────────────────
  const today     = new Date().toISOString().split("T")[0];
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

  const avgTalkSec  = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.avg_talk_sec, 0) / agents.length) : 0;
  const callbacks   = agents.reduce((s, a) => s + (a.callbacks_set ?? 0), 0);
  const conversion  = totalCalls > 0 ? ((periodSales / totalCalls) * 100).toFixed(1) : "0";
  const trendUp     = periodSales >= prevSales;
  const trendDelta  = prevSales > 0 ? (((periodSales - prevSales) / prevSales) * 100).toFixed(1) : "0";

  // ── Chart ─────────────────────────────────────────────────────────────────
  const chartDays = range <= 7 ? salesTrend.length : Math.min(salesTrend.length, 30);
  const hourlyBars: { label: string; value: number; highlight: boolean }[] = isToday
    ? callTimes.map(h => ({
        label: `${h.hour.toString().padStart(2, "0")}h`,
        value: h.sales,
        highlight: h.hour === new Date().getHours(),
      }))
    : salesTrend.slice(-chartDays).map((d, i, arr) => ({
        label: new Date(d.date).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" }),
        value: d.sales,
        highlight: i === arr.length - 1,
      }));
  const maxBar = Math.max(...hourlyBars.map(b => b.value), 1);

  // ── Derived ───────────────────────────────────────────────────────────────
  const campaignsByRevenue = [...campaigns].sort((a, b) => b.total_sales - a.total_sales).slice(0, 5);
  const topAgents = [...agents].sort((a, b) => b.sales - a.sales).slice(0, 4);
  const momMap = new Map((momentum ?? []).map(m => [m.user, m]));

  const periodLabel = isToday
    ? (lang === "es" ? "Hoy" : "Today")
    : rangeLabel === "custom"
      ? (lang === "es" ? "Rango personalizado" : "Custom range")
      : (lang === "es" ? `Últimos ${range} días` : `Last ${range} days`);

  const chartTitle = isToday
    ? (lang === "es" ? "Ventas por hora — hoy" : "Sales by hour — today")
    : (lang === "es" ? `Últimos ${chartDays} días` : `Last ${chartDays} days`);

  const avgTalkLabel = avgTalkSec >= 60
    ? `${(avgTalkSec / 60).toFixed(1)}m`
    : `${avgTalkSec}s`;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {lang === "es" ? "Resumen ejecutivo" : "Executive Summary"}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{periodLabel}</p>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <KpiCard
          label={lang === "es" ? "Ventas" : "Sales"}
          value={periodSales.toLocaleString()}
          sub={`${trendUp ? "+" : ""}${trendDelta}% vs ${lang === "es" ? (isToday ? "ayer" : "período ant.") : (isToday ? "yesterday" : "prior period")}`}
          trendUp={trendUp}
          highlight
        />
        <KpiCard
          label={lang === "es" ? "Agentes activos" : "Active agents"}
          value={agents.length.toString()}
          sub={lang === "es" ? "en el período" : "in period"}
        />
        <KpiCard
          label={lang === "es" ? "Tasa de cierre" : "Close rate"}
          value={`${conversion}%`}
          sub={lang === "es" ? "ventas / llamadas" : "sales / calls"}
        />
        <KpiCard
          label={lang === "es" ? "T. promedio" : "Avg talk"}
          value={avgTalkLabel}
          sub={lang === "es" ? "por llamada" : "per call"}
        />
        <KpiCard
          label="Callbacks"
          value={callbacks.toLocaleString()}
          sub={lang === "es" ? "pendientes" : "scheduled"}
        />
      </div>

      {/* ── Two-column body ── */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* Left col: chart + campaign table */}
        <div className="lg:col-span-3 space-y-4">

          {/* Chart */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{chartTitle}</h3>
            {hourlyBars.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-zinc-500">
                {lang === "es" ? "Sin datos" : "No data"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div style={{ minWidth: isToday ? "560px" : "auto", height: "180px", display: "flex", alignItems: "flex-end", gap: "3px", paddingBottom: "24px", position: "relative" }}>
                  {hourlyBars.map((b, i) => {
                    const barH = maxBar > 0 ? (b.value / maxBar) * 148 : 0;
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: isToday ? "20px" : "auto" }}>
                        {b.value > 0 && (
                          <div style={{ fontSize: "8px", color: b.highlight ? "#10b981" : "#9ca3af", marginBottom: "2px", fontWeight: 600 }}>
                            {b.value}
                          </div>
                        )}
                        <div
                          style={{
                            width: "100%",
                            height: `${Math.max(barH, b.value > 0 ? 3 : 0)}px`,
                            backgroundColor: b.highlight ? "rgb(16,185,129)" : "rgb(52,211,153)",
                            borderRadius: "3px 3px 0 0",
                            opacity: b.highlight ? 1 : 0.55,
                            boxShadow: b.highlight ? "0 0 8px rgba(16,185,129,0.4)" : "none",
                          }}
                          title={`${b.label}: ${b.value}`}
                        />
                        <div style={{ fontSize: "8px", marginTop: "5px", color: b.highlight ? "#10b981" : "#9ca3af", fontWeight: b.highlight ? 700 : 400, whiteSpace: "nowrap" }}>
                          {b.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Campaign table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {lang === "es" ? "Campañas" : "Campaigns"}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 dark:text-zinc-600 text-[11px] uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/60">
                    <th className="text-left px-4 py-2 font-medium">{lang === "es" ? "Campaña" : "Campaign"}</th>
                    <th className="text-right px-3 py-2 font-medium">{lang === "es" ? "Agts" : "Agts"}</th>
                    <th className="text-right px-3 py-2 font-medium">{lang === "es" ? "Ventas" : "Sales"}</th>
                    <th className="text-right px-4 py-2 font-medium">{lang === "es" ? "Cierre%" : "Close%"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                  {campaignsByRevenue.map((c) => (
                    <tr key={c.campaign_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[160px]">{c.campaign_name || c.campaign_id}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-600 dark:text-zinc-400 text-xs">{c.active_agents}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-300 font-semibold">{c.total_sales}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sky-700 dark:text-sky-300 font-medium">{(c.conversion_rate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right col: top agents + AI insight */}
        <div className="lg:col-span-2 space-y-4">

          {/* Top agents */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {lang === "es" ? "Mejores Agentes" : "Top Agents"}
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 dark:text-zinc-600 text-[11px] uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/60">
                  <th className="text-left px-4 py-2 font-medium">{lang === "es" ? "Agente" : "Agent"}</th>
                  <th className="text-right px-3 py-2 font-medium">{lang === "es" ? "Ventas" : "Sales"}</th>
                  <th className="text-right px-4 py-2 font-medium">{lang === "es" ? "Cierre%" : "Close%"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                {topAgents.map((a, rank) => (
                  <tr key={a.user} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-mono text-zinc-400 w-4 shrink-0">{rank + 1}</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {a.full_name.split(" ").map((n, i) => i === 0 ? n : n[0] + ".").join(" ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-300 font-semibold">{a.sales}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-sky-700 dark:text-sky-300 font-medium">{(a.close_rate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Insight */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
                <Sparkles className="h-3 w-3 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {lang === "es" ? "Insight IA" : "AI Insight"}
              </span>
            </div>
            {weekly?.summary ? (
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {weekly.summary}
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                {lang === "es"
                  ? "Resumen IA no disponible — configura ANTHROPIC_API_KEY."
                  : "AI summary unavailable — set ANTHROPIC_API_KEY."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Momentum mini strip ── */}
      {momentum && momentum.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {lang === "es" ? "Momentum de Agentes" : "Agent Momentum"}
            </h3>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {momentum.slice(0, 8).map(m => {
              const badge = STATUS_BADGE[m.status];
              const agent = agents.find(a => a.user === m.user);
              const mom = momMap.get(m.user);
              return (
                <div key={m.user} className="rounded-lg border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/40 p-2.5 space-y-1.5">
                  <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate">
                    {m.full_name.split(" ").map((n, i) => i === 0 ? n : n[0] + ".").join(" ")}
                  </div>
                  <div className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${badge?.color ?? ""}`}>
                    {badge?.[lang] ?? m.status}
                  </div>
                  {agent && (
                    <div className="text-[10px] text-zinc-500 tabular-nums">
                      {agent.sales} {lang === "es" ? "ventas" : "sales"} · {(agent.close_rate * 100).toFixed(1)}%
                      {mom && (
                        <span className={`ml-1 font-semibold ${mom.change_pct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                          {mom.change_pct >= 0 ? "+" : ""}{mom.change_pct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function KpiCard({ label, value, sub, trend, trendUp, highlight }: {
  label: string; value: string; sub: string;
  trend?: boolean; trendUp?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${
      highlight
        ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5"
        : "border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60"
    }`}>
      <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-semibold mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <div className={`text-xl sm:text-2xl font-semibold tabular-nums ${highlight ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-900 dark:text-zinc-100"}`}>
          {value}
        </div>
        {trendUp !== undefined && (trendUp
          ? <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
          : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 mb-1" />
        )}
        {trend !== undefined && (trend
          ? <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
          : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 mb-1" />
        )}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{sub}</div>
    </div>
  );
}
