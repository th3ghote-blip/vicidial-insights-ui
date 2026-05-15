import { api } from "@/lib/api";
import Dashboard from "@/app/components/Dashboard";

// Server component — fetches all dashboard data with the bearer token
// before rendering. Token never reaches the browser.
export default async function HomePage() {
  const [health, leadsRes, agentsRes, disposRes, weekly] = await Promise.all([
    api.health(),
    api.leads(40, 30),
    api.agents(7),
    api.dispositions(7),
    api.weekly("es"),
  ]);

  return (
    <Dashboard
      initialLang="es"
      health={health}
      leads={leadsRes.leads}
      agents={agentsRes.agents}
      dispos={disposRes.dispositions}
      weekly={weekly}
    />
  );
}

export const revalidate = 60;
