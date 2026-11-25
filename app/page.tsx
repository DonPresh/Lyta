'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader } from '@/components/Loader';
import { Onboarding } from '@/components/Onboarding';
import { Today } from '@/components/Today';
import { SugarSheet } from '@/components/SugarSheet';
import { WeightScreen } from '@/components/Weight';
import { RoutinePlayer } from '@/components/Routine';
import { ROUTINES, routineOf } from '@/lib/routines';
import { WalkTimer } from '@/components/Walk';
import { Icon, type IconName } from '@/components/icons';
import { addDays, isDone, streak, useLyta, type HabitDef } from '@/lib/store';

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
  const L = useLyta();
  const { state, ready, today, setProfile, toggle, logSugar } = L;
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Today');
  const [sugarDate, setSugarDate] = useState<string | null>(null);
  const [routineFor, setRoutineFor] = useState<HabitDef | null>(null);

  const s = streak(state, today);
  const lateNights = Array.from({ length: 7 }, (_, i) => addDays(today, -i - 1)).filter(d => state.days[d] && !isDone(state.days[d], 'bed')).length;

  return (
    <main className="app" style={!state.profile ? { paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' } : undefined}>
      {loading && <Loader onDone={() => setLoading(false)} />}
      {ready && !state.profile && <Onboarding onDone={setProfile} />}
      {ready && state.profile && <>
        {tab === 'Today' && <Today profile={state.profile} habits={state.habits} days={state.days} today={today} streak={s} onToggle={toggle} setWater={L.setWater} onSugar={setSugarDate} setSteps={L.setSteps} saveHabit={L.saveHabit} deleteHabit={L.deleteHabit} onRoutine={setRoutineFor} />}
        {tab === 'Streak' && <Soon title="Streak" big={String(s)} unit="days showed up" line="Tick one habit and the day counts. You get 2 freezes a month, used automatically." />}
        {tab === 'Rewards' && <Soon title="Rewards" big={String(state.points)} unit="points" line="1 per habit, 2 bonus for a full day, 1 for logging sugar honestly." />}
        {tab === 'Weight' && <WeightScreen state={state} today={today} saveWeight={L.saveWeight} deleteWeight={L.deleteWeight} updateProfile={L.updateProfile} />}
        <nav className="tabbar" aria-label="Main">
          {TABS.map(([t, ic]) => (
            <button key={t} className="tab" aria-current={tab === t ? 'page' : undefined} aria-label={t} onClick={() => setTab(t)}>
              <Icon name={ic} size={22} />{tab === t && <span>{t}</span>}
            </button>
          ))}
        </nav>
      </>}
      <AnimatePresence>{routineFor && (() => {
        const kind = routineOf(routineFor), log = state.days[today]?.routines?.[routineFor.id];
        if (kind === 'walk') return <WalkTimer key="walk" title={routineFor.title} walkedToday={log?.minutes ?? 0} onClose={() => setRoutineFor(null)}
          onFinish={(min, steps) => { L.logRoutine(routineFor.id, { minutes: (log?.minutes ?? 0) + min, at: new Date().toISOString() }); if (steps) L.setSteps((state.days[today]?.steps ?? 0) + steps); toggle(routineFor.id, today, true); }} />;
        if (kind && ROUTINES[kind]) return <RoutinePlayer key="routine" routine={ROUTINES[kind]} existing={log}
          onClose={() => setRoutineFor(null)} onFinish={(l, did) => { L.logRoutine(routineFor.id, l); if (did) toggle(routineFor.id, today, true); }} />;
        return null;
      })()}</AnimatePresence>
      <AnimatePresence>{sugarDate && <SugarSheet onClose={() => setSugarDate(null)} onLog={l => logSugar(l, sugarDate)} lateNights={lateNights} />}</AnimatePresence>
    </main>
  );
}
