"use client";

import { useState } from "react";
import type { Lead } from "@/lib/api";
import { t, type Lang, recLabel, recColor, scoreColor, fmtRelative } from "@/lib/i18n";

export default function LeadsTab({ lang, leads }: { lang: Lang; leads: Lead[] }) {
  const tr = t[lang];
  const [selected, setSelected] = useState<Lead | null>(null);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">{tr.leadsHeader}</h2>
        <p className="text-sm text-zinc-400">{tr.leadsSub} · {leads.length} totales</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-4">
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-2 font-medium">{tr.leadCol.id}</th>
                <th className="text-left px-4 py-2 font-medium">{tr.leadCol.state}</th>
                <th className="text-left px-4 py-2 font-medium">{tr.leadCol.called}</th>
                <th className="text-left px-4 py-2 font-medium">{tr.leadCol.lastDispo}</th>
                <th className="text-left px-4 py-2 font-medium">{tr.leadCol.score}</th>
                <th className="text-left px-4 py-2 font-medium">{tr.leadCol.rec}</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 60).map(l => (
                <tr
                  key={l.lead_id}
                  onClick={() => setSelected(l)}
                  className={`border-t border-zinc-800 cursor-pointer transition-colors ${selected?.lead_id === l.lead_id ? "bg-zinc-800/60" : "hover:bg-zinc-900/50"}`}
                >
                  <td className="px-4 py-2 font-mono text-zinc-400">{l.lead_id}</td>
                  <td className="px-4 py-2">{l.first_name ? `${l.first_name} ${l.last_name}` : l.state}</td>
                  <td className="px-4 py-2">{l.called_count}</td>
                  <td className="px-4 py-2 text-zinc-300">{l.last_call_dispo || "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono ${scoreColor(l.score)}`}>
                      {l.score}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${recColor(l.recommendation)}`}>
                      {recLabel(lang, l.recommendation)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        <aside className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 h-fit lg:sticky lg:top-32">
          {selected ? <LeadDetail lead={selected} lang={lang} onClose={() => setSelected(null)} /> : (
            <div className="text-sm text-zinc-500 py-12 text-center">
              ← {lang === "es" ? "Selecciona un lead para ver el detalle" : "Select a lead to see details"}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function LeadDetail({ lead, lang, onClose }: { lead: Lead; lang: Lang; onClose: () => void }) {
  const d = t[lang].leadDetail;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-zinc-500">{d.title}</div>
          <div className="font-mono text-lg">{lead.lead_id}</div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-sm">✕</button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded border text-sm font-mono ${scoreColor(lead.score)}`}>{lead.score}</span>
        <span className={`px-2 py-1 rounded border text-xs ${recColor(lead.recommendation)}`}>{recLabel(lang, lead.recommendation)}</span>
      </div>

      <div className="space-y-2 text-sm">
        {(lead.first_name || lead.last_name) && (
          <Row label={lang === "es" ? "Nombre" : "Name"} value={`${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim()} />
        )}
        <Row label={d.stateLabel} value={`${lead.state} ${lead.postal_code}`} />
        <Row label={d.campaignLabel} value={lead.campaign_id} />
        {lead.source && (
          <Row label={lang === "es" ? "Fuente" : "Source"} value={lead.source.replace(/_/g, " ")} />
        )}
        {lead.language && (
          <Row label={lang === "es" ? "Idioma" : "Language"} value={lead.language === "es" ? "Español" : "English"} />
        )}
        <Row label={d.attemptsLabel} value={lead.called_count.toString()} />
        <Row label={d.lastDispo} value={lead.last_call_dispo || "—"} />
        <Row label={d.lastDuration} value={`${lead.last_call_duration_sec}s`} />
        <Row label={lang === "es" ? "Total en llamadas" : "Total talk time"} value={`${lead.total_call_seconds}s`} />
        <Row label={d.lastCallAt} value={fmtRelative(lead.last_local_call_time, lang)} />
      </div>

      {lead.reasons.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">{d.reasons}</div>
          <ul className="space-y-1">
            {lead.reasons.map((r, i) => (
              <li key={i} className="text-sm text-zinc-300 flex gap-2">
                <span className="text-emerald-400">·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200 text-right">{value}</span>
    </div>
  );
}
