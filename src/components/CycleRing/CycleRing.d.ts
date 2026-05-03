declare module '@/components/CycleRing/CycleRing' {
  import type { ComponentType } from 'react';

  export interface WakeClassification {
    color: string;
    label: string;
    deltaMin: number;
    posInCycle?: number;
    minutesToNextBoundary?: number;
  }

  export interface CycleRingProps {
    currentTime: Date;
    wakeDate: Date;
    showCycleBoundaries?: boolean;
    showStageMarkers?: boolean;
    showRedStages?: boolean;
    showAmberStages?: boolean;
    showGreenStages?: boolean;
    cycleMinutes?: number;
    wakeClassification?: WakeClassification | null;
    size?: number;
  }

  const CycleRing: ComponentType<CycleRingProps>;
  export default CycleRing;
}
