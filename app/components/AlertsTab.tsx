"use client";

import { useState } from "react";
import {
  AlertTriangle, AlertCircle, Info, TrendingUp, X, Sparkles,
  Users, Target, Flame, Activity, ChevronRight,
} from "lucide-react";
import type { Alert } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

const SEVERITY_META: Record<Alert["severity"], {
  border: string; bg: string; iconColor: string; icon: React.ElementType;
  labelEs: string; labelEn: string;
}> = {
  high:     { border: "border-red-500/30",                    bg: "bg-red-50 dark:bg-red-950/20",         iconColor: "text-red-600 dark:text-red-400",         icon: AlertTriangle, labelEs: "URGENTE", labelEn: "URGENT" },
  medium:   { border: "border-amber-500/30",                  bg: "bg-amber-50 dark:bg-amber-950/20",     iconColor: "text-amber-600 dark:text-amber-400",     icon: AlertCircle,   labelEs: "AVISO",   labelEn: "WATCH"  },
  low:      { border: "border-zinc-200 dark:border-zinc-700", bg: "bg-zinc-50 dark:bg-zinc-900/40",       iconColor: "text-zinc-600 dark:text-zinc-400",       icon: Info,          labelEs: "INFO",    labelEn: "INFO"   },
  positive: { border: "border-emerald-500/30",                bg: "bg-emerald-50 dark:bg-emerald-950/20", iconColor: "text-emerald-600 dark:text-emerald-400", icon: TrendingUp,    labelEs: "BUENO",   labelEn: "GOOD"   },
};

const TYPE_META: Record<Alert["type"], { icon: React.ElementType; es: string; en: string }> = {
  agent_trend:      { icon: Users,    es: "Agente",     en: "Agent"    },
  lead_source:      { icon: Target,   es: "Fuente",     en: "Source"   },
  forecast:         { icon: TrendingUp, es: "Pronóstico", en: "Forecast" },
  contact_velocity: { icon: Activity, es: "Velocidad",  en: "Velocity" },
  campaign:         { icon: Flame,    es: "Campaña",    en: "Campaign" },
  dialer:           { icon: Sparkles, es: "Marcador",   en: "Dialer"   },
};

type Filter = "all" | Alert["severity"];

export default function AlertsTab({
  lang, alerts, onJump,
}: { lang: Lang; alerts: Alert[]; onJump?: (tab: "leads"|"agents"|"insights") => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const sortOrder: Record<Alert["severity"], number> = { high: 0, medium: 1, positive: 2, low: 3 };
  const sorted = [...alerts]
    .map((a, i) => ({ ...a, _idx: i }))
    .sort((a, b) => sortOrder[a.severity] - sortOrder[b.severity]);

  const visible = sorted
    .filter(a => !dismissed.has(a._idx))
    .filter(a => filter === "all" || a.severity === filter);

  const counts = {
    all: alerts.length - dismissed.size,
    high: alerts.filter((a, i) => a.severity === "high" && !dismissed.has(i)).length,
    medium: alerts.filter((a, i) => a.severity === "medium" && !dismissed.has(i)).length,
    positive: alerts.filter((a, i) => a.severity === "positive" && !dismissed.has(i)).length,
  };

  const filterPills: { key: Filter; label: { es: string; en: string }; color: string; count: number }[] = [
    { key: "all",      label: { es: "Todas",    en: "All"     }, color: "zinc",    count: counts.all },
    { key: "high",     label: { es: "Urgentes", en: "Urgent"  }, color: "red",     count: counts.high },
    { key: "medium",   label: { es: "Avisos",   en: "Watch"   }, color: "amber",   count: counts.medium },
    { key: "positive", label: { es: "Buenas",   en: "Good"    }, color: "emerald", count: counts.positive },
  ];

  const jumpTarget = (type: Alert["type"]): "leads"|"agents"|"insights" | undefined => {
    if (type === "agent_trend") return "agents";
    if (type === "lead_source" || type === "campaign" || type === "forecast" || type === "contact_velocity") return "insights";
    return undefined;
  };

  return (
    <section className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {lang === "es" ? "Alertas" : "Alerts"}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          {lang === "es"
            ? `${alerts.length} alertas generadas por IA · cacheado 5 min`
            : `${alerts.length} AI-generated alerts · cached 5 min`}
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filterPills.map(p => {
          const active = filter === p.key;
          const colors: Record<string, { active: string; idle: string }> = {
            zinc:    { active: "bg-zinc-700 text-white border-zinc-600",          idle: "text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200" },
            red:     { active: "bg-red-500/20 text-red-200 border-red-500/40",    idle: "text-zinc-400 border-zinc-800 hover:border-red-500/30 hover:text-red-300" },
            amber:   { active: "bg-amber-500/20 text-amber-200 border-amber-500/40", idle: "text-zinc-400 border-zinc-800 hover:border-amber-500/30 hover:text-amber-300" },
            emerald: { active: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40", idle: "text-zinc-400 border-zinc-800 hover:border-emerald-500/30 hover:text-emerald-300" },
          };
          const c = colors[p.color];
          return (
            <button
              key={p.key}
              onClick={() => setFilter(p.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? c.active : c.idle}`}
            >
              <span>{p.label[lang]}</span>
              <span className="font-mono opacity-70">{p.count}</span>
            </button>
          );
        })}
      </div>

      {/* Alerts list */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-12 text-center">
          <Sparkles className="h-8 w-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {dismissed.size > 0
              ? (lang === "es" ? "Todas las alertas atendidas" : "All alerts handled")
              : (lang === "es" ? "Sin alertas. Todo en orden." : "No alerts. All clear.")}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((a) => {
            const meta = SEVERITY_META[a.severity];
            const SevIcon = meta.icon;
            const typeMeta = TYPE_META[a.type] ?? TYPE_META.dialer;
            const TypeIcon = typeMeta.icon;
            const target = jumpTarget(a.type);

            return (
              <div
                key={a._idx}
                className={`group relative rounded-xl border ${meta.border} ${meta.bg} p-4 hover:shadow-lg hover:shadow-black/20 transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg bg-white dark:bg-zinc-900/60 border ${meta.border} flex items-center justify-center shrink-0`}>
                    <SevIcon className={`h-4 w-4 ${meta.iconColor}`} strokeWidth={2.2} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold tracking-wider ${meta.iconColor}`}>
                        {lang === "en" ? meta.labelEn : meta.labelEs}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                        <TypeIcon className="h-3 w-3" strokeWidth={2.2} />
                        {typeMeta[lang]}
                      </span>
                    </div>

                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{a.title}</h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{a.message}</p>

                    {a.action && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <ChevronRight className="h-3 w-3 text-zinc-600" />
                        <span>{a.action}</span>
                      </div>
                    )}

                    {target && onJump && (
                      <button
                        onClick={() => onJump(target)}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-emerald-300 transition-colors"
                      >
                        {lang === "es" ? "Ver detalles" : "View details"}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => setDismissed(new Set([...dismissed, a._idx]))}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    title={lang === "es" ? "Descartar" : "Dismiss"}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
