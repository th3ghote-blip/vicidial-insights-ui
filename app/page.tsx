import { api } from "@/lib/api";
import Dashboard from "@/app/components/Dashboard";

export default async function HomePage() {
  const [
    health, leadsRes, agentsRes, disposRes, callTimesRes, salesRes,
    weekly, campaignsRes, momentumRes, sourcesRes, forecast, velocity, alertsRes,
  ] = await Promise.all([
    api.health(),
    api.leads(100, 30),
    api.agents(30),
    api.dispositions(30),
    api.callTimes(30),
    api.salesTrend(30),
    api.weekly("es"),
    api.campaignPerformance(30),
    api.agentMomentum(4),
    api.leadSources(30),
    api.forecast(),
    api.contactVelocity(7),
    api.alerts("es"),
  ]);

  return (
    <Dashboard
      initialLang="es"
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
    />
  );
}

export const revalidate = 60;
