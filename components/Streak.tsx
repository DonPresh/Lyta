'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './icons';
import { GlassHero } from './GlassHero';
import { addDays, streakInfo, type DayMark, type State } from '@/lib/store';

// Streak opens in green (Figma: 05 · Streak).
const MARK: Record<DayMark, { bg: string; fg: string }> = {
  full: { bg: 'var(--green)', fg: '#fff' },
  some: { bg: 'var(--green-soft)', fg: 'var(--green)' },
  freeze: { bg: 'var(--cobalt-soft)', fg: 'var(--ink)' },
  miss: { bg: 'transparent', fg: 'var(--ink-3)' },
};

function Month({ month, marks, today, start, onPick }: { month: string; marks: Record<string, DayMark>; today: string; start: string; onPick: (iso: string) => void }) {
  const first = month + '-01';
  const lead = (new Date(first + 'T12:00').getDay() + 6) % 7;
  const days = new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => addDays(first, i))];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 6, columnGap: 4 }}>
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="small" style={{ textAlign: 'center', paddingBottom: 4 }}>{d}</span>)}
      {cells.map((iso, i) => {
        if (!iso) return <span key={i} />;
        const m = marks[iso], isToday = iso === today, future = iso > today, before = iso < start;
        const c = m ? MARK[m] : { bg: 'transparent', fg: 'var(--ink-3)' };
        return (
          <button key={iso} disabled={future || before} onClick={() => onPick(iso)}
            aria-label={`${new Date(iso + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}${m === 'full' ? ', all done' : m === 'some' ? ', showed up' : m === 'freeze' ? ', freeze used' : ''}`}
            style={{ aspectRatio: '1', width: '100%', maxWidth: 42, justifySelf: 'center', borderRadius: 999, padding: 0, fontSize: 16, fontWeight: 600,
              background: c.bg, color: future || before ? 'var(--ink-3)' : c.fg, border: isToday && m !== 'full' ? '2px solid var(--ink)' : '2px solid transparent', opacity: future ? 0.7 : 1, cursor: future || before ? 'default' : 'pointer' }}>
            {Number(iso.slice(8))}
          </button>
        );
      })}
    </div>
  );
}

export function StreakScreen({ state, today, onPickDay }: { state: State; today: string; onPickDay: (iso: string) => void }) {
  const info = streakInfo(state, today);
  const start = state.profile?.startedOn ?? today;
  const [month, setMonth] = useState(today.slice(0, 7));
  const [replay, setReplay] = useState(0);
  const shift = (n: number) => { const d = new Date(month + '-15T12:00'); d.setMonth(d.getMonth() + n); setMonth(d.toISOString().slice(0, 7)); };
  const atStart = month <= start.slice(0, 7), atNow = month >= today.slice(0, 7);
  const n = info.current;
  const caption = n === 0 ? 'days showed up. Day one starts with a single tick.'
    : n === info.best ? `day${n === 1 ? '' : 's'} showed up. Your best run yet.`
    : `day${n === 1 ? '' : 's'} showed up. Your best is ${info.best}.`;
  const label = new Date(month + '-15T12:00').toLocaleDateString('en-GB', { month: 'long', year: month.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric' });

  return (
    <div className="screen">
      <h2 className="h2" style={{ marginTop: 10 }}>Streak</h2>
      <div onDoubleClick={() => setReplay(r => r + 1)} style={{ margin: '6px -4px 0' }}>
        <GlassHero big={String(n)} caption={caption} height={140} replay={replay} />
      </div>

      {n > 0 && <div className="row" style={{ gap: 8, marginTop: 10 }}>
        {[[String(info.best), 'best streak'], [`${info.freezesLeft} of 2`, 'freezes left'], [String(info.full), 'full days']].map(([v, l]) => (
          <motion.div key={l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card stack" style={{ flex: 1, padding: '12px 14px', borderRadius: 20, gap: 2 }}>
            <span className="h2" style={{ fontWeight: 800 }}>{v}</span><span className="small">{l}</span>
          </motion.div>
        ))}
      </div>}

      <div className="card" style={{ padding: '14px 14px 16px', marginTop: 12 }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <button className="icon-btn" style={{ border: 0, width: 36, height: 36, opacity: atStart ? 0.25 : 1 }} disabled={atStart} aria-label="Previous month" onClick={() => shift(-1)}><Icon name="back" size={18} /></button>
          <span className="h3">{label}</span>
          <button className="icon-btn" style={{ border: 0, width: 36, height: 36, opacity: atNow ? 0.25 : 1 }} disabled={atNow} aria-label="Next month" onClick={() => shift(1)}><Icon name="back" size={18} style={{ transform: 'rotate(180deg)' }} /></button>
        </div>
        <Month month={month} marks={info.marks} today={today} start={start} onPick={onPickDay} />
      </div>

      {n > 0 ? <div className="row small" style={{ gap: 16, marginTop: 12, paddingLeft: 2 }}>
        {[['var(--green)', `All ${state.habits.length}`], ['var(--green-soft)', 'Some'], ['var(--cobalt-soft)', 'Freeze']].map(([c, l]) => <span key={l} className="row" style={{ gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 6, background: c }} />{l}</span>)}
      </div> : <div className="card" style={{ padding: '16px 18px', marginTop: 14, background: 'var(--green-soft)', color: 'var(--green)', fontSize: 15, fontWeight: 500 }}>
        Tick 1 habit and the day counts. You get 2 freezes a month, used automatically, so one bad day never wipes you out.
      </div>}
      <p className="small" style={{ margin: '14px 0 0', textAlign: 'center' }}>Drag the bubble. Tap a day to see it.</p>
    </div>
  );
}
