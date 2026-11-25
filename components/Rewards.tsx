'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './icons';
import { Sheet, field } from './Sheet';
import { currentKg, streakInfo, type Milestone, type Reward, type State } from '@/lib/store';

// Rewards follow the Figma frames (06 · Rewards): cobalt, points are a running total, rewards unlock at thresholds.
const MILESTONES: { id: Milestone; label: string; goal: number; unit: string }[] = [
  { id: 'streak7', label: '7 days', goal: 7, unit: 'day streak' },
  { id: 'streak30', label: '30 days', goal: 30, unit: 'day streak' },
  { id: 'streak90', label: '90 days', goal: 90, unit: 'day streak' },
  { id: 'kg5', label: '5 kg lost', goal: 5, unit: 'kg lost' },
];
const COSTS = [50, 100, 200, 500];
const FOODISH = /\b(cake|pizza|chocolate|ice ?cream|burger|donut|doughnut|sweets?|candy|dessert|snack|chin ?chin|puff ?puff|meat ?pie|shawarma|fries|biscuit|cookies?)\b/i;

const Lock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;

function RewardSheet({ initial, onClose, onSave, onDelete }: { initial?: Reward; onClose: () => void; onSave: (r: Omit<Reward, 'id'> & { id?: string }) => void; onDelete?: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [cost, setCost] = useState<number | undefined>(initial ? initial.cost : 100);
  const [ms, setMs] = useState<Milestone | undefined>(initial?.milestone);
  const food = FOODISH.test(title);
  return (
    <Sheet title={initial ? 'Edit reward' : 'Add a reward'} onClose={onClose}>
      <span className="micro">What do you want?</span>
      <input aria-label="Reward" value={title} onChange={e => setTitle(e.target.value)} placeholder="New sneakers" autoFocus maxLength={40} style={{ ...field, marginTop: 8, height: 56, fontSize: 17, outline: '1.5px solid var(--cobalt)' }} />
      <span className="micro" style={{ display: 'block', marginTop: 18 }}>Unlock with points</span>
      <div className="chips" style={{ marginTop: 8 }}>{COSTS.map(c => <button key={c} className="chip" aria-pressed={cost === c && !ms} onClick={() => { setCost(c); setMs(undefined); }}>{c}</button>)}</div>
      <span className="micro" style={{ display: 'block', marginTop: 16 }}>Or at a milestone</span>
      <div className="chips" style={{ marginTop: 8 }}>{MILESTONES.map(m => <button key={m.id} className="chip" aria-pressed={ms === m.id} onClick={() => { setMs(m.id); setCost(undefined); }}>{m.label}</button>)}</div>
      <p className="small" style={{ margin: '16px 0 18px', color: food ? 'var(--ink)' : undefined }}>{food ? 'That sounds like food. Rewards work better as things that aren’t food, so the habit doesn’t loop back to sugar. Your call.' : 'Rewards are never food. Pick something that makes the work feel worth it.'}</p>
      <button className="btn btn-primary" disabled={!title.trim()} onClick={() => { onSave({ id: initial?.id, title: title.trim(), cost: ms ? undefined : cost, milestone: ms }); onClose(); }}>{initial ? 'Save' : 'Add reward'}</button>
      {onDelete && <button className="btn" style={{ marginTop: 8 }} onClick={() => { onDelete(); onClose(); }}>Delete reward</button>}
    </Sheet>
  );
}

export function RewardsScreen({ state, today, saveReward, deleteReward, claimReward }: {
  state: State; today: string;
  saveReward: (r: Omit<Reward, 'id'> & { id?: string }) => void; deleteReward: (id: string) => void; claimReward: (id: string) => void;
}) {
  const [sheet, setSheet] = useState<Reward | 'new' | null>(null);
  const [party, setParty] = useState<Reward | null>(null);
  const pts = state.points;
  const rewards = state.rewards ?? [];
  const best = streakInfo(state, today).best;
  const lost = Math.max(0, +((state.profile?.startKg ?? 0) - currentKg(state)).toFixed(1));
  const perFullDay = state.habits.length + 2;

  const progress = (r: Reward) => {
    if (r.milestone) { const m = MILESTONES.find(x => x.id === r.milestone)!; const have = m.id === 'kg5' ? lost : best; return { have, goal: m.goal, left: Math.max(0, +(m.goal - have).toFixed(1)), unit: m.unit, label: m.id === 'kg5' ? '5 kg lost' : `${m.goal} day streak` }; }
    const goal = r.cost ?? 0; return { have: pts, goal, left: Math.max(0, goal - pts), unit: 'points', label: `${goal} points` };
  };
  const open = rewards.filter(r => !r.claimedAt).sort((a, b) => progress(a).left / (progress(a).goal || 1) - progress(b).left / (progress(b).goal || 1));
  const earned = rewards.filter(r => r.claimedAt).sort((a, b) => (b.claimedAt! < a.claimedAt! ? -1 : 1));
  const next = open.find(r => progress(r).left > 0);
  const np = next ? progress(next) : null;

  const earn = (
    <div className="card" style={{ padding: '4px 16px' }}>
      {[['Tick a habit', '+1'], [`Full day, all ${state.habits.length}`, '+2 bonus'], ['Finish a routine or walk', '+2 bonus'], ['Log sugar honestly', '+1'], ['Weekly weigh-in', '+3']].map(([l, v], n, a) => (
        <div key={l} className="row between" style={{ height: 47, borderBottom: n < a.length - 1 ? '1px solid var(--line)' : 0 }}><span style={{ fontSize: 15 }}>{l}</span><b className="cobalt" style={{ fontWeight: 600 }}>{v}</b></div>
      ))}
    </div>
  );

  return (
    <div className="screen">
      <h2 className="h2" style={{ marginTop: 10 }}>{rewards.length ? 'You have' : 'Rewards'}</h2>
      <div className="row" style={{ alignItems: 'flex-end', gap: 12, marginTop: 6 }}>
        <motion.span key={pts} initial={{ scale: 0.92, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="num num-xl cobalt">{pts}</motion.span>
        <span className="h2 cobalt" style={{ fontWeight: 600, paddingBottom: 10 }}>{rewards.length ? 'points' : 'points so far'}</span>
      </div>

      {!rewards.length ? <>
        <div style={{ marginTop: 28 }}>{earn}</div>
        <div className="grow" style={{ minHeight: 24 }} />
        <button className="btn btn-primary" onClick={() => setSheet('new')}>Add your first reward</button>
      </> : <>
        {next && np && <div className="card" style={{ background: 'var(--cobalt)', color: '#fff', padding: '16px 16px 14px', marginTop: 22 }}>
          <div className="row between"><b style={{ fontSize: 17 }}>Next up: {next.title}</b><span style={{ fontWeight: 600, fontSize: 15 }}>{np.left} to go</span></div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.3)', margin: '10px 0 8px' }}>
            <motion.div initial={false} animate={{ width: `${Math.min(100, np.have / np.goal * 100)}%` }} style={{ height: 6, borderRadius: 3, background: '#fff' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{next.milestone === 'kg5' ? `${np.left} kg more. Steady habits get you there.` : next.milestone ? `${np.left} more day${np.left === 1 ? '' : 's'} showing up.` : `About ${Math.max(1, Math.ceil(np.left / perFullDay))} more full day${Math.ceil(np.left / perFullDay) === 1 ? '' : 's'}.`}</span>
        </div>}

        <div className="stack" style={{ gap: 8, marginTop: 18 }}>
          {open.map(r => { const p = progress(r), ready = p.left <= 0; return (
            <motion.div layout key={r.id} className="card row" style={{ padding: '10px 12px', gap: 12, borderRadius: 20 }}>
              <span style={{ width: 40, height: 40, borderRadius: 20, display: 'grid', placeItems: 'center', flex: 'none', background: ready ? 'var(--cobalt-soft)' : 'var(--sunken)', color: ready ? 'var(--cobalt)' : 'var(--ink)' }}>{ready ? <Icon name="gift" size={18} /> : <Lock />}</span>
              <button onClick={() => setSheet(r)} className="stack" style={{ flex: 1, border: 0, background: 'none', padding: 0, textAlign: 'left', color: 'var(--ink)' }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{r.title}</span><span className="small">{p.label}</span>
              </button>
              {ready ? <motion.button whileTap={{ scale: 0.94 }} onClick={() => { claimReward(r.id); setParty(r); }} style={{ height: 36, padding: '0 14px', borderRadius: 999, border: 0, background: 'var(--cobalt)', color: '#fff', fontWeight: 600 }}>Unlock</motion.button>
                : <span style={{ height: 36, padding: '0 12px', borderRadius: 999, background: 'var(--sunken)', color: 'var(--ink-2)', fontWeight: 600, display: 'grid', placeItems: 'center', fontSize: 15 }}>{p.left}{p.unit === 'points' ? '' : p.unit === 'kg lost' ? ' kg' : 'd'} away</span>}
            </motion.div>
          ); })}
          <button onClick={() => setSheet('new')} className="row" style={{ justifyContent: 'center', gap: 8, height: 50, borderRadius: 20, border: '1.5px dashed var(--tick)', background: 'transparent', fontWeight: 600, fontSize: 15 }}><Icon name="plus" size={18} />Add a reward</button>
        </div>

        {earned.length > 0 && <>
          <span className="micro" style={{ marginTop: 24 }}>Earned</span>
          <div className="stack" style={{ gap: 6, marginTop: 8 }}>
            {earned.map(r => <button key={r.id} onClick={() => setSheet(r)} className="row between" style={{ padding: '12px 14px', borderRadius: 16, border: 0, background: 'var(--cobalt-soft)', color: 'var(--cobalt-deep)', fontWeight: 600 }}>
              <span className="row" style={{ gap: 8 }}><Icon name="check" size={16} />{r.title}</span><span className="small" style={{ color: 'inherit' }}>{new Date(r.claimedAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </button>)}
          </div>
        </>}

        <details style={{ marginTop: 24 }}>
          <summary className="micro" style={{ cursor: 'pointer', listStyle: 'none' }}>How points work ›</summary>
          <div style={{ marginTop: 10 }}>{earn}</div>
        </details>
      </>}

      <AnimatePresence>
        {sheet && <RewardSheet key="r" initial={sheet === 'new' ? undefined : sheet} onClose={() => setSheet(null)} onSave={saveReward} onDelete={sheet !== 'new' ? () => deleteReward(sheet.id) : undefined} />}
      </AnimatePresence>

      <AnimatePresence>
        {party && <motion.div key="party" role="dialog" aria-label="Reward unlocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setParty(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--cobalt)', color: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          {Array.from({ length: 28 }, (_, i) => <motion.span key={i} initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }} animate={{ y: 900, x: (i % 2 ? 1 : -1) * (20 + (i * 37) % 120), rotate: 360 + i * 40, opacity: 0.9 }} transition={{ duration: 2.2 + (i % 5) * 0.3, delay: (i % 7) * 0.08, ease: 'easeIn' }}
            style={{ position: 'absolute', top: 0, left: `${(i * 53) % 100}%`, width: 10, height: 16, borderRadius: 3, background: ['#FBF6EC', '#FF8A3D', '#F4B9D2', '#0B6B4F'][i % 4] }} />)}
          <div className="stack" style={{ maxWidth: 360, padding: '0 24px', alignItems: 'flex-start', gap: 12, position: 'relative' }}>
            <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }} className="num" style={{ fontSize: 92 }}>Yes.</motion.span>
            <h1 className="h1" style={{ color: '#fff' }}>{party.title} is yours.</h1>
            <p className="body-l" style={{ margin: 0, opacity: 0.85 }}>You earned it one small day at a time. Go enjoy it.</p>
            <button className="btn" style={{ background: '#fff', color: 'var(--cobalt)', marginTop: 20 }} onClick={() => setParty(null)}>Back to rewards</button>
          </div>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}
