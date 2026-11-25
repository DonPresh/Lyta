'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ruler } from './Ruler';
import { Icon, LytaMark } from './icons';
import { BigNumber } from './BigNumber';
import { isoDate, type Profile } from '@/lib/store';

const fmtTime = (m: number) => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

function Progress({ step }: { step: number }) {
  const pct = step * 25;
  return (
    <div style={{ position: 'relative', height: 40, marginTop: 14 }} aria-label={`Step ${step} of 4`}>
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

export function Onboarding({ onDone }: { onDone: (p: Profile, kg: number) => void }) {
  const [step, setStep] = useState(0);
  const [kg, setKg] = useState(100);
  const [loss, setLoss] = useState(28);
  const [bed, setBed] = useState(26 * 60); // 02:00, minutes from midnight of the previous day
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

  const finish = async (askNotify: boolean) => {
    if (askNotify && 'Notification' in window) { try { await Notification.requestPermission(); } catch { /* not supported */ } }
    onDone({ startKg: kg, goalKg: +(kg - loss).toFixed(1), bedStart: fmtTime(bed), bedGoal: '23:00', startedOn: isoDate(), stepGoal: 6000, pace: 0.75 }, kg);
  };

  const shown = unit === 'kg' ? kg : Math.round(kg * 2.2046);
  const Value = ({ big, u }: { big: string; u?: string }) => (
    <div className="row" style={{ justifyContent: 'center', alignItems: 'flex-end', gap: 6, margin: '36px 0 10px' }}>
      <span className="num num-xl cobalt">{big}</span>{u && <span className="h2 cobalt" style={{ fontWeight: 900 }}>{u}</span>}
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div key={step} className="screen" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
        {step === 0 && <>
          <div className="row" style={{ gap: 8, marginTop: 8 }}><LytaMark size={28} /><span className="h3 cobalt" style={{ fontWeight: 900, fontSize: 24 }}>lyta</span></div>
          <div className="grow" />
          <span className="num num-xl cobalt" style={{ marginLeft: -4 }}>−28</span>
          <p className="h2 cobalt" style={{ margin: '12px 0 28px' }}>kg, one small day at a time</p>
          <h1 className="h1">A kinder way to get lighter</h1>
          <p className="body-l muted" style={{ margin: '10px 0 32px' }}>Three small habits a day: real food, a 10 minute knee routine and an earlier bedtime. No calorie counting. No guilt.</p>
          <button className="btn btn-primary" onClick={() => setStep(1)}>Let&apos;s start</button>
        </>}

        {step > 0 && <div className="row between" style={{ marginTop: 8 }}>
          <button className="icon-btn" aria-label="Back" onClick={() => setStep(s => s - 1)}><Icon name="back" size={20} /></button>
        </div>}
        {step > 0 && <Progress step={step} />}

        {step === 1 && <>
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
          <button className="btn btn-primary" onClick={() => setStep(2)}>Next</button>
        </>}

        {step === 2 && <>
          <h1 className="h1 cobalt" style={{ marginTop: 24 }}>What&apos;s your weight loss goal?</h1>
          <p className="muted" style={{ margin: '10px 0 0' }}>Saying the number out loud is an important (and hard) first step.</p>
          <div style={{ margin: '36px 0 10px' }}><BigNumber size="xl" value={loss} onChange={setLoss} min={1} max={Math.max(1, Math.floor(kg - 40))} unit="kg" label="Kilograms to lose" /></div>
          <Ruler min={1} max={80} step={1} value={loss} onChange={setLoss} label="Weight to lose" valueText={`${loss} kilograms`} />
          <div className="card" style={{ background: 'var(--cobalt-soft)', color: 'var(--cobalt-deep)', padding: '16px 18px', marginTop: 16 }}>
            At a safe 0.5 to 1 kg a week, that&apos;s about {Math.ceil(loss / 4)} to {Math.ceil(loss / 2.2)} months. Goal: {+(kg - loss).toFixed(1)} kg.
          </div>
          <div className="grow" />
          <button className="btn btn-primary" onClick={() => setStep(3)}>Next</button>
        </>}

        {step === 3 && <>
          <h1 className="h1 cobalt" style={{ marginTop: 24 }}>When do you usually fall asleep?</h1>
          <p className="muted" style={{ margin: '10px 0 0' }}>Be honest. Late nights make sugar cravings worse, so we&apos;ll fix this slowly.</p>
          <Value big={fmtTime(bed)} />
          <Ruler min={21 * 60} max={29 * 60} step={15} value={bed} onChange={setBed} label="Usual bedtime" valueText={fmtTime(bed)} />
          <div className="card" style={{ background: 'var(--cobalt-soft)', color: 'var(--cobalt-deep)', padding: '16px 18px', marginTop: 16 }}>
            {bed > 23 * 60 ? `Your bedtime moves 30 minutes earlier each week until 23:00. That's ${Math.ceil((bed - 23 * 60) / 30)} small steps.` : 'Already early. We’ll just help you keep it.'}
          </div>
          <div className="grow" />
          <button className="btn btn-primary" onClick={() => setStep(4)}>Next</button>
        </>}

        {step === 4 && <>
          <h1 className="h1 cobalt" style={{ marginTop: 24 }}>Want a few gentle nudges?</h1>
          <p className="muted" style={{ margin: '10px 0 20px' }}>Water, desk breaks, knee routine, last coffee and wind down. Short and kind, never nagging.</p>
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
