"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Bell, Users, BarChart3, Sparkles, Target,
  Database, Cpu, Server, Sun, Moon, Loader2,
} from "lucide-react";
import type {
  Lead, AgentStat, Disposition, CallHour, SalesDay, WeeklyInsight, Health, CampaignStat,
  AgentMomentum, SourceROI, PipelineForecast, ContactVelocity, Alert, AgentCampaignCell,
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
  initialRange: 7 | 30 | 90;
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
  matrix: AgentCampaignCell[];
};

type TabKey = "alerts" | "leads" | "agents" | "insights";
type Theme = "light" | "dark";

const NAV = [
  { key: "alerts"   as const, icon: Bell,       labelEs: "Alertas", labelEn: "Alerts"   },
  { key: "leads"    as const, icon: Target,     labelEs: "Leads",   labelEn: "Leads"    },
  { key: "agents"   as const, icon: Users,      labelEs: "Agentes", labelEn: "Agents"   },
  { key: "insights" as const, icon: BarChart3,  labelEs: "Análisis",labelEn: "Insights" },
];

export default function Dashboard(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [lang, setLang] = useState<Lang>(props.initialLang);
  const [tab, setTabState] = useState<TabKey>(() => {
    const tabParam = searchParams.get("tab") as TabKey | null;
    return tabParam && ["alerts", "leads", "agents", "insights"].includes(tabParam) ? tabParam : "alerts";
  });
  const [theme, setTheme] = useState<Theme>("dark");
  const tr = t[lang];
  const urgentCount = props.alerts.filter(a => a.severity === "high").length;

  // Init theme from localStorage
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  const setTab = (t: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    setTabState(t);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const setRange = (r: 7 | 30 | 90) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", String(r));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex">
      {/* ────────── Sidebar ────────── */}
      <aside className="hidden md:flex md:flex-col w-60 border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950 sticky top-0 h-screen">
        <div className="px-5 pt-5 pb-6 border-b border-zinc-200 dark:border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-semibold leading-tight text-sm">{tr.appName}</div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-500 mt-0.5">{tr.subtitle}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(n => {
            const Icon = n.icon;
            const active = tab === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-zinc-200 dark:bg-zinc-800/80 text-zinc-900 dark:text-white"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/60"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-emerald-500" />
                )}
                <Icon className={`h-4 w-4 ${active ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"}`} strokeWidth={2} />
                <span className="flex-1 text-left">{lang === "es" ? n.labelEs : n.labelEn}</span>
                {n.key === "alerts" && urgentCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30">
                    {urgentCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/60 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-500 font-semibold mb-1">
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
        <header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-20">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 md:hidden">
              <Sparkles className="h-5 w-5 text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} />
              <span className="font-medium text-sm">{tr.appName}</span>
            </div>

            <h1 className="hidden md:flex text-base font-medium text-zinc-700 dark:text-zinc-200 items-center gap-2">
              {tab === "alerts"   && <><Bell className="h-4 w-4 text-zinc-500"/> {lang === "es" ? "Alertas" : "Alerts"}</>}
              {tab === "leads"    && <><Target className="h-4 w-4 text-zinc-500"/> {lang === "es" ? "Leads" : "Leads"}</>}
              {tab === "agents"   && <><Users className="h-4 w-4 text-zinc-500"/> {lang === "es" ? "Agentes" : "Agents"}</>}
              {tab === "insights" && <><BarChart3 className="h-4 w-4 text-zinc-500"/> {lang === "es" ? "Análisis" : "Insights"}</>}
            </h1>

            <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium ${
              props.health.mock_mode
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${props.health.mock_mode ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
              {props.health.mock_mode ? tr.mockBanner : tr.realDataBanner}
            </span>

            <div className="flex-1" />

            {/* Time range — actually wired to URL */}
            <div className="hidden sm:flex border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden text-xs bg-white dark:bg-zinc-900/60 relative">
              {([7, 30, 90] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  disabled={isPending}
                  className={`px-3 py-1.5 transition-colors disabled:opacity-50 ${
                    props.initialRange === r
                      ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {r}d
                </button>
              ))}
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-zinc-900/40">
                  <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                </div>
              )}
            </div>

            {/* Language toggle */}
            <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden text-xs bg-white dark:bg-zinc-900/60">
              <button onClick={() => setLang("es")} className={`px-2.5 py-1.5 transition-colors ${lang === "es" ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"}`}>ES</button>
              <button onClick={() => setLang("en")} className={`px-2.5 py-1.5 transition-colors ${lang === "en" ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"}`}>EN</button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <nav className="md:hidden px-4 flex gap-1 border-t border-zinc-200 dark:border-zinc-900 overflow-x-auto">
            {NAV.map(n => {
              const Icon = n.icon;
              const active = tab === n.key;
              return (
                <button key={n.key} onClick={() => setTab(n.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 whitespace-nowrap transition-colors ${
                    active ? "border-emerald-500 dark:border-emerald-400 text-zinc-900 dark:text-white" : "border-transparent text-zinc-500 dark:text-zinc-400"
                  }`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  <span>{lang === "es" ? n.labelEs : n.labelEn}</span>
                  {n.key === "alerts" && urgentCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-px rounded bg-red-500/15 text-red-600 dark:text-red-300">{urgentCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
          <KpiStrip lang={lang} leads={props.leads} agents={props.agents} salesTrend={props.salesTrend} forecast={props.forecast} range={props.initialRange} />
          {tab !== "insights" && tab !== "alerts" && <AiBanner lang={lang} weekly={props.weekly} compact />}
          {tab === "alerts"   && <AlertsTab lang={lang} alerts={props.alerts} onJump={setTab} />}
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
              matrix={props.matrix}
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
  const dot = ok ? "bg-emerald-500" : warn ? "bg-amber-500" : "bg-zinc-400 dark:bg-zinc-600";
  return (
    <div className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-500">
      <Icon className="h-3 w-3" strokeWidth={2} />
      <span className="flex-1">{label}</span>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{value}</span>
    </div>
  );
}
