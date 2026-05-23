"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { CampaignHealth, AttemptROI, CallbackStats, AgentCampaignCell, AgentStat } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

// ── Tooltip style used on all charts ──────────────────────────────────────────
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "rgb(24 24 27)",
  border: "1px solid rgb(63 63 70)",
  borderRadius: 8,
  fontSize: 11,
  color: "#e4e4e7",
};
const TOOLTIP_LABEL_STYLE = { color: "#a1a1aa", marginBottom: 2 };

// ── Attempt ROI value → colour ─────────────────────────────────────────────────
const ATTEMPT_COLORS: Record<AttemptROI["value"], string> = {
  strong:     "#10b981", // emerald-500
  ok:         "#0ea5e9", // sky-500
  diminishing:"#f59e0b", // amber-500
  stop:       "#ef4444", // red-500
};

// ── Small helpers ──────────────────────────────────────────────────────────────
function pct(n: number, decimals = 1) {
  return `${(n * 100).toFixed(decimals)}%`;
}

function colorDot(cls: string) {
  return <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cls}`} />;
}

function contactRateColor(r: number) {
  if (r > 0.30) return "text-emerald-700 dark:text-emerald-300";
  if (r > 0.20) return "text-amber-700 dark:text-amber-300";
  return "text-red-700 dark:text-red-400";
}

function contactRateDotCls(r: number) {
  if (r > 0.30) return "bg-emerald-500";
  if (r > 0.20) return "bg-amber-500";
  return "bg-red-500";
}

function leadAgeColor(days: number) {
  if (days < 7)  return "text-emerald-700 dark:text-emerald-300";
  if (days < 21) return "text-amber-700 dark:text-amber-300";
  return "text-red-700 dark:text-red-400";
}

function remainingColor(r: number) {
  if (r > 0.40) return "text-emerald-700 dark:text-emerald-300";
  if (r > 0.20) return "text-amber-700 dark:text-amber-300";
  return "text-red-700 dark:text-red-400";
}

function freshLeadColor(r: number) {
  if (r > 0.50) return "text-emerald-700 dark:text-emerald-300";
  if (r > 0.25) return "text-amber-700 dark:text-amber-300";
  return "text-red-700 dark:text-red-400";
}

function conversionColor(r: number) {
  if (r > 0.12) return "text-emerald-700 dark:text-emerald-300";
  if (r > 0.07) return "text-amber-700 dark:text-amber-300";
  return "text-red-700 dark:text-red-400";
}

function showRateColor(r: number) {
  if (r > 0.65) return "text-emerald-700 dark:text-emerald-300";
  if (r > 0.45) return "text-amber-700 dark:text-amber-300";
  return "text-red-700 dark:text-red-400";
}

function cbConvColor(r: number) {
  if (r > 0.30) return "text-emerald-700 dark:text-emerald-300";
  if (r > 0.20) return "text-amber-700 dark:text-amber-300";
  return "text-red-700 dark:text-red-400";
}

function healthBarColor(status: CampaignHealth["health_status"]) {
  if (status === "healthy")  return "bg-emerald-500";
  if (status === "warning")  return "bg-amber-400";
  return "bg-red-500";
}

function healthBadge(status: CampaignHealth["health_status"]) {
  const cfg = {
    healthy:  { dot: "🟢", label: "Healthy",  cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
    warning:  { dot: "🟡", label: "Warning",  cls: "bg-amber-500/15  text-amber-700  dark:text-amber-300  border-amber-500/30"  },
    critical: { dot: "🔴", label: "Critical", cls: "bg-red-500/15    text-red-700    dark:text-red-300    border-red-500/30"    },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${cfg.cls}`}>
      {cfg.dot} {cfg.label}
    </span>
  );
}

function verdictBadge(value: AttemptROI["value"], lang: Lang) {
  const labels: Record<AttemptROI["value"], { en: string; es: string; cls: string }> = {
    strong:     { en: "Strong",  es: "Fuerte", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
    ok:         { en: "OK",      es: "OK",     cls: "bg-sky-500/15     text-sky-700     dark:text-sky-300     border-sky-500/30"     },
    diminishing:{ en: "Fading",  es: "Baja",   cls: "bg-amber-500/15  text-amber-700  dark:text-amber-300  border-amber-500/30"  },
    stop:       { en: "Stop",    es: "Parar",  cls: "bg-red-500/15    text-red-700    dark:text-red-300    border-red-500/30"    },
  };
  const cfg = labels[value];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold whitespace-nowrap ${cfg.cls}`}>
      {lang === "es" ? cfg.es : cfg.en}
    </span>
  );
}

// ── Stat bar item ──────────────────────────────────────────────────────────────
function CampStat({ label, value, color = "zinc" }: { label: string; value: string; color?: string }) {
  const cls: Record<string, string> = {
    zinc:    "text-zinc-900 dark:text-zinc-100",
    emerald: "text-emerald-700 dark:text-emerald-300",
    amber:   "text-amber-700 dark:text-amber-300",
    red:     "text-red-700 dark:text-red-400",
  };
  return (
    <div className="flex-1 px-3 sm:px-4 py-2.5 min-w-[90px]">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold leading-none mb-0.5 truncate">{label}</div>
      <div className={`text-base font-semibold tabular-nums leading-none ${cls[color] ?? cls.zinc}`}>{value}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CampaignTab({
  lang, campaignHealth, attemptROI, callbackStats, matrix, agents,
}: {
  lang: Lang;
  campaignHealth: CampaignHealth[];
  attemptROI: AttemptROI[];
  callbackStats: CallbackStats;
  matrix: AgentCampaignCell[];
  agents: AgentStat[];
}) {
  // ── Derived data ─────────────────────────────────────────────────────────────

  // Best agent per campaign_id (highest close_rate, min 5 calls)
  const bestAgentPerCampaign = useMemo(() => {
    const bycamp = new Map<string, AgentCampaignCell>();
    for (const cell of matrix) {
      if (cell.calls < 5) continue;
      const existing = bycamp.get(cell.campaign_id);
      if (!existing || cell.close_rate > existing.close_rate) {
        bycamp.set(cell.campaign_id, cell);
      }
    }
    return bycamp;
  }, [matrix]);

  // Matrix lookup: [user][campaign_id] → cell
  const matrixLookup = useMemo(() => {
    const m = new Map<string, AgentCampaignCell>();
    for (const cell of matrix) {
      m.set(`${cell.user}::${cell.campaign_id}`, cell);
    }
    return m;
  }, [matrix]);

  // Unique campaigns from matrix (preserving order of first appearance)
  const campaignColumns = useMemo(() => {
    const seen = new Set<string>();
    const cols: { id: string; name: string }[] = [];
    for (const cell of matrix) {
      if (!seen.has(cell.campaign_id)) {
        seen.add(cell.campaign_id);
        cols.push({ id: cell.campaign_id, name: cell.campaign_name });
      }
    }
    return cols;
  }, [matrix]);

  // Stat bar derived values
  const healthyCnt  = campaignHealth.filter(c => c.health_status === "healthy").length;
  const warningCnt  = campaignHealth.filter(c => c.health_status === "warning").length;
  const criticalCnt = campaignHealth.filter(c => c.health_status === "critical").length;
  const avgDropRate = campaignHealth.length
    ? campaignHealth.reduce((s, c) => s + c.drop_rate, 0) / campaignHealth.length
    : 0;
  const dropColor = avgDropRate < 0.02 ? "emerald" : avgDropRate < 0.03 ? "amber" : "red";
  const showColor  = callbackStats.show_rate > 0.60 ? "emerald" : callbackStats.show_rate > 0.40 ? "amber" : "red";

  // Callback agents — top 10 by set desc
  const topCallbackAgents = useMemo(
    () => [...callbackStats.by_agent].sort((a, b) => b.set - a.set).slice(0, 10),
    [callbackStats.by_agent],
  );

  // Attempt ROI chart data
  const attemptChartData = useMemo(() =>
    attemptROI.map(r => ({
      ...r,
      name: lang === "es" ? `Intento ${r.attempt}` : `Attempt ${r.attempt}`,
      contact_pct:    r.contact_rate * 100,
      conversion_pct: r.conversion_rate * 100,
    })),
  [attemptROI, lang]);

  // ── Matrix: cell colour ───────────────────────────────────────────────────────
  function cellStyle(rate: number): string {
    if (rate > 0.18) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    if (rate > 0.12) return "bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400";
    if (rate > 0.07) return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <section className="space-y-6">

      {/* ── 1. Stat bar ── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
        <div className="flex flex-wrap divide-x divide-zinc-200 dark:divide-zinc-800/80">
          <CampStat
            label={lang === "es" ? "Campañas" : "Campaigns"}
            value={campaignHealth.length.toString()}
            color="zinc"
          />
          <CampStat
            label={lang === "es" ? "Saludables 🟢" : "Healthy 🟢"}
            value={healthyCnt.toString()}
            color="emerald"
          />
          <CampStat
            label={lang === "es" ? "Advertencia 🟡" : "Warning 🟡"}
            value={warningCnt.toString()}
            color="amber"
          />
          <CampStat
            label={lang === "es" ? "Críticas 🔴" : "Critical 🔴"}
            value={criticalCnt.toString()}
            color="red"
          />
          <CampStat
            label={lang === "es" ? "Drop rate prom." : "Avg drop rate"}
            value={pct(avgDropRate)}
            color={dropColor}
          />
          <CampStat
            label={lang === "es" ? "Show callbacks" : "Callback show rate"}
            value={pct(callbackStats.show_rate)}
            color={showColor}
          />
        </div>
      </div>

      {/* ── 2. Campaign health cards grid ── */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          {lang === "es" ? "Salud de campañas" : "Campaign Health"}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {lang === "es"
            ? "Estado operativo y KPIs por campaña"
            : "Operational status and KPIs per campaign"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaignHealth.map(c => {
            const best = bestAgentPerCampaign.get(c.campaign_id);
            return (
              <div
                key={c.campaign_id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 shadow-sm dark:shadow-none"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-tight">{c.campaign_name}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">{c.campaign_id}</div>
                  </div>
                  {healthBadge(c.health_status)}
                </div>

                {/* Health score bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                      {lang === "es" ? "Score de salud" : "Health score"}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                      {c.health_score} / 100
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${healthBarColor(c.health_status)}`}
                      style={{ width: `${c.health_score}%` }}
                    />
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                  {/* Contact rate */}
                  <div className="flex items-center text-xs">
                    {colorDot(contactRateDotCls(c.contact_rate))}
                    <span className="text-zinc-500 mr-1">{lang === "es" ? "Contacto" : "Contact"}:</span>
                    <span className={`font-mono tabular-nums font-medium ${contactRateColor(c.contact_rate)}`}>{pct(c.contact_rate)}</span>
                  </div>

                  {/* Drop rate */}
                  <div className="flex items-center text-xs">
                    <span className="text-zinc-500 mr-1">{lang === "es" ? "Drop" : "Drop"}:</span>
                    <span className={`font-mono tabular-nums font-medium ${c.drop_rate > 0.02 ? "text-red-700 dark:text-red-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                      {pct(c.drop_rate)}
                    </span>
                    {c.drop_rate > 0.02 && <span className="ml-1">⚠️</span>}
                  </div>

                  {/* Lead age */}
                  <div className="flex items-center text-xs">
                    <span className="text-zinc-500 mr-1">{lang === "es" ? "Edad leads" : "Lead age"}:</span>
                    <span className={`font-mono tabular-nums font-medium ${leadAgeColor(c.lead_age_avg_days)}`}>
                      {c.lead_age_avg_days.toFixed(1)} {lang === "es" ? "d prom." : "days avg"}
                    </span>
                  </div>

                  {/* List remaining */}
                  <div className="flex items-center text-xs">
                    <span className="text-zinc-500 mr-1">{lang === "es" ? "Lista rest." : "Remaining"}:</span>
                    <span className={`font-mono tabular-nums font-medium ${remainingColor(c.leads_remaining_pct)}`}>
                      {pct(c.leads_remaining_pct, 0)}
                    </span>
                  </div>

                  {/* Fresh leads */}
                  <div className="flex items-center text-xs">
                    <span className="text-zinc-500 mr-1">{lang === "es" ? "Frescos" : "Fresh"}:</span>
                    <span className={`font-mono tabular-nums font-medium ${freshLeadColor(c.fresh_lead_pct)}`}>
                      {pct(c.fresh_lead_pct, 0)}
                    </span>
                  </div>

                  {/* Conversion */}
                  <div className="flex items-center text-xs">
                    <span className="text-zinc-500 mr-1">{lang === "es" ? "Conversión" : "Conv."}:</span>
                    <span className={`font-mono tabular-nums font-medium ${conversionColor(c.conversion_rate)}`}>
                      {pct(c.conversion_rate)}
                    </span>
                  </div>

                  {/* Cost/sale */}
                  <div className="flex items-center text-xs">
                    <span className="text-zinc-500 mr-1">{lang === "es" ? "Costo/venta" : "Cost/sale"}:</span>
                    <span className="font-mono tabular-nums font-medium text-zinc-800 dark:text-zinc-200">
                      ${c.cost_per_sale_usd.toFixed(0)}
                    </span>
                  </div>

                  {/* Active agents */}
                  <div className="flex items-center text-xs">
                    <span className="text-zinc-500 mr-1">{lang === "es" ? "Agentes" : "Agents"}:</span>
                    <span className="font-mono tabular-nums font-medium text-zinc-800 dark:text-zinc-200">{c.active_agents}</span>
                  </div>
                </div>

                {/* Flags */}
                {c.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {c.flags.map((flag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                      >
                        ⚠️ {flag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Best agent chip */}
                {best && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-[11px]">
                    <span className="text-zinc-500">{lang === "es" ? "Mejor cierre:" : "Best closer:"}</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{best.full_name}</span>
                    <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-300 font-semibold">{pct(best.close_rate, 1)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Attempt ROI ── */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          {lang === "es"
            ? "ROI por intento — ¿Cuándo parar?"
            : "Dial Attempt ROI — When to Stop Calling"}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {lang === "es"
            ? "Tasa de contacto y conversión por número de intento"
            : "Contact and conversion rate by attempt number"}
        </p>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 shadow-sm dark:shadow-none">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Chart */}
            <div className="flex-1 min-w-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={attemptChartData} barGap={4}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#a1a1aa" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_CONTENT_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      typeof value === "number" ? `${value.toFixed(1)}%` : value,
                      name === "contact_pct"
                        ? (lang === "es" ? "Contacto" : "Contact")
                        : (lang === "es" ? "Conversión" : "Conversion"),
                    ]}
                  />
                  {/* Contact rate bars — coloured by value */}
                  <Bar dataKey="contact_pct" name="contact_pct" radius={[3, 3, 0, 0]}>
                    {attemptROI.map((r, i) => (
                      <Cell key={i} fill={ATTEMPT_COLORS[r.value]} fillOpacity={0.7} />
                    ))}
                  </Bar>
                  {/* Conversion rate bars — emerald always */}
                  <Bar dataKey="conversion_pct" name="conversion_pct" radius={[3, 3, 0, 0]}>
                    {attemptROI.map((r, i) => (
                      <Cell key={i} fill={ATTEMPT_COLORS[r.value]} fillOpacity={1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex items-center gap-4 justify-center mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className="inline-block w-3 h-1.5 rounded-full opacity-70" style={{ backgroundColor: "#a1a1aa" }} />
                  {lang === "es" ? "Contacto" : "Contact"}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className="inline-block w-3 h-1.5 rounded-full" style={{ backgroundColor: "#10b981" }} />
                  {lang === "es" ? "Conversión" : "Conversion"}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className="inline-block w-3 h-1.5 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                  Stop
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="lg:w-[400px] overflow-x-auto no-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="py-2 text-left pr-3">{lang === "es" ? "Intento" : "Attempt"}</th>
                    <th className="py-2 text-right pr-3">{lang === "es" ? "Llams." : "Calls"}</th>
                    <th className="py-2 text-right pr-3">{lang === "es" ? "Contactos" : "Contacts"}</th>
                    <th className="py-2 text-right pr-3">{lang === "es" ? "Ventas" : "Sales"}</th>
                    <th className="py-2 text-right pr-3">Contact%</th>
                    <th className="py-2 text-right pr-3">Conv%</th>
                    <th className="py-2 text-left">{lang === "es" ? "Veredicto" : "Verdict"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {attemptROI.map(r => (
                    <tr
                      key={r.attempt}
                      className={`${r.value === "stop" ? "bg-red-500/5 dark:bg-red-500/8" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"} transition-colors`}
                    >
                      <td className="py-1.5 pr-3 font-medium text-zinc-800 dark:text-zinc-200">
                        {lang === "es" ? `Intento ${r.attempt}` : `Attempt ${r.attempt}`}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-700 dark:text-zinc-400">{r.calls.toLocaleString()}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-700 dark:text-zinc-400">{r.contacts.toLocaleString()}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-700 dark:text-zinc-400">{r.sales.toLocaleString()}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{pct(r.contact_rate)}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{pct(r.conversion_rate)}</td>
                      <td className="py-1.5">{verdictBadge(r.value, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Callback performance ── */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          {lang === "es"
            ? "Tasa de presentación de callbacks"
            : "Callback Show Rate"}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {lang === "es"
            ? "Cuántos callbacks programados se presentan y convierten"
            : "How many scheduled callbacks show up and convert"}
        </p>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 shadow-sm dark:shadow-none">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Big stats */}
            <div className="flex lg:flex-col gap-4 lg:w-44 shrink-0">
              <BigStat
                label={lang === "es" ? "Programados" : "Total scheduled"}
                value={callbackStats.total_scheduled.toLocaleString()}
                color="zinc"
              />
              <BigStat
                label={lang === "es" ? "Show rate" : "Show rate"}
                value={`${(callbackStats.show_rate * 100).toFixed(1)}%`}
                color={callbackStats.show_rate > 0.60 ? "emerald" : callbackStats.show_rate > 0.40 ? "amber" : "red"}
              />
              <BigStat
                label={lang === "es" ? "Conv. rate" : "Convert rate"}
                value={`${(callbackStats.convert_rate * 100).toFixed(1)}%`}
                color={callbackStats.convert_rate > 0.30 ? "emerald" : callbackStats.convert_rate > 0.20 ? "amber" : "red"}
              />
            </div>

            {/* By-agent table */}
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="py-2 text-left pr-3">{lang === "es" ? "Agente" : "Agent"}</th>
                    <th className="py-2 text-right pr-3">{lang === "es" ? "Agend." : "Set"}</th>
                    <th className="py-2 text-right pr-3">{lang === "es" ? "Asistió" : "Showed"}</th>
                    <th className="py-2 text-right pr-3">{lang === "es" ? "Convirtió" : "Converted"}</th>
                    <th className="py-2 text-right pr-3">Show %</th>
                    <th className="py-2 text-right">Conv %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {topCallbackAgents.map(a => (
                    <tr key={a.user} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="py-1.5 pr-3 font-medium text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{a.full_name}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-700 dark:text-zinc-400">{a.set}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-700 dark:text-zinc-400">{a.showed}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-700 dark:text-zinc-400">{a.converted}</td>
                      <td className={`py-1.5 pr-3 text-right tabular-nums font-medium ${showRateColor(a.show_rate)}`}>
                        {pct(a.show_rate, 1)}
                      </td>
                      <td className={`py-1.5 text-right tabular-nums font-medium ${cbConvColor(a.convert_rate)}`}>
                        {pct(a.convert_rate, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Agent × Campaign matrix ── */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          {lang === "es"
            ? "Rendimiento de agentes por campaña"
            : "Agent Performance by Campaign"}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {lang === "es"
            ? "Tasa de cierre por agente y campaña. Color = cierre. Mejor agente por campaña destacado."
            : "Close rate per agent and campaign. Color = close rate. Best agent per campaign highlighted."}
        </p>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-900/80 px-4 py-2.5 text-left whitespace-nowrap border-r border-zinc-200 dark:border-zinc-800">
                    {lang === "es" ? "Agente" : "Agent"}
                  </th>
                  {campaignColumns.map(col => (
                    <th key={col.id} className="px-3 py-2.5 text-center whitespace-nowrap min-w-[100px]">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {agents.map(agent => (
                  <tr key={agent.user} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    {/* Sticky agent name */}
                    <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900/40 px-4 py-2 font-medium text-zinc-800 dark:text-zinc-200 whitespace-nowrap border-r border-zinc-200 dark:border-zinc-800">
                      {agent.full_name}
                    </td>
                    {campaignColumns.map(col => {
                      const cell = matrixLookup.get(`${agent.user}::${col.id}`);
                      const isBest = bestAgentPerCampaign.get(col.id)?.user === agent.user;

                      if (!cell) {
                        return (
                          <td
                            key={col.id}
                            className="px-3 py-2 text-center tabular-nums bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400"
                          >
                            —
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.id}
                          className={`px-3 py-2 text-center tabular-nums font-mono font-medium ${cellStyle(cell.close_rate)}`}
                        >
                          {isBest ? "⭐ " : ""}{pct(cell.close_rate, 1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[10px] text-zinc-500 flex flex-wrap gap-3">
            <span>
              {lang === "es"
                ? "Color = tasa de cierre. Mejor agente por campaña destacado."
                : "Color = close rate. Best agent per campaign highlighted."}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-emerald-500/15" />
              {">"}18%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-emerald-500/[0.08]" />
              12–18%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-amber-500/10" />
              7–12%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-red-500/10" />
              {"≤"}7%
            </span>
          </div>
        </div>
      </div>

    </section>
  );
}

// ── Helper sub-components ──────────────────────────────────────────────────────

function BigStat({ label, value, color = "zinc" }: { label: string; value: string; color?: string }) {
  const cls: Record<string, string> = {
    zinc:    "text-zinc-900 dark:text-zinc-100",
    emerald: "text-emerald-700 dark:text-emerald-300",
    amber:   "text-amber-700 dark:text-amber-300",
    red:     "text-red-700 dark:text-red-400",
  };
  return (
    <div className="flex-1 lg:flex-none">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold leading-none mb-1">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums leading-none ${cls[color] ?? cls.zinc}`}>{value}</div>
    </div>
  );
}
