'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './icons';
import { Sheet } from './Sheet';
import { minutes, plan, RELAX, type Routine as R } from '@/lib/routines';
import type { RoutineLog } from '@/lib/store';

const buzz = (ms = 30) => { try { navigator.vibrate?.(ms); } catch { /* not supported */ } };

function PainScale({ value, onChange, label }: { value: number | null; onChange: (n: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {Array.from({ length: 11 }, (_, n) => (
          <button key={n} role="radio" aria-checked={value === n} onClick={() => onChange(n)}
            style={{ height: 52, borderRadius: 16, border: 0, fontSize: 20, fontWeight: 700, background: value === n ? (n >= 6 ? 'var(--orange)' : 'var(--cobalt)') : 'var(--card)', color: value === n ? '#fff' : 'var(--ink)' }}>{n}</button>
        ))}
      </div>
      <div className="row between small" style={{ marginTop: 8 }}><span>0 no pain</span><span>5 moderate</span><span>10 worst</span></div>
    </div>
  );
}

function Ring({ pct, children, onClick, label, tone = 'var(--cobalt)' }: { pct: number; children: React.ReactNode; onClick?: () => void; label: string; tone?: string }) {
  const r = 118, c = 2 * Math.PI * r;
  return (
    <motion.button whileTap={onClick ? { scale: 0.96 } : undefined} onClick={onClick} aria-label={label} disabled={!onClick}
      style={{ position: 'relative', width: 260, height: 260, borderRadius: '50%', border: 0, padding: 0, background: 'none', alignSelf: 'center', display: 'grid', placeItems: 'center', cursor: onClick ? 'pointer' : 'default', color: 'var(--ink)' }}>
      <svg width="260" height="260" viewBox="0 0 260 260" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx="130" cy="130" r={r} fill="var(--card)" stroke="var(--line)" strokeWidth="12" />
        <motion.circle cx="130" cy="130" r={r} fill="none" stroke={tone} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - Math.min(1, pct)) }} transition={{ duration: 0.35 }} />
      </svg>
      <div className="stack" style={{ position: 'relative', alignItems: 'center', gap: 4 }}>{children}</div>
    </motion.button>
  );
}

export function RoutinePlayer({ routine, existing, onClose, onFinish }: {
  routine: R; existing?: RoutineLog; onClose: () => void; onFinish: (log: RoutineLog, didSomething: boolean) => void;
}) {
  const [phase, setPhase] = useState<'check' | 'go' | 'after' | 'done'>('check');
  const [before, setBefore] = useState<number | null>(null);
  const [gentle, setGentle] = useState(false);
  const [i, setI] = useState(0);
  const [count, setCount] = useState(0);
  const [hold, setHold] = useState<{ mode: 'hold' | 'relax'; left: number } | null>(null);
  const [paused, setPaused] = useState(true);
  const [hurt, setHurt] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [after, setAfter] = useState<number | null>(null);
  const [doneSteps, setDoneSteps] = useState(0);
  const [prevTimes] = useState(existing?.times ?? 0);

  const steps = useMemo(() => plan(routine, gentle), [routine, gentle]);
  const step = steps[i];
  const fullMins = minutes(plan(routine, false)), gentleMins = minutes(plan(routine, true));

  // Hold timer: hold for N seconds, relax 3, repeat until reps are done.
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (phase !== 'go' || !step?.ex.hold || paused) return;
    tick.current = setInterval(() => {
      setHold(h => {
        const cur = h ?? { mode: 'hold', left: step.ex.hold! };
        if (cur.left > 1) return { ...cur, left: cur.left - 1 };
        if (cur.mode === 'hold') { buzz(60); setCount(c => c + 1); return { mode: 'relax', left: RELAX }; }
        buzz(20); return { mode: 'hold', left: step.ex.hold! };
      });
    }, 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [phase, step, paused]);
  useEffect(() => { if (step && count >= step.reps) setPaused(true); }, [count, step]);

  const goTo = (n: number, completed: boolean) => {
    if (completed) setDoneSteps(d => d + 1);
    setCount(0); setHold(null); setPaused(true);
    if (n >= steps.length) { if (routine.painCheck) setPhase('after'); else { onFinish({ times: prevTimes + 1, at: new Date().toISOString() }, true); setDoneSteps(d => d); setPhase('done'); } } else setI(n);
  };
  const start = () => { setI(0); setCount(0); setHold(null); setPaused(true); setPhase('go'); };
  const finish = () => {
    onFinish({ ...(routine.painCheck ? { before: before ?? 0, after: after ?? undefined, gentle } : { times: prevTimes + 1 }), stopped: stopped || undefined, at: new Date().toISOString() }, doneSteps > 0);
    setPhase('done');
  };

  const reached = step ? count >= step.reps : false;
  const worse = after !== null && before !== null && (after > 5 || after - before >= 2);

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={routine.name} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.22 }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--cream)', overflowY: 'auto' }}>
      <div className="stack" style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', padding: 'max(env(safe-area-inset-top), 16px) var(--pad) calc(env(safe-area-inset-bottom) + 24px)' }}>
        <div className="row between">
          <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" size={20} /></button>
          {phase === 'go' && <span className="small">{gentle ? 'Gentle version' : routine.rounds > 1 ? `Round ${step.round} of ${routine.rounds}` : `${i + 1} of ${steps.length}`}</span>}
          <span style={{ width: 44 }} />
        </div>

        {phase === 'go' && <div className="row" style={{ gap: 3, marginTop: 14 }} aria-label={`Exercise ${i + 1} of ${steps.length}`}>
          {steps.map((_, n) => <span key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n < i ? 'var(--cobalt)' : n === i ? 'var(--ink)' : 'var(--line)' }} />)}
        </div>}

        <AnimatePresence mode="wait">
          {phase === 'check' && !routine.painCheck && <motion.div key="intro" className="stack grow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="micro" style={{ marginTop: 24 }}>{routine.name}{existing?.times ? ` · ${existing.times} today` : ''}</span>
            <h1 className="h1 cobalt" style={{ marginTop: 8 }}>Up you get. {minutes(steps)} minutes.</h1>
            <p className="muted" style={{ margin: '10px 0 18px' }}>{routine.note}</p>
            <div className="stack" style={{ gap: 8 }}>
              {routine.exercises.map((e, n) => <div key={e.id} className="card row" style={{ padding: '14px 16px', gap: 14 }}><span className="h3 cobalt" style={{ width: 20 }}>{n + 1}</span><span className="h3" style={{ flex: 1 }}>{e.name}</span><span className="small">{e.hold && e.reps === 1 ? `${e.hold}s` : `${e.reps}${e.sides ? ' each side' : ''}`}</span></div>)}
            </div>
            <div className="grow" style={{ minHeight: 20 }} />
            <button className="btn btn-primary" onClick={start}>Start</button>
          </motion.div>}

          {phase === 'check' && routine.painCheck && <motion.div key="check" className="stack grow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="micro" style={{ marginTop: 24 }}>{routine.name}</span>
            <h1 className="h1 cobalt" style={{ marginTop: 8 }}>How are your knees right now?</h1>
            <p className="muted" style={{ margin: '10px 0 20px' }}>Pick a number. We&apos;ll check again at the end so you can see what the routine does.</p>
            <PainScale value={before} onChange={n => { setBefore(n); setGentle(n >= 6); }} label="Knee pain before" />

            {before !== null && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="stack" style={{ gap: 10, marginTop: 20 }}>
              {before >= 8 && <div className="card" style={{ padding: '14px 16px', background: 'var(--orange-soft)' }}>
                <b>That&apos;s a lot of pain.</b> Resting today is fine and still counts. If it stays this bad or your knee is hot and swollen, check with a doctor.
              </div>}
              <div className="row" style={{ background: 'var(--sunken)', borderRadius: 999, padding: 4, gap: 4 }} role="group" aria-label="Version">
                {[false, true].map(g => <button key={String(g)} aria-pressed={gentle === g} onClick={() => setGentle(g)} style={{ flex: 1, height: 44, borderRadius: 999, border: 0, fontWeight: 600, background: gentle === g ? 'var(--card)' : 'transparent', color: gentle === g ? 'var(--ink)' : 'var(--ink-3)' }}>{g ? `Gentle · ${gentleMins} min` : `Full · ${fullMins} min`}</button>)}
              </div>
              <p className="small" style={{ margin: 0 }}>{gentle ? 'Half the reps, lying and seated moves only. Good for flare days.' : `${routine.exercises.length} moves, both legs. ${routine.note}`}</p>
            </motion.div>}

            <div className="grow" style={{ minHeight: 20 }} />
            <div className="card" style={{ padding: '14px 16px', background: 'var(--cobalt-soft)', color: 'var(--cobalt-deep)', marginBottom: 14 }}>
              <b>The pain rule.</b> A dull ache up to 5 is okay if it settles within a couple of hours. Stop if pain is sharp, goes above 5, or your knee swells.
            </div>
            <button className="btn btn-primary" disabled={before === null} onClick={start}>{before === null ? 'Pick a number to start' : before >= 8 ? 'Try the gentle version' : 'Start'}</button>
            {before !== null && before >= 8 && <button className="btn" style={{ marginTop: 8 }} onClick={() => { onFinish({ before, gentle: true, stopped: true, at: new Date().toISOString() }, false); setPhase('done'); }}>Rest today</button>}
            <p className="small" style={{ textAlign: 'center', margin: '12px 0 0' }}>Not a replacement for a physio. If yours gave you exercises, do theirs.</p>
          </motion.div>}

          {phase === 'go' && step && <motion.div key={`go-${i}`} className="stack grow" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <div className="row" style={{ gap: 8, marginTop: 22, alignItems: 'center' }}>
              <h1 className="h1" style={{ flex: 1 }}>{step.ex.name}</h1>
              {step.side && <span style={{ height: 32, padding: '0 12px', borderRadius: 999, background: 'var(--ink)', color: '#fff', fontWeight: 600, display: 'grid', placeItems: 'center', flex: 'none' }}>{step.side} {step.ex.sideLabel ?? 'leg'}</span>}
            </div>
            <p className="muted" style={{ margin: '8px 0 10px' }}>{step.ex.setup}</p>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }} className="body-l">{step.ex.steps.map(t => <li key={t}>{t}</li>)}</ol>

            <div style={{ margin: '22px 0 12px', display: 'flex', justifyContent: 'center' }}>
              {step.ex.hold ? (
                <Ring pct={hold?.mode === 'hold' ? 1 - (hold.left - 1) / step.ex.hold : count / step.reps} label={paused ? 'Start the timer' : 'Pause'} onClick={reached ? undefined : () => setPaused(p => !p)} tone={hold?.mode === 'relax' ? 'var(--green)' : 'var(--cobalt)'}>
                  {reached ? <><span className="num num-l cobalt">{count}</span><span className="h3">done</span></>
                    : paused ? <><span className="h2 cobalt">{count === 0 ? 'Tap to start' : 'Paused'}</span><span className="small">{count} of {step.reps} · {step.reps === 1 ? `${step.ex.hold} seconds` : `hold ${step.ex.hold}s`}</span></>
                    : <><span className="micro">{hold?.mode === 'relax' ? 'Relax' : step.ex.cue ?? 'Hold'}</span><span className="num num-l" style={{ color: hold?.mode === 'relax' ? 'var(--green)' : 'var(--cobalt)' }}>{hold?.left ?? step.ex.hold}</span><span className="small">{count} of {step.reps}</span></>}
                </Ring>
              ) : (
                <Ring pct={count / step.reps} label={`Count a rep. ${count} of ${step.reps}`} onClick={reached ? undefined : () => { buzz(); setCount(c => c + 1); }}>
                  <span className="num num-l cobalt">{count}</span>
                  <span className="small">{reached ? 'done' : `of ${step.reps} · tap each rep`}</span>
                </Ring>
              )}
            </div>
            <p className="small" style={{ textAlign: 'center', margin: 0 }}><b>Easier:</b> {step.ex.easier}</p>

            <div className="grow" style={{ minHeight: 16 }} />
            <button className={reached ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => goTo(i + 1, reached)}>{reached ? (i + 1 === steps.length ? 'Finish' : 'Next') : 'Skip this one'}</button>
            <button onClick={() => { setPaused(true); setHurt(true); }} style={{ marginTop: 10, height: 44, border: 0, background: 'none', color: 'var(--ink-2)', fontWeight: 600 }}>This hurts</button>
          </motion.div>}

          {phase === 'after' && <motion.div key="after" className="stack grow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h1 className="h1 cobalt" style={{ marginTop: 24 }}>{stopped ? 'Good call.' : 'Done.'} How are your knees now?</h1>
            <p className="muted" style={{ margin: '10px 0 20px' }}>You started at {before}.</p>
            <PainScale value={after} onChange={setAfter} label="Knee pain after" />
            {after !== null && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '14px 16px', marginTop: 20, background: worse ? 'var(--orange-soft)' : 'var(--green-soft)' }}>
              {worse ? 'That’s more than we want. Go easier next time: try the gentle version. If it’s still worse tomorrow or your knee swells, rest it and check with a doctor or physio.'
                : after < (before ?? 0) ? `Down from ${before} to ${after}. That’s the routine working.`
                : 'Steady. That’s what we want. Moving keeps the joint fed and the muscles holding it strong.'}
            </motion.div>}
            <div className="grow" style={{ minHeight: 20 }} />
            <button className="btn btn-primary" disabled={after === null} onClick={finish}>Save</button>
          </motion.div>}

          {phase === 'done' && <motion.div key="done" className="stack grow" style={{ alignItems: 'flex-start' }} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="grow" />
            <span className="num num-xl cobalt">{doneSteps > 0 || !routine.painCheck ? '+1' : 'Rest'}</span>
            <h1 className="h1" style={{ marginTop: 12 }}>{doneSteps > 0 || !routine.painCheck ? routine.done : 'Resting is the right call today.'}</h1>
            <p className="body-l muted" style={{ margin: '10px 0 0' }}>{doneSteps > 0 || !routine.painCheck ? (routine.painCheck ? `${doneSteps} of ${steps.length} moves. Ticked off for today.` : `Break ${prevTimes + 1} today. See you in an hour.`) : 'Try the gentle version tomorrow.'}</p>
            <div className="grow" />
            <button className="btn btn-primary" onClick={onClose}>Back to today</button>
          </motion.div>}
        </AnimatePresence>
        {existing && routine.painCheck && phase === 'check' && <p className="small" style={{ textAlign: 'center', margin: '8px 0 0' }}>Already done today ({existing.before} → {existing.after ?? '?'}). Doing it again replaces that.</p>}
      </div>

      <AnimatePresence>{hurt && <Sheet title="Does it hurt?" onClose={() => setHurt(false)}>
        <p className="body-l" style={{ margin: '0 0 8px' }}>A dull ache up to 5 is usually okay with arthritis. Try the easier version: {step?.ex.easier.toLowerCase()}</p>
        <p className="muted" style={{ margin: '0 0 18px' }}>Sharp pain, pain above 5, or swelling means stop.</p>
        <div className="stack" style={{ gap: 10 }}>
          <button className="btn btn-dark" onClick={() => { setHurt(false); goTo(i + 1, false); }}>Skip this exercise</button>
          <button className="btn btn-secondary" onClick={() => { setHurt(false); setStopped(true); setPhase('after'); }}>Stop for today</button>
          <button className="btn" onClick={() => setHurt(false)}>It&apos;s okay, keep going</button>
        </div>
      </Sheet>}</AnimatePresence>
    </motion.div>
  );
}
