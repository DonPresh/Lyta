'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sheet, field } from './Sheet';
import { Ruler } from './Ruler';
import { Icon } from './icons';
import { BigNumber } from './BigNumber';
import { currentKg, fmtDate, plan, type Pace, type Profile, type State, type Weigh } from '@/lib/store';

const PACES: [Pace, string, string][] = [[0.5, 'Steady', '0.5 kg a week'], [0.75, 'Balanced', '0.75 kg a week'], [1, 'Faster', '1 kg a week']];
const STEP_GOALS = [4000, 6000, 8000, 10000];

function Chart({ weights, goal }: { weights: Weigh[]; goal: number }) {
  if (weights.length < 2) return (
    <div className="card" style={{ padding: '28px 24px', border: '1.5px dashed var(--tick)', background: 'transparent', textAlign: 'center' }}>
      <p className="h3" style={{ margin: 0 }}>Your chart starts after 2 weigh-ins</p>
      <p className="muted" style={{ margin: '8px 0 0' }}>Weigh in once a week, same day, before breakfast.</p>
    </div>
  );
  const W = 330, H = 170, pad = 16;
  const kgs = weights.map(w => w.kg), hi = Math.max(...kgs) + 1, lo = Math.min(goal, Math.min(...kgs)) - 1;
  const t0 = new Date(weights[0].date).getTime(), t1 = new Date(weights.at(-1)!.date).getTime() || t0 + 1;
  const x = (d: string) => pad + ((new Date(d).getTime() - t0) / Math.max(1, t1 - t0)) * (W - pad * 2);
  const y = (kg: number) => pad + ((hi - kg) / (hi - lo)) * (H - pad * 2);
  const pts = weights.map(w => `${x(w.date).toFixed(1)},${y(w.kg).toFixed(1)}`).join(' ');
  return (
    <div className="card" style={{ padding: '14px 12px 10px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Weight from ${weights[0].kg} to ${weights.at(-1)!.kg} kg, goal ${goal} kg`}>
        <line x1={pad} x2={W - pad} y1={y(goal)} y2={y(goal)} stroke="var(--cobalt)" strokeWidth="1.5" strokeDasharray="5 5" />
        <text x={pad} y={y(goal) - 6} fontSize="12" fill="var(--cobalt)">Goal {goal} kg</text>
        <polyline points={pts} fill="none" stroke="var(--cobalt)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {weights.map(w => <circle key={w.date} cx={x(w.date)} cy={y(w.kg)} r="4.5" fill="var(--cobalt)" />)}
      </svg>
    </div>
  );
}

export function WeightScreen({ state, today, saveWeight, deleteWeight, updateProfile }: {
  state: State; today: string;
  saveWeight: (w: Weigh, replaceDate?: string) => void; deleteWeight: (date: string) => void; updateProfile: (p: Partial<Profile>) => void;
}) {
  const p = state.profile!;
  const pl = plan(state, today)!;
  const now = currentKg(state), lost = +(p.startKg - now).toFixed(1);
  const sorted = [...state.weights].sort((a, b) => a.date < b.date ? -1 : 1);
  const [editing, setEditing] = useState<Weigh | 'new' | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);

  return (
    <div className="screen">
      <h2 className="h2" style={{ marginTop: 10 }}>Weight</h2>
      <div className="split"><div className="col-main">
      <div className="row" style={{ alignItems: 'flex-end', gap: 8, marginTop: 10 }}>
        <span className="num num-l cobalt">{lost > 0 ? '−' + lost : now}</span>
        <span className="h3 cobalt" style={{ paddingBottom: 8 }}>{lost > 0 ? 'kg so far' : 'kg today'}</span>
      </div>

      <div className="row between" style={{ marginTop: 16 }}>
        {[['Start', p.startKg + ' kg'], ['Now', now + ' kg'], ['Goal', p.goalKg + ' kg'], ['To go', Math.max(0, pl.toLose) + ' kg']].map(([l, v]) => (
          <div key={l} className="stack"><span className="small">{l}</span><span className="h3">{v}</span></div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}><Chart weights={sorted} goal={p.goalKg} /></div>
      </div><div className="col-side">

      <section className="card" style={{ marginTop: 12, padding: '18px 18px 16px', background: 'var(--cobalt)', color: '#fff' }}>
        <div className="row between"><span className="micro" style={{ color: 'rgba(255,255,255,.75)' }}>Your plan</span>
          <button onClick={() => setGoalOpen(true)} style={{ border: 0, background: 'rgba(255,255,255,.16)', color: '#fff', borderRadius: 999, height: 36, padding: '0 14px', fontWeight: 600 }}>Edit goal</button></div>
        {pl.toLose > 0 ? <>
          <p className="h2" style={{ margin: '10px 0 4px' }}>{p.goalKg} kg by {fmtDate(pl.finish, { month: 'long', year: 'numeric' })}</p>
          <p style={{ margin: 0, opacity: 0.85 }}>About {pl.weeks} weeks at {p.pace} kg a week{pl.projected ? `. At your real pace so far (${pl.actualPace} kg a week): ${fmtDate(pl.projected, { month: 'short', year: 'numeric' })}` : ''}.</p>
          <div className="stack" style={{ gap: 8, marginTop: 16 }}>
            <p className="micro" style={{ margin: 0, color: 'rgba(255,255,255,.75)' }}>The work, every day</p>
            <div className="row between" style={{ background: 'rgba(255,255,255,.12)', borderRadius: 16, padding: '12px 14px' }}>
              <span>Walk {p.stepGoal.toLocaleString()} steps</span><b>≈ {pl.fromSteps} kcal</b></div>
            <div className="row between" style={{ background: 'rgba(255,255,255,.12)', borderRadius: 16, padding: '12px 14px' }}>
              <span>Eat a little less</span><b>≈ {pl.fromFood} kcal</b></div>
            <p className="small" style={{ color: 'rgba(255,255,255,.8)', margin: '4px 0 0' }}>
              {pl.fromFood > 0 ? `Dropping sugary drinks and making starch a fist-sized portion usually covers ${pl.fromFood > 500 ? 'most' : 'all'} of the food part.` : 'Your steps alone cover the gap.'}
              {pl.avgSteps ? ` You’ve averaged ${pl.avgSteps.toLocaleString()} steps this week.` : ''}
            </p>
          </div>
        </> : <p className="h2" style={{ margin: '10px 0 0' }}>You’ve reached your goal. Set a new one or hold steady.</p>}
        <p className="small" style={{ color: 'rgba(255,255,255,.65)', margin: '12px 0 0' }}>An estimate, not a promise: bodies don’t lose in straight lines. Check big changes with your doctor.</p>
      </section>

      <div className="row between" style={{ marginTop: 22, marginBottom: 8 }}>
        <h3 className="h3">Weigh-ins</h3>
        <button onClick={() => setEditing('new')} className="row" style={{ gap: 6, border: 0, background: 'none', color: 'var(--cobalt)', fontWeight: 600, height: 44 }}><Icon name="plus" size={18} />Add</button>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {[...sorted].reverse().map((w, i) => (
          <button key={w.date} onClick={() => setEditing(w)} className="row between" style={{ width: '100%', minHeight: 52, border: 0, background: 'none', borderTop: i ? '1px solid var(--line)' : 0, padding: 0, textAlign: 'left' }}>
            <span className="body-l">{fmtDate(w.date, { weekday: 'short', day: 'numeric', month: 'short' })}{w.date === sorted[0].date ? ' · start' : ''}</span>
            <span className="row" style={{ gap: 6 }}><b>{w.kg} kg</b><Icon name="back" size={16} style={{ transform: 'rotate(180deg)', color: 'var(--ink-3)' }} /></span>
          </button>
        ))}
      </div>
      </div></div>

      <AnimatePresence>
        {editing && <WeighSheet key="w" entry={editing === 'new' ? null : editing} today={today} fallbackKg={now} canDelete={state.weights.length > 1}
          onClose={() => setEditing(null)} onSave={(w, old) => { saveWeight(w, old); setEditing(null); }} onDelete={d => { deleteWeight(d); setEditing(null); }} />}
        {goalOpen && <GoalSheet key="g" profile={p} now={now} onClose={() => setGoalOpen(false)} onSave={patch => { updateProfile(patch); setGoalOpen(false); }} />}
      </AnimatePresence>
    </div>
  );
}

function WeighSheet({ entry, today, fallbackKg, canDelete, onClose, onSave, onDelete }: {
  entry: Weigh | null; today: string; fallbackKg: number; canDelete: boolean;
  onClose: () => void; onSave: (w: Weigh, oldDate?: string) => void; onDelete: (date: string) => void;
}) {
  const [kg, setKg] = useState(entry?.kg ?? fallbackKg);
  const [date, setDate] = useState(entry?.date ?? today);
  return (
    <Sheet title={entry ? 'Edit weigh-in' : 'Log weight'} onClose={onClose}>
      <label className="micro" htmlFor="wdate">Date</label>
      <input id="wdate" type="date" value={date} max={today} onChange={e => setDate(e.target.value)} style={{ ...field, marginTop: 8 }} />
      <div style={{ margin: '24px 0 8px' }}><BigNumber value={kg} onChange={setKg} min={40} max={250} decimals={1} unit="kg" label="Weight in kilograms" /></div>
      <p className="small" style={{ textAlign: 'center', margin: '0 0 6px' }}>Tap the number to type it, or slide the ruler.</p>
      <Ruler min={40} max={250} step={0.1} value={kg} onChange={setKg} label="Weight" valueText={`${kg.toFixed(1)} kilograms`} />
      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => onSave({ date, kg: +kg.toFixed(1) }, entry?.date)}>{entry ? 'Save changes' : 'Log weight'}</button>
      {entry && canDelete && <button className="btn" style={{ marginTop: 8, color: '#B42318' }} onClick={() => onDelete(entry.date)}>Delete this weigh-in</button>}
    </Sheet>
  );
}

function GoalSheet({ profile, now, onClose, onSave }: { profile: Profile; now: number; onClose: () => void; onSave: (p: Partial<Profile>) => void }) {
  const [goal, setGoal] = useState(profile.goalKg);
  const [pace, setPace] = useState<Pace>(profile.pace);
  const [steps, setSteps] = useState(profile.stepGoal);
  const weeks = Math.max(0, Math.ceil((now - goal) / pace));
  return (
    <Sheet title="Your goal" onClose={onClose}>
      <div style={{ margin: '8px 0' }}><BigNumber value={goal} onChange={setGoal} min={40} max={Math.max(41, Math.floor(now))} unit="kg" label="Goal weight in kilograms" /></div>
      <Ruler min={40} max={Math.max(41, Math.floor(now))} step={1} value={goal} onChange={setGoal} label="Goal weight" valueText={`${goal} kilograms`} />
      <p className="micro" style={{ margin: '20px 0 10px' }}>Pace</p>
      <div className="stack" style={{ gap: 8 }}>
        {PACES.map(([v, name, desc]) => (
          <button key={v} aria-pressed={pace === v} onClick={() => setPace(v)} className="row between" style={{ height: 56, borderRadius: 18, padding: '0 16px', border: pace === v ? '2px solid var(--cobalt)' : '1.5px solid var(--line)', background: pace === v ? 'var(--cobalt-soft)' : 'var(--card)' }}>
            <b>{name}</b><span className="muted">{desc} · about {Math.ceil((now - goal) / v)} weeks</span>
          </button>
        ))}
      </div>
      <p className="micro" style={{ margin: '20px 0 10px' }}>Daily step goal</p>
      <div className="chips">{STEP_GOALS.map(s => <button key={s} className="chip" aria-pressed={steps === s} onClick={() => setSteps(s)}>{s.toLocaleString()}</button>)}</div>
      <button className="btn btn-primary" style={{ marginTop: 22 }} onClick={() => onSave({ goalKg: goal, pace, stepGoal: steps })}>Save · {weeks} weeks to go</button>
    </Sheet>
  );
}
