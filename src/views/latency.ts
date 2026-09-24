import { midiHub } from "../midiHub";
import { scheduleMetronome } from "../metronome";
import { loadLatencyOffsetMs, saveLatencyOffsetMs } from "../latency";
import type { MidiEvent } from "../midi";
import { mountDeviceSelector } from "./deviceSelector";

const TEST_BPM = 80;
const BEATS_PER_BAR = 4;
const TOTAL_BEATS = 16;
const CLICK_WINDOW_MS = 250;
const LEAD_IN_MS = 100;

export function mountLatency(container: HTMLElement): () => void {
  container.innerHTML = `
    <div class="page">
      <h2 class="view-title">Latencia</h2>
      <p class="subtitle">
        Mide el desfase entre el clic del metrónomo y tu golpe real, para que la Práctica
        evalúe con tu latencia real (del cable, el módulo, el sistema) y no te penalice injustamente.
      </p>

      <div id="device-selector"></div>

      <section class="panel">
        <p>Offset guardado actualmente: <b id="current-offset"></b></p>
        <p class="subtitle">
          Vas a escuchar 16 clics a ${TEST_BPM} BPM. Golpeá cualquier pieza de tu batería
          exactamente cuando suene cada clic.
        </p>
        <button id="start-btn">Empezar prueba</button>
        <div id="beat-dots" class="beat-dots"></div>
        <p id="latency-message" class="status"></p>
        <div id="latency-result" class="results" hidden>
          <h3>Resultado</h3>
          <p id="result-text"></p>
          <div class="calib-actions">
            <button id="apply-btn">Guardar y usar este offset</button>
            <button id="reset-btn">Volver a 0 ms</button>
          </div>
        </div>
      </section>
    </div>
  `;

  const unmountSelector = mountDeviceSelector(
    container.querySelector<HTMLDivElement>("#device-selector")!,
  );

  const currentOffsetEl = container.querySelector<HTMLElement>("#current-offset")!;
  const startBtn = container.querySelector<HTMLButtonElement>("#start-btn")!;
  const dotsEl = container.querySelector<HTMLDivElement>("#beat-dots")!;
  const messageEl = container.querySelector<HTMLParagraphElement>("#latency-message")!;
  const resultEl = container.querySelector<HTMLDivElement>("#latency-result")!;
  const resultTextEl = container.querySelector<HTMLParagraphElement>("#result-text")!;
  const applyBtn = container.querySelector<HTMLButtonElement>("#apply-btn")!;
  const resetBtn = container.querySelector<HTMLButtonElement>("#reset-btn")!;

  let audioCtx: AudioContext | null = null;
  let clickTimes: number[] = [];
  let matched = new Set<number>();
  let hits: { clickIndex: number; diffMs: number }[] = [];
  let running = false;
  let rafId = 0;
  let pendingOffsetMs = 0;

  function renderCurrentOffset(): void {
    currentOffsetEl.textContent = `${loadLatencyOffsetMs()} ms`;
  }

  function renderDots(): void {
    dotsEl.innerHTML = "";
    for (let i = 0; i < TOTAL_BEATS; i++) {
      const dot = document.createElement("span");
      dot.className = "beat-dot";
      if (matched.has(i)) dot.classList.add("beat-dot--hit");
      dotsEl.appendChild(dot);
    }
  }

  function getAudioContext(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  }

  function handleMidiEvent(evt: MidiEvent): void {
    if (!running || evt.kind !== "noteon") return;
    const hitTime = performance.now();

    let bestIndex = -1;
    let bestDiff = Infinity;
    clickTimes.forEach((clickTime, index) => {
      if (matched.has(index)) return;
      const diff = Math.abs(hitTime - clickTime);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = index;
      }
    });

    if (bestIndex === -1 || bestDiff > CLICK_WINDOW_MS) return;

    matched.add(bestIndex);
    hits.push({ clickIndex: bestIndex, diffMs: hitTime - clickTimes[bestIndex] });
    renderDots();
  }

  function tick(): void {
    const lastClick = clickTimes[clickTimes.length - 1];
    if (performance.now() > lastClick + CLICK_WINDOW_MS + 300) {
      finish();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function finish(): void {
    running = false;
    startBtn.disabled = false;

    // El primer clic suele salir peor (el usuario todavía está entrando en tempo).
    const usable = hits.filter((h) => h.clickIndex > 0).map((h) => h.diffMs);

    if (usable.length < 4) {
      messageEl.textContent = `Solo se detectaron ${hits.length} golpes válidos. Probá de nuevo, tocando más fuerte y parejo.`;
      resultEl.hidden = true;
      return;
    }

    const sorted = [...usable].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    pendingOffsetMs = median;

    messageEl.textContent = "";
    resultTextEl.textContent = `Desfase medido: ${Math.round(median)} ms sobre ${usable.length} golpes (mediana). ${
      median > 0 ? "Tendés a llegar tarde." : median < 0 ? "Tendés a adelantarte." : "Estás muy justo al tiempo."
    }`;
    resultEl.hidden = false;
  }

  function start(): void {
    startBtn.disabled = true;
    resultEl.hidden = true;
    messageEl.textContent = "";
    matched = new Set();
    hits = [];
    renderDots();

    const ctx = getAudioContext();
    void ctx.resume();

    const secondsPerBeat = 60 / TEST_BPM;
    const audioStart = ctx.currentTime + LEAD_IN_MS / 1000;
    scheduleMetronome(ctx, audioStart, TEST_BPM, BEATS_PER_BAR, TOTAL_BEATS);

    const startTimestamp = performance.now() + LEAD_IN_MS;
    clickTimes = Array.from({ length: TOTAL_BEATS }, (_, i) => startTimestamp + i * secondsPerBeat * 1000);

    running = true;
    rafId = requestAnimationFrame(tick);
  }

  startBtn.addEventListener("click", start);

  applyBtn.addEventListener("click", () => {
    saveLatencyOffsetMs(pendingOffsetMs);
    renderCurrentOffset();
    messageEl.textContent = "Offset guardado. La Práctica ya lo va a usar.";
    resultEl.hidden = true;
  });

  resetBtn.addEventListener("click", () => {
    saveLatencyOffsetMs(0);
    renderCurrentOffset();
    messageEl.textContent = "Offset restablecido a 0 ms.";
    resultEl.hidden = true;
  });

  renderCurrentOffset();
  renderDots();

  const unsubscribeEvents = midiHub.onEvent(handleMidiEvent);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    unsubscribeEvents();
    unmountSelector();
    if (audioCtx) void audioCtx.close();
  };
}
