'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './icons';
import { Sheet, field } from './Sheet';
import type { Meal, MealSlot, Meals } from '@/lib/store';

// A food diary with no calories and no judgement: what you ate and roughly when.
const SLOTS: { id: MealSlot; label: string; by: string }[] = [
  { id: 'breakfast', label: 'Breakfast', by: '10:00' },
  { id: 'lunch', label: 'Lunch', by: '15:00' },
  { id: 'dinner', label: 'Dinner', by: '21:00' },
];
const QUICK: Record<MealSlot | 'snack', string[]> = {
  breakfast: ['Bread and eggs', 'Oats', 'Akara and pap', 'Yoghurt and fruit', 'Tea and bread', 'Leftovers'],
  lunch: ['Rice and stew', 'Beans', 'Swallow and soup', 'Jollof rice', 'Yam and egg sauce', 'Noodles'],
  dinner: ['Rice and stew', 'Swallow and soup', 'Beans and plantain', 'Pepper soup', 'Noodles and egg', 'Leftovers'],
  snack: ['Fruit', 'Groundnuts', 'Boiled egg', 'Biscuits', 'Chin chin', 'Soft drink'],
};
const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const fmt = (hm: string) => { const [h, m] = hm.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`; };

function Plate({ filled }: { filled: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />{filled ? <path d="M8 12.5l3 3 5-6" /> : <circle cx="12" cy="12" r="4.5" strokeDasharray="2 3" />}
  </svg>;
}

function MealSheet({ slot, initial, isToday, onClose, onSave, onRemove }: {
  slot: MealSlot | 'snack'; initial?: Meal; isToday: boolean; onClose: () => void; onSave: (m: Meal) => void; onRemove?: () => void;
}) {
  const [what, setWhat] = useState(initial?.skipped ? '' : initial?.what ?? '');
  const [at, setAt] = useState(initial?.at ?? (isToday ? nowHM() : slot === 'breakfast' ? '08:00' : slot === 'lunch' ? '13:00' : slot === 'dinner' ? '19:00' : '16:00'));
  const [bought, setBought] = useState(!!initial?.bought);
  const label = slot === 'snack' ? 'Snack' : SLOTS.find(s => s.id === slot)!.label;
  return (
    <Sheet title={initial ? `Edit ${label.toLowerCase()}` : label} onClose={onClose}>
      <span className="micro">What did you have?</span>
      <input aria-label="What you ate" value={what} onChange={e => setWhat(e.target.value)} placeholder={QUICK[slot][0]} autoFocus maxLength={60} style={{ ...field, marginTop: 8, height: 56, fontSize: 17 }}
        onKeyDown={e => { if (e.key === 'Enter' && what.trim()) { onSave({ what: what.trim(), at, bought }); } }} />
      <div className="chips" style={{ marginTop: 10 }}>{QUICK[slot].map(q => <button key={q} className="chip" style={{ height: 38, fontSize: 14, padding: '0 14px' }} aria-pressed={what === q} onClick={() => setWhat(q)}>{q}</button>)}</div>

      <div className="row" style={{ gap: 10, marginTop: 18 }}>
        <label className="stack" style={{ flex: 1, gap: 6 }}><span className="micro">Time</span>
          <input type="time" value={at} onChange={e => setAt(e.target.value)} style={{ ...field, height: 48 }} /></label>
        <div className="stack" style={{ flex: 1, gap: 6 }}><span className="micro">Made or bought?</span>
          <div className="row" style={{ background: 'var(--sunken)', borderRadius: 999, padding: 4, gap: 4, height: 48 }} role="group" aria-label="Made or bought">
            {[false, true].map(b => <button key={String(b)} aria-pressed={bought === b} onClick={() => setBought(b)} style={{ flex: 1, height: 40, borderRadius: 999, border: 0, fontWeight: 600, background: bought === b ? 'var(--card)' : 'transparent', color: bought === b ? 'var(--ink)' : 'var(--ink-3)' }}>{b ? 'Bought' : 'Made'}</button>)}
          </div></div>
      </div>

      <p className="small" style={{ margin: '14px 0 16px' }}>No calories, no judging. Just a record so you can spot patterns, like skipped breakfast leading to sugar later.</p>
      <button className="btn btn-primary" disabled={!what.trim()} onClick={() => onSave({ what: what.trim(), at, bought })}>Save</button>
      {slot !== 'snack' && !initial?.skipped && <button className="btn" style={{ marginTop: 8 }} onClick={() => onSave({ what: 'Skipped', at, skipped: true })}>I skipped {label.toLowerCase()}</button>}
      {onRemove && <button className="btn" style={{ marginTop: 4, color: 'var(--ink-2)' }} onClick={onRemove}>Remove</button>}
    </Sheet>
  );
}

export function MealsCard({ meals, isToday, onSet }: { meals: Meals; isToday: boolean; onSet: (slot: MealSlot | 'snack', m: Meal | null, snackIndex?: number) => void }) {
  const [open, setOpen] = useState<{ slot: MealSlot | 'snack'; index?: number } | null>(null);
  const hm = nowHM();
  const snacks = meals.snacks ?? [];
  const eaten = SLOTS.filter(s => meals[s.id] && !meals[s.id]!.skipped).length;
  const skippedBreakfast = meals.breakfast?.skipped;
  const editing = open ? (open.slot === 'snack' ? (open.index !== undefined ? snacks[open.index] : undefined) : meals[open.slot]) : undefined;

  return (
    <section className="card" style={{ padding: 16, marginTop: 12 }} aria-label="Meals">
      <div className="row between">
        <span className="small">Meals{isToday ? ' today' : ''}</span>
        <span className="small">{eaten} of 3{snacks.length ? ` · ${snacks.length} snack${snacks.length > 1 ? 's' : ''}` : ''}</span>
      </div>
      <div className="stack" style={{ marginTop: 6 }}>
        {SLOTS.map((s, i) => {
          const m = meals[s.id]; const late = isToday && !m && hm > s.by;
          return (
            <button key={s.id} onClick={() => setOpen({ slot: s.id })} className="row" style={{ gap: 12, minHeight: 56, padding: '6px 0', border: 0, borderTop: i ? '1px solid var(--line)' : 0, background: 'none', textAlign: 'left', color: 'var(--ink)' }}>
              <span style={{ color: m && !m.skipped ? 'var(--cobalt)' : 'var(--ink-3)', display: 'grid' }}><Plate filled={!!m && !m.skipped} /></span>
              <span className="stack" style={{ flex: 1, gap: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>{s.label}</span>
                <span className="small" style={{ color: m?.skipped ? 'var(--ink-3)' : undefined }}>{m ? (m.skipped ? 'Skipped' : `${m.what}${m.bought ? ' · bought' : ''}`) : late ? 'Not logged yet. Did you eat?' : 'Tap to log'}</span>
              </span>
              {m ? <span className="small">{fmt(m.at)}</span> : <span style={{ height: 32, padding: '0 12px', borderRadius: 999, background: 'var(--sunken)', fontWeight: 600, fontSize: 14, display: 'grid', placeItems: 'center' }}>Add</span>}
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 2 }}>
        <AnimatePresence initial={false}>
          {snacks.map((sn, i) => (
            <motion.button key={sn.at + sn.what + i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onClick={() => setOpen({ slot: 'snack', index: i })}
              className="row" style={{ width: '100%', gap: 10, padding: '6px 0', border: 0, background: 'none', textAlign: 'left', color: 'var(--ink)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--pink)', marginLeft: 7 }} />
              <span style={{ flex: 1, fontSize: 15 }}>{sn.what}{sn.bought ? ' · bought' : ''}</span>
              <span className="small">{fmt(sn.at)}</span>
            </motion.button>
          ))}
        </AnimatePresence>
        <button onClick={() => setOpen({ slot: 'snack' })} className="row" style={{ gap: 6, height: 40, border: 0, background: 'none', color: 'var(--cobalt)', fontWeight: 600, padding: 0 }}><Icon name="plus" size={18} />Add a snack</button>
      </div>

      {skippedBreakfast && isToday && <p className="small" style={{ margin: '6px 0 0', padding: '10px 12px', borderRadius: 14, background: 'var(--pink-soft)', color: 'var(--ink)' }}>Skipped breakfast? Eat something real by lunch. Long gaps are when sugar cravings hit hardest.</p>}

      <AnimatePresence>
        {open && <MealSheet key="m" slot={open.slot} initial={editing} isToday={isToday} onClose={() => setOpen(null)}
          onSave={m => { onSet(open.slot, m, open.index); setOpen(null); }}
          onRemove={editing ? () => { onSet(open.slot, null, open.index); setOpen(null); } : undefined} />}
      </AnimatePresence>
    </section>
  );
}
