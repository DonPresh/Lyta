'use client';
import { motion } from 'framer-motion';
import { Icon } from './icons';
import { addDays, bedTarget, coffeeCutoff, doneCount, ladderWeek, type Day, type Habit, type Profile } from '@/lib/store';

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

export function Today({ profile, days, today, streak, onToggle, onWater, onSugar }: {
  profile: Profile; days: Record<string, Day>; today: string; streak: number;
  onToggle: (h: Habit) => void; onWater: () => void; onSugar: () => void;
}) {
  const d = days[today] ?? {};
  const n = doneCount(d);
  const bed = bedTarget(profile, today);
  const left = (['food', 'knee', 'bed'] as Habit[]).filter(k => !d[k]);
  const sub = n === 0 ? 'Tick one thing and you’ve started.' : n === 3 ? 'That’s the whole job today.' : left.length === 1 ? `One to go: ${({ food: 'real food', knee: 'knee routine', bed: 'bedtime' } as const)[left[0]]}.` : 'Two to go.';
  const now = new Date(); const dow = (now.getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => { const iso = addDays(today, i - dow); return { iso, label: 'MTWTFSS'[i], num: Number(iso.slice(8)), today: iso === today, future: iso > today, mark: doneCount(days[iso]) > 0 }; });
  const water = d.water ?? 0, sugarN = d.sugar?.length ?? 0;

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
        <span className="num num-l cobalt" aria-label={`${n} of 3 done today`}>{n}/3</span>
        <div className="stack" style={{ width: 150, gap: 8 }}>
          <span className="h3 cobalt">done today</span>
          <div className="row" style={{ gap: 4 }}>{[0, 1, 2].map(i => <motion.span key={i} initial={false} animate={{ backgroundColor: i < n ? '#1C35D6' : '#E5DDCC' }} style={{ flex: 1, height: 6, borderRadius: 3 }} />)}</div>
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
        <HabitRow title="Real food, not sugar" detail="Eat something real before noon" done={!!d.food} onToggle={() => onToggle('food')} />
        <HabitRow title="Knee routine" detail="10 minutes, 2 rounds" done={!!d.knee} onToggle={() => onToggle('knee')} />
        <HabitRow title={`In bed by ${bed}`} detail={`Bedtime ladder, week ${ladderWeek(profile, today)} · last coffee ${coffeeCutoff(bed)}`} done={!!d.bed} onToggle={() => onToggle('bed')} />
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
    </div>
  );
}
