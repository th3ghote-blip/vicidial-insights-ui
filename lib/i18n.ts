export type Lang = "es" | "en";

export const t = {
  es: {
    appName: "Vicidial Insights",
    subtitle: "Centro de inteligencia para call center",
    refresh: "Actualizar",
    loading: "Cargando…",
    error: "Error",
    nav: { alerts: "Alertas", leads: "Leads", agents: "Agentes", insights: "Análisis" },
    kpi: {
      hotLeads: "Leads calientes",
      conversion: "Conversión 7d",
      callsToday: "Llamadas (período)",
      topCloser: "Mejor cerrador",
    },
    leadsHeader: "Leads priorizados",
    leadsSub: "Ordenados por probabilidad de cierre",
    leadCol: { id: "ID", state: "Estado", called: "Intentos", lastDispo: "Última disp.", score: "Score", rec: "Recomendación" },
    rec: {
      call_now: "Llamar ahora",
      route_closer: "Cerrador A",
      callback_due: "Devolver llamada",
      rest: "Esperar",
      dnc_review: "Revisar DNC",
    },
    leadDetail: {
      title: "Detalle del lead",
      reasons: "Por qué este score",
      recommendation: "Recomendación de IA",
      stateLabel: "Estado",
      campaignLabel: "Campaña",
      attemptsLabel: "Intentos",
      lastDuration: "Duración última llamada",
      lastDispo: "Última disposición",
      lastCallAt: "Última llamada",
      close: "Cerrar",
    },
    agentsHeader: "Tabla de agentes (últimos 7 días)",
    agentCol: { name: "Agente", calls: "Llamadas", sales: "Ventas", rate: "% Cierre", avgTalk: "Prom. (seg)" },
    weeklyHeader: "Resumen semanal — Generado por IA",
    topLeadsCount: "leads de alta prioridad para mañana",
    disposHeader: "Desglose de disposiciones",
    callTimesHeader: "Mejores horarios para llamar",
    salesTrendHeader: "Ventas por día (últimos 7)",
    callsLabel: "Llamadas",
    salesLabel: "Ventas",
    mockBanner: "Datos de prueba — esperando credenciales del cliente",
    realDataBanner: "Datos en vivo",
  },
  en: {
    appName: "Vicidial Insights",
    subtitle: "Call center intelligence",
    refresh: "Refresh",
    loading: "Loading…",
    error: "Error",
    nav: { alerts: "Alerts", leads: "Leads", agents: "Agents", insights: "Insights" },
    kpi: {
      hotLeads: "Hot leads",
      conversion: "Conv. 7d",
      callsToday: "Calls (period)",
      topCloser: "Top closer",
    },
    leadsHeader: "Prioritized leads",
    leadsSub: "Ranked by likelihood to close",
    leadCol: { id: "ID", state: "State", called: "Attempts", lastDispo: "Last dispo", score: "Score", rec: "Recommendation" },
    rec: {
      call_now: "Call now",
      route_closer: "Top closer",
      callback_due: "Callback due",
      rest: "Wait",
      dnc_review: "Review DNC",
    },
    leadDetail: {
      title: "Lead detail",
      reasons: "Why this score",
      recommendation: "AI recommendation",
      stateLabel: "State",
      campaignLabel: "Campaign",
      attemptsLabel: "Attempts",
      lastDuration: "Last call duration",
      lastDispo: "Last disposition",
      lastCallAt: "Last call",
      close: "Close",
    },
    agentsHeader: "Agent leaderboard (last 7 days)",
    agentCol: { name: "Agent", calls: "Calls", sales: "Sales", rate: "Close %", avgTalk: "Avg (sec)" },
    weeklyHeader: "Weekly summary — AI generated",
    topLeadsCount: "high-priority leads for tomorrow",
    disposHeader: "Disposition breakdown",
    callTimesHeader: "Best times to call",
    salesTrendHeader: "Daily sales (last 7)",
    callsLabel: "Calls",
    salesLabel: "Sales",
    mockBanner: "Mock data — waiting on client credentials",
    realDataBanner: "Live data",
  },
} as const;

export function recLabel(lang: Lang, rec: string): string {
  const r = (t[lang].rec as Record<string, string>)[rec];
  return r ?? rec;
}

export function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (score >= 60) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (score >= 30) return "bg-violet-500/15 text-violet-300 border-violet-500/30";
  return "bg-zinc-700/30 text-zinc-400 border-zinc-700";
}

export function recColor(rec: string): string {
  switch (rec) {
    case "call_now": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "route_closer": return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "callback_due": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "dnc_review": return "bg-red-500/15 text-red-300 border-red-500/30";
    default: return "bg-zinc-700/30 text-zinc-400 border-zinc-700";
  }
}

export function fmtDate(iso: string, lang: Lang): string {
  try {
    return new Date(iso).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch { return iso; }
}

export function fmtRelative(iso: string | null, lang: Lang): string {
  if (!iso) return "—";
  try {
    const ts = new Date(iso).getTime();
    const diff = (Date.now() - ts) / 1000;
    const r = lang === "es"
      ? { now: "ahora", min: "min", h: "h", d: "d" }
      : { now: "now", min: "min", h: "h", d: "d" };
    if (diff < 60) return r.now;
    if (diff < 3600) return `${Math.floor(diff / 60)} ${r.min}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${r.h}`;
    return `${Math.floor(diff / 86400)} ${r.d}`;
  } catch { return iso; }
}
