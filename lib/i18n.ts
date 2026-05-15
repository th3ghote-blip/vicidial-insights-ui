export type Lang = "es" | "en";

export const t = {
  es: {
    appName: "Vicidial Insights",
    subtitle: "Centro de inteligencia para call center",
    refresh: "Actualizar",
    loading: "Cargando…",
    error: "Error",
    tabLeads: "Leads",
    tabAgents: "Agentes",
    tabInsights: "Análisis",
    weeklyHeader: "Resumen semanal",
    topLeadsCount: "leads de alta prioridad",
    leadsHeader: "Leads priorizados",
    leadsSub: "Ordenados por probabilidad de cierre",
    leadCol: { id: "ID", state: "Estado", called: "Llamadas", lastDispo: "Última disp.", score: "Score", rec: "Recomendación" },
    rec: {
      call_now: "Llamar ahora",
      route_closer: "Cerrador A",
      callback_due: "Devolver llamada",
      rest: "Esperar",
      dnc_review: "Revisar DNC",
    },
    agentsHeader: "Tabla de agentes (últimos 7 días)",
    agentCol: { name: "Agente", calls: "Llamadas", sales: "Ventas", rate: "% Cierre", avgTalk: "Prom. (seg)" },
    disposHeader: "Desglose de disposiciones",
    dispoCount: "ocurrencias",
    mockBanner: "Mostrando datos de prueba — esperando credenciales del cliente",
    realDataBanner: "Datos reales en vivo",
  },
  en: {
    appName: "Vicidial Insights",
    subtitle: "Call center intelligence",
    refresh: "Refresh",
    loading: "Loading…",
    error: "Error",
    tabLeads: "Leads",
    tabAgents: "Agents",
    tabInsights: "Insights",
    weeklyHeader: "Weekly summary",
    topLeadsCount: "high-priority leads",
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
    agentsHeader: "Agent leaderboard (last 7 days)",
    agentCol: { name: "Agent", calls: "Calls", sales: "Sales", rate: "Close %", avgTalk: "Avg (sec)" },
    disposHeader: "Disposition breakdown",
    dispoCount: "occurrences",
    mockBanner: "Showing mock data — waiting on client credentials",
    realDataBanner: "Live real data",
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
    case "call_now": return "bg-emerald-500/15 text-emerald-300";
    case "route_closer": return "bg-sky-500/15 text-sky-300";
    case "callback_due": return "bg-amber-500/15 text-amber-300";
    case "dnc_review": return "bg-red-500/15 text-red-300";
    default: return "bg-zinc-700/30 text-zinc-400";
  }
}
