"use client";

import type { Lead, AgentStat, SalesDay } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

export default function KpiStrip({
  lang, leads, agents, salesTrend,
}: { lang: Lang; leads: Lead[]; agents: AgentStat[]; salesTrend: SalesDay[] }) {
  const tr = t[lang].kpi;
  const hot = leads.filter(l => l.score >= 60).length;
  const totalSales = salesTrend.reduce((s, d) => s + d.sales, 0);
  const totalCalls = agents.reduce((s, a) => s + a.calls_handled, 0);
  const conv = totalCalls > 0 ? ((totalSales / totalCalls) * 100).toFixed(1) : "0";
  const top = agents[0];

  const subs = lang === "es"
    ? { of: "de", total: "totales", sales: "ventas", last7: "últimos 7 días", close: "cierre" }
    : { of: "of", total: "total", sales: "sales", last7: "last 7 days", close: "close rate" };

  const cards = [
    { label: tr.hotLeads, value: hot, accent: "text-emerald-300", sub: `${subs.of} ${leads.length} ${subs.total}` },
    { label: tr.conversion, value: `${conv}%`, accent: "text-sky-300", sub: `${totalSales} ${subs.sales}` },
    { label: tr.callsToday, value: totalCalls.toLocaleString(), accent: "text-zinc-100", sub: subs.last7 },
    { label: tr.topCloser, value: top?.full_name ?? "—", accent: "text-amber-300", sub: top ? `${(top.close_rate * 100).toFixed(1)}% ${subs.close}` : "" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">{c.label}</div>
          <div className={`text-2xl font-semibold mt-1 ${c.accent}`}>{c.value}</div>
          {c.sub && <div className="text-xs text-zinc-500 mt-1">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
