'use client';
import { useCallback, useEffect, useState } from 'react';

export type Habit = 'food' | 'knee' | 'bed';
export type SugarLog = { at: string; what: string[]; why: string[]; strength: number; note?: string };
export type Day = { food?: boolean; knee?: boolean; bed?: boolean; water?: number; sugar?: SugarLog[]; wake?: string; wakings?: number };
export type Profile = { startKg: number; goalLossKg: number; bedStart: string; bedGoal: string; startedOn: string };
export type State = { profile: Profile | null; days: Record<string, Day>; weights: { date: string; kg: number }[]; points: number };

const KEY = 'lyta-v1';
const empty: State = { profile: null, days: {}, weights: [], points: 0 };

export const isoDate = (d = new Date()) => {
  const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10);
};
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return isoDate(d); };
export const daysBetween = (a: string, b: string) => Math.round((new Date(b + 'T12:00').getTime() - new Date(a + 'T12:00').getTime()) / 864e5);

// Bedtime ladder: 30 minutes earlier per week until the goal.
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); let v = h * 60 + m; if (v < 12 * 60) v += 1440; return v; };
const toTime = (v: number) => { v = ((v % 1440) + 1440) % 1440; return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'); };
export const bedTarget = (p: Profile, today = isoDate()) => {
  const week = Math.max(0, Math.floor(daysBetween(p.startedOn, today) / 7));
  return toTime(Math.max(toMin(p.bedGoal), toMin(p.bedStart) - 30 * week));
};
export const coffeeCutoff = (bed: string) => toTime(toMin(bed) - 8 * 60);
export const ladderWeek = (p: Profile, today = isoDate()) => Math.floor(daysBetween(p.startedOn, today) / 7) + 1;
export const ladderSteps = (p: Profile) => Math.ceil((toMin(p.bedStart) - toMin(p.bedGoal)) / 30) + 1;

export const doneCount = (d?: Day) => (d ? (['food', 'knee', 'bed'] as Habit[]).filter(k => d[k]).length : 0);
export const showedUp = (d?: Day) => doneCount(d) > 0 || (d?.sugar?.length ?? 0) > 0;

// Streak: consecutive days showed up, ending today or yesterday, with 2 freezes a month used automatically.
export const streak = (s: State, today = isoDate()) => {
  let n = 0, cursor = showedUp(s.days[today]) ? today : addDays(today, -1);
  const freezesUsed: Record<string, number> = {};
  for (let i = 0; i < 3650; i++) {
    if (s.profile && cursor < s.profile.startedOn) break;
    if (showedUp(s.days[cursor])) { n++; }
    else {
      const month = cursor.slice(0, 7);
      if ((freezesUsed[month] ?? 0) < 2 && n > 0) { freezesUsed[month] = (freezesUsed[month] ?? 0) + 1; }
      else break;
    }
    cursor = addDays(cursor, -1);
  }
  return n;
};

const load = (): State => { try { const raw = localStorage.getItem(KEY); return raw ? { ...empty, ...JSON.parse(raw) } : empty; } catch { return empty; } };
const save = (s: State) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } };

export function useLyta() {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);
  useEffect(() => { setState(load()); setReady(true); }, []);
  const update = useCallback((fn: (s: State) => State) => setState(prev => { const next = fn(prev); save(next); return next; }), []);
  const today = isoDate();

  const setProfile = (p: Profile, weightKg: number) => update(s => ({ ...s, profile: p, weights: [{ date: p.startedOn, kg: weightKg }] }));
  const toggle = (k: Habit) => update(s => {
    const d = { ...(s.days[today] ?? {}) }; const was = !!d[k]; d[k] = !was;
    let pts = s.points + (was ? -1 : 1);
    const before = doneCount(s.days[today]), after = doneCount(d);
    if (before < 3 && after === 3) pts += 2; if (before === 3 && after < 3) pts -= 2;
    return { ...s, points: Math.max(0, pts), days: { ...s.days, [today]: d } };
  });
  const addWater = () => update(s => { const d = { ...(s.days[today] ?? {}) }; d.water = ((d.water ?? 0) + 1) % 7; return { ...s, days: { ...s.days, [today]: d } }; });
  const logSugar = (log: SugarLog) => update(s => { const d = { ...(s.days[today] ?? {}) }; d.sugar = [...(d.sugar ?? []), log]; return { ...s, points: s.points + 1, days: { ...s.days, [today]: d } }; });
  const reset = () => update(() => empty);

  return { state, ready, today, setProfile, toggle, addWater, logSugar, reset };
}
