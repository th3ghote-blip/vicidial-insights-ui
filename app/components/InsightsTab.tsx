"use client";

import type { Disposition, CallHour, SalesDay, WeeklyInsight, CampaignStat, SourceROI, PipelineForecast, ContactVelocity } from "@/lib/api";
import { t, type Lang, fmtDate } from "@/lib/i18n";
import AiBanner from "./AiBanner";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const DISPO_COLORS = ["#10b981", "#f59e0b", "#94a3b8", "#71717a", "#ef4444", "#6366f1", "#ec4899"];
const TOOLTIP_STYLE = { backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff" };

export default function InsightsTab({
  lang, weekly, dispos, callTimes, salesTrend, campaigns, sources, forecast, velocity,
}: {
  lang: Lang;
  weekly: WeeklyInsight;
  dispos: Disposition[];
  callTimes: CallHour[];
  salesTrend: SalesDay[];
  campaigns: CampaignStat[];
  sources: SourceROI[];
  forecast: PipelineForecast;
  velocity: ContactVelocity;
}) {
  const tr = t[lang];

  return (
    <section className="space-y-6">
      <AiBanner lang={lang} weekly={weekly} />

      {/* Forecast + velocity row */}
      <div className="grid md:grid-cols-3 gap-4">
        <ForecastCard lang={lang} forecast={forecast} />
        <VelocityCard lang={lang} velocity={velocity} />
        <FunnelCard lang={lang} forecast={forecast} />
      </div>

      {/* Lead source ROI */}
      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-3">
          {lang === "es" ? "ROI por fuente de leads" : "Lead source ROI"}
        </h3>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                <th className="px-4 py-2 text-left">{lang === "es" ? "Fuente" : "Source"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Leads" : "Leads"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Contacto" : "Contact"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Ventas" : "Sales"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Conv." : "Conv."}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "$/lead" : "$/lead"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "$/venta" : "$/sale"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sources.map((s) => (
                <tr key={s.source} className="hover:bg-zinc-900/30">
                  <td className="px-4 py-2 font-medium text-zinc-200">{s.source.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-400">{s.leads_total.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-400">{(s.contact_rate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2 text-right tabular-nums text-emerald-300">{s.sales}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-sky-300">{(s.conversion_rate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-400">${s.cost_per_lead_usd.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-amber-300 font-medium">${s.cost_per_sale_usd.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title={tr.disposHeader}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dispos}
                dataKey="count"
                nameKey="dispo"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                paddingAngle={2}
                stroke="#0a0a0a"
              >
                {dispos.map((_, i) => <Cell key={i} fill={DISPO_COLORS[i % DISPO_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={tr.salesTrendHeader}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrend.map(d => ({ ...d, label: fmtDate(d.date, lang) }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="label" stroke="#a1a1aa" fontSize={12} />
              <YAxis stroke="#a1a1aa" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Campaign performance table */}
      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-3">
          {lang === "es" ? "Rendimiento por campaña" : "Campaign performance"}
        </h3>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                <th className="px-4 py-2 text-left">{lang === "es" ? "Campaña" : "Campaign"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Leads" : "Leads"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Penetración" : "Penetration"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Marcaciones" : "Dials"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Ventas" : "Sales"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Conv." : "Conv."}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Marc./venta" : "Dials/sale"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Mejor hora" : "Best hour"}</th>
                <th className="px-4 py-2 text-right">{lang === "es" ? "Agentes" : "Agents"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {campaigns.map((c) => (
                <tr key={c.campaign_id} className="hover:bg-zinc-900/30">
                  <td className="px-4 py-2 font-medium text-zinc-200 max-w-[180px] truncate">{c.campaign_name}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-400">{c.leads_total.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    <span className={penetrationColor(c.penetration_rate)}>
                      {(c.penetration_rate * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-400">{c.total_dials.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-emerald-300">{c.total_sales}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-sky-300">{(c.conversion_rate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right tabular-nums text-amber-300">{c.dials_per_sale}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-400">{c.best_hour}:00</td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-400">{c.active_agents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ChartCard title={tr.callTimesHeader} fullWidth>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={callTimes.map(h => ({ ...h, hourLabel: `${h.hour}h` }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="hourLabel" stroke="#a1a1aa" fontSize={12} />
            <YAxis stroke="#a1a1aa" fontSize={12} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
            <Bar dataKey="calls" name={tr.callsLabel} fill="#3f3f46" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sales" name={tr.salesLabel} fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}

function penetrationColor(rate: number) {
  if (rate >= 0.60) return "text-emerald-300";
  if (rate >= 0.40) return "text-amber-300";
  return "text-red-400";
}

function ForecastCard({ lang, forecast }: { lang: Lang; forecast: PipelineForecast }) {
  const positive = forecast.delta_vs_last_week_pct >= 0;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
        {lang === "es" ? "Pronóstico próximos 7 días" : "Next 7 days forecast"}
      </div>
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-semibold text-emerald-300 tabular-nums">{forecast.expected_total_sales}</div>
        <div className={`text-sm tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
          {positive ? "+" : ""}{forecast.delta_vs_last_week_pct.toFixed(1)}%
        </div>
      </div>
      <div className="text-xs text-zinc-500 mt-1">
        {lang === "es" ? `vs ${forecast.last_week_sales} la semana pasada` : `vs ${forecast.last_week_sales} last week`}
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1 text-xs">
        <Row label={lang === "es" ? "De callbacks" : "From callbacks"} value={`${forecast.expected_callback_sales}`} />
        <Row label={lang === "es" ? "De leads frescos" : "From fresh leads"} value={`${forecast.expected_fresh_sales}`} />
        <Row label={lang === "es" ? "Callbacks programados" : "Callbacks scheduled"} value={`${forecast.callbacks_scheduled_next_7d}`} />
      </div>
    </div>
  );
}

function VelocityCard({ lang, velocity }: { lang: Lang; velocity: ContactVelocity }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
        {lang === "es" ? "Velocidad de contacto" : "Contact velocity"}
      </div>
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-semibold text-sky-300 tabular-nums">{velocity.avg_hours_to_first_contact}h</div>
        <div className="text-xs text-zinc-500">
          {lang === "es" ? "promedio al 1er intento" : "avg to first dial"}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1 text-xs">
        <Row
          label={lang === "es" ? `Atascados >${velocity.stuck_threshold_hours}h` : `Stuck >${velocity.stuck_threshold_hours}h`}
          value={`${velocity.leads_stuck_no_contact}`}
          valueColor={velocity.alert ? "text-red-400" : "text-zinc-300"}
        />
        {velocity.conversion_by_age.slice(0, 3).map((c) => (
          <Row key={c.age_bucket}
            label={lang === "es" ? `Conv. ${c.age_bucket}` : `Conv. ${c.age_bucket}`}
            value={`${(c.conversion_rate * 100).toFixed(1)}%`}
          />
        ))}
      </div>
    </div>
  );
}

function FunnelCard({ lang, forecast }: { lang: Lang; forecast: PipelineForecast }) {
  const f = forecast.funnel;
  const stages = [
    { key: "new",       label: { es: "Nuevos",       en: "New"        }, value: f.new,       color: "bg-zinc-500" },
    { key: "contacted", label: { es: "Contactados",  en: "Contacted"  }, value: f.contacted, color: "bg-sky-500" },
    { key: "engaged",   label: { es: "Interesados",  en: "Engaged"    }, value: f.engaged,   color: "bg-amber-500" },
    { key: "callback",  label: { es: "Callback",     en: "Callback"   }, value: f.callback,  color: "bg-violet-500" },
    { key: "sold_7d",   label: { es: "Vendidos 7d",  en: "Sold (7d)"  }, value: f.sold_7d,   color: "bg-emerald-500" },
  ];
  const max = Math.max(...stages.map(s => s.value), 1);
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
        {lang === "es" ? "Embudo (estado actual)" : "Funnel (current state)"}
      </div>
      <div className="space-y-1.5">
        {stages.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="w-20 text-xs text-zinc-400 truncate">{s.label[lang]}</div>
            <div className="flex-1 h-3 bg-zinc-800/50 rounded overflow-hidden">
              <div className={`h-full ${s.color}/60`} style={{ width: `${(s.value / max) * 100}%` }} />
            </div>
            <div className="w-12 text-right text-xs font-mono tabular-nums text-zinc-300">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-mono tabular-nums ${valueColor ?? "text-zinc-300"}`}>{value}</span>
    </div>
  );
}

function ChartCard({ title, children, fullWidth }: { title: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`rounded-lg border border-zinc-800 p-5 ${fullWidth ? "" : ""}`}>
      <h3 className="text-sm font-medium mb-4 text-zinc-300">{title}</h3>
      <div className="h-72">{children}</div>
    </div>
  );
}
