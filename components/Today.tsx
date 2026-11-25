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

export function Today({ profile, habits, days, today, streak, onToggle, setWater, onSugar, setSteps, saveHabit, deleteHabit }: {
  profile: Profile; habits: HabitDef[]; days: Record<string, Day>; today: string; streak: number;
  onToggle: (id: string, date: string) => void; setWater: (n: number, date: string) => void; onSugar: (date: string) => void; setSteps: (n: number, date: string) => void;
  saveHabit: (h: Omit<HabitDef, 'id'> & { id?: string }) => void; deleteHabit: (id: string) => void;
}) {
  const [sel, setSel] = useState(today);
  const [weekOff, setWeekOff] = useState(0);
  const isToday = sel === today;
  const d = days[sel] ?? {};
  const total = habits.length, n = doneCount(d, habits);
  const bed = bedTarget(profile, sel);
  const left = habits.filter(h => !isDone(d, h.id));
  const sub = !isToday ? (n === total ? 'A full day.' : n === 0 ? 'Nothing ticked. Missed something? Tick it now.' : `${n} of ${total} done that day.`) : n === 0 ? 'Tick one thing and you’ve started.' : n === total ? 'That’s the whole job today.' : left.length === 1 ? `One to go: ${left[0].kind === 'bed' ? 'bedtime' : left[0].title.toLowerCase()}.` : `${left.length} to go.`;
  const now = new Date(); const dow = (now.getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => { const iso = addDays(today, i - dow + weekOff * 7); return { iso, label: 'MTWTFSS'[i], num: Number(iso.slice(8)), today: iso === today, sel: iso === sel, future: iso > today, mark: doneCount(days[iso], habits) > 0 }; });
  const water = d.water ?? 0, sugarN = d.sugar?.length ?? 0, steps = d.steps ?? 0;
  const [editHabits, setEditHabits] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const label = (h: HabitDef) => h.kind === 'bed' ? `In bed by ${bed}` : h.title;
  const detail = (h: HabitDef) => h.kind === 'bed' ? `Bedtime ladder, week ${ladderWeek(profile, sel)} · last coffee ${coffeeCutoff(bed)}` : h.detail;
  const selLabel = new Date(sel + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="screen" style={{ gap: 0 }}>
      <div className="row between" style={{ marginTop: 6 }}>
        {isToday ? <div className="stack"><span className="small">{longDate()}</span><span className="h3">{greeting()}, Don</span></div>
          : <div className="stack"><span className="small">Looking back</span><span className="h3">{selLabel}</span></div>}
        <div className="row" style={{ gap: 8 }}>
          {isToday ? <span className="row" style={{ gap: 6, height: 36, padding: '0 14px 0 12px', borderRadius: 999, background: 'var(--green)', color: '#fff', fontWeight: 600 }}>
            <Icon name="streak" size={16} />{streak > 0 ? streak : 'Day 1'}
          </span> : <button onClick={() => { setSel(today); setWeekOff(0); }} style={{ height: 40, padding: '0 16px', borderRadius: 999, border: 0, background: 'var(--cobalt)', color: '#fff', fontWeight: 600 }}>Back to today</button>}
        </div>
      </div>

      <div className="row between" style={{ alignItems: 'center', marginTop: 18 }}>
        <span className="num num-l cobalt" aria-label={`${n} of ${total} done today`}>{n}/{total}</span>
        <div className="stack" style={{ width: 150, gap: 8 }}>
          <span className="h3 cobalt">{isToday ? 'done today' : 'done that day'}</span>
          <div className="row" style={{ gap: 4 }}>{habits.map((h, i) => <motion.span key={h.id} initial={false} animate={{ backgroundColor: i < n ? '#1C35D6' : '#E5DDCC' }} style={{ flex: 1, height: 6, borderRadius: 3 }} />)}</div>
          <span className="small">{sub}</span>
        </div>
      </div>

      <div className="row between" style={{ marginTop: 16, marginBottom: 8 }}>
        <button className="icon-btn" style={{ border: 0, width: 36, height: 36 }} aria-label="Previous week" onClick={() => setWeekOff(w => w - 1)}><Icon name="back" size={18} /></button>
        <span className="small">{weekOff === 0 ? 'This week' : weekOff === -1 ? 'Last week' : `${-weekOff} weeks ago`}</span>
        <button className="icon-btn" style={{ border: 0, width: 36, height: 36, opacity: weekOff >= 0 ? 0.25 : 1 }} aria-label="Next week" disabled={weekOff >= 0} onClick={() => setWeekOff(w => Math.min(0, w + 1))}><Icon name="back" size={18} style={{ transform: 'rotate(180deg)' }} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 6 }}>
        {week.map(w => (
          <button key={w.iso} disabled={w.future} onClick={() => setSel(w.iso)} aria-pressed={w.sel} aria-label={new Date(w.iso + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            className="stack" style={{ alignItems: 'center', gap: 3, padding: '8px 0 7px', borderRadius: 16, border: w.today && !w.sel ? '1.5px solid var(--cobalt)' : '1.5px solid transparent', background: w.sel ? 'var(--cobalt)' : 'var(--card)', color: w.sel ? '#fff' : w.future ? 'var(--ink-3)' : 'var(--ink)', cursor: w.future ? 'default' : 'pointer' }}>
            <span style={{ fontSize: 13, fontWeight: 500, opacity: w.sel ? 1 : 0.6 }}>{w.label}</span>
            <span className="h3">{w.num}</span>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: w.mark ? (w.sel ? '#fff' : 'var(--green)') : 'transparent' }} />
          </button>
        ))}
      </div>

      <div className="stack" style={{ gap: 8, marginTop: 14 }}>
        <div className="row between"><span className="micro">{isToday ? 'Your plan for today' : 'Your plan that day'}</span>
          <button onClick={() => setEditHabits(true)} style={{ border: 0, background: 'none', color: 'var(--cobalt)', fontWeight: 600, height: 36 }}>Edit</button></div>
        {habits.map(h => <HabitRow key={h.id} title={label(h)} detail={detail(h)} done={isDone(d, h.id)} onToggle={() => onToggle(h.id, sel)} />)}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 12, background: 'var(--ink)', color: '#fff' }}>
        <div className="row between">
          <button onClick={() => setStepsOpen(true)} className="stack" style={{ border: 0, background: 'none', padding: 0, textAlign: 'left' }} aria-label={`Steps: ${steps} of ${profile.stepGoal}. Edit`}>
            <span className="small" style={{ color: 'rgba(255,255,255,.7)' }}>Steps</span>
            <span className="row" style={{ gap: 4, alignItems: 'baseline', color: '#fff' }}><span className="num num-m">{steps.toLocaleString()}</span><span className="body-l" style={{ color: 'rgba(255,255,255,.6)' }}>/ {profile.stepGoal.toLocaleString()}</span></span>
          </button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSteps(steps + 1000, sel)} style={{ height: 40, padding: '0 14px', borderRadius: 999, border: 0, background: '#fff', color: 'var(--ink)', fontWeight: 600 }}>+1,000</motion.button>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,.18)', marginTop: 12, overflow: 'hidden' }}>
          <motion.div initial={false} animate={{ width: `${Math.min(100, steps / profile.stepGoal * 100)}%` }} style={{ height: '100%', background: '#fff', borderRadius: 4 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
        <div className="card stack" style={{ padding: 16, gap: 10 }}>
          <div className="row between"><span className="small">Water</span>
            <div className="row" style={{ gap: 6 }}>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => setWater(water - 1, sel)} disabled={water === 0} aria-label="Remove a glass of water" style={{ width: 36, height: 36, borderRadius: 999, border: '1.5px solid var(--line)', background: 'transparent', color: 'var(--ink)', display: 'grid', placeItems: 'center', fontSize: 22, lineHeight: 1, opacity: water === 0 ? 0.35 : 1 }}>−</motion.button>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => setWater(water + 1, sel)} aria-label="Add a glass of water" style={{ width: 36, height: 36, borderRadius: 999, border: 0, background: 'var(--cobalt)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="plus" size={18} /></motion.button>
            </div>
          </div>
          <div className="row" style={{ gap: 4, alignItems: 'baseline' }}><span className="num num-m cobalt">{water}</span><span className="body-l muted">/ 6</span></div>
          <div className="row" style={{ gap: 6 }}>{Array.from({ length: 6 }, (_, i) => <button key={i} aria-label={`Set water to ${i + 1 === water ? i : i + 1} glasses`} onClick={() => setWater(i + 1 === water ? i : i + 1, sel)} style={{ width: 18, height: 22, padding: 0, borderRadius: '3px 3px 7px 7px', background: i < water ? 'var(--cobalt)' : 'transparent', border: i < water ? 0 : '1.5px solid var(--tick)' }} />)}</div>
          <span className="small" style={{ marginTop: -4 }}>Tap a glass to set it</span>
        </div>
        <div className="card stack" style={{ padding: 16, gap: 10, background: 'var(--pink-soft)' }}>
          <span className="small">{isToday ? "Sugar today" : "Sugar that day"}</span>
          <span style={{ fontSize: 15, lineHeight: 1.35 }}>{sugarN === 0 ? (isToday ? 'Sweet thing? Log it, no guilt.' : 'Nothing logged that day.') : `Logged ${sugarN === 1 ? 'once' : sugarN + ' times'}. Thanks for being honest.`}</span>
          <button onClick={() => onSugar(sel)} style={{ marginTop: 'auto', height: 40, borderRadius: 999, border: 0, background: 'var(--ink)', color: '#fff', fontWeight: 600 }}>I had sugar</button>
        </div>
      </div>
      <AnimatePresence>
        {editHabits && <HabitsSheet key="h" habits={habits} onClose={() => setEditHabits(false)} save={saveHabit} remove={deleteHabit} />}
        {stepsOpen && <StepsSheet key="s" steps={steps} goal={profile.stepGoal} onClose={() => setStepsOpen(false)} onSave={v => { setSteps(v, sel); setStepsOpen(false); }} />}
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
      <input inputMode="numeric" aria-label="Steps" value={v} onChange={e => setV(e.target.value)} placeholder="4200" style={{ ...field, height: 72, fontSize: 40, fontWeight: 800, textAlign: 'center', color: 'var(--ink)' }} />
      <p className="small" style={{ textAlign: 'center', margin: '10px 0 0' }}>{n >= goal ? 'Goal reached.' : `${(goal - n).toLocaleString()} to go. A 10 minute walk is about 1,000 steps.`}</p>
      <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => onSave(n)}>Save steps</button>
    </Sheet>
  );
}
