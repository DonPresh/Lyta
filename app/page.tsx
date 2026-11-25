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
import { StreakScreen } from '@/components/Streak';
import { RewardsScreen } from '@/components/Rewards';
import { Icon, LytaMark, type IconName } from '@/components/icons';
import { addDays, isDone, streak, useLyta, type HabitDef } from '@/lib/store';

type Tab = 'Today' | 'Streak' | 'Rewards' | 'Weight';
const TABS: [Tab, IconName][] = [['Today', 'today'], ['Streak', 'streak'], ['Rewards', 'gift'], ['Weight', 'scale']];

export default function Home() {
  const L = useLyta();
  const { state, ready, today, setProfile, toggle, logSugar } = L;
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Today');
  const [sugarDate, setSugarDate] = useState<string | null>(null);
  const [pickDate, setPickDate] = useState<string | undefined>();
  const [routineFor, setRoutineFor] = useState<HabitDef | null>(null);

  const s = streak(state, today);
  const lateNights = Array.from({ length: 7 }, (_, i) => addDays(today, -i - 1)).filter(d => state.days[d] && !isDone(state.days[d], 'bed')).length;

  return (
    <main className={`app${state.profile ? ' has-nav' : ''}`} style={!state.profile ? { paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' } : undefined}>
      {loading && <Loader onDone={() => setLoading(false)} />}
      {ready && !state.profile && <Onboarding onDone={setProfile} />}
      {ready && state.profile && <>
        {tab === 'Today' && <Today key={pickDate ?? 'today'} initialSel={pickDate} profile={state.profile} habits={state.habits} days={state.days} today={today} streak={s} onToggle={toggle} setWater={L.setWater} onSugar={setSugarDate} setSteps={L.setSteps} saveHabit={L.saveHabit} deleteHabit={L.deleteHabit} onRoutine={setRoutineFor} setMeal={L.setMeal} />}
        {tab === 'Streak' && <StreakScreen state={state} today={today} onPickDay={d => { setPickDate(d === today ? undefined : d); setTab('Today'); }} />}
        {tab === 'Rewards' && <RewardsScreen state={state} today={today} saveReward={L.saveReward} deleteReward={L.deleteReward} claimReward={L.claimReward} />}
        {tab === 'Weight' && <WeightScreen state={state} today={today} saveWeight={L.saveWeight} deleteWeight={L.deleteWeight} updateProfile={L.updateProfile} />}
        <nav className="tabbar" aria-label="Main">
          <div className="nav-logo"><LytaMark size={26} /><span>lyta</span></div>
          {TABS.map(([t, ic]) => (
            <button key={t} className="tab" aria-current={tab === t ? 'page' : undefined} data-tab={t} aria-label={t} onClick={() => { setPickDate(undefined); setTab(t); }}>
              <Icon name={ic} size={22} /><span className="tab-label">{t}</span>
            </button>
          ))}
        </nav>
      </>}
      <AnimatePresence>{routineFor && (() => {
        const kind = routineOf(routineFor), log = state.days[today]?.routines?.[routineFor.id];
        if (kind === 'walk') return <WalkTimer key="walk" title={routineFor.title} walkedToday={log?.minutes ?? 0} onClose={() => setRoutineFor(null)}
          onFinish={(min, steps) => { L.logRoutine(routineFor.id, { minutes: (log?.minutes ?? 0) + min, at: new Date().toISOString() }, log ? 0 : 2); if (steps) L.setSteps((state.days[today]?.steps ?? 0) + steps); toggle(routineFor.id, today, true); }} />;
        const month = Object.entries(state.days).filter(([k]) => k.slice(0, 7) === today.slice(0, 7)).map(([, d]) => d.routines?.[routineFor.id]).filter(r => r && !(r.stopped && r.after === undefined));
        const monthCount = kind === 'desk' ? month.reduce((t, r) => t + (r?.times ?? 0), 0) : month.length;
        if (kind && ROUTINES[kind]) return <RoutinePlayer key="routine" routine={ROUTINES[kind]} existing={log} monthCount={monthCount}
          onClose={() => setRoutineFor(null)} onFinish={(l, did) => { L.logRoutine(routineFor.id, l, did && !log ? 2 : 0); if (did) toggle(routineFor.id, today, true); }} />;
        return null;
      })()}</AnimatePresence>
      <AnimatePresence>{sugarDate && <SugarSheet onClose={() => setSugarDate(null)} onLog={l => logSugar(l, sugarDate)} lateNights={lateNights} />}</AnimatePresence>
    </main>
  );
}
