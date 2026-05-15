/**
 * Server-side fetch helpers for the Vicidial backend on Railway.
 *
 * Token lives in process.env (server-only). These functions are only
 * called from Server Components or Route Handlers — never from client
 * components — so the bearer token never reaches the browser.
 */

const API_BASE = process.env.VICIDIAL_API_BASE!;
const API_TOKEN = process.env.VICIDIAL_API_TOKEN!;

if (!API_BASE || !API_TOKEN) {
  // Don't crash at import time in dev — just log. Server components will throw on first fetch.
  console.warn("[lib/api] VICIDIAL_API_BASE or VICIDIAL_API_TOKEN missing");
}

async function fetchJSON<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    next: { revalidate },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`vicidial-api ${path} -> ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ---------- Response types (match the FastAPI shapes) ------------------------

export type Lead = {
  lead_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  state: string;
  postal_code: string;
  entry_date: string;
  status: string;
  called_count: number;
  last_local_call_time: string | null;
  last_call_duration_sec: number;
  last_call_dispo: string;
  total_call_seconds: number;
  campaign_id: string;
  source: string;
  language: "es" | "en";
  score: number;
  recommendation: "call_now" | "route_closer" | "callback_due" | "rest" | "dnc_review";
  reasons: string[];
};

export type AgentStat = {
  user: string;
  full_name: string;
  calls_handled: number;
  sales: number;
  close_rate: number;
  talk_seconds: number;
  avg_talk_sec: number;
  // Efficiency
  login_seconds: number;
  pause_seconds: number;
  utilization_rate: number;
  avg_wait_sec: number;
  dials_per_hour: number;
  // Follow-up
  callbacks_set: number;
  callbacks_converted: number;
  callback_conversion_rate: number;
};

export type CampaignStat = {
  campaign_id: string;
  campaign_name: string;
  leads_total: number;
  leads_contacted: number;
  contact_rate: number;
  penetration_rate: number;
  total_dials: number;
  total_sales: number;
  conversion_rate: number;
  dials_per_sale: number;
  avg_handle_time_sec: number;
  best_hour: number;
  best_day: string;
  active_agents: number;
  cost_per_lead_usd: number;
};

export type AgentMomentum = {
  user: string;
  full_name: string;
  current_close_rate: number;
  prior_avg_close_rate: number;
  change_pct: number;
  status: "rising_star" | "needs_attention" | "cooling" | "on_streak" | "stable";
  weekly_series: number[];
};

export type SourceROI = {
  source: string;
  leads_total: number;
  leads_contacted: number;
  contact_rate: number;
  sales: number;
  conversion_rate: number;
  cost_per_lead_usd: number;
  cost_total_usd: number;
  cost_per_sale_usd: number;
};

export type PipelineForecast = {
  callbacks_scheduled_next_7d: number;
  historical_callback_conversion: number;
  expected_callback_sales: number;
  fresh_leads_next_7d: number;
  expected_fresh_sales: number;
  expected_total_sales: number;
  last_week_sales: number;
  delta_vs_last_week_pct: number;
  funnel: { new: number; contacted: number; engaged: number; callback: number; sold_7d: number };
};

export type ContactVelocity = {
  avg_hours_to_first_contact: number;
  median_hours_to_first_contact: number;
  leads_stuck_no_contact: number;
  stuck_threshold_hours: number;
  conversion_by_age: { age_bucket: string; count: number; conversion_rate: number }[];
  alert: boolean;
};

export type AgentCampaignCell = {
  user: string;
  full_name: string;
  campaign_id: string;
  campaign_name: string;
  calls: number;
  sales: number;
  close_rate: number;
};

export type Alert = {
  severity: "high" | "medium" | "low" | "positive";
  type: "agent_trend" | "lead_source" | "forecast" | "contact_velocity" | "campaign" | "dialer";
  title: string;
  message: string;
  action?: string;
};

export type Disposition = { dispo: string; count: number };
export type CallHour = { hour: number; calls: number; sales: number };
export type SalesDay = { date: string; sales: number; calls?: number };
export type WeeklyInsight = { lang: "es" | "en"; summary: string; top_leads_count: number };
export type Campaign = { campaign_id: string; campaign_name: string; active: string };

export type Health = {
  status: string;
  mock_mode: boolean;
  auth_configured: boolean;
  supabase_configured: boolean;
  anthropic_configured: boolean;
  dispo_sale: string;
  dispo_callback: string;
};

// ---------- Public API -------------------------------------------------------

export const api = {
  health: () => fetchJSON<Health>("/health", 30),
  leads: (topN = 40, daysBack = 30) =>
    fetchJSON<{ count: number; returned: number; leads: Lead[] }>(
      `/leads/priority?top_n=${topN}&days_back=${daysBack}`,
    ),
  agents: (daysBack = 7) =>
    fetchJSON<{ agents: AgentStat[] }>(`/agents/leaderboard?days_back=${daysBack}`),
  dispositions: (daysBack = 7) =>
    fetchJSON<{ dispositions: Disposition[] }>(`/insights/dispositions?days_back=${daysBack}`),
  callTimes: (daysBack = 7) =>
    fetchJSON<{ hours: CallHour[] }>(`/insights/call-times?days_back=${daysBack}`),
  salesTrend: (daysBack = 7) =>
    fetchJSON<{ days: SalesDay[] }>(`/insights/sales-trend?days_back=${daysBack}`),
  weekly: (lang: "es" | "en" = "es") =>
    fetchJSON<WeeklyInsight>(`/insights/weekly?lang=${lang}`),
  campaigns: () => fetchJSON<{ campaigns: Campaign[] }>(`/campaigns`),
  campaignPerformance: (daysBack = 30) =>
    fetchJSON<{ campaigns: CampaignStat[] }>(`/campaigns/performance?days_back=${daysBack}`),
  agentMomentum: (weeksBack = 4) =>
    fetchJSON<{ agents: AgentMomentum[] }>(`/agents/momentum?weeks_back=${weeksBack}`),
  leadSources: (daysBack = 30) =>
    fetchJSON<{ sources: SourceROI[] }>(`/insights/sources?days_back=${daysBack}`),
  forecast: () => fetchJSON<PipelineForecast>(`/insights/forecast`),
  contactVelocity: (daysBack = 7) =>
    fetchJSON<ContactVelocity>(`/insights/contact-velocity?days_back=${daysBack}`),
  agentCampaignMatrix: (daysBack = 30) =>
    fetchJSON<{ matrix: AgentCampaignCell[] }>(`/agents/by-campaign?days_back=${daysBack}`),
  alerts: (lang: "es" | "en" = "es") =>
    fetchJSON<{ lang: string; count: number; alerts: Alert[] }>(`/insights/alerts?lang=${lang}`, 300),
};
