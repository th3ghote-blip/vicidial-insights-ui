/**
 * Mock data generators for the full-suite dashboard.
 * Called in page.tsx as fallback — Railway endpoints for these shapes TBD.
 * Uses a seeded LCG so the same agent/campaign always gets the same data.
 */

import type {
  AgentStat, CampaignStat,
  DayHourCell, HourlyContact, AgentHourlyPerf, AgentDispositionBreakdown,
  LoginPattern, CampaignHealth, AttemptROI, CallbackStats,
  StaffingHour, DayOfWeekPerf, DialerHealth, PaceToTarget,
} from "./api";

// ── Seeded LCG random ─────────────────────────────────────────────────────────
function rng(seed: string): () => number {
  let h = 0;
  for (const c of seed) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return () => {
    h = (Math.imul(h, 0x9e3779b9) + 0x6b3a9cd1) | 0;
    return (h >>> 0) / 0x100000000;
  };
}

// ── Profile constants ─────────────────────────────────────────────────────────

// Call volume weight by hour (0-23). Peak: 10-11am, 2-5pm
const HOUR_CALL_W = [
  0, 0, 0, 0, 0, 0, 0, 0,       // 0-7
  0.20, 0.50, 0.85, 1.00,        // 8-11
  0.60, 0.55,                    // 12-13 lunch
  0.80, 0.95, 1.00, 0.90,        // 14-17
  0.65, 0.45, 0.25, 0.10,        // 18-21
  0, 0,                          // 22-23
];

// Contact rate boost by hour (people more likely to pick up at certain times)
const HOUR_CONTACT_W = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0.80, 0.85, 0.90, 0.95,
  1.05, 1.10,                    // lunch — home
  0.90, 0.95, 1.00, 0.95,
  1.05, 1.00, 0.85, 0.70,
  0, 0,
];

// Relative call volume by day (0=Mon … 6=Sun)
const DAY_W = [0.80, 1.00, 1.10, 1.05, 0.90, 0.35, 0.00];

const DAY_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ── Generators ────────────────────────────────────────────────────────────────

export function mockDayHourHeatmap(): DayHourCell[] {
  const r = rng("heatmap-v2");
  const cells: DayHourCell[] = [];
  for (let day = 0; day < 7; day++) {
    const df = DAY_W[day];
    for (let hour = 8; hour <= 20; hour++) {
      const hf = HOUR_CALL_W[hour];
      const base = Math.round(38 * df * hf + r() * 14);
      const cr = Math.min(0.70, Math.max(0.05,
        (0.26 + HOUR_CONTACT_W[hour] * 0.10 + r() * 0.08) * (df > 0 ? 1 : 0)
      ));
      const contacts = Math.round(base * cr);
      const sales = Math.round(contacts * Math.max(0.04, 0.10 + hf * 0.06 + r() * 0.04));
      cells.push({ day, hour, calls: base, contacts, contact_rate: cr, sales });
    }
  }
  return cells;
}

export function mockHourlyContact(): HourlyContact[] {
  const r = rng("hourly-v2");
  return Array.from({ length: 24 }, (_, hour) => {
    const hf = HOUR_CALL_W[hour];
    const base = Math.round(48 * hf + r() * 18);
    const cr = hf > 0 ? Math.min(0.65, Math.max(0.10,
      0.26 + HOUR_CONTACT_W[hour] * 0.10 + r() * 0.08
    )) : 0;
    const contacts = Math.round(base * cr);
    const sales = hf > 0 ? Math.round(contacts * Math.max(0.03, 0.09 + hf * 0.07 + r() * 0.04)) : 0;
    return { hour, calls: base, contacts, contact_rate: cr, sales };
  });
}

export function mockAgentHourlyPerf(agents: AgentStat[]): AgentHourlyPerf[] {
  return agents.map(a => {
    const r = rng(a.user + ":hourly");
    const base = a.close_rate;
    // High utilization → more fatigue
    const fatigueFactor = a.utilization_rate > 0.80 ? 0.045 : 0.022;
    const hourly = Array.from({ length: 8 }, (_, i) => {
      const decay = 1 - i * fatigueFactor * (0.8 + r() * 0.4);
      const noise = r() * 0.04 - 0.02;
      return {
        hour_of_shift: i,
        close_rate: Math.max(0.01, base * decay + noise),
        calls: Math.round(7 + r() * 6),
      };
    });
    const mid = 4;
    const fh = hourly.slice(0, mid).reduce((s, h) => s + h.close_rate, 0) / mid;
    const sh = hourly.slice(mid).reduce((s, h) => s + h.close_rate, 0) / mid;
    return {
      user: a.user,
      full_name: a.full_name,
      hourly,
      fatigue_detected: fh > 0 && (fh - sh) / fh > 0.20,
      avg_close_first_half: fh,
      avg_close_second_half: sh,
    };
  });
}

export function mockAgentDispositions(agents: AgentStat[]): AgentDispositionBreakdown[] {
  return agents.map(a => {
    const r = rng(a.user + ":dispo");
    const total = Math.max(1, a.calls_handled);
    const salePct   = a.close_rate;
    const cbPct     = 0.16 + r() * 0.12;
    const niPct     = 0.22 + r() * 0.16;
    const naPct     = 0.18 + r() * 0.12;
    const amPct     = 0.10 + r() * 0.10;
    const dncPct    = 0.008 + r() * 0.022;
    const rest      = Math.max(0, 1 - salePct - cbPct - niPct - naPct - amPct - dncPct);

    const dispositions = [
      { dispo: "SALE", label_en: "Sale",          label_es: "Venta",          pct: salePct, color: "emerald" as const },
      { dispo: "CBCK", label_en: "Callback",      label_es: "Rellamar",       pct: cbPct,   color: "violet"  as const },
      { dispo: "NI",   label_en: "Not Interested",label_es: "No interesado",  pct: niPct,   color: "zinc"    as const },
      { dispo: "NA",   label_en: "No Answer",     label_es: "Sin respuesta",  pct: naPct,   color: "zinc"    as const },
      { dispo: "AM",   label_en: "Ans. Machine",  label_es: "Buzón de voz",   pct: amPct,   color: "amber"   as const },
      { dispo: "DNC",  label_en: "Do Not Call",   label_es: "No llamar",      pct: dncPct,  color: "red"     as const },
      { dispo: "OTH",  label_en: "Other",         label_es: "Otro",           pct: rest,    color: "zinc"    as const },
    ].map(d => ({ ...d, count: Math.round(d.pct * total) }));

    const flags: string[] = [];
    if (dncPct > 0.025)  flags.push("High DNC rate — list quality issue");
    if (cbPct > 0.28)    flags.push("Over-relying on callbacks — needs closing training");
    if (niPct > 0.42)    flags.push("High rejection rate — pitch review needed");
    if (amPct > 0.22)    flags.push("High answering machine rate — calling wrong times");

    return {
      user: a.user,
      full_name: a.full_name,
      dispositions,
      dnc_pct: dncPct,
      sale_pct: salePct,
      callback_pct: cbPct,
      not_interested_pct: niPct,
      flags,
    };
  });
}

export function mockLoginPatterns(agents: AgentStat[]): LoginPattern[] {
  return agents.map(a => {
    const r = rng(a.user + ":login");
    const loginDelta  = (r() * 18) - 4;        // -4 to +14 min
    const logoutDelta = (r() * 20) - 16;        // -16 to +4 min (negative = left early)
    const breakMin    = 25 + r() * 22;          // 25-47 min
    const breakTarget = 30;
    const score = Math.round(
      100
      - Math.max(0, loginDelta)  * 2.0          // penalise late
      - Math.max(0, -logoutDelta) * 1.5         // penalise early leave
      - Math.abs(breakMin - breakTarget) * 0.8  // penalise over/under break
    );
    return {
      user: a.user,
      full_name: a.full_name,
      avg_login_delta_min: Math.round(loginDelta * 10) / 10,
      avg_logout_delta_min: Math.round(logoutDelta * 10) / 10,
      avg_break_min: Math.round(breakMin * 10) / 10,
      break_target_min: breakTarget,
      adherence_score: Math.max(45, Math.min(100, score)),
    };
  });
}

export function mockCampaignHealth(campaigns: CampaignStat[]): CampaignHealth[] {
  return campaigns.map(c => {
    const r = rng(c.campaign_id + ":health");
    const dropRate     = 0.007 + r() * 0.032;
    const abandonRate  = 0.018 + r() * 0.055;
    const leadAge      = 2 + r() * 50;
    const freshPct     = Math.max(0.04, 0.82 - leadAge / 55 + r() * 0.08);
    const recycledPct  = 0.08 + r() * 0.55;
    const bestAttempt  = Math.floor(r() * 3) + 1;

    const flags: string[] = [];
    if (dropRate > 0.03)             flags.push("Drop rate > 3% — FTC compliance risk");
    if (dropRate > 0.02 && dropRate <= 0.03) flags.push("Drop rate approaching FTC limit (3%)");
    if (leadAge > 30)                flags.push("Leads aging fast — list going stale");
    if (c.penetration_rate > 0.85)   flags.push("List nearly exhausted — replenish soon");
    if (c.contact_rate < 0.22)       flags.push("Low contact rate — review calling hours");
    if (abandonRate > 0.06)          flags.push("High abandon rate — dialer ratio too aggressive");
    if (recycledPct > 0.55)          flags.push("Over-recycling leads — diminishing returns");

    let score = 100;
    if (dropRate > 0.03)             score -= 30;
    else if (dropRate > 0.02)        score -= 12;
    if (leadAge > 30)                score -= 20;
    else if (leadAge > 14)           score -= 8;
    if (c.penetration_rate > 0.85)   score -= 20;
    else if (c.penetration_rate > 0.70) score -= 8;
    if (c.contact_rate < 0.22)       score -= 15;
    else if (c.contact_rate < 0.30)  score -= 5;
    if (c.conversion_rate < 0.07)    score -= 10;
    if (abandonRate > 0.06)          score -= 8;
    score = Math.max(0, Math.min(100, score + r() * 8 - 4));

    const health_status: CampaignHealth["health_status"] =
      score >= 68 ? "healthy" : score >= 42 ? "warning" : "critical";

    return {
      campaign_id: c.campaign_id,
      campaign_name: c.campaign_name,
      contact_rate: c.contact_rate,
      abandon_rate: abandonRate,
      drop_rate: dropRate,
      penetration_rate: c.penetration_rate,
      leads_remaining_pct: Math.max(0, 1 - c.penetration_rate),
      lead_age_avg_days: Math.round(leadAge * 10) / 10,
      fresh_lead_pct: freshPct,
      recycled_call_pct: recycledPct,
      best_attempt: bestAttempt,
      conversion_rate: c.conversion_rate,
      cost_per_sale_usd: c.cost_per_lead_usd / Math.max(0.04, c.conversion_rate),
      active_agents: c.active_agents,
      health_score: Math.round(score),
      health_status,
      flags,
    };
  });
}

export function mockAttemptROI(): AttemptROI[] {
  const ATTEMPTS = [
    { attempt: 1, callPct: 0.34, crMult: 1.00, convMult: 1.00, value: "strong"      as const },
    { attempt: 2, callPct: 0.26, crMult: 0.84, convMult: 0.88, value: "strong"      as const },
    { attempt: 3, callPct: 0.19, crMult: 0.68, convMult: 0.72, value: "ok"          as const },
    { attempt: 4, callPct: 0.11, crMult: 0.50, convMult: 0.50, value: "diminishing" as const },
    { attempt: 5, callPct: 0.06, crMult: 0.36, convMult: 0.32, value: "stop"        as const },
    { attempt: 6, callPct: 0.04, crMult: 0.22, convMult: 0.18, value: "stop"        as const },
  ];
  const TOTAL = 3400, BASE_CR = 0.34, BASE_CONV = 0.13;
  return ATTEMPTS.map(d => {
    const calls    = Math.round(TOTAL * d.callPct);
    const cr       = Math.min(0.90, BASE_CR * d.crMult);
    const contacts = Math.round(calls * cr);
    const conv     = Math.min(0.45, BASE_CONV * d.convMult);
    const sales    = Math.round(contacts * conv);
    return { attempt: d.attempt, calls, contacts, sales, contact_rate: cr, conversion_rate: conv, value: d.value };
  });
}

export function mockCallbackStats(agents: AgentStat[]): CallbackStats {
  const byAgent = agents.map(a => {
    const r = rng(a.user + ":cb");
    const set       = a.callbacks_set ?? Math.round(r() * 14 + 2);
    const showRate  = Math.max(0.20, Math.min(0.90, 0.44 + r() * 0.32));
    const convRate  = Math.max(0.10, Math.min(0.60, 0.18 + r() * 0.28));
    const showed    = Math.round(set * showRate);
    const converted = Math.round(showed * convRate);
    return { user: a.user, full_name: a.full_name, set, showed, converted, show_rate: showRate, convert_rate: convRate };
  });
  const ts = byAgent.reduce((s, a) => s + a.set,       0);
  const tw = byAgent.reduce((s, a) => s + a.showed,    0);
  const tc = byAgent.reduce((s, a) => s + a.converted, 0);
  return {
    total_scheduled: ts,
    show_rate:    tw / Math.max(1, ts),
    convert_rate: tc / Math.max(1, tw),
    by_agent: byAgent,
  };
}

export function mockStaffingHours(agents: AgentStat[]): StaffingHour[] {
  const r = rng("staffing-v2");
  const n = agents.length;
  return Array.from({ length: 24 }, (_, hour) => {
    const hf = HOUR_CALL_W[hour];
    const ideal  = Math.round(n * hf);
    const actual = Math.max(0, Math.round(ideal * (0.65 + r() * 0.70)));
    const vol    = Math.round(52 * hf + r() * 16);
    const ratio  = ideal > 0 ? actual / ideal : 1;
    const status: StaffingHour["coverage_status"] =
      ratio < 0.78 ? "understaffed" : ratio > 1.28 ? "overstaffed" : "optimal";
    return { hour, agents_logged_in: actual, call_volume: vol, coverage_status: status };
  });
}

export function mockDayOfWeekPerf(): DayOfWeekPerf[] {
  const r = rng("dow-v2");
  return Array.from({ length: 7 }, (_, day) => {
    const df      = DAY_W[day];
    const calls   = Math.round(430 * df + r() * 90);
    const cr      = Math.max(0.05, 0.26 + df * 0.09 + r() * 0.07);
    const contacts = Math.round(calls * cr);
    const conv    = Math.max(0.02, 0.09 + df * 0.04 + r() * 0.04);
    const sales   = Math.round(contacts * conv);
    return {
      day,
      day_name_en: DAY_EN[day],
      day_name_es: DAY_ES[day],
      calls,
      sales,
      contact_rate: cr,
      close_rate: sales / Math.max(1, calls),
    };
  });
}

export function mockDialerHealth(): DialerHealth {
  const r = rng("dialer-v2");
  const drop = 0.010 + r() * 0.028;
  return {
    drop_rate: drop,
    drop_status: drop > 0.03 ? "critical" : drop > 0.02 ? "warning" : "ok",
    total_dropped: Math.round(drop * 3400),
    lines_per_agent: Math.round((2.6 + r() * 1.6) * 10) / 10,
  };
}

export function mockPaceToTarget(agents: AgentStat[]): PaceToTarget {
  const r = rng("pace-v2");
  const now          = new Date();
  const shiftStart   = 8; // 8am
  const shiftEnd     = 18; // 6pm
  const elapsed      = Math.max(0.5, Math.min(shiftEnd - shiftStart, now.getHours() + now.getMinutes() / 60 - shiftStart));
  const remaining    = Math.max(0.25, shiftEnd - shiftStart - elapsed);
  const targetToday  = Math.round(agents.length * 4.2 + r() * agents.length);
  // Simulate having made ~50-70% of target so far based on elapsed time
  const expectedPct  = (elapsed / (shiftEnd - shiftStart)) * (0.80 + r() * 0.30);
  const soFar        = Math.round(targetToday * Math.min(0.95, expectedPct));
  const currentPace  = soFar / Math.max(0.5, elapsed);
  const required     = (targetToday - soFar) / Math.max(0.25, remaining);
  const projected    = Math.round(soFar + currentPace * remaining);
  return {
    target_today:   targetToday,
    actual_so_far:  soFar,
    current_pace:   Math.round(currentPace * 10) / 10,
    required_pace:  Math.round(required * 10) / 10,
    projected_eod:  projected,
    on_track:       projected >= targetToday * 0.88,
    hours_elapsed:  Math.round(elapsed * 10) / 10,
    hours_remaining: Math.round(remaining * 10) / 10,
  };
}
