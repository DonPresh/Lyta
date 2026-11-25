'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './icons';
import type { SugarLog } from '@/lib/store';

const WHAT = ['Soft drink', 'Malt', 'Sweets', 'Biscuits', 'Cake', 'Chin chin', 'Sugary tea', 'Juice'];
const WHY = ['Tired', 'Skipped a meal', 'Stressed', 'Craving', 'With people', 'Bored'];

export function SugarSheet({ onClose, onLog, lateNights }: { onClose: () => void; onLog: (l: SugarLog) => void; lateNights: number }) {
  const [what, setWhat] = useState<string[]>([]);
  const [why, setWhy] = useState<string[]>([]);
  const [strength, setStrength] = useState(3);
  const [note, setNote] = useState('');
  const [logged, setLogged] = useState(false);
  const flip = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const submit = () => { onLog({ at: new Date().toISOString(), what, why, strength, note: note.trim() || undefined }); setLogged(true); };

  return (
    <>
      <motion.div className="sheet-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div className="sheet" role="dialog" aria-modal="true" aria-label="Log sugar"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={logged ? { background: 'var(--pink-soft)' } : undefined}>
        <div className="grabber" />
        {!logged ? <>
          <div className="row between">
            <h2 className="h2">What did you have?</h2>
            <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" size={20} /></button>
          </div>
          <p className="micro" style={{ margin: '18px 0 10px' }}>Sweet thing</p>
          <div className="chips">{WHAT.map(w => <button key={w} className="chip" aria-pressed={what.includes(w)} onClick={() => flip(what, setWhat, w)}>{w}</button>)}</div>
          <p className="micro" style={{ margin: '18px 0 10px' }}>Why, do you think?</p>
          <div className="chips">{WHY.map(w => <button key={w} className="chip" aria-pressed={why.includes(w)} onClick={() => flip(why, setWhy, w)}>{w}</button>)}</div>
          <p className="micro" style={{ margin: '18px 0 10px' }}>How strong was the craving?</p>
          <div className="row" style={{ gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => <button key={n} aria-pressed={strength === n} onClick={() => setStrength(n)} style={{ flex: 1, height: 44, borderRadius: 999, border: 0, fontWeight: 600, background: strength === n ? 'var(--cobalt)' : 'var(--sunken)', color: strength === n ? '#fff' : 'var(--ink)' }}>{n}</button>)}
          </div>
          <label className="micro" htmlFor="sugar-note" style={{ display: 'block', margin: '18px 0 10px' }}>Note (optional)</label>
          <input id="sugar-note" value={note} onChange={e => setNote(e.target.value)} placeholder="After a long call" style={{ width: '100%', height: 52, borderRadius: 16, border: 0, background: 'var(--sunken)', padding: '0 16px', fontSize: 16 }} />
          <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={submit} disabled={what.length === 0}>Log it</button>
          <p className="small" style={{ textAlign: 'center', marginTop: 12 }}>Logging is information, not failure. It never breaks your streak.</p>
        </> : <>
          <p className="num num-m" style={{ margin: '8px 0 12px' }}>Logged.</p>
          <p className="body-l" style={{ margin: 0 }}>That&apos;s data, not failure. Your streak is safe and you earned 1 point for being honest.</p>
          {why.length > 0 && <div className="card" style={{ padding: '16px 18px', marginTop: 18 }}>
            <p className="micro" style={{ margin: 0 }}>Noticed</p>
            <p className="h3" style={{ marginTop: 6 }}>{why.includes('Tired') && lateNights > 0 ? `You went to bed late ${lateNights} of the last 7 nights. Tired cravings follow late nights.` : `Logged as: ${why.join(', ').toLowerCase()}. Patterns show up in your Sunday look-back.`}</p>
          </div>}
          <button className="btn btn-dark" style={{ marginTop: 24 }} onClick={onClose}>Back to today</button>
        </>}
      </motion.div>
    </>
  );
}
