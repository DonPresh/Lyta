// Line drawings for each move, in the style of the Figma knee routine: 5px ink strokes, round caps, on a peach card.
// Coordinates sit in the same 354 x 270 box as the Figma illustration.
import type { ReactNode } from 'react';

const head = (x: number, y: number) => <circle cx={x} cy={y} r="14" />;
const floor = <path d="M87 210h180" />;
const chair = (x = 137) => <path d={`M${x} 210V155h50v55M${x} 155V130`} />;
const chairBehind = (x = 230) => <path d={`M${x} 210V110M${x} 155h44v55`} />;

const FIGURES: Record<string, ReactNode> = {
  // Knee
  quad: <>{floor}{head(118, 110)}<path d="M120 124l8 78M128 202h120M124 150l26 46" /><path d="M196 202v-12" stroke="var(--orange)" /></>,
  heel: <>{floor}{head(92, 188)}<path d="M106 194l64 8M170 202h86M170 202l34-44 30 46M120 198l30 4" /><path d="M246 182l-18 0m6-6l-6 6 6 6" stroke="var(--orange)" strokeWidth="4" /></>,
  slr: <>{floor}{head(92, 188)}<path d="M106 194l64 8M170 202l30-42 26 44M170 202l86-36M120 198l30 4" /><path d="M262 150v-20m-6 6l6-6 6 6" stroke="var(--orange)" strokeWidth="4" /></>,
  ext: <>{chair()}{floor}{head(162, 86)}<path d="M162 100v52h40M202 152h52M180 112l18 26M202 154v54" /><path d="M262 140v-16m-6 6l6-6 6 6" stroke="var(--orange)" strokeWidth="4" /></>,
  sts: <><path d="M117 210H137M137 210H187M137 210V155M187 210H237M187 210V155H137M137 155V130" /><circle cx="197" cy="75" r="14" /><path d="M197 89V139H175V177L161 210M197 105L223 127" /></>,
  calf: <>{floor}{chairBehind()}{head(168, 66)}<path d="M168 80v68M168 98l62 14M168 148l-8 46 6 10M168 148l8 46 6 10" /><path d="M150 206v-14m-6 6l6-6 6 6" stroke="var(--orange)" strokeWidth="4" /></>,
  // Desk break
  up: <>{floor}{head(177, 66)}<path d="M177 80v70M177 150l-14 58M177 150l14 58M177 100l-34 30M177 100l34 30" /><path d="M128 120l-10-6M226 120l10-6M126 138l-12 0M228 138l12 0" stroke="var(--orange)" strokeWidth="4" /></>,
  shoulders: <>{floor}{head(177, 66)}<path d="M177 80v70M177 150l-14 58M177 150l14 58M177 100l-26 44M177 100l26 44" /><path d="M146 96a16 16 0 1 1 6 22M208 96a16 16 0 1 0 -6 22" stroke="var(--orange)" strokeWidth="4" /></>,
  neck: <>{floor}<circle cx="190" cy="70" r="14" /><path d="M177 84v66M177 150l-14 58M177 150l14 58M177 100l-22 46M177 100l22 46" /><path d="M214 52a30 30 0 0 1 4 30" stroke="var(--orange)" strokeWidth="4" /></>,
  chest: <>{floor}{head(177, 66)}<path d="M177 80v70M177 150l-14 58M177 150l14 58M177 100l-20 32 22 12M177 100l20 32-18 12" /><path d="M150 96l-14-8M204 96l14-8" stroke="var(--orange)" strokeWidth="4" /></>,
  march: <>{floor}{head(177, 66)}<path d="M177 80v70M177 150l-6 58M177 150l28 6 -4 36M177 100l-24 36M177 100l26 -10" /><path d="M222 150h20M226 140h16" stroke="var(--orange)" strokeWidth="4" /></>,
  // Walk
  walk: <>{floor}{head(180, 66)}<path d="M178 80l-4 70M174 150l-24 58M174 150l26 30 4 28M176 100l-26 32M176 100l28 26" /><path d="M110 120h24M100 140h24M114 160h20" stroke="var(--orange)" strokeWidth="4" /></>,
};

export function Figure({ id, height = 270 }: { id: string; height?: number }) {
  return (
    <svg viewBox="40 30 274 210" width="100%" height={height} fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {FIGURES[id] ?? FIGURES.up}
    </svg>
  );
}
