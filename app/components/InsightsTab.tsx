"use client";

import type { Disposition, CallHour, SalesDay, WeeklyInsight, CampaignStat } from "@/lib/api";
import { t, type Lang, fmtDate } from "@/lib/i18n";
import AiBanner from "./AiBanner";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const DISPO_COLORS = ["#10b981", "#f59e0b", "#94a3b8", "#71717a", "#ef4444", "#6366f1", "#ec4899"];
const TOOLTIP_STYLE = { backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff" };

export default function InsightsTab({
  lang, weekly, dispos, callTimes, salesTrend, campaigns,
}: {
  lang: Lang;
  weekly: WeeklyInsight;
  dispos: Disposition[];
  callTimes: CallHour[];
  salesTrend: SalesDay[];
  campaigns: CampaignStat[];
}) {
  const tr = t[lang];

  return (
    <section className="space-y-6">
      <AiBanner lang={lang} weekly={weekly} />

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

function ChartCard({ title, children, fullWidth }: { title: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`rounded-lg border border-zinc-800 p-5 ${fullWidth ? "" : ""}`}>
      <h3 className="text-sm font-medium mb-4 text-zinc-300">{title}</h3>
      <div className="h-72">{children}</div>
    </div>
  );
}
