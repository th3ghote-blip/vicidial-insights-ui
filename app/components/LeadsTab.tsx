"use client";

import { useMemo, useState } from "react";
import { Search, X, Phone, MapPin, Calendar, Clock, Tag, Globe2, Users } from "lucide-react";
import type { Lead } from "@/lib/api";
import { t, type Lang, recLabel, recColor, scoreColor, fmtRelative } from "@/lib/i18n";

type RecFilter = "all" | Lead["recommendation"];

export default function LeadsTab({ lang, leads }: { lang: Lang; leads: Lead[] }) {
  const tr = t[lang];
  const [selected, setSelected] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [recFilter, setRecFilter] = useState<RecFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter(l => {
      if (recFilter !== "all" && l.recommendation !== recFilter) return false;
      if (!q) return true;
      return (
        String(l.lead_id).includes(q) ||
        l.phone_number?.includes(q) ||
        l.first_name?.toLowerCase().includes(q) ||
        l.last_name?.toLowerCase().includes(q) ||
        l.state?.toLowerCase().includes(q) ||
        l.campaign_id?.toLowerCase().includes(q)
      );
    });
  }, [leads, search, recFilter]);

  const recCounts = useMemo(() => ({
    all: leads.length,
    call_now:    leads.filter(l => l.recommendation === "call_now").length,
    route_closer:leads.filter(l => l.recommendation === "route_closer").length,
    callback_due:leads.filter(l => l.recommendation === "callback_due").length,
    rest:        leads.filter(l => l.recommendation === "rest").length,
    dnc_review:  leads.filter(l => l.recommendation === "dnc_review").length,
  }), [leads]);

  const recPills: { key: RecFilter; color: string }[] = [
    { key: "all",          color: "zinc"    },
    { key: "call_now",     color: "emerald" },
    { key: "route_closer", color: "sky"     },
    { key: "callback_due", color: "amber"   },
    { key: "dnc_review",   color: "red"     },
  ];

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{tr.leadsHeader}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          {tr.leadsSub} · {filtered.length} {lang === "es" ? "de" : "of"} {leads.length}
        </p>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === "es" ? "Buscar por nombre, ID, teléfono…" : "Search name, ID, phone…"}
            className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {recPills.map(p => {
            const active = recFilter === p.key;
            const count = recCounts[p.key];
            return (
              <button
                key={p.key}
                onClick={() => setRecFilter(p.key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                  active
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
                    : "text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-300"
                }`}
              >
                <span>{p.key === "all" ? (lang === "es" ? "Todos" : "All") : recLabel(lang, p.key)}</span>
                <span className="font-mono opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-4">
        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900/60 text-zinc-500">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{tr.leadCol.id}</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{lang === "es" ? "Nombre" : "Name"}</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{tr.leadCol.state}</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{tr.leadCol.called}</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{tr.leadCol.lastDispo}</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{tr.leadCol.score}</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">{tr.leadCol.rec}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filtered.slice(0, 60).map(l => {
                  const isSel = selected?.lead_id === l.lead_id;
                  return (
                    <tr
                      key={l.lead_id}
                      onClick={() => setSelected(l)}
                      className={`cursor-pointer transition-colors ${isSel ? "bg-zinc-100 dark:bg-zinc-800/60" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60"}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-zinc-500 text-xs">{l.lead_id}</td>
                      <td className="px-4 py-2.5 text-zinc-800 dark:text-zinc-200">
                        {l.first_name ? `${l.first_name} ${l.last_name}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">{l.state}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{l.called_count}</td>
                      <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{l.last_call_dispo || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-mono ${scoreColor(l.score)}`}>
                          {l.score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-md border ${recColor(l.recommendation)}`}>
                          {recLabel(lang, l.recommendation)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500">
                    {lang === "es" ? "Sin resultados" : "No results"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <aside className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 h-fit lg:sticky lg:top-32 shadow-sm dark:shadow-none">
          {selected ? <LeadDetail lead={selected} lang={lang} onClose={() => setSelected(null)} /> : (
            <div className="text-sm text-zinc-500 py-12 text-center">
              <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              {lang === "es" ? "Selecciona un lead para ver el detalle" : "Select a lead to see details"}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function LeadDetail({ lead, lang, onClose }: { lead: Lead; lang: Lang; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            {lang === "es" ? "Lead" : "Lead"} #{lead.lead_id}
          </div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {lead.first_name ? `${lead.first_name} ${lead.last_name}` : `#${lead.lead_id}`}
          </div>
        </div>
        <button onClick={onClose} className="h-7 w-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`px-2.5 py-1 rounded-md border text-sm font-mono ${scoreColor(lead.score)}`}>
          {lang === "es" ? "Score" : "Score"} {lead.score}
        </span>
        <span className={`px-2.5 py-1 rounded-md border text-xs ${recColor(lead.recommendation)}`}>
          {recLabel(lang, lead.recommendation)}
        </span>
      </div>

      <div className="space-y-2.5 text-sm pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <DetailRow icon={Phone}    label={lang === "es" ? "Teléfono" : "Phone"} value={lead.phone_number} mono />
        <DetailRow icon={MapPin}   label={lang === "es" ? "Ubicación" : "Location"} value={`${lead.state} ${lead.postal_code}`} />
        <DetailRow icon={Tag}      label={lang === "es" ? "Campaña" : "Campaign"} value={lead.campaign_id} />
        {lead.source && <DetailRow icon={Globe2} label={lang === "es" ? "Fuente" : "Source"} value={lead.source.replace(/_/g, " ")} />}
        {lead.language && <DetailRow icon={Globe2} label={lang === "es" ? "Idioma" : "Language"} value={lead.language === "es" ? "Español" : "English"} />}
        <DetailRow icon={Phone}    label={lang === "es" ? "Intentos" : "Attempts"} value={lead.called_count.toString()} />
        <DetailRow icon={Tag}      label={lang === "es" ? "Última disp." : "Last dispo"} value={lead.last_call_dispo || "—"} mono />
        <DetailRow icon={Clock}    label={lang === "es" ? "Última duración" : "Last duration"} value={`${lead.last_call_duration_sec}s`} />
        <DetailRow icon={Clock}    label={lang === "es" ? "Total en línea" : "Total talk time"} value={`${lead.total_call_seconds}s`} />
        <DetailRow icon={Calendar} label={lang === "es" ? "Última llamada" : "Last call"} value={fmtRelative(lead.last_local_call_time, lang)} />
      </div>

      {lead.reasons.length > 0 && (
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">
            {lang === "es" ? "Por qué este score" : "Why this score"}
          </div>
          <ul className="space-y-1.5">
            {lead.reasons.map((r, i) => (
              <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2 items-start">
                <span className="text-emerald-400 mt-1.5 leading-none">·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="flex items-center gap-2 text-zinc-500 text-xs">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </span>
      <span className={`text-zinc-800 dark:text-zinc-200 text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
