"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
} from "recharts";
import type {
  AgentStat,
  Lead,
  CallHour,
  SalesDay,
  HourlyContact,
  DayHourCell,
  StaffingHour,
  DayOfWeekPerf,
  DialerHealth,
  PaceToTarget,
} from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import { scoreColor } from "@/lib/i18n";

// ── Shared tooltip style ──────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "rgb(24 24 27)",
    border: "1px solid rgb(63 63 70)",
    borderRadius: 8,
    fontSize: 11,
    color: "#e4e4e7",
  },
  labelStyle: { color: "#a1a1aa", marginBottom: 2 },
};

// ── CmdStat helper ────────────────────────────────────────────────────────────
function CmdStat({
  label,
  value,
  sub,
  color = "zinc",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: "zinc" | "emerald" | "amber" | "red" | "violet" | "sky";
}) {
  const val: Record<string, string> = {
    zinc: "text-zinc-900 dark:text-zinc-100",
    emerald: "text-emerald-700 dark:text-emerald-300",
    amber: "text-amber-700 dark:text-amber-300",
    red: "text-red-700 dark:text-red-400",
    violet: "text-violet-700 dark:text-violet-300",
    sky: "text-sky-700 dark:text-sky-300",
  };
  return (
    <div className="flex-1 px-3 sm:px-4 py-2.5 min-w-[90px]">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold leading-none mb-0.5 truncate">
        {label}
      </div>
      <div
        className={`text-base font-semibold tabular-nums leading-none ${val[color] ?? val.zinc}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-zinc-500 leading-none mt-0.5">{sub}</div>
      )}
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
      {children}
    </h3>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 shadow-sm dark:shadow-none ${className}`}
    >
      {children}
    </div>
  );
}

// ── Section 1: Stat bar ───────────────────────────────────────────────────────
function StatBar({
  lang,
  agents,
  hourlyContact,
  dialerHealth,
  paceToTarget,
}: {
  lang: Lang;
  agents: AgentStat[];
  hourlyContact: HourlyContact[];
  dialerHealth: DialerHealth;
  paceToTarget: PaceToTarget;
}) {
  const totalCalls = useMemo(
    () => hourlyContact.reduce((s, h) => s + h.calls, 0),
    [hourlyContact]
  );

  const totalSales = useMemo(
    () => hourlyContact.reduce((s, h) => s + h.sales, 0),
    [hourlyContact]
  );

  const avgContactRate = useMemo(() => {
    const active = hourlyContact.filter((h) => h.calls > 0);
    if (active.length === 0) return 0;
    return active.reduce((s, h) => s + h.contact_rate, 0) / active.length;
  }, [hourlyContact]);

  const contactRateColor: "emerald" | "amber" | "red" =
    avgContactRate > 0.3 ? "emerald" : avgContactRate > 0.2 ? "amber" : "red";

  const dropColor: "emerald" | "amber" | "red" =
    dialerHealth.drop_status === "ok"
      ? "emerald"
      : dialerHealth.drop_status === "warning"
      ? "amber"
      : "red";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
      <div className="flex flex-wrap divide-x divide-zinc-200 dark:divide-zinc-800/80">
        <CmdStat
          label={lang === "es" ? "Llamadas hoy" : "Today's calls"}
          value={totalCalls.toLocaleString()}
          sub={lang === "es" ? "total marcaciones" : "total dials"}
          color="zinc"
        />
        <CmdStat
          label={lang === "es" ? "Tasa de contacto" : "Contact rate"}
          value={`${(avgContactRate * 100).toFixed(1)}%`}
          color={contactRateColor}
        />
        <CmdStat
          label={lang === "es" ? "Ventas hoy" : "Sales today"}
          value={totalSales.toLocaleString()}
          color="emerald"
        />
        <CmdStat
          label={lang === "es" ? "Ritmo" : "Pace"}
          value={paceToTarget.on_track ? (lang === "es" ? "En camino 🟢" : "On track 🟢") : (lang === "es" ? "Retrasado 🔴" : "Behind 🔴")}
          sub={`proj. ${paceToTarget.projected_eod} / target ${paceToTarget.target_today}`}
          color={paceToTarget.on_track ? "emerald" : "red"}
        />
        <CmdStat
          label={lang === "es" ? "Tasa de abandono" : "Drop rate"}
          value={`${(dialerHealth.drop_rate * 100).toFixed(1)}%`}
          color={dropColor}
        />
        <CmdStat
          label={lang === "es" ? "Agentes activos" : "Active agents"}
          value={agents.length.toString()}
          color="zinc"
        />
      </div>
    </div>
  );
}

// ── Section 2: Pace to target ─────────────────────────────────────────────────
function PaceCard({ lang, pace }: { lang: Lang; pace: PaceToTarget }) {
  const progressPct = Math.min(
    (pace.actual_so_far / Math.max(pace.target_today, 1)) * 100,
    100
  );
  const isOnTrack = pace.on_track;

  return (
    <Card>
      <SectionTitle>
        {lang === "es" ? "Ritmo hacia el objetivo" : "Pace to Target"}
      </SectionTitle>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Left: numbers */}
        <div className="shrink-0 space-y-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              {lang === "es" ? "Real vs objetivo" : "Actual vs Target"}
            </div>
            <div className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100 leading-none mt-0.5">
              <span className={isOnTrack ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}>
                {pace.actual_so_far}
              </span>
              <span className="text-zinc-400 dark:text-zinc-600 text-xl mx-1">/</span>
              <span>{pace.target_today}</span>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-zinc-500">
            <div>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {pace.current_pace.toFixed(1)}/h
              </span>{" "}
              {lang === "es" ? "ritmo actual" : "current pace"}
            </div>
            <div>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {pace.required_pace.toFixed(1)}/h
              </span>{" "}
              {lang === "es" ? "requerido" : "required"}
            </div>
          </div>
          <div className="text-[10px] text-zinc-500">
            {lang === "es"
              ? `${pace.hours_elapsed}h transcurridas · ${pace.hours_remaining}h restantes`
              : `${pace.hours_elapsed}h elapsed · ${pace.hours_remaining}h remaining`}
          </div>
        </div>

        {/* Center: progress bar */}
        <div className="flex-1 min-w-0 w-full">
          <div className="relative h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOnTrack ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-zinc-500 tabular-nums">
            <span>0</span>
            <span>{pace.target_today}</span>
          </div>
        </div>

        {/* Right: projected EOD */}
        <div className="shrink-0 text-right">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            {lang === "es" ? "Proyección fin de día" : "Projected EOD"}
          </div>
          <div
            className={`text-3xl font-bold tabular-nums leading-none mt-0.5 ${
              isOnTrack
                ? "text-emerald-600 dark:text-emerald-300"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {pace.projected_eod}
          </div>
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold mt-1 border ${
              isOnTrack
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30"
            }`}
          >
            {isOnTrack
              ? (lang === "es" ? "En camino" : "On track")
              : (lang === "es" ? "Retrasado" : "Behind")}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Section 3a: Calls & Contact Rate by Hour ──────────────────────────────────
function CallsContactChart({
  lang,
  hourlyContact,
}: {
  lang: Lang;
  hourlyContact: HourlyContact[];
}) {
  const data = useMemo(() => {
    return hourlyContact
      .filter((h) => h.hour >= 7 && h.hour <= 21)
      .map((h) => ({
        label: `${String(h.hour).padStart(2, "0")}h`,
        calls: h.calls,
        contact_pct: Math.round(h.contact_rate * 1000) / 10,
        sales: h.sales,
      }));
  }, [hourlyContact]);

  return (
    <Card>
      <SectionTitle>
        {lang === "es"
          ? "Llamadas y Tasa de Contacto por Hora"
          : "Calls & Contact Rate by Hour"}
      </SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 40, bottom: 0, left: -10 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 80]}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
            formatter={(v, name) =>
              name === "Contact %" || name === "Contacto %"
                ? [`${v}%`, name]
                : [v, name]
            }
          />
          <Bar
            yAxisId="left"
            dataKey="calls"
            name={lang === "es" ? "Llamadas" : "Calls"}
            fill="#71717a"
            opacity={0.6}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <ReferenceLine
            yAxisId="right"
            y={30}
            stroke="#f59e0b"
            strokeDasharray="5 3"
            strokeWidth={1.5}
            label={{
              value: "30% target",
              position: "insideTopRight",
              fontSize: 9,
              fill: "#f59e0b",
            }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="contact_pct"
            name={lang === "es" ? "Contacto %" : "Contact %"}
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Section 3b: Sales by Hour ─────────────────────────────────────────────────
function SalesByHourChart({
  lang,
  hourlyContact,
}: {
  lang: Lang;
  hourlyContact: HourlyContact[];
}) {
  const { data, top3Hours } = useMemo(() => {
    const filtered = hourlyContact
      .filter((h) => h.hour >= 7 && h.hour <= 21)
      .map((h) => ({
        label: `${String(h.hour).padStart(2, "0")}h`,
        sales: h.sales,
        hour: h.hour,
      }));
    const sorted = [...filtered].sort((a, b) => b.sales - a.sales);
    const top3Hours = new Set(sorted.slice(0, 3).map((h) => h.hour));
    return { data: filtered, top3Hours };
  }, [hourlyContact]);

  return (
    <Card>
      <SectionTitle>
        {lang === "es" ? "Ventas por Hora" : "Sales by Hour"}
      </SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
          />
          <Bar
            dataKey="sales"
            name={lang === "es" ? "Ventas" : "Sales"}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          >
            {data.map((entry) => (
              <Cell
                key={entry.hour}
                fill={top3Hours.has(entry.hour) ? "#10b981" : "#6ee7b7"}
                opacity={top3Hours.has(entry.hour) ? 1 : 0.55}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Section 4a: Day × Hour heatmap ───────────────────────────────────────────
const DAY_NAMES_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function cellBg(rate: number): string {
  if (rate > 0.45) return "bg-emerald-500 text-white";
  if (rate > 0.35) return "bg-emerald-400 text-white";
  if (rate > 0.25) return "bg-emerald-300/70 text-emerald-900 dark:text-emerald-950";
  if (rate > 0.15) return "bg-amber-300/60 text-amber-900 dark:text-amber-950";
  if (rate > 0.05) return "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300";
  return "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600";
}

function DayHourHeatmap({
  lang,
  dayHourHeatmap,
}: {
  lang: Lang;
  dayHourHeatmap: DayHourCell[];
}) {
  const cellMap = useMemo(() => {
    const m = new Map<string, DayHourCell>();
    for (const c of dayHourHeatmap) {
      m.set(`${c.day}-${c.hour}`, c);
    }
    return m;
  }, [dayHourHeatmap]);

  const dayNames = lang === "es" ? DAY_NAMES_ES : DAY_NAMES_EN;

  return (
    <Card className="overflow-hidden">
      <SectionTitle>
        {lang === "es"
          ? "Mapa de calor — tasa de contacto"
          : "Contact Rate Heatmap (by Day × Hour)"}
      </SectionTitle>
      <div className="overflow-x-auto no-scrollbar">
        <table className="text-[10px] border-separate border-spacing-0.5 min-w-[420px]">
          <thead>
            <tr>
              <th className="w-8" />
              {HOURS.map((h) => (
                <th
                  key={h}
                  className="text-center font-normal text-zinc-500 dark:text-zinc-500 pb-1 w-7"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }, (_, day) => (
              <tr key={day}>
                <td className="text-right pr-1.5 text-zinc-500 dark:text-zinc-500 font-medium">
                  {dayNames[day]}
                </td>
                {HOURS.map((h) => {
                  const cell = cellMap.get(`${day}-${h}`);
                  const rate = cell?.contact_rate ?? 0;
                  const sales = cell?.sales ?? 0;
                  return (
                    <td key={h} className="p-0">
                      <div
                        title={`${dayNames[day]} ${h}h — ${(rate * 100).toFixed(0)}% contact${sales > 0 ? ` · ${sales} sales` : ""}`}
                        className={`w-7 h-6 rounded flex items-center justify-center text-[9px] font-semibold transition-opacity ${cellBg(rate)}`}
                      >
                        {sales > 0 ? sales : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-zinc-500">
        <span>{lang === "es" ? "Bajo" : "Low"}</span>
        <div className="h-3 w-4 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
        <div className="h-3 w-4 rounded bg-amber-300/60" />
        <div className="h-3 w-4 rounded bg-emerald-300/70" />
        <div className="h-3 w-4 rounded bg-emerald-400" />
        <div className="h-3 w-4 rounded bg-emerald-500" />
        <span>{lang === "es" ? "Alto" : "High"}</span>
        <span className="ml-2 text-zinc-400">
          {lang === "es"
            ? "Número en celda = ventas"
            : "Number in cell = sales"}
        </span>
      </div>
    </Card>
  );
}

// ── Section 4b: Staffing vs Demand ───────────────────────────────────────────
const COVERAGE_FILL: Record<StaffingHour["coverage_status"], string> = {
  understaffed: "#ef4444",
  optimal: "#71717a",
  overstaffed: "#f59e0b",
};

function StaffingChart({
  lang,
  staffingHours,
}: {
  lang: Lang;
  staffingHours: StaffingHour[];
}) {
  const data = useMemo(
    () =>
      staffingHours
        .filter((h) => h.hour >= 7 && h.hour <= 20)
        .map((h) => ({
          label: `${String(h.hour).padStart(2, "0")}h`,
          call_volume: h.call_volume,
          agents_logged_in: h.agents_logged_in,
          coverage_status: h.coverage_status,
        })),
    [staffingHours]
  );

  return (
    <Card>
      <SectionTitle>
        {lang === "es"
          ? "Personal vs Volumen de llamadas"
          : "Staffing vs Call Volume"}
      </SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="vol"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="agents"
            orientation="right"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
          />
          <Bar
            yAxisId="vol"
            dataKey="call_volume"
            name={lang === "es" ? "Vol. llamadas" : "Call volume"}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={COVERAGE_FILL[entry.coverage_status]}
                opacity={0.7}
              />
            ))}
          </Bar>
          <Line
            yAxisId="agents"
            type="monotone"
            dataKey="agents_logged_in"
            name={lang === "es" ? "Agentes activos" : "Agents logged in"}
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500 opacity-70 inline-block" />
          {lang === "es" ? "Déficit personal" : "Understaffed"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-zinc-500 opacity-70 inline-block" />
          {lang === "es" ? "Óptimo" : "Optimal"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-400 opacity-70 inline-block" />
          {lang === "es" ? "Exceso personal" : "Overstaffed"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 border-t-2 border-emerald-400 inline-block" />
          {lang === "es" ? "Agentes activos" : "Agents logged in"}
        </span>
      </div>
    </Card>
  );
}

// ── Section 5a: Day of week table ─────────────────────────────────────────────
function DayOfWeekTable({
  lang,
  dayOfWeekPerf,
}: {
  lang: Lang;
  dayOfWeekPerf: DayOfWeekPerf[];
}) {
  const { bestDay, worstDay } = useMemo(() => {
    if (dayOfWeekPerf.length === 0) return { bestDay: -1, worstDay: -1 };
    const byMostSales = [...dayOfWeekPerf].sort((a, b) => b.sales - a.sales);
    const bestDay = byMostSales[0]?.day ?? -1;

    // worst = lowest close rate excluding Sat/Sun if they have 0 sales
    const eligible = dayOfWeekPerf.filter((d) => !(d.day >= 5 && d.sales === 0));
    if (eligible.length === 0) return { bestDay, worstDay: -1 };
    const byWorst = [...eligible].sort((a, b) => a.close_rate - b.close_rate);
    const worstDay = byWorst[0]?.day ?? -1;
    return { bestDay, worstDay };
  }, [dayOfWeekPerf]);

  return (
    <Card>
      <SectionTitle>
        {lang === "es"
          ? "Rendimiento por día de la semana"
          : "Performance by Day of Week"}
      </SectionTitle>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="py-2 pr-3 text-left">{lang === "es" ? "Día" : "Day"}</th>
              <th className="py-2 px-2 text-right">{lang === "es" ? "Llamadas" : "Calls"}</th>
              <th className="py-2 px-2 text-right">{lang === "es" ? "Contacto" : "Contact"}</th>
              <th className="py-2 px-2 text-right">{lang === "es" ? "Ventas" : "Sales"}</th>
              <th className="py-2 pl-2 text-right">{lang === "es" ? "Cierre" : "Close %"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {dayOfWeekPerf.map((d) => {
              const isBest = d.day === bestDay;
              const isWorst = d.day === worstDay && d.day !== bestDay;
              const rowClass = isBest
                ? "bg-emerald-500/10"
                : isWorst
                ? "bg-red-500/10"
                : "";
              const dayName =
                lang === "es" ? d.day_name_es : d.day_name_en;
              return (
                <tr key={d.day} className={`${rowClass} text-xs`}>
                  <td className="py-2 pr-3 font-medium text-zinc-800 dark:text-zinc-200">
                    {dayName}
                    {isBest && (
                      <span className="ml-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        ★
                      </span>
                    )}
                    {isWorst && (
                      <span className="ml-1.5 text-[9px] font-bold text-red-500 dark:text-red-400 uppercase">
                        ▼
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {d.calls.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {(d.contact_rate * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-300">
                    {d.sales}
                  </td>
                  <td className="py-2 pl-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {(d.close_rate * 100).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Section 5b: Callbacks urgency ─────────────────────────────────────────────
function CallbacksQueue({
  lang,
  leads,
}: {
  lang: Lang;
  leads: Lead[];
}) {
  const callbackLeads = useMemo(
    () =>
      leads
        .filter((l) => l.recommendation === "callback_due")
        .slice(0, 8),
    [leads]
  );

  return (
    <Card>
      <SectionTitle>
        {lang === "es" ? "Callbacks pendientes ahora" : "Callbacks Due Now"}
      </SectionTitle>
      {callbackLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-zinc-500">
          <span className="text-2xl mb-2">✓</span>
          <span>
            {lang === "es" ? "Sin callbacks pendientes" : "No pending callbacks"}
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {callbackLeads.map((lead) => (
            <div
              key={lead.lead_id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 hover:border-amber-300/50 dark:hover:border-amber-700/50 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {lead.first_name} {lead.last_name}
                </div>
                <div className="text-[10px] text-zinc-500 flex gap-2 mt-0.5">
                  <span>{lead.campaign_id}</span>
                  <span>·</span>
                  <span>
                    {lead.called_count} {lang === "es" ? "intentos" : "attempts"}
                  </span>
                </div>
              </div>
              <span
                className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${scoreColor(lead.score)}`}
              >
                {lead.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Section 6: Dialer health ──────────────────────────────────────────────────
function DialerHealthCard({
  lang,
  dialerHealth,
}: {
  lang: Lang;
  dialerHealth: DialerHealth;
}) {
  const statusColor =
    dialerHealth.drop_status === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : dialerHealth.drop_status === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const trafficLight =
    dialerHealth.drop_status === "ok"
      ? "🟢"
      : dialerHealth.drop_status === "warning"
      ? "🟡"
      : "🔴";

  return (
    <Card>
      <SectionTitle>
        {lang === "es" ? "Salud del marcador (FTC)" : "Dialer Health (FTC)"}
      </SectionTitle>

      {/* Warning banners */}
      {dialerHealth.drop_status === "critical" && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-700 dark:text-red-300">
          ⚠️{" "}
          {lang === "es"
            ? "Tasa de abandono supera el límite FTC del 3% — reduce las líneas por agente de inmediato"
            : "Drop rate above FTC 3% limit — reduce lines/agent immediately"}
        </div>
      )}
      {dialerHealth.drop_status === "warning" && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-300">
          ⚠️{" "}
          {lang === "es"
            ? "Acercándose al límite FTC — monitoriza de cerca"
            : "Approaching FTC limit — monitor closely"}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        {/* Drop rate */}
        <div className="flex-1 min-w-[140px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
            {lang === "es" ? "Tasa de abandono" : "Drop rate"}
          </div>
          <div className={`text-2xl font-bold tabular-nums leading-none ${statusColor}`}>
            {trafficLight} {(dialerHealth.drop_rate * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {lang === "es" ? "límite FTC: 3%" : "FTC limit: 3%"}
          </div>
        </div>

        {/* Lines per agent */}
        <div className="flex-1 min-w-[140px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
            {lang === "es" ? "Líneas por agente" : "Lines/agent"}
          </div>
          <div className="text-2xl font-bold tabular-nums leading-none text-zinc-900 dark:text-zinc-100">
            {dialerHealth.lines_per_agent.toFixed(1)}
          </div>
        </div>

        {/* Total dropped */}
        <div className="flex-1 min-w-[140px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
            {lang === "es" ? "Total abandonadas" : "Total dropped"}
          </div>
          <div
            className={`text-2xl font-bold tabular-nums leading-none ${
              dialerHealth.total_dropped > 0
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {dialerHealth.total_dropped.toLocaleString()}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CommandTab({
  lang,
  agents,
  leads,
  callTimes,
  salesTrend,
  hourlyContact,
  dayHourHeatmap,
  staffingHours,
  dayOfWeekPerf,
  dialerHealth,
  paceToTarget,
}: {
  lang: Lang;
  agents: AgentStat[];
  leads: Lead[];
  callTimes: CallHour[];
  salesTrend: SalesDay[];
  hourlyContact: HourlyContact[];
  dayHourHeatmap: DayHourCell[];
  staffingHours: StaffingHour[];
  dayOfWeekPerf: DayOfWeekPerf[];
  dialerHealth: DialerHealth;
  paceToTarget: PaceToTarget;
}) {
  // Suppress unused-variable warnings for callTimes/salesTrend
  void callTimes;
  void salesTrend;

  return (
    <section className="space-y-5">
      {/* 1. Stat bar */}
      <StatBar
        lang={lang}
        agents={agents}
        hourlyContact={hourlyContact}
        dialerHealth={dialerHealth}
        paceToTarget={paceToTarget}
      />

      {/* 2. Pace to target */}
      <PaceCard lang={lang} pace={paceToTarget} />

      {/* 3. Two-column: hourly calls+contact | sales by hour */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <CallsContactChart lang={lang} hourlyContact={hourlyContact} />
        </div>
        <div className="lg:col-span-2">
          <SalesByHourChart lang={lang} hourlyContact={hourlyContact} />
        </div>
      </div>

      {/* 4. Two-column: heatmap | staffing */}
      <div className="grid lg:grid-cols-9 gap-4">
        <div className="lg:col-span-5">
          <DayHourHeatmap lang={lang} dayHourHeatmap={dayHourHeatmap} />
        </div>
        <div className="lg:col-span-4">
          <StaffingChart lang={lang} staffingHours={staffingHours} />
        </div>
      </div>

      {/* 5. Two-column: day of week table | callbacks urgency */}
      <div className="grid lg:grid-cols-2 gap-4">
        <DayOfWeekTable lang={lang} dayOfWeekPerf={dayOfWeekPerf} />
        <CallbacksQueue lang={lang} leads={leads} />
      </div>

      {/* 6. Dialer health */}
      <DialerHealthCard lang={lang} dialerHealth={dialerHealth} />
    </section>
  );
}
