'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader } from '@/components/Loader';
import { Onboarding } from '@/components/Onboarding';
import { Today } from '@/components/Today';
import { SugarSheet } from '@/components/SugarSheet';
import { Icon, type IconName } from '@/components/icons';
import { addDays, streak, useLyta } from '@/lib/store';

type Tab = 'Today' | 'Streak' | 'Rewards' | 'Weight';
const TABS: [Tab, IconName][] = [['Today', 'today'], ['Streak', 'streak'], ['Rewards', 'gift'], ['Weight', 'scale']];

function Soon({ title, big, unit, line }: { title: string; big: string; unit: string; line: string }) {
  return (
    <div className="screen">
      <h2 className="h2" style={{ marginTop: 10 }}>{title}</h2>
      <div className="row" style={{ alignItems: 'flex-end', gap: 10, marginTop: 12 }}><span className="num num-xl cobalt">{big}</span><span className="h3 cobalt" style={{ paddingBottom: 10 }}>{unit}</span></div>
      <div className="card" style={{ padding: '18px 20px', marginTop: 24 }}><p className="body-l" style={{ margin: 0 }}>{line}</p><p className="small" style={{ margin: '8px 0 0' }}>The full screen is coming in the next build.</p></div>
    </div>
  );
}

export default function Home() {
  const { state, ready, today, setProfile, toggle, addWater, logSugar } = useLyta();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Today');
  const [sugarOpen, setSugarOpen] = useState(false);

  const s = streak(state, today);
  const lateNights = Array.from({ length: 7 }, (_, i) => addDays(today, -i - 1)).filter(d => state.days[d] && !state.days[d].bed).length;
  const lastKg = state.weights[state.weights.length - 1]?.kg;

  return (
    <main className="app" style={!state.profile ? { paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' } : undefined}>
      {loading && <Loader onDone={() => setLoading(false)} />}
      {ready && !state.profile && <Onboarding onDone={setProfile} />}
      {ready && state.profile && <>
        {tab === 'Today' && <Today profile={state.profile} days={state.days} today={today} streak={s} onToggle={toggle} onWater={addWater} onSugar={() => setSugarOpen(true)} />}
        {tab === 'Streak' && <Soon title="Streak" big={String(s)} unit="days showed up" line="Tick one habit and the day counts. You get 2 freezes a month, used automatically." />}
        {tab === 'Rewards' && <Soon title="Rewards" big={String(state.points)} unit="points" line="1 per habit, 2 bonus for a full day, 1 for logging sugar honestly." />}
        {tab === 'Weight' && <Soon title="Weight" big={String(lastKg ?? '–')} unit="kg" line={`Goal: ${state.profile.startKg - state.profile.goalLossKg} kg. Weigh in once a week, before breakfast.`} />}
        <nav className="tabbar" aria-label="Main">
          {TABS.map(([t, ic]) => (
            <button key={t} className="tab" aria-current={tab === t ? 'page' : undefined} aria-label={t} onClick={() => setTab(t)}>
              <Icon name={ic} size={22} />{tab === t && <span>{t}</span>}
            </button>
          ))}
        </nav>
      </>}
      <AnimatePresence>{sugarOpen && <SugarSheet onClose={() => setSugarOpen(false)} onLog={logSugar} lateNights={lateNights} />}</AnimatePresence>
    </main>
  );
}
