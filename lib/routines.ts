// Guided routines. Knee first, built for knee osteoarthritis (low impact, no kneeling, no deep bends).
export type Exercise = {
  id: string;
  name: string;
  setup: string;
  steps: string[];
  easier: string;
  reps: number;
  hold?: number; // seconds per rep; absent = counted reps
  sides: boolean;
  skipWhenGentle?: boolean;
};

export type Routine = { id: string; name: string; rounds: number; note: string; exercises: Exercise[] };

export const KNEE: Routine = {
  id: 'knee',
  name: 'Knee routine',
  rounds: 1,
  note: 'Low impact and kind to arthritic knees. No kneeling, jumping or deep squats.',
  exercises: [
    { id: 'quad', name: 'Thigh squeeze', setup: 'Sit or lie with your legs straight out.', steps: ['Tighten the muscle on top of your thigh', 'Press the back of your knee down', 'Hold, then relax'], easier: 'Put a rolled towel under your knee and press into it.', reps: 10, hold: 5, sides: true },
    { id: 'heel', name: 'Heel slides', setup: 'Lie on your back with your legs straight.', steps: ['Slowly slide one heel towards you, bending the knee', 'Only go as far as feels okay', 'Slide it back out'], easier: 'Make the bend smaller. Socks on a smooth floor help.', reps: 10, sides: true },
    { id: 'slr', name: 'Straight leg raise', setup: 'Lie on your back. Bend one knee, foot flat.', steps: ['Keep the other leg straight and tighten the thigh', 'Lift it to the height of the bent knee', 'Lower it slowly'], easier: 'Lift only a few centimetres.', reps: 10, sides: true },
    { id: 'ext', name: 'Seated knee straightening', setup: 'Sit tall on a chair, feet flat on the floor.', steps: ['Straighten one knee until your leg is level', 'Hold', 'Lower it slowly'], easier: 'Don’t straighten all the way.', reps: 10, hold: 3, sides: true },
    { id: 'sts', name: 'Sit to stand', setup: 'Sit near the front of a firm chair, feet hip-width apart.', steps: ['Lean forward and stand up', 'Use your hands on your thighs if you need to', 'Sit back down slowly, don’t drop'], easier: 'Use a higher chair or sit on a cushion.', reps: 8, sides: false, skipWhenGentle: true },
    { id: 'calf', name: 'Calf raises', setup: 'Stand behind a chair and hold the back of it.', steps: ['Rise up onto your toes', 'Pause', 'Lower slowly'], easier: 'Rise only a little.', reps: 10, sides: false, skipWhenGentle: true },
  ],
};

export const ROUTINES: Record<string, Routine> = { knee: KNEE };

export type Step = { ex: Exercise; side?: 'Left' | 'Right'; round: number; reps: number };

export function plan(r: Routine, gentle: boolean): Step[] {
  const out: Step[] = [];
  const rounds = gentle ? 1 : r.rounds;
  for (let round = 1; round <= rounds; round++) {
    for (const ex of r.exercises) {
      if (gentle && ex.skipWhenGentle) continue;
      const reps = gentle ? Math.ceil(ex.reps / 2) : ex.reps;
      if (ex.sides) { out.push({ ex, side: 'Left', round, reps }, { ex, side: 'Right', round, reps }); }
      else out.push({ ex, round, reps });
    }
  }
  return out;
}

export const RELAX = 3;
export const minutes = (steps: Step[]) => Math.max(1, Math.round(steps.reduce((t, s) => t + s.reps * (s.ex.hold ? s.ex.hold + RELAX : 3) + 10, 0) / 60));
