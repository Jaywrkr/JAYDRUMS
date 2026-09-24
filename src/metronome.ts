// Metrónomo con Web Audio API. Los clics se agendan por adelantado con
// tiempos exactos de AudioContext, así no dependen del framerate de rAF.
function playClick(ctx: AudioContext, time: number, accent: boolean): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = accent ? 1500 : 900;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.35 : 0.2, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.06);
}

export function scheduleMetronome(
  ctx: AudioContext,
  startTime: number,
  bpm: number,
  beatsPerBar: number,
  totalBeats: number,
): void {
  const secondsPerBeat = 60 / bpm;
  for (let beat = 0; beat < totalBeats; beat++) {
    const time = startTime + beat * secondsPerBeat;
    const accent = beat % beatsPerBar === 0;
    playClick(ctx, time, accent);
  }
}
