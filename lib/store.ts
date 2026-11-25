'use client';
import { useCallback, useEffect, useState } from 'react';

export type HabitDef = { id: string; title: string; detail: string; kind?: 'bed'; routine?: 'knee' };
export type RoutineLog = { before: number; after?: number; gentle: boolean; stopped?: boolean; at: string };
export type SugarLog = { at: string; what: string[]; why: string[]; strength: number; note?: string };
export type Day = { done?: Record<string, boolean>; water?: number; steps?: number; sugar?: SugarLog[]; wake?: string; wakings?: number; routines?: Record<string, RoutineLog> };
export type Pace = 0.5 | 0.75 | 1;
export type Profile = { name?: string; startKg: number; goalKg: number; bedStart: string; bedGoal: string; startedOn: string; stepGoal: number; pace: Pace };
export type Weigh = { date: string; kg: number };
export type State = { profile: Profile | null; habits: HabitDef[]; days: Record<string, Day>; weights: Weigh[]; points: number };

const KEY = 'lyta-v1';
export const DEFAULT_HABITS: HabitDef[] = [
  { id: 'food', title: 'Real food, not sugar', detail: 'Eat something real before noon' },
  { id: 'knee', title: 'Knee routine', detail: 'Guided, about 10 minutes', routine: 'knee' },
  { id: 'bed', title: 'In bed on time', detail: '', kind: 'bed' },
];
const empty: State = { profile: null, habits: DEFAULT_HABITS, days: {}, weights: [], points: 0 };

export const isoDate = (d = new Date()) => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return isoDate(d); };
export const daysBetween = (a: string, b: string) => Math.round((new Date(b + 'T12:00').getTime() - new Date(a + 'T12:00').getTime()) / 864e5);
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => new Date(iso + 'T12:00').toLocaleDateString('en-GB', opts);

// Bedtime ladder: 30 minutes earlier per week until the goal.
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); let v = h * 60 + m; if (v < 12 * 60) v += 1440; return v; };
const toTime = (v: number) => { v = ((v % 1440) + 1440) % 1440; return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'); };
export const bedTarget = (p: Profile, today = isoDate()) => { const week = Math.max(0, Math.floor(daysBetween(p.startedOn, today) / 7)); return toTime(Math.max(toMin(p.bedGoal), toMin(p.bedStart) - 30 * week)); };
export const coffeeCutoff = (bed: string) => toTime(toMin(bed) - 8 * 60);
export const ladderWeek = (p: Profile, today = isoDate()) => Math.max(1, Math.floor(daysBetween(p.startedOn, today) / 7) + 1);

export const isDone = (d: Day | undefined, id: string) => !!d?.done?.[id];
export const doneCount = (d: Day | undefined, habits: HabitDef[]) => habits.filter(h => isDone(d, h.id)).length;
export const showedUp = (d: Day | undefined) => Object.values(d?.done ?? {}).some(Boolean) || (d?.sugar?.length ?? 0) > 0;
export const currentKg = (s: State) => s.weights.length ? [...s.weights].sort((a, b) => a.date < b.date ? -1 : 1).at(-1)!.kg : s.profile?.startKg ?? 0;

// Streak: consecutive days showed up, with 2 freezes a month used automatically.
export const streak = (s: State, today = isoDate()) => {
  let n = 0, cursor = showedUp(s.days[today]) ? today : addDays(today, -1);
  const used: Record<string, number> = {};
  for (let i = 0; i < 3650; i++) {
    if (s.profile && cursor < s.profile.startedOn) break;
    if (showedUp(s.days[cursor])) n++;
    else { const m = cursor.slice(0, 7); if ((used[m] ?? 0) < 2 && n > 0) used[m] = (used[m] ?? 0) + 1; else break; }
    cursor = addDays(cursor, -1);
  }
  return n;
};

/**
 * Plan estimate. Rule-of-thumb maths, not medical advice:
 * about 7,700 kcal per kg of body fat; walking burns roughly 0.0006 kcal per step per kg of body weight,
 * counted only above a 3,000-step baseline.
 */
export const KCAL_PER_KG = 7700;
export const stepKcal = (steps: number, kg: number) => Math.max(0, steps - 3000) * kg * 0.0006;
export const plan = (s: State, today = isoDate()) => {
  const p = s.profile; if (!p) return null;
  const now = currentKg(s), toLose = +(now - p.goalKg).toFixed(1);
  const weeks = toLose > 0 ? Math.ceil(toLose / p.pace) : 0;
  const daily = Math.round(p.pace * KCAL_PER_KG / 7);
  const fromSteps = Math.min(daily, Math.round(stepKcal(p.stepGoal, now)));
  const fromFood = Math.max(0, daily - fromSteps);
  const sorted = [...s.weights].sort((a, b) => a.date < b.date ? -1 : 1);
  let actualPace: number | null = null;
  if (sorted.length >= 2) { const span = daysBetween(sorted[0].date, sorted.at(-1)!.date); if (span >= 14) actualPace = +(((sorted[0].kg - sorted.at(-1)!.kg) / span) * 7).toFixed(2); }
  const projected = actualPace && actualPace > 0 ? addDays(today, Math.ceil(toLose / actualPace * 7)) : null;
  const avgSteps = (() => { const v = Array.from({ length: 7 }, (_, i) => s.days[addDays(today, -i)]?.steps ?? 0).filter(Boolean); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; })();
  return { now, toLose, weeks, finish: addDays(today, weeks * 7), daily, fromSteps, fromFood, actualPace, projected, avgSteps };
};

const migrate = (raw: Record<string, unknown>): State => {
  const s = { ...empty, ...raw } as State & { profile: (Profile & { goalLossKg?: number }) | null };
  if (s.profile) {
    const p = s.profile;
    s.profile = { ...p, name: p.name ?? 'Don', goalKg: p.goalKg ?? p.startKg - (p.goalLossKg ?? 0), stepGoal: p.stepGoal ?? 6000, pace: p.pace ?? 0.75 };
  }
  for (const [k, d] of Object.entries(s.days)) {
    const old = d as Day & Record<string, unknown>;
    if (!old.done) { s.days[k] = { ...d, done: { food: !!old.food, knee: !!old.knee, bed: !!old.bed } }; }
  }
  if (!s.habits?.length) s.habits = DEFAULT_HABITS;
  s.habits = s.habits.map(h => h.id === 'knee' && !h.routine ? { ...h, routine: 'knee', detail: h.detail === '10 minutes, 2 rounds' ? 'Guided, about 10 minutes' : h.detail } : h);
  return s;
};
const load = (): State => { try { const raw = localStorage.getItem(KEY); return raw ? migrate(JSON.parse(raw)) : empty; } catch { return empty; } };
const save = (s: State) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } };
const uid = () => Math.random().toString(36).slice(2, 9);
/** Keep the profile's start weight equal to the earliest weigh-in, so editing that entry fixes the start. */
const syncStart = (s: State): State => { const first = [...s.weights].sort((a, b) => a.date < b.date ? -1 : 1)[0]; return s.profile && first ? { ...s, profile: { ...s.profile, startKg: first.kg } } : s; };

export function useLyta() {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);
  useEffect(() => { setState(load()); setReady(true); }, []);
  const update = useCallback((fn: (s: State) => State) => setState(prev => { const next = fn(prev); save(next); return next; }), []);
  const today = isoDate();
  const patchDay = (s: State, fn: (d: Day) => Day, date = today) => ({ ...s, days: { ...s.days, [date]: fn({ ...(s.days[date] ?? {}) }) } });

  return {
    state, ready, today,
    setProfile: (p: Profile, kg: number, habits?: HabitDef[]) => update(s => ({ ...s, profile: p, habits: habits?.length ? habits : s.habits, weights: [{ date: p.startedOn, kg }] })),
    updateProfile: (patch: Partial<Profile>) => update(s => s.profile ? { ...s, profile: { ...s.profile, ...patch } } : s),
    toggle: (id: string, date = today, force?: boolean) => update(s => {
      if (force !== undefined && !!s.days[date]?.done?.[id] === force) return s;
      const before = doneCount(s.days[date], s.habits);
      const next = patchDay(s, d => ({ ...d, done: { ...(d.done ?? {}), [id]: !d.done?.[id] } }), date);
      const after = doneCount(next.days[date], s.habits), all = s.habits.length;
      let pts = s.points + (after > before ? 1 : -1);
      if (before < all && after === all) pts += 2; if (before === all && after < all) pts -= 2;
      return { ...next, points: Math.max(0, pts) };
    }),
    logRoutine: (habitId: string, log: RoutineLog, date = today) => update(s => patchDay(s, d => ({ ...d, routines: { ...(d.routines ?? {}), [habitId]: log } }), date)),
    setWater: (n: number, date = today) => update(s => patchDay(s, d => ({ ...d, water: Math.min(12, Math.max(0, n)) }), date)),
    setSteps: (n: number, date = today) => update(s => patchDay(s, d => ({ ...d, steps: Math.max(0, Math.round(n)) }), date)),
    logSugar: (log: SugarLog, date = today) => update(s => ({ ...patchDay(s, d => ({ ...d, sugar: [...(d.sugar ?? []), log] }), date), points: s.points + 1 })),
    saveWeight: (w: Weigh, replaceDate?: string) => update(s => {
      const rest = s.weights.filter(x => x.date !== w.date && x.date !== replaceDate);
      const isNew = !s.weights.some(x => x.date === w.date || x.date === replaceDate);
      return syncStart({ ...s, weights: [...rest, w].sort((a, b) => a.date < b.date ? -1 : 1), points: s.points + (isNew ? 3 : 0) });
    }),
    deleteWeight: (date: string) => update(s => syncStart({ ...s, weights: s.weights.length > 1 ? s.weights.filter(x => x.date !== date) : s.weights })),
    saveHabit: (h: Omit<HabitDef, 'id'> & { id?: string }) => update(s => h.id ? { ...s, habits: s.habits.map(x => x.id === h.id ? { ...x, ...h, id: x.id } : x) } : { ...s, habits: [...s.habits, { ...h, id: uid() }] }),
    deleteHabit: (id: string) => update(s => ({ ...s, habits: s.habits.length > 1 ? s.habits.filter(h => h.id !== id) : s.habits })),
  };
}
