'use client';
import { useEffect, useState } from 'react';

/** The big cobalt number, editable by typing. Commits on blur or Enter, clamped to min/max. */
export function BigNumber({ value, onChange, min, max, decimals = 0, unit, label, size = 'l' }: {
  value: number; onChange: (v: number) => void; min: number; max: number; decimals?: number; unit?: string; label: string; size?: 'l' | 'xl';
}) {
  const fmt = (v: number) => decimals ? v.toFixed(decimals) : String(Math.round(v));
  const [text, setText] = useState(fmt(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setText(fmt(value)); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);
  const commit = () => { const n = parseFloat(text.replace(',', '.')); if (!isNaN(n)) onChange(+Math.min(max, Math.max(min, n)).toFixed(decimals)); else setText(fmt(value)); setFocused(false); };
  return (
    <div className="row" style={{ justifyContent: 'center', alignItems: 'flex-end', gap: 6 }}>
      <input aria-label={label} inputMode="decimal" value={text} onFocus={e => { setFocused(true); e.currentTarget.select(); }} onChange={e => setText(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        className={`num ${size === 'xl' ? 'num-xl' : 'num-l'} cobalt`}
        style={{ width: `${Math.max(2, text.length) * 0.62}em`, border: 0, background: 'transparent', textAlign: 'center', padding: 0, borderBottom: focused ? '3px solid var(--cobalt)' : '3px dashed transparent' }} />
      {unit && <span className="h2 cobalt" style={{ fontWeight: 900 }}>{unit}</span>}
    </div>
  );
}
