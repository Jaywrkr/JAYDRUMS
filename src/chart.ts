export interface ChartNote {
  time: number; // segundos desde el inicio del patrón
  pieceId: string;
}

export interface Chart {
  id: string;
  name: string;
  bpm: number;
  beatsPerBar: number;
  lanes: string[]; // pieceIds en orden de carriles, izquierda a derecha
  notes: ChartNote[];
  durationSeconds: number;
}

interface BeatHit {
  beat: number; // posición dentro del compás, en negras (0 = primer tiempo)
  pieceId: string;
}

interface BuildChartOptions {
  id: string;
  name: string;
  bpm: number;
  lanes: string[];
  pattern: BeatHit[];
  bars: number;
  beatsPerBar?: number;
}

export function buildChart(options: BuildChartOptions): Chart {
  const { id, name, bpm, lanes, pattern, bars, beatsPerBar = 4 } = options;
  const secondsPerBeat = 60 / bpm;
  const notes: ChartNote[] = [];

  for (let bar = 0; bar < bars; bar++) {
    for (const hit of pattern) {
      notes.push({
        time: (bar * beatsPerBar + hit.beat) * secondsPerBeat,
        pieceId: hit.pieceId,
      });
    }
  }

  notes.sort((a, b) => a.time - b.time);

  return {
    id,
    name,
    bpm,
    beatsPerBar,
    lanes,
    notes,
    durationSeconds: bars * beatsPerBar * secondsPerBeat,
  };
}
