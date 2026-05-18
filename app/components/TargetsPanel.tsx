"use client";

import { useState, useEffect } from "react";
import { X, Target, RotateCcw } from "lucide-react";
import { type Targets, DEFAULT_TARGETS, saveTargets } from "@/lib/targets";
import type { Lang } from "@/lib/i18n";

// ── Field definitions ─────────────────────────────────────────────────────────

type FieldDef = {
  key: keyof Targets;
  labelEs: string;
  labelEn: string;
  unit: "%" | "s" | "#";
  // stored as 0-1 for %, raw number for s/#
  // input is always shown in "human" units (% → multiply by 100)
  placeholder: string;
  hint?: { es: string; en: string };
};

const FIELDS: FieldDef[] = [
  {
    key: "close_rate",
    labelEs: "Tasa de cierre",
    labelEn: "Close rate",
    unit: "%",
    placeholder: "15",
    hint: { es: "% de llamadas que terminan en venta", en: "% of calls that convert to a sale" },
  },
  {
    key: "sales",
    labelEs: "Ventas (período)",
    labelEn: "Sales (period)",
    unit: "#",
    placeholder: "50",
    hint: { es: "Ventas totales en el período seleccionado", en: "Total sales in the selected period" },
  },
  {
    key: "calls",
    labelEs: "Llamadas (período)",
    labelEn: "Calls (period)",
    unit: "#",
    placeholder: "200",
  },
  {
    key: "dials_per_hour",
    labelEs: "Marcaciones / hora",
    labelEn: "Dials / hour",
    unit: "#",
    placeholder: "20",
  },
  {
    key: "avg_talk_sec",
    labelEs: "Tiempo promedio (seg)",
    labelEn: "Avg talk time (sec)",
    unit: "s",
    placeholder: "180",
    hint: { es: "Segundos por llamada (p.ej. 180 = 3 minutos)", en: "Seconds per call (e.g. 180 = 3 minutes)" },
  },
  {
    key: "utilization",
    labelEs: "Utilización",
    labelEn: "Utilization",
    unit: "%",
    placeholder: "70",
    hint: { es: "% del tiempo de login en llamada activa", en: "% of login time spent on active calls" },
  },
  {
    key: "callback_conv",
    labelEs: "Conversión callbacks",
    labelEn: "Callback conversion",
    unit: "%",
    placeholder: "30",
  },
];

// Convert stored value to display string
function toDisplay(key: keyof Targets, stored: number | null): string {
  if (stored === null) return "";
  const field = FIELDS.find(f => f.key === key)!;
  if (field.unit === "%") return (stored * 100).toFixed(0);
  return stored.toString();
}

// Convert display string to stored value (null if empty/invalid)
function fromDisplay(key: keyof Targets, input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const n = parseFloat(trimmed);
  if (isNaN(n) || n < 0) return null;
  const field = FIELDS.find(f => f.key === key)!;
  if (field.unit === "%") return Math.min(n / 100, 1);
  return n;
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function TargetsPanel({
  open, onClose, targets, onChange, lang,
}: {
  open: boolean;
  onClose: () => void;
  targets: Targets;
  onChange: (t: Targets) => void;
  lang: Lang;
}) {
  // Local draft — only commit on change (auto-save)
  const [draft, setDraft] = useState<Record<string, string>>({});

  // Sync draft when targets change from outside (e.g. reset)
  useEffect(() => {
    const d: Record<string, string> = {};
    for (const f of FIELDS) d[f.key] = toDisplay(f.key, targets[f.key]);
    setDraft(d);
  }, [targets]);

  const handleChange = (key: keyof Targets, raw: string) => {
    const next = { ...draft, [key]: raw };
    setDraft(next);
    const stored = fromDisplay(key, raw);
    const nextTargets = { ...targets, [key]: stored };
    onChange(nextTargets);
    saveTargets(nextTargets);
  };

  const handleReset = () => {
    onChange(DEFAULT_TARGETS);
    saveTargets(DEFAULT_TARGETS);
  };

  const activeCount = FIELDS.filter(f => targets[f.key] !== null).length;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {lang === "es" ? "Objetivos KPI" : "KPI Targets"}
              </div>
              <div className="text-[11px] text-zinc-500">
                {activeCount > 0
                  ? (lang === "es" ? `${activeCount} objetivo${activeCount !== 1 ? "s" : ""} activo${activeCount !== 1 ? "s" : ""}` : `${activeCount} active target${activeCount !== 1 ? "s" : ""}`)
                  : (lang === "es" ? "Sin objetivos definidos" : "No targets set")}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-xs text-zinc-500 leading-relaxed">
            {lang === "es"
              ? "Define objetivos para ver si cada agente está por encima o por debajo. Se guardan en este navegador."
              : "Set targets to see which agents are above or below. Saved locally in this browser."}
          </p>

          {FIELDS.map(f => (
            <div key={f.key} className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {lang === "es" ? f.labelEs : f.labelEn}
                {targets[f.key] !== null && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                    {lang === "es" ? "activo" : "active"}
                  </span>
                )}
              </label>

              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step={f.unit === "%" ? "0.5" : "1"}
                  value={draft[f.key] ?? ""}
                  onChange={e => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full pr-10 pl-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="absolute right-3 text-xs text-zinc-500 font-mono pointer-events-none">
                  {f.unit}
                </span>
                {targets[f.key] !== null && (
                  <button
                    onClick={() => handleChange(f.key, "")}
                    className="absolute right-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    title={lang === "es" ? "Borrar" : "Clear"}
                  >
                    <X className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {f.hint && (
                <p className="text-[11px] text-zinc-500">{f.hint[lang]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={handleReset}
            disabled={activeCount === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
            {lang === "es" ? "Borrar todos los objetivos" : "Clear all targets"}
          </button>
        </div>
      </div>
    </>
  );
}
