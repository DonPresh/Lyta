'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ruler } from './Ruler';
import { Icon, LytaMark } from './icons';
import { BigNumber } from './BigNumber';
import { isoDate, type HabitDef, type Profile } from '@/lib/store';
import { field } from './Sheet';

const fmtTime = (m: number) => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

type Option = HabitDef & { on: boolean; editing?: boolean };
const OPTIONS: Option[] = [
  { id: 'food', title: 'Real food, not sugar', detail: 'Eat something real before noon', on: false },
  { id: 'walk', title: 'Walk every day', detail: '20 minutes, any pace', on: false },
  { id: 'bed', title: 'Earlier bedtime', detail: '30 minutes earlier each week', kind: 'bed', on: false },
  { id: 'move', title: 'Get up every hour', detail: 'Stand and stretch for 2 minutes', on: false },
  { id: 'knee', title: 'Knee-friendly routine', detail: 'Guided, about 10 minutes. Arthritis-friendly', routine: 'knee', on: false },
  { id: 'drinks', title: 'No sugary drinks', detail: 'Water, tea or black coffee instead', on: false },
  { id: 'protein', title: 'Protein at breakfast', detail: 'Eggs, beans, yoghurt or similar', on: false },
];

function Progress({ step, total }: { step: number; total: number }) {
  const pct = Math.round(step / total * 100);
  return (
    <div style={{ position: 'relative', height: 40, marginTop: 14 }} aria-label={`Step ${step} of ${total}`}>
      <div className="row" style={{ position: 'absolute', inset: '14px 0 0', gap: 8 }}>
        <b className="cobalt" style={{ fontWeight: 900 }}>W</b>
        <div style={{ flex: 1, height: 3, background: 'var(--line)', borderRadius: 2, position: 'relative' }}>
          <motion.div initial={false} animate={{ width: `${pct}%` }} style={{ height: 3, background: 'var(--cobalt)', borderRadius: 2 }} />
          <motion.div initial={false} animate={{ left: `${pct}%` }} style={{ position: 'absolute', top: -14, transform: 'translateX(-50%)', fontSize: 12, fontWeight: 600, color: 'var(--cobalt)' }}>{pct}%</motion.div>
        </div>
        <b className="cobalt" style={{ fontWeight: 900 }}>W</b>
      </div>
    </div>
  );
}

export function Onboarding({ onDone }: { onDone: (p: Profile, kg: number, habits: HabitDef[]) => void }) {
  const [step, setStep] = useState(0);
  const [opts, setOpts] = useState<Option[]>(OPTIONS);
  const [kg, setKg] = useState(100);
  const [goal, setGoal] = useState(80);
  const [bed, setBed] = useState(26 * 60); // 02:00, minutes from midnight of the previous day
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

  const finish = async (askNotify: boolean) => {
    if (askNotify && 'Notification' in window) { try { await Notification.requestPermission(); } catch { /* not supported */ } }
    const habits = opts.filter(o => o.on && o.title.trim()).map(({ id, title, detail, kind, routine }) => ({ id, title: title.trim(), detail: detail.trim(), ...(kind ? { kind } : {}), ...(routine ? { routine } : {}) }));
    onDone({ name: name.trim(), startKg: kg, goalKg: Math.min(goal, kg - 0.1), bedStart: fmtTime(bed), bedGoal: '23:00', startedOn: isoDate(), stepGoal: 6000, pace: 0.75 }, kg, habits);
  };

  const wantsBed = opts.some(o => o.on && o.kind === 'bed');
  const flow = ['welcome', 'name', 'weight', 'goal', 'habits', ...(wantsBed ? ['bed'] : []), 'remind'] as const;
  const at = flow[Math.min(step, flow.length - 1)];
  const next = () => setStep(s => s + 1);
  const picked = opts.filter(o => o.on).length;
  const patch = (id: string, p: Partial<Option>) => setOpts(os => os.map(o => o.id === id ? { ...o, ...p } : o));
  const toU = (v: number) => unit === 'kg' ? v : Math.round(v * 2.2046);
  const fromU = (v: number) => unit === 'kg' ? v : Math.round(v / 2.2046 * 10) / 10;
  const toLose = Math.max(0, +(kg - goal).toFixed(1));

  const shown = unit === 'kg' ? kg : Math.round(kg * 2.2046);
  const Value = ({ big, u }: { big: string; u?: string }) => (
    <div className="row" style={{ justifyContent: 'center', alignItems: 'flex-end', gap: 6, margin: '36px 0 10px' }}>
      <span className="num num-xl cobalt">{big}</span>{u && <span className="h2 cobalt" style={{ fontWeight: 900 }}>{u}</span>}
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div key={step} className="screen" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
        {at === 'welcome' && <>
          <div className="row" style={{ gap: 8, marginTop: 8 }}><LytaMark size={28} /><span className="h3 cobalt" style={{ fontWeight: 900, fontSize: 24 }}>lyta</span></div>
          <div className="grow" />
          <span className="num num-xl cobalt" style={{ marginLeft: -4 }}>1 day</span>
          <p className="h2 cobalt" style={{ margin: '12px 0 28px' }}>at a time</p>
          <h1 className="h1">A kinder way to get lighter</h1>
          <p className="body-l muted" style={{ margin: '10px 0 32px' }}>Pick a few small habits that fit your life. Tick them off, log sugar without guilt, and watch the weight come off slowly. No calorie counting.</p>
          <button className="btn btn-primary" onClick={next}>Let&apos;s start</button>
        </>}

        {step > 0 && <div className="row between" style={{ marginTop: 8 }}>
          <button className="icon-btn" aria-label="Back" onClick={() => setStep(s => s - 1)}><Icon name="back" size={20} /></button>
        </div>}
        {step > 0 && <Progress step={step} total={flow.length - 1} />}

        {at === 'name' && <>
          <h1 className="h1 cobalt" style={{ marginTop: 24 }}>What should we call you?</h1>
          <p className="muted" style={{ margin: '10px 0 24px' }}>Just a first name or nickname. It stays on this phone.</p>
          <input aria-label="Your name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && name.trim()) next(); }} placeholder="Your name" autoFocus maxLength={24}
            style={{ ...field, height: 72, fontSize: 32, fontWeight: 800, color: 'var(--cobalt)' }} />
          <div className="grow" />
          <button className="btn btn-primary" disabled={!name.trim()} onClick={next}>{name.trim() ? `Hi, ${name.trim()}` : 'Next'}</button>
          <button className="btn" style={{ marginTop: 8 }} onClick={() => { setName(''); next(); }}>Skip</button>
        </>}

        {at === 'weight' && <>
          <h1 className="h1 cobalt" style={{ marginTop: 24 }}>What do you weigh today?</h1>
          <p className="muted" style={{ margin: '10px 0 0' }}>Weigh in before breakfast. Only you will ever see this number.</p>
          <div style={{ margin: '36px 0 10px' }}><BigNumber size="xl" value={shown} onChange={v => setKg(unit === 'kg' ? v : Math.round(v / 2.2046 * 10) / 10)} min={unit === 'kg' ? 40 : 88} max={unit === 'kg' ? 250 : 550} decimals={unit === 'kg' ? 1 : 0} unit={unit} label="Your weight today" /></div>
          <p className="small" style={{ textAlign: 'center', margin: '0 0 6px' }}>Tap the number to type it, or slide the ruler.</p>
          <Ruler min={40} max={250} step={0.1} value={kg} onChange={setKg} label="Current weight" valueText={`${kg.toFixed(1)} kilograms`} />
          <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
            <div className="row" style={{ background: 'var(--sunken)', borderRadius: 999, padding: 4, gap: 4 }} role="group" aria-label="Units">
              {(['kg', 'lbs'] as const).map(u => <button key={u} aria-pressed={unit === u} onClick={() => setUnit(u)} style={{ width: 72, height: 36, borderRadius: 999, border: 0, fontWeight: 600, background: unit === u ? 'var(--card)' : 'transparent', color: unit === u ? 'var(--ink)' : 'var(--ink-3)' }}>{u}</button>)}
            </div>
          </div>
          <div className="grow" />
          <button className="btn btn-primary" onClick={() => { if (goal >= kg) setGoal(Math.max(40, Math.round(kg * 0.85))); next(); }}>Next</button>
        </>}

        {at === 'goal' && <>
          <h1 className="h1 cobalt" style={{ marginTop: 24 }}>What would you like to weigh?</h1>
          <p className="muted" style={{ margin: '10px 0 0' }}>Saying the number out loud is an important (and hard) first step. You can change it later.</p>
          <div style={{ margin: '36px 0 10px' }}><BigNumber size="xl" value={toU(goal)} onChange={v => setGoal(Math.min(fromU(v), kg - 0.1))} min={toU(40)} max={toU(kg)} decimals={unit === 'kg' ? 1 : 0} unit={unit} label="Goal weight" /></div>
          <Ruler min={40} max={Math.max(41, Math.floor(kg))} step={0.1} value={goal} onChange={setGoal} label="Goal weight" valueText={`${goal.toFixed(1)} kilograms`} />
          <div className="card" style={{ background: 'var(--cobalt-soft)', color: 'var(--cobalt-deep)', padding: '16px 18px', marginTop: 16 }}>
            That&apos;s {toU(toLose)} {unit} to lose. At a safe 0.5 to 1 kg a week, about {Math.max(1, Math.ceil(toLose / 4))} to {Math.max(1, Math.ceil(toLose / 2.2))} months.
          </div>
          <button onClick={() => setStep(2)} className="small" style={{ alignSelf: 'center', marginTop: 14, border: 0, background: 'none', textDecoration: 'underline' }}>Today: {toU(kg)} {unit}. Change it</button>
          <div className="grow" />
          <button className="btn btn-primary" onClick={next}>Next</button>
        </>}

        {at === 'habits' && <>
          <h1 className="h1 cobalt" style={{ marginTop: 24 }}>What do you want to work on?</h1>
          <p className="muted" style={{ margin: '10px 0 16px' }}>Pick up to 3 to start. Tap Edit to make one fit you. You can change these any time.</p>
          <div className="stack" style={{ gap: 8, overflowY: 'auto', margin: '0 -4px', padding: '0 4px 8px' }}>
            {opts.map(o => (
              <div key={o.id} className="card" style={{ padding: 0, border: o.on ? '2px solid var(--cobalt)' : '2px solid transparent' }}>
                <div className="row" style={{ gap: 12, padding: '12px 12px 12px 14px' }}>
                  <button aria-pressed={o.on} aria-label={`${o.on ? 'Remove' : 'Add'} ${o.title || 'habit'}`} onClick={() => patch(o.id, { on: !o.on })}
                    style={{ width: 28, height: 28, flex: 'none', borderRadius: 999, display: 'grid', placeItems: 'center', border: o.on ? 0 : '1.5px solid var(--tick)', background: o.on ? 'var(--cobalt)' : 'transparent', color: '#fff' }}>
                    {o.on && <Icon name="check" size={16} />}
                  </button>
                  <button onClick={() => patch(o.id, { on: !o.on })} className="stack grow" style={{ border: 0, background: 'none', textAlign: 'left', padding: 0, gap: 2, color: 'var(--ink)' }}>
                    <span style={{ fontWeight: 600, fontSize: 17 }}>{o.title || 'Untitled'}</span>
                    {o.detail && <span className="small">{o.detail}</span>}
                  </button>
                  <button onClick={() => patch(o.id, { editing: !o.editing, on: true })} style={{ border: 0, background: 'none', color: 'var(--cobalt)', fontWeight: 600, padding: '6px 4px' }}>{o.editing ? 'Done' : 'Edit'}</button>
                </div>
                {o.editing && <div className="stack" style={{ gap: 8, padding: '0 12px 12px' }}>
                  <input aria-label="Habit name" value={o.title} onChange={e => patch(o.id, { title: e.target.value })} placeholder="e.g. Walk after lunch" style={field} autoFocus />
                  <input aria-label="Details" value={o.detail} onChange={e => patch(o.id, { detail: e.target.value })} placeholder="Details (optional)" style={field} />
                  {!OPTIONS.some(x => x.id === o.id) && <button onClick={() => setOpts(os => os.filter(x => x.id !== o.id))} style={{ alignSelf: 'flex-start', border: 0, background: 'none', color: 'var(--ink-3)', fontWeight: 600, padding: 4 }}>Remove</button>}
                </div>}
              </div>
            ))}
            <button className="chip" style={{ alignSelf: 'flex-start' }} onClick={() => setOpts(os => [...os, { id: Math.random().toString(36).slice(2, 9), title: '', detail: '', on: true, editing: true }])}>+ Add your own</button>
          </div>
          {picked > 3 && <p className="small" style={{ margin: '8px 0 0' }}>{picked} picked. Fewer habits are easier to keep, but it&apos;s your call.</p>}
          <div style={{ height: 12 }} />
          <button className="btn btn-primary" disabled={picked === 0} style={{ opacity: picked === 0 ? 0.4 : 1 }} onClick={() => { setOpts(os => os.map(o => ({ ...o, editing: false }))); next(); }}>{picked === 0 ? 'Pick at least one' : 'Next'}</button>
        </>}

        {at === 'bed' && <>
          <h1 className="h1 cobalt" style={{ marginTop: 24 }}>When do you usually fall asleep?</h1>
          <p className="muted" style={{ margin: '10px 0 0' }}>Be honest. Late nights make sugar cravings worse, so we&apos;ll fix this slowly.</p>
          <Value big={fmtTime(bed)} />
          <Ruler min={21 * 60} max={29 * 60} step={15} value={bed} onChange={setBed} label="Usual bedtime" valueText={fmtTime(bed)} />
          <div className="card" style={{ background: 'var(--cobalt-soft)', color: 'var(--cobalt-deep)', padding: '16px 18px', marginTop: 16 }}>
            {bed > 23 * 60 ? `Your bedtime moves 30 minutes earlier each week until 23:00. That's ${Math.ceil((bed - 23 * 60) / 30)} small steps.` : 'Already early. We’ll just help you keep it.'}
          </div>
          <div className="grow" />
          <button className="btn btn-primary" onClick={next}>Next</button>
        </>}

        {at === 'remind' && <>
          <h1 className="h1 cobalt" style={{ marginTop: 24 }}>Want a few gentle nudges?</h1>
          <p className="muted" style={{ margin: '10px 0 20px' }}>Water, your habits, last coffee and wind down. Short and kind, never nagging.</p>
          <p className="small">On iPhone, add Lyta to your home screen first (Share, then Add to Home Screen) so reminders can reach you.</p>
          <div className="grow" />
          <div className="stack" style={{ gap: 10 }}>
            <button className="btn btn-primary" onClick={() => finish(true)}>Turn on reminders</button>
            <button className="btn btn-secondary" onClick={() => finish(false)}>Maybe later</button>
          </div>
        </>}
      </motion.div>
    </AnimatePresence>
  );
}
