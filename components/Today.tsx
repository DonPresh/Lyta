'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './icons';
import { Sheet, field } from './Sheet';
import { addDays, bedTarget, coffeeCutoff, doneCount, isDone, ladderWeek, type Day, type HabitDef, type Profile } from '@/lib/store';

const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const longDate = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

function HabitRow({ title, detail, done, onToggle }: { title: string; detail: string; done: boolean; onToggle: () => void }) {
  return (
    <div className="card row" style={{ minHeight: 76, padding: '0 16px 0 14px', gap: 14 }}>
      <motion.button onClick={onToggle} aria-pressed={done} aria-label={(done ? 'Untick ' : 'Tick ') + title} whileTap={{ scale: 0.9 }}
        style={{ width: 44, height: 44, flex: 'none', borderRadius: 999, padding: 0, display: 'grid', placeItems: 'center', border: done ? 0 : '1.5px solid var(--ink)', background: done ? 'var(--cobalt)' : 'transparent', color: '#fff', transition: 'background .2s' }}>
        <motion.svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: done ? 1 : 0 }} transition={{ duration: 0.3 }} />
        </motion.svg>
      </motion.button>
      <div className="stack" style={{ gap: 2, flex: 1 }}>
        <span className="h3" style={{ color: done ? 'var(--ink-3)' : 'var(--ink)', textDecoration: done ? 'line-through' : 'none' }}>{title}</span>
        <span className="small">{detail}</span>
      </div>
    </div>
  );
}

export function Today({ profile, habits, days, today, streak, onToggle, onWater, onSugar, setSteps, saveHabit, deleteHabit }: {
  profile: Profile; habits: HabitDef[]; days: Record<string, Day>; today: string; streak: number;
  onToggle: (id: string) => void; onWater: () => void; onSugar: () => void; setSteps: (n: number) => void;
  saveHabit: (h: Omit<HabitDef, 'id'> & { id?: string }) => void; deleteHabit: (id: string) => void;
}) {
  const d = days[today] ?? {};
  const total = habits.length, n = doneCount(d, habits);
  const bed = bedTarget(profile, today);
  const left = habits.filter(h => !isDone(d, h.id));
  const sub = n === 0 ? 'Tick one thing and you’ve started.' : n === total ? 'That’s the whole job today.' : left.length === 1 ? `One to go: ${left[0].kind === 'bed' ? 'bedtime' : left[0].title.toLowerCase()}.` : `${left.length} to go.`;
  const now = new Date(); const dow = (now.getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => { const iso = addDays(today, i - dow); return { iso, label: 'MTWTFSS'[i], num: Number(iso.slice(8)), today: iso === today, future: iso > today, mark: doneCount(days[iso], habits) > 0 }; });
  const water = d.water ?? 0, sugarN = d.sugar?.length ?? 0, steps = d.steps ?? 0;
  const [editHabits, setEditHabits] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const label = (h: HabitDef) => h.kind === 'bed' ? `In bed by ${bed}` : h.title;
  const detail = (h: HabitDef) => h.kind === 'bed' ? `Bedtime ladder, week ${ladderWeek(profile, today)} · last coffee ${coffeeCutoff(bed)}` : h.detail;

  return (
    <div className="screen" style={{ gap: 0 }}>
      <div className="row between" style={{ marginTop: 6 }}>
        <div className="stack"><span className="small">{longDate()}</span><span className="h3">{greeting()}, Don</span></div>
        <div className="row" style={{ gap: 8 }}>
          <span className="row" style={{ gap: 6, height: 36, padding: '0 14px 0 12px', borderRadius: 999, background: 'var(--green)', color: '#fff', fontWeight: 600 }}>
            <Icon name="streak" size={16} />{streak > 0 ? streak : 'Day 1'}
          </span>
        </div>
      </div>

      <div className="row between" style={{ alignItems: 'center', marginTop: 18 }}>
        <span className="num num-l cobalt" aria-label={`${n} of ${total} done today`}>{n}/{total}</span>
        <div className="stack" style={{ width: 150, gap: 8 }}>
          <span className="h3 cobalt">done today</span>
          <div className="row" style={{ gap: 4 }}>{habits.map((h, i) => <motion.span key={h.id} initial={false} animate={{ backgroundColor: i < n ? '#1C35D6' : '#E5DDCC' }} style={{ flex: 1, height: 6, borderRadius: 3 }} />)}</div>
          <span className="small">{sub}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 6, marginTop: 18 }}>
        {week.map(w => (
          <div key={w.iso} className="stack" style={{ alignItems: 'center', gap: 3, padding: '8px 0 7px', borderRadius: 16, background: w.today ? 'var(--cobalt)' : 'var(--card)', color: w.today ? '#fff' : w.future ? 'var(--ink-3)' : 'var(--ink)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, opacity: w.today ? 1 : 0.6 }}>{w.label}</span>
            <span className="h3">{w.num}</span>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: w.mark ? (w.today ? '#fff' : 'var(--green)') : 'transparent' }} />
          </div>
        ))}
      </div>

      <div className="stack" style={{ gap: 8, marginTop: 14 }}>
        <div className="row between"><span className="micro">Your plan for today</span>
          <button onClick={() => setEditHabits(true)} style={{ border: 0, background: 'none', color: 'var(--cobalt)', fontWeight: 600, height: 36 }}>Edit</button></div>
        {habits.map(h => <HabitRow key={h.id} title={label(h)} detail={detail(h)} done={isDone(d, h.id)} onToggle={() => onToggle(h.id)} />)}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div className="row between">
          <button onClick={() => setStepsOpen(true)} className="stack" style={{ border: 0, background: 'none', padding: 0, textAlign: 'left' }} aria-label={`Steps: ${steps} of ${profile.stepGoal}. Edit`}>
            <span className="small">Steps</span>
            <span className="row" style={{ gap: 4, alignItems: 'baseline' }}><span className="num num-m" style={{ color: 'var(--green)' }}>{steps.toLocaleString()}</span><span className="body-l muted">/ {profile.stepGoal.toLocaleString()}</span></span>
          </button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSteps(steps + 1000)} style={{ height: 40, padding: '0 14px', borderRadius: 999, border: 0, background: 'var(--green-soft)', color: 'var(--green)', fontWeight: 600 }}>+1,000</motion.button>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--sunken)', marginTop: 12, overflow: 'hidden' }}>
          <motion.div initial={false} animate={{ width: `${Math.min(100, steps / profile.stepGoal * 100)}%` }} style={{ height: '100%', background: 'var(--green)', borderRadius: 4 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
        <div className="card stack" style={{ padding: 16, gap: 10 }}>
          <div className="row between"><span className="small">Water</span>
            <motion.button whileTap={{ scale: 0.88 }} onClick={onWater} aria-label="Add a glass of water" style={{ width: 36, height: 36, borderRadius: 999, border: 0, background: 'var(--cobalt)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="plus" size={18} /></motion.button>
          </div>
          <div className="row" style={{ gap: 4, alignItems: 'baseline' }}><span className="num num-m cobalt">{water}</span><span className="body-l muted">/ 6</span></div>
          <div className="row" style={{ gap: 6 }}>{Array.from({ length: 6 }, (_, i) => <span key={i} style={{ width: 18, height: 22, borderRadius: '3px 3px 7px 7px', background: i < water ? 'var(--cobalt)' : 'transparent', border: i < water ? 0 : '1.5px solid var(--tick)' }} />)}</div>
        </div>
        <div className="card stack" style={{ padding: 16, gap: 10, background: 'var(--pink-soft)' }}>
          <span className="small">Sugar today</span>
          <span style={{ fontSize: 15, lineHeight: 1.35 }}>{sugarN === 0 ? 'Sweet thing? Log it, no guilt.' : `Logged ${sugarN === 1 ? 'once' : sugarN + ' times'}. Thanks for being honest.`}</span>
          <button onClick={onSugar} style={{ marginTop: 'auto', height: 40, borderRadius: 999, border: 0, background: 'var(--ink)', color: '#fff', fontWeight: 600 }}>I had sugar</button>
        </div>
      </div>
      <AnimatePresence>
        {editHabits && <HabitsSheet key="h" habits={habits} onClose={() => setEditHabits(false)} save={saveHabit} remove={deleteHabit} />}
        {stepsOpen && <StepsSheet key="s" steps={steps} goal={profile.stepGoal} onClose={() => setStepsOpen(false)} onSave={v => { setSteps(v); setStepsOpen(false); }} />}
      </AnimatePresence>
    </div>
  );
}

function HabitsSheet({ habits, onClose, save, remove }: { habits: HabitDef[]; onClose: () => void; save: (h: Omit<HabitDef, 'id'> & { id?: string }) => void; remove: (id: string) => void }) {
  const [draft, setDraft] = useState<{ id?: string; title: string; detail: string } | null>(null);
  const ideas = ['Walk after lunch', 'No soft drinks', 'Protein at breakfast', '2 glasses of water before noon', 'Stand up every hour'];
  return (
    <Sheet title="Your plan" onClose={onClose}>
      <p className="muted" style={{ margin: '0 0 14px' }}>The things you’ll do each day to reach your goal. Keep it to 3 to 5 so it stays doable.</p>
      <div className="stack" style={{ gap: 8 }}>
        {habits.map(h => (
          <div key={h.id} className="row" style={{ background: 'var(--sunken)', borderRadius: 18, padding: '10px 10px 10px 16px' }}>
            <div className="stack" style={{ flex: 1 }}><b>{h.kind === 'bed' ? 'In bed on time' : h.title}</b><span className="small">{h.kind === 'bed' ? 'Follows your bedtime ladder' : h.detail || 'No detail'}</span></div>
            {h.kind !== 'bed' && <button onClick={() => setDraft({ id: h.id, title: h.title, detail: h.detail })} style={{ border: 0, background: 'none', color: 'var(--cobalt)', fontWeight: 600, height: 44, padding: '0 10px' }}>Edit</button>}
            {habits.length > 1 && <button aria-label={`Remove ${h.title}`} onClick={() => remove(h.id)} className="icon-btn" style={{ border: 0 }}><Icon name="close" size={18} /></button>}
          </div>
        ))}
      </div>
      {draft ? (
        <div className="stack" style={{ gap: 10, marginTop: 18 }}>
          <label className="micro" htmlFor="ht">{draft.id ? 'Edit habit' : 'New habit'}</label>
          <input id="ht" autoFocus value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Walk after lunch" style={field} />
          <input aria-label="Detail" value={draft.detail} onChange={e => setDraft({ ...draft, detail: e.target.value })} placeholder="15 minutes, around the block" style={field} />
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setDraft(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={!draft.title.trim()} onClick={() => { save({ ...draft, title: draft.title.trim(), detail: draft.detail.trim() }); setDraft(null); }}>Save</button>
          </div>
        </div>
      ) : <>
        <p className="micro" style={{ margin: '20px 0 10px' }}>Ideas</p>
        <div className="chips">{ideas.filter(i => !habits.some(h => h.title === i)).map(i => <button key={i} className="chip" onClick={() => save({ title: i, detail: '' })}>+ {i}</button>)}</div>
        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setDraft({ title: '', detail: '' })}>Add your own</button>
      </>}
    </Sheet>
  );
}

function StepsSheet({ steps, goal, onClose, onSave }: { steps: number; goal: number; onClose: () => void; onSave: (n: number) => void }) {
  const [v, setV] = useState(String(steps || ''));
  const n = parseInt(v.replace(/\D/g, ''), 10) || 0;
  return (
    <Sheet title="Steps today" onClose={onClose}>
      <p className="muted" style={{ margin: '0 0 14px' }}>Copy today’s number from your phone’s Health or Fit app. Lyta will read it for you once it’s a native app.</p>
      <input inputMode="numeric" aria-label="Steps" value={v} onChange={e => setV(e.target.value)} placeholder="4200" style={{ ...field, height: 72, fontSize: 40, fontWeight: 800, textAlign: 'center', color: 'var(--green)' }} />
      <p className="small" style={{ textAlign: 'center', margin: '10px 0 0' }}>{n >= goal ? 'Goal reached.' : `${(goal - n).toLocaleString()} to go. A 10 minute walk is about 1,000 steps.`}</p>
      <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => onSave(n)}>Save steps</button>
    </Sheet>
  );
}
