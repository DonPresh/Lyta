'use client';
import { useEffect, useRef } from 'react';

const PX = 10;

/** Horizontal scroll ruler. Every tick is one step; every fifth tick is taller. */
export function Ruler({ min, max, step, value, onChange, label, valueText }: {
  min: number; max: number; step: number; value: number; onChange: (v: number) => void; label: string; valueText: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const count = Math.round((max - min) / step);
  const idx = Math.round((value - min) / step);

  useEffect(() => { const el = ref.current; if (el) el.scrollLeft = idx * PX; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFromScroll = () => {
    const el = ref.current; if (!el) return;
    const i = Math.min(count, Math.max(0, Math.round(el.scrollLeft / PX)));
    const v = +(min + i * step).toFixed(2);
    if (v !== value) onChange(v);
  };
  const nudge = (d: number) => {
    const el = ref.current; if (!el) return;
    const i = Math.min(count, Math.max(0, idx + d));
    el.scrollTo({ left: i * PX, behavior: 'smooth' });
    onChange(+(min + i * step).toFixed(2));
  };

  return (
    <div style={{ position: 'relative', height: 80, margin: '0 calc(-1 * var(--pad))' }}>
      <div
        ref={ref}
        onScroll={setFromScroll}
        role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={valueText}
        onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); nudge(1); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); nudge(-1); } }}
        style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', height: '100%', touchAction: 'pan-x' }}
      >
        <span style={{ flex: '0 0 50%' }} />
        <div style={{
          flex: `0 0 ${count * PX + 2}px`, height: 72, marginTop: 4,
          backgroundImage: 'linear-gradient(90deg, var(--tick) 2px, transparent 2px), linear-gradient(90deg, var(--tick) 2px, transparent 2px)',
          backgroundSize: `${PX * 5}px 44px, ${PX}px 24px`,
          backgroundPosition: '0 14px, 0 24px',
          backgroundRepeat: 'repeat-x',
        }} />
        <span style={{ flex: '0 0 50%' }} />
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', left: 'calc(50% - 1px)', top: 0, width: 4, height: 80, borderRadius: 2, background: 'var(--cobalt)', pointerEvents: 'none' }} />
    </div>
  );
}
