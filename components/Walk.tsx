'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './icons';

// The walk keeps running if the phone locks or the app closes: we store when it started, not a ticking count.
const KEY = 'lyta-walk';
type Run = { startedAt: number | null; banked: number; target: number };
const read = (): Run | null => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const write = (r: Run | null) => { try { if (r) localStorage.setItem(KEY, JSON.stringify(r)); else localStorage.removeItem(KEY); } catch { /* storage unavailable */ } };
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const TIPS = [
  'Flat ground is kinder to knees than hills or stairs.',
  'Any pace counts. Slow and steady is fine.',
  'Two 10 minute walks count the same as one 20.',
  'Supportive shoes make a real difference.',
  'Walking after a meal helps steady your blood sugar.',
];

export function WalkTimer({ title, walkedToday, onClose, onFinish }: {
  title: string; walkedToday: number; onClose: () => void; onFinish: (minutes: number, steps: number) => void;
}) {
  const [run, setRun] = useState<Run>(() => read() ?? { startedAt: null, banked: 0, target: 20 });
  const [now, setNow] = useState(Date.now());
  const [ended, setEnded] = useState<number | null>(null);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  const running = run.startedAt !== null;
  const secs = run.banked + (running ? (now - run.startedAt!) / 1000 : 0);
  const pct = Math.min(1, secs / (run.target * 60));
  const started = secs > 0;

  useEffect(() => { if (!running) return; const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, [running]);
  useEffect(() => { if (ended === null) write(started ? run : null); }, [run, started, ended]);
  useEffect(() => { if (running && pct >= 1) { try { navigator.vibrate?.([80, 60, 80]); } catch { /* not supported */ } } }, [running, pct >= 1]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => setRun(r => r.startedAt !== null ? { ...r, startedAt: null, banked: r.banked + (Date.now() - r.startedAt) / 1000 } : { ...r, startedAt: Date.now() });
  const end = () => { setRun(r => r.startedAt !== null ? { ...r, startedAt: null, banked: r.banked + (Date.now() - r.startedAt) / 1000 } : r); setEnded(Math.max(1, Math.round(secs / 60))); write(null); };
  const steps = (ended ?? 0) * 100; // about 100 steps a minute at an easy pace

  const r = 118, c = 2 * Math.PI * r;
  return (
    <motion.div role="dialog" aria-modal="true" aria-label={title} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.22 }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: ended === null ? 'var(--ink)' : 'var(--cream)', color: ended === null ? '#fff' : 'var(--ink)', overflowY: 'auto', transition: 'background .3s, color .3s' }}>
      <div className="stack" style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', padding: 'max(env(safe-area-inset-top), 16px) var(--pad) calc(env(safe-area-inset-bottom) + 24px)' }}>
        <div className="row between">
          <button className="icon-btn" aria-label={started && ended === null ? 'Close, the walk keeps running' : 'Close'} onClick={onClose} style={{ borderColor: 'currentColor' }}><Icon name="close" size={20} /></button>
          <span className="small" style={{ color: 'inherit', opacity: 0.7 }}>{walkedToday > 0 ? `${walkedToday} min walked today` : title}</span>
          <span style={{ width: 44 }} />
        </div>

        <AnimatePresence mode="wait">
          {ended === null ? <motion.div key="run" className="stack grow" exit={{ opacity: 0 }}>
            {!started && <>
              <h1 className="h1" style={{ marginTop: 24 }}>How long today?</h1>
              <div className="row" style={{ gap: 8, marginTop: 14 }} role="group" aria-label="Walk length">
                {[10, 15, 20, 30].map(m => <button key={m} aria-pressed={run.target === m} onClick={() => setRun(x => ({ ...x, target: m }))}
                  style={{ flex: 1, height: 48, borderRadius: 999, border: '1.5px solid rgba(255,255,255,.3)', background: run.target === m ? '#fff' : 'transparent', color: run.target === m ? 'var(--ink)' : '#fff', fontWeight: 600 }}>{m} min</button>)}
              </div>
            </>}
            <div className="grow" />
            <button onClick={toggle} aria-label={running ? 'Pause walk' : started ? 'Resume walk' : 'Start walk'}
              style={{ position: 'relative', width: 280, height: 280, alignSelf: 'center', border: 0, background: 'none', padding: 0, color: '#fff', display: 'grid', placeItems: 'center' }}>
              <svg width="280" height="280" viewBox="-10 -10 280 280" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
                <circle cx="130" cy="130" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="12" />
                <circle cx="130" cy="130" r={r} fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .5s linear' }} />
              </svg>
              <div className="stack" style={{ position: 'relative', alignItems: 'center', gap: 6 }}>
                <span className="num" style={{ fontSize: 60 }}>{mmss(secs)}</span>
                <span className="small" style={{ color: 'rgba(255,255,255,.7)', maxWidth: 180, textAlign: 'center' }}>{pct >= 1 ? 'Goal reached. Keep going if you like.' : !started ? `Tap to start · ${run.target} min` : running ? `of ${run.target}:00 · tap to pause` : 'Paused · tap to resume'}</span>
              </div>
            </button>
            <div className="grow" />
            <p className="small" style={{ textAlign: 'center', color: 'rgba(255,255,255,.75)', margin: '0 0 16px' }}>{started ? 'You can lock your phone. The timer keeps going.' : tip}</p>
            {started && <button className="btn" style={{ background: '#fff', color: 'var(--ink)' }} onClick={end}>{pct >= 1 ? 'Finish walk' : 'End walk'}</button>}
          </motion.div>
          : <motion.div key="done" className="stack grow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grow" />
            <span className="num num-xl cobalt">{ended}<span className="h2 cobalt" style={{ letterSpacing: 0 }}> min</span></span>
            <h1 className="h1" style={{ marginTop: 12 }}>{ended >= run.target ? 'Walk done.' : 'Every minute counts.'}</h1>
            <p className="body-l muted" style={{ margin: '10px 0 0' }}>{ended >= run.target ? 'Ticked off for today.' : `Short of ${run.target}, but you moved. It still counts.`} That&apos;s roughly {steps.toLocaleString()} steps.</p>
            <div className="grow" />
            <div className="stack" style={{ gap: 10 }}>
              <button className="btn btn-primary" onClick={() => { onFinish(ended, steps); onClose(); }}>Save and add {steps.toLocaleString()} steps</button>
              <button className="btn btn-secondary" onClick={() => { onFinish(ended, 0); onClose(); }}>Save, my phone counts steps</button>
            </div>
          </motion.div>}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
