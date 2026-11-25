'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './icons';
import { Sheet } from './Sheet';
import { Figure } from './Figures';
import { plan, RELAX, minutes, type Routine as R } from '@/lib/routines';
import type { RoutineLog } from '@/lib/store';

// Movement features open in orange (Figma: 04 · Knee routine).
export const movementTheme = { '--accent': 'var(--orange)', '--accent-soft': 'var(--orange-soft)' } as CSSProperties;
const buzz = (ms: number | number[] = 30) => { try { navigator.vibrate?.(ms); } catch { /* not supported */ } };
const clock = (s: number) => { s = Math.max(0, Math.ceil(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

function PainScale({ value, onChange, label }: { value: number | null; onChange: (n: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {Array.from({ length: 11 }, (_, n) => (
          <button key={n} role="radio" aria-checked={value === n} onClick={() => onChange(n)}
            style={{ height: 52, borderRadius: 16, border: 0, fontSize: 20, fontWeight: 700, background: value === n ? 'var(--accent)' : 'var(--card)', color: 'var(--ink)' }}>{n}</button>
        ))}
      </div>
      <div className="row between small" style={{ marginTop: 8 }}><span>0 no pain</span><span>5 moderate</span><span>10 worst</span></div>
    </div>
  );
}

function Dashes({ total, at }: { total: number; at: number }) {
  return (
    <div className="row" style={{ gap: 5, marginTop: 16 }} aria-label={`Move ${at + 1} of ${total}`}>
      {Array.from({ length: total }, (_, n) => <span key={n} style={{ flex: 1, height: 5, borderRadius: 3, background: n < at ? 'var(--accent)' : n === at ? 'var(--ink)' : 'var(--line)', transition: 'background .25s' }} />)}
    </div>
  );
}

export function RoutinePlayer({ routine, existing, monthCount, onClose, onFinish }: {
  routine: R; existing?: RoutineLog; monthCount: number; onClose: () => void; onFinish: (log: RoutineLog, didSomething: boolean) => void;
}) {
  const [phase, setPhase] = useState<'check' | 'go' | 'after' | 'done'>('check');
  const [before, setBefore] = useState<number | null>(null);
  const [gentle, setGentle] = useState(false);
  const [i, setI] = useState(0);
  const [count, setCount] = useState(0);
  const [hold, setHold] = useState<{ mode: 'hold' | 'relax'; left: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [hurt, setHurt] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [after, setAfter] = useState<number | null>(null);
  const [doneSteps, setDoneSteps] = useState(0);
  const [prevTimes] = useState(existing?.times ?? 0);
  const [firstToday] = useState(!existing);
  const [startedAt, setStartedAt] = useState(0);
  const [took, setTook] = useState(0);

  const steps = useMemo(() => plan(routine, gentle), [routine, gentle]);
  const step = steps[i];
  const fullMins = minutes(plan(routine, false)), gentleMins = minutes(plan(routine, true));
  const next = steps[i + 1];

  // Timed moves run by themselves: hold, relax, repeat, then move on.
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (phase !== 'go' || !step?.ex.hold || paused || count >= step.reps) return;
    tick.current = setInterval(() => {
      setHold(h => {
        const cur = h ?? { mode: 'hold', left: step.ex.hold! };
        if (cur.left > 1) return { ...cur, left: cur.left - 1 };
        if (cur.mode === 'hold') { buzz(60); setCount(c => c + 1); return { mode: 'relax', left: RELAX }; }
        buzz(20); return { mode: 'hold', left: step.ex.hold! };
      });
    }, 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [phase, step, paused, count]);
  useEffect(() => {
    if (phase === 'go' && step?.ex.hold && count >= step.reps) { const t = setTimeout(() => goTo(i + 1, true), 900); return () => clearTimeout(t); }
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (extra: Partial<RoutineLog>, did: boolean) => onFinish({ at: new Date().toISOString(), ...extra }, did);
  const wrapUp = () => {
    setTook(Math.max(1, Math.round((Date.now() - startedAt) / 60000)));
    if (routine.painCheck) setPhase('after');
    else { save({ times: prevTimes + 1 }, true); setPhase('done'); }
  };
  const goTo = (n: number, completed: boolean) => {
    if (completed) setDoneSteps(d => d + 1);
    setCount(0); setHold(null); setPaused(false);
    if (n >= steps.length) wrapUp(); else setI(Math.max(0, n));
  };
  const start = () => { setI(0); setCount(0); setHold(null); setPaused(false); setStartedAt(Date.now()); setPhase('go'); };
  const finish = () => { save({ before: before ?? 0, after: after ?? undefined, gentle, stopped: stopped || undefined }, doneSteps > 0); setPhase('done'); };

  const worse = after !== null && before !== null && (after > 5 || after - before >= 2);
  const did = doneSteps > 0 || !routine.painCheck;
  const points = did ? (firstToday ? 2 : 0) + 1 : 0;
  const moveLabel = step ? `${routine.rounds > 1 && !gentle ? `Round ${step.round} of ${routine.rounds} · ` : gentle ? 'Gentle · ' : ''}move ${i + 1} of ${steps.length}` : '';
  const holdLeft = hold?.left ?? step?.ex.hold ?? 0;
  const ringPct = step?.ex.hold ? (hold?.mode === 'relax' ? 1 : 1 - (holdLeft - 1) / step.ex.hold) : 0;
  const R_ = 146, C = 2 * Math.PI * R_;

  const doneScreen = phase === 'done';
  return (
    <motion.div role="dialog" aria-modal="true" aria-label={routine.name} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.22 }}
      style={{ ...movementTheme, position: 'fixed', inset: 0, zIndex: 50, background: doneScreen && did ? 'var(--accent)' : 'var(--cream)', overflowY: 'auto', transition: 'background .35s' }}>
      <div className="stack" style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', padding: 'max(env(safe-area-inset-top), 16px) var(--pad) calc(env(safe-area-inset-bottom) + 24px)' }}>
        {!doneScreen && <div className="row between">
          <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" size={20} /></button>
          {phase === 'go' && <span className="small">{moveLabel}</span>}
        </div>}
        {phase === 'go' && <Dashes total={steps.length} at={i} />}

        <AnimatePresence mode="wait">
          {phase === 'check' && !routine.painCheck && <motion.div key="intro" className="stack grow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="micro" style={{ marginTop: 24 }}>{routine.name}{prevTimes ? ` · ${prevTimes} today` : ''}</span>
            <h1 className="h1" style={{ marginTop: 8 }}>Up you get. <span style={{ color: 'var(--accent)' }}>{fullMins} minutes.</span></h1>
            <p className="muted" style={{ margin: '10px 0 18px' }}>{routine.note}</p>
            <div className="stack" style={{ gap: 8 }}>
              {routine.exercises.map((e, n) => <div key={e.id} className="card row" style={{ padding: '14px 16px', gap: 14 }}><span className="h3" style={{ width: 20, color: 'var(--accent)' }}>{n + 1}</span><span className="h3" style={{ flex: 1 }}>{e.name}</span><span className="small">{e.hold && e.reps === 1 ? `${e.hold}s` : `${e.reps}${e.sides ? ' each side' : ''}`}</span></div>)}
            </div>
            <div className="grow" style={{ minHeight: 20 }} />
            <button className="btn btn-accent" onClick={start}>Start</button>
          </motion.div>}

          {phase === 'check' && routine.painCheck && <motion.div key="check" className="stack grow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="micro" style={{ marginTop: 24 }}>{routine.name}</span>
            <h1 className="h1" style={{ marginTop: 8 }}>How are your knees right now?</h1>
            <p className="muted" style={{ margin: '10px 0 20px' }}>Pick a number. We&apos;ll ask again at the end so you can see what the routine does.</p>
            <PainScale value={before} onChange={n => { setBefore(n); setGentle(n >= 6); }} label="Knee pain before" />

            {before !== null && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="stack" style={{ gap: 10, marginTop: 20 }}>
              {before >= 8 && <div className="card" style={{ padding: '14px 16px', background: 'var(--accent-soft)' }}>
                <b>That&apos;s a lot of pain.</b> Resting today is fine. If it stays this bad or your knee is hot and swollen, check with a doctor.
              </div>}
              <div className="row" style={{ background: 'var(--sunken)', borderRadius: 999, padding: 4, gap: 4 }} role="group" aria-label="Version">
                {[false, true].map(g => <button key={String(g)} aria-pressed={gentle === g} onClick={() => setGentle(g)} style={{ flex: 1, height: 44, borderRadius: 999, border: 0, fontWeight: 600, background: gentle === g ? 'var(--card)' : 'transparent', color: gentle === g ? 'var(--ink)' : 'var(--ink-3)' }}>{g ? `Gentle · ${gentleMins} min` : `Full · ${fullMins} min`}</button>)}
              </div>
              <p className="small" style={{ margin: 0 }}>{gentle ? 'Half the reps, lying and seated moves only. Good for flare days.' : `${routine.exercises.length} moves, both legs. ${routine.note}`}</p>
            </motion.div>}

            <div className="grow" style={{ minHeight: 20 }} />
            <div className="card" style={{ padding: '14px 16px', background: 'var(--accent-soft)', marginBottom: 14 }}>
              <b>The pain rule.</b> A dull ache up to 5 is okay if it settles within a couple of hours. Stop if pain is sharp, goes above 5, or your knee swells.
            </div>
            <button className="btn btn-accent" disabled={before === null} onClick={start}>{before === null ? 'Pick a number to start' : before >= 8 ? 'Try the gentle version' : 'Start'}</button>
            {before !== null && before >= 8 && <button className="btn" style={{ marginTop: 8 }} onClick={() => { save({ before, gentle: true, stopped: true }, false); setPhase('done'); }}>Rest today</button>}
            <p className="small" style={{ textAlign: 'center', margin: '12px 0 0' }}>Not a replacement for a physio. If yours gave you exercises, do theirs.</p>
            {existing?.before !== undefined && <p className="small" style={{ textAlign: 'center', margin: '6px 0 0' }}>Done once today ({existing.before} → {existing.after ?? '?'}). Again replaces that.</p>}
          </motion.div>}

          {/* Rep move: picture, name, reps, how to. Figma "01 Rep move". */}
          {phase === 'go' && step && !step.ex.hold && <motion.div key={`rep-${i}`} className="stack grow" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <div style={{ position: 'relative', marginTop: 21, borderRadius: 32, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', height: 'min(270px, 32dvh)', overflow: 'hidden' }}>
              <Figure id={step.ex.id} height={230} />
              {step.side && <span style={{ position: 'absolute', top: 14, right: 14, height: 32, padding: '0 12px', borderRadius: 999, background: 'var(--ink)', color: '#fff', fontWeight: 600, display: 'grid', placeItems: 'center' }}>{step.side} {step.ex.sideLabel ?? 'leg'}</span>}
            </div>
            <h1 className="h1" style={{ marginTop: 18 }}>{step.ex.name}</h1>
            <div className="row" style={{ gap: 6, alignItems: 'baseline', marginTop: 6 }}>
              <span className="num" style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--accent)' }}>{step.reps}</span>
              <span className="h3">reps</span>
            </div>
            <p className="muted" style={{ margin: '10px 0 0', fontSize: 15 }}>{step.ex.setup} {step.ex.steps.join('. ')}.</p>
            <p className="small" style={{ margin: '8px 0 0' }}><b>Easier:</b> {step.ex.easier}</p>
            <div className="grow" style={{ minHeight: 16 }} />
            <div className="row" style={{ gap: 12 }}>
              <button className="icon-btn" aria-label="Previous move" disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }} onClick={() => goTo(i - 1, false)}><Icon name="back" size={20} /></button>
              <button className="btn btn-accent" style={{ flex: 1 }} onClick={() => goTo(i + 1, true)}>{next ? 'Done, next move' : 'Done, finish'}</button>
            </div>
            <div className="row between" style={{ marginTop: 6 }}>
              <button onClick={() => setHurt(true)} className="link-btn">This hurts</button>
              <button onClick={() => goTo(i + 1, false)} className="link-btn">Skip</button>
            </div>
          </motion.div>}

          {/* Timed move: glowing ring that counts itself. Figma "02 Timed move". */}
          {phase === 'go' && step && step.ex.hold && <motion.div key={`hold-${i}`} className="stack grow" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <div className="grow" style={{ minHeight: 24 }} />
            <div style={{ position: 'relative', width: 300, height: 300, alignSelf: 'center' }}>
              <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent) 0%, rgba(255,138,61,.35) 38%, rgba(255,138,61,0) 68%)', opacity: hold?.mode === 'relax' || paused ? 0.35 : 1, transition: 'opacity .4s' }} />
              <svg width="300" height="300" viewBox="0 0 300 300" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
                <circle cx="150" cy="150" r={R_} fill="none" stroke="var(--line)" strokeWidth="4" opacity=".6" />
                <circle cx="150" cy="150" r={R_} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ringPct)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div className="stack" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <span className="num" style={{ fontSize: 62 }}>{count >= step.reps ? 'Nice.' : paused ? 'Paused' : hold?.mode === 'relax' ? 'Relax' : clock(holdLeft)}</span>
                <span className="h3">{step.ex.name}{step.side ? ` · ${step.side.toLowerCase()}` : ''}</span>
              </div>
            </div>
            <div className="grow" style={{ minHeight: 24 }} />
            <div className="card" style={{ padding: 16, borderRadius: 22 }}>
              <div className="row between" style={{ gap: 10 }}>
                <span style={{ fontSize: 17, fontWeight: 500 }}>{step.ex.steps[0]}</span>
                {step.reps > 1 && <span className="small" style={{ flex: 'none' }}>{Math.min(count + 1, step.reps)} of {step.reps}</span>}
              </div>
              <span className="small">{next ? `Up next: ${next.ex.name}${next.side ? `, ${next.side.toLowerCase()}` : ''}` : 'Last move. Then you’re done for today.'}</span>
            </div>
            <div className="grow" style={{ minHeight: 24 }} />
            <div className="row" style={{ justifyContent: 'center' }}>
              <motion.button whileTap={{ scale: 0.94 }} aria-label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused(p => !p)}
                style={{ width: 120, height: 56, borderRadius: 999, border: 0, background: 'var(--sunken)', display: 'grid', placeItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--ink)" aria-hidden="true">{paused ? <path d="M8 5l11 7-11 7z" /> : <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>}</svg>
              </motion.button>
            </div>
            <div className="row between" style={{ marginTop: 6 }}>
              <button onClick={() => { setPaused(true); setHurt(true); }} className="link-btn">This hurts</button>
              <button onClick={() => goTo(i + 1, false)} className="link-btn">Skip</button>
            </div>
          </motion.div>}

          {phase === 'after' && <motion.div key="after" className="stack grow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h1 className="h1" style={{ marginTop: 24 }}>{stopped ? 'Good call.' : 'Nearly done.'} How are your knees now?</h1>
            <p className="muted" style={{ margin: '10px 0 20px' }}>You started at {before}.</p>
            <PainScale value={after} onChange={setAfter} label="Knee pain after" />
            {after !== null && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '14px 16px', marginTop: 20, background: worse ? 'var(--accent-soft)' : 'var(--green-soft)' }}>
              {worse ? 'That’s more than we want. Go easier next time: try the gentle version. If it’s still worse tomorrow or your knee swells, rest it and check with a doctor or physio.'
                : after < (before ?? 0) ? `Down from ${before} to ${after}. That’s the routine working.`
                : 'Steady. That’s what we want. Moving keeps the joint fed and the muscles around it strong.'}
            </motion.div>}
            <div className="grow" style={{ minHeight: 20 }} />
            <button className="btn btn-accent" disabled={after === null} onClick={finish}>Save</button>
          </motion.div>}

          {/* Done: the whole screen turns orange. Figma "03 Done". */}
          {doneScreen && <motion.div key="done" className="stack grow" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.span initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', damping: 14 }}
              className="num" style={{ fontSize: 92, marginTop: 60 }}>{did ? 'Done.' : 'Rest.'}</motion.span>
            <h1 className="h1" style={{ marginTop: 50, maxWidth: 342 }}>{did ? routine.done : 'Resting is the right call today.'}</h1>
            <p className="body-l" style={{ margin: '12px 0 0', maxWidth: 320 }}>
              {!did ? 'Try the gentle version tomorrow.'
                : routine.painCheck ? `${doneSteps} moves in ${took} minute${took === 1 ? '' : 's'}. Ticked on today’s page.`
                : `Break ${prevTimes + 1} today. See you in an hour.`}
            </p>
            {did && <div className="row" style={{ gap: 10, marginTop: 28 }}>
              <div className="stack" style={{ flex: 1, padding: 16, borderRadius: 24, background: 'rgba(255,255,255,.35)', gap: 6 }}><span className="num" style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.04em' }}>{monthCount}</span><span className="small" style={{ color: 'var(--ink)' }}>{routine.painCheck ? 'routines this month' : 'breaks this month'}</span></div>
              <div className="stack" style={{ flex: 1, padding: 16, borderRadius: 24, background: 'rgba(255,255,255,.35)', gap: 6 }}><span className="num" style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.04em' }}>+{points}</span><span className="small" style={{ color: 'var(--ink)' }}>points</span></div>
            </div>}
            <div className="grow" />
            <button className="btn btn-dark" onClick={onClose}>Back to today</button>
          </motion.div>}
        </AnimatePresence>
      </div>

      <AnimatePresence>{hurt && <Sheet title="Does it hurt?" onClose={() => setHurt(false)}>
        <p className="body-l" style={{ margin: '0 0 8px' }}>A dull ache up to 5 is usually okay with arthritis. Try the easier way: {step?.ex.easier.toLowerCase()}</p>
        <p className="muted" style={{ margin: '0 0 18px' }}>Sharp pain, pain above 5, or swelling means stop.</p>
        <div className="stack" style={{ gap: 10 }}>
          <button className="btn btn-dark" onClick={() => { setHurt(false); goTo(i + 1, false); }}>Skip this move</button>
          <button className="btn btn-secondary" onClick={() => { setHurt(false); setStopped(true); wrapUp(); }}>Stop for today</button>
          <button className="btn" onClick={() => { setHurt(false); setPaused(false); }}>It&apos;s okay, keep going</button>
        </div>
      </Sheet>}</AnimatePresence>
    </motion.div>
  );
}
