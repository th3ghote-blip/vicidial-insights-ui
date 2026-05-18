/**
 * Custom KPI targets — stored in localStorage, never sent to any server.
 *
 * All rate fields are 0–1 decimals (e.g. close_rate: 0.15 = 15%).
 * Count fields are raw numbers.
 * null means "no target set".
 */

export type Targets = {
  close_rate:      number | null;   // 0–1  (e.g. 0.15 = 15 %)
  sales:           number | null;   // count per period
  calls:           number | null;   // count per period
  dials_per_hour:  number | null;   // number
  avg_talk_sec:    number | null;   // seconds
  utilization:     number | null;   // 0–1  (e.g. 0.70 = 70 %)
  callback_conv:   number | null;   // 0–1  (e.g. 0.30 = 30 %)
};

export const DEFAULT_TARGETS: Targets = {
  close_rate:     null,
  sales:          null,
  calls:          null,
  dials_per_hour: null,
  avg_talk_sec:   null,
  utilization:    null,
  callback_conv:  null,
};

const LS_KEY = "vicidial_targets_v1";

export function loadTargets(): Targets {
  if (typeof window === "undefined") return DEFAULT_TARGETS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_TARGETS;
    return { ...DEFAULT_TARGETS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TARGETS;
  }
}

export function saveTargets(t: Targets): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(t));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

/** Returns "above" | "below" | "on" | null (if no target set). */
export function vsTarget(value: number, target: number | null): "above" | "below" | "on" | null {
  if (target === null) return null;
  const diff = (value - target) / target;
  if (Math.abs(diff) < 0.01) return "on";   // within 1% — treat as on target
  return diff > 0 ? "above" : "below";
}
