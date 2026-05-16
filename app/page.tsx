import { api } from "@/lib/api";
import Dashboard from "@/app/components/Dashboard";

type SearchParams = Promise<{ range?: string; startDate?: string; endDate?: string }>;
type RangeType = "today" | 7 | 30 | 90 | "custom";

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  let daysBack = 30;
  let rangeLabel: RangeType = 30;

  if (params.range === "today") {
    daysBack = 1;
    rangeLabel = "today";
  } else if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    daysBack = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    rangeLabel = "custom";
  } else {
    const raw = parseInt(params.range || "30", 10);
    daysBack = raw === 7 || raw === 90 ? raw : 30;
    rangeLabel = daysBack as 7 | 30 | 90;
  }
  const range = daysBack;

  const [
    health, leadsRes, agentsRes, disposRes, callTimesRes, salesRes,
    weekly, campaignsRes, momentumRes, sourcesRes, forecast, velocity, alertsRes, matrixRes,
  ] = await Promise.all([
    api.health(),
    api.leads(100, range),
    api.agents(range),
    api.dispositions(range),
    api.callTimes(range),
    api.salesTrend(range),
    api.weekly("es"),
    api.campaignPerformance(range),
    api.agentMomentum(rangeLabel === "today" ? 7 : range),
    api.leadSources(range),
    api.forecast(),
    api.contactVelocity(7),
    api.alerts("es"),
    api.agentCampaignMatrix(range),
  ]);

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
      sources={sourcesRes.sources}
      forecast={forecast}
      velocity={velocity}
      alerts={alertsRes.alerts}
      matrix={matrixRes.matrix}
    />
  );
}

export const revalidate = 60;
