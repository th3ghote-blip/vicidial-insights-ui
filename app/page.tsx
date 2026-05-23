import { api } from "@/lib/api";
import type {
  Health, WeeklyInsight, PipelineForecast, ContactVelocity,
} from "@/lib/api";
import Dashboard from "@/app/components/Dashboard";
import {
  mockDayHourHeatmap, mockHourlyContact, mockAgentHourlyPerf, mockAgentDispositions,
  mockLoginPatterns, mockCampaignHealth, mockAttemptROI, mockCallbackStats,
  mockStaffingHours, mockDayOfWeekPerf, mockDialerHealth, mockPaceToTarget,
} from "@/lib/mock-data";

type SearchParams = Promise<{ range?: string; startDate?: string; endDate?: string }>;
type RangeType = "today" | 7 | 30 | 90 | "custom";

// ---------- Safe fallbacks ----------------------------------------------------

const FALLBACK_HEALTH: Health = {
  status: "unavailable",
  mock_mode: false,
  auth_configured: false,
  supabase_configured: false,
  anthropic_configured: false,
  dispo_sale: "SALE",
  dispo_callback: "CBCK",
};

const FALLBACK_WEEKLY: WeeklyInsight = { lang: "es", summary: "", top_leads_count: 0 };

const FALLBACK_FORECAST: PipelineForecast = {
  callbacks_scheduled_next_7d: 0,
  historical_callback_conversion: 0,
  expected_callback_sales: 0,
  fresh_leads_next_7d: 0,
  expected_fresh_sales: 0,
  expected_total_sales: 0,
  last_week_sales: 0,
  delta_vs_last_week_pct: 0,
  funnel: { new: 0, contacted: 0, engaged: 0, callback: 0, sold_7d: 0 },
};

const FALLBACK_VELOCITY: ContactVelocity = {
  avg_hours_to_first_contact: 0,
  median_hours_to_first_contact: 0,
  leads_stuck_no_contact: 0,
  stuck_threshold_hours: 24,
  conversion_by_age: [],
  alert: false,
};

// ---------- Unwrap helper -----------------------------------------------------

function ok<T>(result: PromiseSettledResult<T>, fallback: T): T {
  if (result.status === "fulfilled") return result.value;
  console.error("[page] API call failed:", result.reason);
  return fallback;
}

// ---------- Page --------------------------------------------------------------

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  let daysBack = 30;
  let rangeLabel: RangeType = 30;

  if (params.range === "today") {
    daysBack = 1;
    rangeLabel = "today";
  } else if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end   = new Date(params.endDate);
    daysBack    = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    rangeLabel  = "custom";
  } else {
    const raw = parseInt(params.range || "30", 10);
    daysBack   = raw === 7 || raw === 90 ? raw : 30;
    rangeLabel = daysBack as 7 | 30 | 90;
  }
  const range       = daysBack;
  const momentumDays = rangeLabel === "today" ? 7 : range;

  // Fire all API calls in parallel — never let one failure kill the page
  const [
    rHealth, rLeads, rAgents, rDispos, rCallTimes, rSales,
    rWeekly, rCampaigns, rMomentum, rMomentum90, rSources,
    rForecast, rVelocity, rAlerts, rMatrix,
  ] = await Promise.allSettled([
    api.health(),
    api.leads(100, range),
    api.agents(range),
    api.dispositions(range),
    api.callTimes(range),
    api.salesTrend(range),
    api.weekly("es"),
    api.campaignPerformance(range),
    api.agentMomentum(momentumDays),
    api.agentMomentum(91),
    api.leadSources(range),
    api.forecast(),
    api.contactVelocity(7),
    api.alerts("es"),
    api.agentCampaignMatrix(range),
  ]);

  const health       = ok(rHealth,    FALLBACK_HEALTH);
  const leadsRes     = ok(rLeads,     { count: 0, returned: 0, leads: [] });
  const agentsRes    = ok(rAgents,    { agents: [] });
  const disposRes    = ok(rDispos,    { dispositions: [] });
  const callTimesRes = ok(rCallTimes, { hours: [] });
  const salesRes     = ok(rSales,     { days: [] });
  const weekly       = ok(rWeekly,    FALLBACK_WEEKLY);
  const campaignsRes = ok(rCampaigns, { campaigns: [] });
  const momentumRes  = ok(rMomentum,  { agents: [] });
  const momentum90Res = ok(rMomentum90, { agents: [] });
  const sourcesRes   = ok(rSources,   { sources: [] });
  const forecast     = ok(rForecast,  FALLBACK_FORECAST);
  const velocity     = ok(rVelocity,  FALLBACK_VELOCITY);
  const alertsRes    = ok(rAlerts,    { lang: "es", count: 0, alerts: [] });
  const matrixRes    = ok(rMatrix,    { matrix: [] });

  // ── Generate mock data for new full-suite sections (Railway endpoints TBD) ──
  const agentsList   = agentsRes.agents;
  const campsList    = campaignsRes.campaigns;

  const dayHourHeatmap    = mockDayHourHeatmap();
  const hourlyContact     = mockHourlyContact();
  const agentHourlyPerf   = mockAgentHourlyPerf(agentsList);
  const agentDispositions = mockAgentDispositions(agentsList);
  const loginPatterns     = mockLoginPatterns(agentsList);
  const campaignHealth    = mockCampaignHealth(campsList);
  const attemptROI        = mockAttemptROI();
  const callbackStats     = mockCallbackStats(agentsList);
  const staffingHours     = mockStaffingHours(agentsList);
  const dayOfWeekPerf     = mockDayOfWeekPerf();
  const dialerHealth      = mockDialerHealth();
  const paceToTarget      = mockPaceToTarget(agentsList);

  return (
    <Dashboard
      initialLang="es"
      initialRange={range}
      initialRangeLabel={rangeLabel}
      initialStartDate={params.startDate}
      initialEndDate={params.endDate}
      health={health}
      leads={leadsRes.leads}
      agents={agentsRes.agents}
      dispos={disposRes.dispositions}
      callTimes={callTimesRes.hours}
      salesTrend={salesRes.days}
      weekly={weekly}
      campaigns={campaignsRes.campaigns}
      momentum={momentumRes.agents}
      momentum90={momentum90Res.agents}
      sources={sourcesRes.sources}
      forecast={forecast}
      velocity={velocity}
      alerts={alertsRes.alerts}
      matrix={matrixRes.matrix}
      // New full-suite data
      dayHourHeatmap={dayHourHeatmap}
      hourlyContact={hourlyContact}
      agentHourlyPerf={agentHourlyPerf}
      agentDispositions={agentDispositions}
      loginPatterns={loginPatterns}
      campaignHealth={campaignHealth}
      attemptROI={attemptROI}
      callbackStats={callbackStats}
      staffingHours={staffingHours}
      dayOfWeekPerf={dayOfWeekPerf}
      dialerHealth={dialerHealth}
      paceToTarget={paceToTarget}
    />
  );
}

export const revalidate = 60;
