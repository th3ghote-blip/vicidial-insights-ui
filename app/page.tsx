import { api } from "@/lib/api";
import Dashboard from "@/app/components/Dashboard";

export default async function HomePage() {
  const [health, leadsRes, agentsRes, disposRes, callTimesRes, salesRes, weekly] = await Promise.all([
    api.health(),
    api.leads(40, 30),
    api.agents(7),
    api.dispositions(7),
    api.callTimes(7),
    api.salesTrend(7),
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
