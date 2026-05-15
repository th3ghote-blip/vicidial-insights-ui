import { api } from "@/lib/api";
import Dashboard from "@/app/components/Dashboard";

export default async function HomePage() {
  const [health, leadsRes, agentsRes, disposRes, callTimesRes, salesRes, weekly] = await Promise.all([
    api.health(),
    api.leads(100, 30),
    api.agents(30),
    api.dispositions(30),
    api.callTimes(30),
    api.salesTrend(30),
    api.weekly("es"),
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
    />
  );
}

export const revalidate = 60;
