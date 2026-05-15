import { api } from "@/lib/api";
import Dashboard from "@/app/components/Dashboard";

type SearchParams = Promise<{ range?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = parseInt(params.range || "30", 10);
  const range: 7 | 30 | 90 = raw === 7 || raw === 90 ? raw : 30;

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
    api.agentMomentum(4),
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
