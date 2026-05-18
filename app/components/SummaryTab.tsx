"use client";

import { TrendingUp, TrendingDown, Sparkles, Flame, Phone, Clock, ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, Minus } from "lucide-react";
import type { SalesDay, CallHour, CampaignStat, AgentStat, Lead, WeeklyInsight, AgentMomentum, PipelineForecast } from "@/lib/api";
import { type Lang } from "@/lib/i18n";
import { type Targets, vsTarget } from "@/lib/targets";

type RangeLabel = "today" | 7 | 30 | 90 | "custom" | number;

const STATUS_BADGE: Record<string, { es: string; en: string; color: string }> = {
  rising_star:     { es: "En racha 🔥",       en: "On fire 🔥",        color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  on_streak:       { es: "Subiendo",           en: "Rising",            color: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  stable:          { es: "Estable",            en: "Stable",            color: "bg-zinc-200/60 text-zinc-600 dark:bg-zinc-700/60 dark:text-zinc-200" },
  cooling:         { es: "Vigilar",            en: "Watch",             color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  needs_attention: { es: "Atención",           en: "Attention",         color: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

export default function SummaryTab({
  lang, salesTrend, callTimes, campaigns, agents, leads,
  range, rangeLabel, weekly, momentum, targets, forecast,
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
  targets?: Targets;
  forecast?: PipelineForecast;
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

      {/* ── Compact stat bar ── */}
      {(() => {
        const hotLeads = leads.filter(l => l.score >= 60).length;
        const convStatus  = vsTarget(totalCalls > 0 ? periodSales / totalCalls : 0, targets?.close_rate ?? null);
        const callsStatus = vsTarget(totalCalls, targets?.calls ?? null);
        const forecastUp  = (forecast?.delta_vs_last_week_pct ?? 0) >= 0;
        return (
          <div className="space-y-2">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
              <div className="flex flex-wrap divide-x divide-zinc-200 dark:divide-zinc-800/80">
                {/* Sales — highlighted */}
                <div className="flex-1 flex items-center gap-2.5 px-3 sm:px-4 py-2.5 min-w-[120px] bg-emerald-500/5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold leading-none mb-0.5">{lang === "es" ? "Ventas" : "Sales"}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{periodSales.toLocaleString()}</span>
                      <span className={`text-[10px] font-semibold ${trendUp ? "text-emerald-500" : "text-red-400"}`}>
                        {trendUp ? "+" : ""}{trendDelta}%
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 leading-none">{lang === "es" ? (isToday ? "vs ayer" : "vs período ant.") : (isToday ? "vs yesterday" : "vs prior period")}</div>
                  </div>
                </div>

                {/* Calls */}
                <div className="flex-1 flex items-center gap-2.5 px-3 sm:px-4 py-2.5 min-w-[100px]">
                  <div className="h-7 w-7 rounded-lg bg-zinc-700/20 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold leading-none mb-0.5">{lang === "es" ? "Llamadas" : "Calls"}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{totalCalls.toLocaleString()}</span>
                      {callsStatus && <VsChip status={callsStatus} />}
                    </div>
                    <div className="text-[10px] text-zinc-500 leading-none">{lang === "es" ? `últ. ${range}d` : `last ${range}d`}</div>
                  </div>
                </div>

                {/* Close rate */}
                <div className="flex-1 flex items-center gap-2.5 px-3 sm:px-4 py-2.5 min-w-[100px]">
                  <div className="h-7 w-7 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-sky-400" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold leading-none mb-0.5">{lang === "es" ? "Cierre" : "Close rate"}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-semibold tabular-nums text-sky-700 dark:text-sky-300">{conversion}%</span>
                      {convStatus && <VsChip status={convStatus} />}
                    </div>
                    <div className="text-[10px] text-zinc-500 leading-none">{lang === "es" ? "ventas/llamadas" : "sales/calls"}</div>
                  </div>
                </div>

                {/* Avg talk */}
                <div className="flex-1 flex items-center gap-2.5 px-3 sm:px-4 py-2.5 min-w-[100px]">
                  <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-3.5 w-3.5 text-violet-400" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold leading-none mb-0.5">{lang === "es" ? "T. promedio" : "Avg talk"}</div>
                    <span className="text-base font-semibold tabular-nums text-violet-700 dark:text-violet-300">{avgTalkLabel}</span>
                    <div className="text-[10px] text-zinc-500 leading-none">{lang === "es" ? "por llamada" : "per call"}</div>
                  </div>
                </div>

                {/* Hot leads */}
                <div className="flex-1 flex items-center gap-2.5 px-3 sm:px-4 py-2.5 min-w-[100px]">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Flame className="h-3.5 w-3.5 text-amber-400" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold leading-none mb-0.5">{lang === "es" ? "Leads calientes" : "Hot leads"}</div>
                    <span className="text-base font-semibold tabular-nums text-amber-700 dark:text-amber-300">{hotLeads}</span>
                    <div className="text-[10px] text-zinc-500 leading-none">{lang === "es" ? `de ${leads.length}` : `of ${leads.length}`}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast inline */}
            {forecast && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 px-4 py-2.5 flex items-center gap-3 shadow-sm">
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${forecastUp ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                  {forecastUp ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />}
                </div>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold whitespace-nowrap">{lang === "es" ? "Próx. 7 días" : "Next 7 days"}</span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{forecast.expected_total_sales}</span>
                  {" "}{lang === "es" ? "ventas esperadas" : "expected sales"}
                </span>
                <span className={`text-sm font-semibold tabular-nums ${forecastUp ? "text-emerald-400" : "text-red-400"}`}>
                  {forecastUp ? "+" : ""}{forecast.delta_vs_last_week_pct.toFixed(1)}%
                </span>
                <span className="text-xs text-zinc-500 hidden sm:inline">
                  {lang === "es" ? `vs ${forecast.last_week_sales} sem. ant.` : `vs ${forecast.last_week_sales} last week`}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Two-column body ── */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* Left col: chart + campaign table */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Chart */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{chartTitle}</h3>
            {hourlyBars.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-zinc-500">
                {lang === "es" ? "Sin datos" : "No data"}
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <div style={{ minWidth: isToday ? "520px" : "auto", height: "180px", display: "flex", alignItems: "flex-end", gap: "2px", paddingBottom: "24px", position: "relative" }}>
                  {hourlyBars.map((b, i) => {
                    const barH = maxBar > 0 ? (b.value / maxBar) * 148 : 0;
                    // Show labels every Nth bar to avoid crowding; always show first, last, highlight
                    const labelStep = hourlyBars.length > 20 ? 7 : hourlyBars.length > 10 ? 4 : 1;
                    const showLabel = b.highlight || i === 0 || i % labelStep === 0;
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: isToday ? "18px" : "auto" }}>
                        {b.value > 0 && (
                          <div style={{ fontSize: "8px", color: b.highlight ? "#10b981" : "#9ca3af", marginBottom: "2px", fontWeight: 600 }}>
                            {b.highlight ? b.value : ""}
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
                        <div style={{ fontSize: "8px", marginTop: "5px", color: b.highlight ? "#10b981" : "#9ca3af", fontWeight: b.highlight ? 700 : 400, whiteSpace: "nowrap", visibility: showLabel ? "visible" : "hidden" }}>
                          {b.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Campaign table — flex-1 so it fills remaining height matching right col */}
          <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {lang === "es" ? "Campañas" : "Campaigns"}
              </h3>
            </div>
            <div className="overflow-x-auto no-scrollbar">
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
                {topAgents.map((a, rank) => {
                  const closeStatus = vsTarget(a.close_rate, targets?.close_rate ?? null);
                  const salesStatus = vsTarget(a.sales,      targets?.sales      ?? null);
                  return (
                    <tr key={a.user} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-mono text-zinc-400 w-4 shrink-0">{rank + 1}</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {a.full_name.split(" ").map((n, i) => i === 0 ? n : n[0] + ".").join(" ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                        <span className={salesStatus === "above" ? "text-emerald-700 dark:text-emerald-300" : salesStatus === "below" ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-300"}>
                          {a.sales}
                        </span>
                        {salesStatus && <SummaryTargetBadge status={salesStatus} />}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                        <span className={closeStatus === "above" ? "text-emerald-700 dark:text-emerald-300" : closeStatus === "below" ? "text-red-700 dark:text-red-400" : "text-sky-700 dark:text-sky-300"}>
                          {(a.close_rate * 100).toFixed(1)}%
                        </span>
                        {closeStatus && <SummaryTargetBadge status={closeStatus} />}
                      </td>
                    </tr>
                  );
                })}
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
                <InlineMarkdown text={weekly.summary} />
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

/** Renders **bold** and # headings from AI summary without a markdown lib. */
function InlineMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter(b => b.trim());
  return (
    <>
      {blocks.map((block, bi) => {
        const trimmed = block.trim();
        // Strip leading # heading markers — render as bold label, not a giant h1
        const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
        if (headingMatch) {
          return (
            <span key={bi}>
              {bi > 0 && <><br /><br /></>}
              <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400">
                {headingMatch[1]}
              </span>
            </span>
          );
        }
        // Inline **bold**
        const parts = trimmed.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={bi}>
            {bi > 0 && <><br /><br /></>}
            {parts.map((part, pi) =>
              pi % 2 === 1
                ? <strong key={pi} className="font-semibold text-zinc-900 dark:text-zinc-100">{part}</strong>
                : part
            )}
          </span>
        );
      })}
    </>
  );
}

function VsChip({ status }: { status: "above" | "below" | "on" }) {
  if (status === "above") return <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 leading-none"><ChevronUp className="h-2 w-2" strokeWidth={3} /></span>;
  if (status === "below") return <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/25 leading-none"><ChevronDown className="h-2 w-2" strokeWidth={3} /></span>;
  return <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 leading-none"><Minus className="h-2 w-2" strokeWidth={3} /></span>;
}

function SummaryTargetBadge({ status }: { status: "above" | "below" | "on" }) {
  if (status === "above") return <span className="ml-1 text-[8px] font-bold text-emerald-600 dark:text-emerald-400">▲</span>;
  if (status === "below") return <span className="ml-1 text-[8px] font-bold text-red-600 dark:text-red-400">▼</span>;
  return <span className="ml-1 text-[8px] font-bold text-amber-600 dark:text-amber-400">=</span>;
}

