"use client";

import { useState } from "react";
import type { Lead, AgentStat, Disposition, WeeklyInsight, Health } from "@/lib/api";
import { t, type Lang, recLabel, scoreColor, recColor } from "@/lib/i18n";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

type Props = {
  initialLang: Lang;
  health: Health;
  leads: Lead[];
  agents: AgentStat[];
  dispos: Disposition[];
  weekly: WeeklyInsight;
};

export default function Dashboard({ initialLang, health, leads, agents, dispos, weekly }: Props) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [tab, setTab] = useState<"leads" | "agents" | "insights">("leads");
  const tr = t[lang];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{tr.appName}</h1>
            <p className="text-sm text-zinc-400">{tr.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${health.mock_mode ? "bg-amber-500/10 text-amber-300 border-amber-500/30" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"}`}>
              {health.mock_mode ? tr.mockBanner : tr.realDataBanner}
            </span>
            <div className="flex border border-zinc-700 rounded-md overflow-hidden text-sm">
              <button onClick={() => setLang("es")} className={`px-3 py-1 ${lang === "es" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}>🇪🇸 ES</button>
              <button onClick={() => setLang("en")} className={`px-3 py-1 ${lang === "en" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}>🇺🇸 EN</button>
            </div>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-6 flex gap-1">
          {(["leads", "agents", "insights"] as const).map(k => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 text-sm border-b-2 transition-colors ${tab === k ? "border-emerald-400 text-white" : "border-transparent text-zinc-400 hover:text-white"}`}
            >
              {k === "leads" ? tr.tabLeads : k === "agents" ? tr.tabAgents : tr.tabInsights}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {tab === "leads" && <LeadsTab lang={lang} leads={leads} />}
        {tab === "agents" && <AgentsTab lang={lang} agents={agents} />}
        {tab === "insights" && <InsightsTab lang={lang} weekly={weekly} dispos={dispos} />}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-4 text-xs text-zinc-500 border-t border-zinc-900">
        API: {process.env.NEXT_PUBLIC_API_REGION || "Railway"} · Backend: {health.mock_mode ? "mock" : "live"} · Auth: {health.auth_configured ? "✓" : "✗"} · Cache: {health.supabase_configured ? "✓" : "✗"} · LLM: {health.anthropic_configured ? "Haiku" : "fallback"}
      </footer>
    </div>
  );
}

function LeadsTab({ lang, leads }: { lang: Lang; leads: Lead[] }) {
  const tr = t[lang];
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-medium">{tr.leadsHeader}</h2>
        <p className="text-sm text-zinc-400">{tr.leadsSub} · {leads.length} total</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-2 font-medium">{tr.leadCol.id}</th>
              <th className="text-left px-4 py-2 font-medium">{tr.leadCol.state}</th>
              <th className="text-left px-4 py-2 font-medium">{tr.leadCol.called}</th>
              <th className="text-left px-4 py-2 font-medium">{tr.leadCol.lastDispo}</th>
              <th className="text-left px-4 py-2 font-medium">{tr.leadCol.score}</th>
              <th className="text-left px-4 py-2 font-medium">{tr.leadCol.rec}</th>
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 40).map(l => (
              <tr key={l.lead_id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                <td className="px-4 py-2 font-mono text-zinc-400">{l.lead_id}</td>
                <td className="px-4 py-2">{l.state}</td>
                <td className="px-4 py-2">{l.called_count}</td>
                <td className="px-4 py-2 text-zinc-300">{l.last_call_dispo || "—"}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono ${scoreColor(l.score)}`}>
                    {l.score}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${recColor(l.recommendation)}`}>
                    {recLabel(lang, l.recommendation)}
                  </span>
                  {l.reasons.length > 0 && (
                    <span className="text-xs text-zinc-500 ml-2">· {l.reasons[0]}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AgentsTab({ lang, agents }: { lang: Lang; agents: AgentStat[] }) {
  const tr = t[lang];
  return (
    <section>
      <h2 className="text-lg font-medium mb-4">{tr.agentsHeader}</h2>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-2 font-medium">{tr.agentCol.name}</th>
              <th className="text-right px-4 py-2 font-medium">{tr.agentCol.calls}</th>
              <th className="text-right px-4 py-2 font-medium">{tr.agentCol.sales}</th>
              <th className="text-right px-4 py-2 font-medium">{tr.agentCol.rate}</th>
              <th className="text-right px-4 py-2 font-medium">{tr.agentCol.avgTalk}</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a, i) => (
              <tr key={a.user} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                <td className="px-4 py-2">
                  <span className="text-zinc-500 mr-2">#{i + 1}</span>
                  {a.full_name}
                </td>
                <td className="px-4 py-2 text-right font-mono">{a.calls_handled}</td>
                <td className="px-4 py-2 text-right font-mono text-emerald-300">{a.sales}</td>
                <td className="px-4 py-2 text-right font-mono">{(a.close_rate * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-right font-mono text-zinc-400">{a.avg_talk_sec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InsightsTab({ lang, weekly, dispos }: { lang: Lang; weekly: WeeklyInsight; dispos: Disposition[] }) {
  const tr = t[lang];
  const dispoColors = ["#10b981", "#f59e0b", "#94a3b8", "#71717a", "#ef4444", "#6366f1"];
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-gradient-to-br from-emerald-900/20 to-zinc-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">{tr.weeklyHeader}</h2>
          <span className="text-xs text-zinc-400">{weekly.top_leads_count} {tr.topLeadsCount}</span>
        </div>
        <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{weekly.summary}</div>
      </div>

      <div className="rounded-lg border border-zinc-800 p-5">
        <h2 className="text-lg font-medium mb-4">{tr.disposHeader}</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dispos} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="dispo" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Bar dataKey="count">
                {dispos.map((_, i) => <Cell key={i} fill={dispoColors[i % dispoColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
