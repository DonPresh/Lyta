'use client';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Icon } from './icons';

/** Bottom sheet with a scrim, grabber, title row and close button. Wrap in <AnimatePresence>. */
export function Sheet({ title, onClose, children, bg }: { title?: string; onClose: () => void; children: ReactNode; bg?: string }) {
  return (
    <>
      <motion.div className="sheet-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div className="sheet" role="dialog" aria-modal="true" aria-label={title}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={bg ? { background: bg } : undefined}>
        <div className="grabber" />
        {title && <div className="row between" style={{ marginBottom: 14 }}>
          <h2 className="h2">{title}</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>}
        {children}
      </motion.div>
    </>
  );
}

export const field: React.CSSProperties = { width: '100%', height: 52, borderRadius: 16, border: 0, background: 'var(--sunken)', padding: '0 16px', fontSize: 16 };
