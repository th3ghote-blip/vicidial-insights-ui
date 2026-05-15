"use client";

import { useState } from "react";
import type {
  Lead, AgentStat, Disposition, CallHour, SalesDay, WeeklyInsight, Health, CampaignStat,
  AgentMomentum, SourceROI, PipelineForecast, ContactVelocity, Alert,
} from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";
import KpiStrip from "./KpiStrip";
import AiBanner from "./AiBanner";
import LeadsTab from "./LeadsTab";
import AgentsTab from "./AgentsTab";
import InsightsTab from "./InsightsTab";
import AlertsTab from "./AlertsTab";

type Props = {
  initialLang: Lang;
  health: Health;
  leads: Lead[];
  agents: AgentStat[];
  dispos: Disposition[];
  callTimes: CallHour[];
  salesTrend: SalesDay[];
  weekly: WeeklyInsight;
  campaigns: CampaignStat[];
  momentum: AgentMomentum[];
  sources: SourceROI[];
  forecast: PipelineForecast;
  velocity: ContactVelocity;
  alerts: Alert[];
};

type TabKey = "alerts" | "leads" | "agents" | "insights";

export default function Dashboard(props: Props) {
  const [lang, setLang] = useState<Lang>(props.initialLang);
  const [tab, setTab] = useState<TabKey>("alerts");
  const urgentCount = props.alerts.filter(a => a.severity === "high").length;
  const tr = t[lang];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 border-r border-zinc-800 bg-zinc-950 p-4 gap-1 sticky top-0 h-screen">
        <div className="mb-6">
          <div className="text-emerald-400 text-2xl mb-1">✦</div>
          <div className="font-semibold leading-tight">{tr.appName}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{tr.subtitle}</div>
        </div>
        {(["alerts", "leads", "agents", "insights"] as const).map(k => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between ${tab === k ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}
          >
            <span>{tr.nav[k]}</span>
            {k === "alerts" && urgentCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-px rounded bg-red-500/20 text-red-300 border border-red-500/30">
                {urgentCount}
              </span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <div className="text-xs text-zinc-600 space-y-1 border-t border-zinc-900 pt-3">
          <div>Backend: {props.health.mock_mode ? "mock" : "live"}</div>
          <div>LLM: {props.health.anthropic_configured ? "Haiku ✓" : "fallback"}</div>
          <div>Cache: {props.health.supabase_configured ? "Supabase ✓" : "—"}</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur sticky top-0 z-10">
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
              <span className="text-emerald-400 text-xl">✦</span>
              <span className="font-medium">{tr.appName}</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${props.health.mock_mode ? "bg-amber-500/10 text-amber-300 border-amber-500/30" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"}`}>
              {props.health.mock_mode ? tr.mockBanner : tr.realDataBanner}
            </span>
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex border border-zinc-700 rounded-md overflow-hidden text-sm">
                <button onClick={() => setLang("es")} className={`px-3 py-1 ${lang === "es" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}>🇪🇸 ES</button>
                <button onClick={() => setLang("en")} className={`px-3 py-1 ${lang === "en" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}>🇺🇸 EN</button>
              </div>
            </div>
          </div>
          {/* Mobile tabs */}
          <nav className="md:hidden px-6 flex gap-1 border-t border-zinc-900 overflow-x-auto">
            {(["alerts", "leads", "agents", "insights"] as const).map(k => (
              <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm border-b-2 whitespace-nowrap ${tab === k ? "border-emerald-400 text-white" : "border-transparent text-zinc-400"}`}>
                {tr.nav[k]}
                {k === "alerts" && urgentCount > 0 && (
                  <span className="ml-1.5 text-[10px] font-mono px-1.5 py-px rounded bg-red-500/20 text-red-300">
                    {urgentCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </header>

        <main className="px-6 py-6 space-y-6 max-w-7xl">
          <KpiStrip lang={lang} leads={props.leads} agents={props.agents} salesTrend={props.salesTrend} />
          {tab !== "insights" && tab !== "alerts" && <AiBanner lang={lang} weekly={props.weekly} compact />}
          {tab === "alerts" && <AlertsTab lang={lang} alerts={props.alerts} />}
          {tab === "leads" && <LeadsTab lang={lang} leads={props.leads} />}
          {tab === "agents" && (
            <AgentsTab lang={lang} agents={props.agents} momentum={props.momentum} />
          )}
          {tab === "insights" && (
            <InsightsTab
              lang={lang}
              weekly={props.weekly}
              dispos={props.dispos}
              callTimes={props.callTimes}
              salesTrend={props.salesTrend}
              campaigns={props.campaigns}
              sources={props.sources}
              forecast={props.forecast}
              velocity={props.velocity}
            />
          )}
        </main>
      </div>
    </div>
  );
}
