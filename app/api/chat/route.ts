/**
 * Chat route — 3-tier fallback strategy:
 *
 * 1. Railway backend  → full live data + Haiku (~$0.001/call)
 * 2. Direct Anthropic → pull data via lib/api.ts, call Haiku here
 *    (kicks in when Railway is down; needs ANTHROPIC_API_KEY in Vercel env)
 * 3. Demo mode        → honest mock response with disclaimer
 *
 * Token never leaves the server — all tiers stay in Route Handler.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { api } from "@/lib/api";
import { rateLimit, getIp } from "@/lib/rate-limit";

const API_BASE  = process.env.VICIDIAL_API_BASE!;
const API_TOKEN = process.env.VICIDIAL_API_TOKEN!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ── Tier 1: try Railway backend ──────────────────────────────────────────────

async function tryRailway(body: unknown): Promise<string | null> {
  try {
    const upstream = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(body),
    });
    if (!upstream.ok) return null;
    const data = await upstream.json();
    return data.answer ?? null;
  } catch {
    return null;
  }
}

// ── Tier 2: call Anthropic directly with data from lib/api.ts ────────────────

const SYSTEM_ES = `Eres un asistente analítico de call center con acceso en tiempo real a los datos de rendimiento del equipo.
Responde preguntas sobre agentes, campañas, leads, tendencias y métricas.
Sé directo y cita números exactos de los datos. Máximo 3-4 frases por respuesta salvo que se pida más detalle.
Nunca inventes datos que no estén en el contexto.

Datos actuales:
{data}`;

const SYSTEM_EN = `You are a call centre analytics assistant with real-time access to this Vicidial operation's performance data.
Answer questions about agents, campaigns, leads, trends and metrics.
Be direct, cite exact numbers from the data. Max 3-4 sentences per answer unless more detail is requested.
Never invent data not present in the context.

Current data:
{data}`;

async function tryDirect(
  question: string,
  history: { role: string; content: string }[],
  lang: string,
): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null;

  try {
    // Fetch data in parallel; fall back gracefully if any call fails
    const [agentsRes, campaignsRes, momentumRes] = await Promise.allSettled([
      api.agents(7),
      api.campaignPerformance(30),
      api.agentMomentum(28),
    ]);

    const agents   = agentsRes.status   === "fulfilled" ? agentsRes.value.agents       : [];
    const campaigns = campaignsRes.status === "fulfilled" ? campaignsRes.value.campaigns : [];
    const momentum  = momentumRes.status  === "fulfilled" ? momentumRes.value.agents    : [];

    const lines: string[] = ["AGENTS (last 7 days):"];
    for (const a of agents.slice(0, 12)) {
      lines.push(`- ${a.full_name}: ${a.sales} sales, ${Math.round(a.close_rate * 1000) / 10}% close rate, ${a.calls_handled} calls, ${a.dials_per_hour.toFixed(1)} dials/hr`);
    }
    lines.push("\nCAMPAIGNS (last 30 days):");
    for (const c of campaigns.slice(0, 8)) {
      lines.push(`- ${c.campaign_name}: ${c.total_sales} sales, ${Math.round(c.conversion_rate * 1000) / 10}% conv, ${c.active_agents} agents`);
    }
    lines.push("\nAGENT MOMENTUM:");
    for (const m of momentum.slice(0, 10)) {
      lines.push(`- ${m.full_name}: ${m.status}, change ${m.change_pct > 0 ? "+" : ""}${m.change_pct.toFixed(1)}%, now ${Math.round(m.current_close_rate * 1000) / 10}%`);
    }

    const dataStr = lines.join("\n");
    const systemTpl = lang === "en" ? SYSTEM_EN : SYSTEM_ES;
    const system = systemTpl.replace("{data}", dataStr);

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system,
      messages: [
        ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: question },
      ],
    });

    return (msg.content[0] as { type: string; text: string }).text.trim();
  } catch (err) {
    console.error("[chat/direct] Anthropic call failed:", err);
    return null;
  }
}

// ── Tier 3: honest demo fallback ─────────────────────────────────────────────

const DEMO_ES = `⚠️ *Respuesta de ejemplo* — el servidor de análisis no está disponible en este momento.

En condiciones normales respondería con datos reales. Ejemplo de respuesta típica: "Esta semana el mejor cierre fue María García con 23% (14 ventas de 61 llamadas). Le sigue Pedro Ramos con 21%. Te recomiendo asignarles los leads premium del batch de mañana."

Intenta de nuevo en unos minutos o verifica la conexión con Railway.`;

const DEMO_EN = `⚠️ *Example response* — the analytics server is currently unavailable.

In normal operation I would answer with live data. Typical response example: "This week's top closer was Maria Garcia at 23% (14 sales from 61 calls), followed by Pedro Ramos at 21%. I'd recommend routing tomorrow's premium lead batch to both of them."

Try again in a few minutes or check the Railway connection.`;

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate-limit: 20 requests per minute per IP
  const ip = getIp(req);
  if (!rateLimit(`${ip}:chat`, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests — slow down" }, { status: 429 });
  }

  const body = await req.json();
  const { question, lang = "es", history = [] } = body as {
    question: string;
    lang?: string;
    history?: { role: string; content: string }[];
  };

  // Input validation
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (question.length > 2000) {
    return NextResponse.json({ error: "Question too long (max 2000 chars)" }, { status: 400 });
  }

  // Sanitize history: last 10 entries, cap each entry to 1000 chars
  const safeHistory = Array.isArray(history)
    ? history.slice(-10).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content.slice(0, 1000) : "",
      }))
    : [];

  // Tier 1 — Railway (pass original body so backend gets full context)
  const railwayBody = { question, lang, history: safeHistory };
  const railwayAnswer = await tryRailway(railwayBody);
  if (railwayAnswer) return NextResponse.json({ answer: railwayAnswer });

  // Tier 2 — direct Anthropic
  const directAnswer = await tryDirect(question, safeHistory, lang);
  if (directAnswer) return NextResponse.json({ answer: directAnswer });

  // Tier 3 — demo note
  return NextResponse.json({ answer: lang === "en" ? DEMO_EN : DEMO_ES });
}
