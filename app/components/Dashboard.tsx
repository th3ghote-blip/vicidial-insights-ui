"use client";

import { useState } from "react";
import {
  Bell, Users, BarChart3, Sparkles, Target, Settings, Activity,
  Database, Cpu, Server, Zap,
} from "lucide-react";
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

const NAV = [
  { key: "alerts"   as const, icon: Bell,       labelEs: "Alertas", labelEn: "Alerts"   },
  { key: "leads"    as const, icon: Target,     labelEs: "Leads",   labelEn: "Leads"    },
  { key: "agents"   as const, icon: Users,      labelEs: "Agentes", labelEn: "Agents"   },
  { key: "insights" as const, icon: BarChart3,  labelEs: "Análisis",labelEn: "Insights" },
];

export default function Dashboard(props: Props) {
  const [lang, setLang] = useState<Lang>(props.initialLang);
  const [tab, setTab] = useState<TabKey>("alerts");
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const tr = t[lang];
  const urgentCount = props.alerts.filter(a => a.severity === "high").length;
  const navigate = (k: TabKey) => setTab(k);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* ────────── Sidebar ────────── */}
      <aside className="hidden md:flex md:flex-col w-60 border-r border-zinc-800/80 bg-gradient-to-b from-zinc-950 to-zinc-900/40 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 pt-5 pb-6 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-4 w-4 text-zinc-950" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-semibold leading-tight text-sm">{tr.appName}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{tr.subtitle}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(n => {
            const Icon = n.icon;
            const active = tab === n.key;
            return (
              <button
                key={n.key}
                onClick={() => navigate(n.key)}
                className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-zinc-800/80 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-emerald-400" />
                )}
                <Icon className={`h-4 w-4 ${active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"}`} strokeWidth={2} />
                <span className="flex-1 text-left">{lang === "es" ? n.labelEs : n.labelEn}</span>
                {n.key === "alerts" && urgentCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                    {urgentCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System health footer */}
        <div className="px-4 pb-4 pt-3 border-t border-zinc-800/60 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mb-1">
            {lang === "es" ? "Sistema" : "System"}
          </div>
          <HealthRow icon={Server} label={lang === "es" ? "Backend" : "Backend"}
            value={props.health.mock_mode ? "mock" : "live"}
            ok={!props.health.mock_mode} warn={props.health.mock_mode} />
          <HealthRow icon={Cpu} label="LLM"
            value={props.health.anthropic_configured ? "Haiku" : "off"}
            ok={props.health.anthropic_configured} />
          <HealthRow icon={Database} label="Cache"
            value={props.health.supabase_configured ? "Supabase" : "—"}
            ok={props.health.supabase_configured} />
        </div>
      </aside>

      {/* ────────── Main ────────── */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-20">
          <div className="px-6 py-3 flex items-center gap-4">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 md:hidden">
              <Sparkles className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
              <span className="font-medium text-sm">{tr.appName}</span>
            </div>

            {/* Page title */}
            <h1 className="hidden md:flex text-base font-medium text-zinc-200 items-center gap-2">
              {tab === "alerts"   && <><Bell className="h-4 w-4 text-zinc-500"/> {lang === "es" ? "Alertas" : "Alerts"}</>}
              {tab === "leads"    && <><Target className="h-4 w-4 text-zinc-500"/> {lang === "es" ? "Leads" : "Leads"}</>}
              {tab === "agents"   && <><Users className="h-4 w-4 text-zinc-500"/> {lang === "es" ? "Agentes" : "Agents"}</>}
              {tab === "insights" && <><BarChart3 className="h-4 w-4 text-zinc-500"/> {lang === "es" ? "Análisis" : "Insights"}</>}
            </h1>

            <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium ${
              props.health.mock_mode
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${props.health.mock_mode ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
              {props.health.mock_mode ? tr.mockBanner : tr.realDataBanner}
            </span>

            <div className="flex-1" />

            {/* Time range pills */}
            <div className="hidden sm:flex border border-zinc-800 rounded-lg overflow-hidden text-xs bg-zinc-900/60">
              {([7, 30, 90] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 transition-colors ${
                    range === r
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>

            {/* Language toggle */}
            <div className="flex border border-zinc-800 rounded-lg overflow-hidden text-xs bg-zinc-900/60">
              <button onClick={() => setLang("es")} className={`px-2.5 py-1.5 transition-colors ${lang === "es" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-200"}`}>ES</button>
              <button onClick={() => setLang("en")} className={`px-2.5 py-1.5 transition-colors ${lang === "en" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-200"}`}>EN</button>
            </div>
          </div>

          {/* Mobile tabs */}
          <nav className="md:hidden px-4 flex gap-1 border-t border-zinc-900 overflow-x-auto">
            {NAV.map(n => {
              const Icon = n.icon;
              const active = tab === n.key;
              return (
                <button key={n.key} onClick={() => navigate(n.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 whitespace-nowrap transition-colors ${
                    active ? "border-emerald-400 text-white" : "border-transparent text-zinc-400"
                  }`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  <span>{lang === "es" ? n.labelEs : n.labelEn}</span>
                  {n.key === "alerts" && urgentCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-px rounded bg-red-500/20 text-red-300">{urgentCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
          <KpiStrip lang={lang} leads={props.leads} agents={props.agents} salesTrend={props.salesTrend} forecast={props.forecast} />
          {tab !== "insights" && tab !== "alerts" && <AiBanner lang={lang} weekly={props.weekly} compact />}
          {tab === "alerts"   && <AlertsTab lang={lang} alerts={props.alerts} onJump={navigate} />}
          {tab === "leads"    && <LeadsTab lang={lang} leads={props.leads} />}
          {tab === "agents"   && <AgentsTab lang={lang} agents={props.agents} momentum={props.momentum} />}
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

function HealthRow({ icon: Icon, label, value, ok, warn }: {
  icon: React.ElementType; label: string; value: string; ok?: boolean; warn?: boolean;
}) {
  const dot = ok ? "bg-emerald-400" : warn ? "bg-amber-400" : "bg-zinc-600";
  return (
    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
      <Icon className="h-3 w-3" strokeWidth={2} />
      <span className="flex-1">{label}</span>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-zinc-300 font-medium">{value}</span>
    </div>
  );
}
