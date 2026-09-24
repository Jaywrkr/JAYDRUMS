import { midiHub } from "../midiHub";
import { labelForPieceId } from "../pieces";
import { loadMidiMap, buildNoteToPieceMap } from "../storage";
import { LESSONS } from "../lessons";
import type { Chart } from "../chart";
import type { MidiEvent } from "../midi";
import { mountDeviceSelector } from "./deviceSelector";

const TRAVEL_MS = 1800; // tiempo que tarda una nota en bajar desde arriba hasta la línea de golpe
const HIT_LINE_OFFSET_PX = 40;
const WINDOW_PERFECT_MS = 30;
const WINDOW_GOOD_MS = 70;
const WINDOW_OK_MS = 150;
const END_BUFFER_MS = TRAVEL_MS + 500;

type Judgement = "perfect" | "good" | "ok" | "miss";

const JUDGEMENT_POINTS: Record<Judgement, number> = {
  perfect: 100,
  good: 70,
  ok: 30,
  miss: 0,
};

interface LiveNote {
  time: number;
  pieceId: string;
  el: HTMLDivElement;
  judged: Judgement | null;
}

export function mountGame(container: HTMLElement): () => void {
  container.innerHTML = `
    <div class="page">
      <h1>J-Drums — Práctica</h1>
      <p class="subtitle">Toca sobre el patrón. Calibra tu kit primero en la pestaña Calibración.</p>

      <div id="device-selector"></div>

      <section class="panel">
        <label for="lesson-select">Lección</label>
        <select id="lesson-select"></select>

        <div class="game-controls">
          <button id="start-btn">Empezar</button>
          <div class="game-stats">
            <span>Puntaje: <b id="stat-score">0</b></span>
            <span>Racha: <b id="stat-streak">0</b></span>
            <span>Precisión: <b id="stat-accuracy">—</b></span>
          </div>
        </div>
        <p id="game-message" class="status"></p>
      </section>

      <section class="panel">
        <div id="lanes" class="lanes"></div>
      </section>
    </div>
  `;

  const unmountSelector = mountDeviceSelector(
    container.querySelector<HTMLDivElement>("#device-selector")!,
  );

  const lessonSelect = container.querySelector<HTMLSelectElement>("#lesson-select")!;
  const startBtn = container.querySelector<HTMLButtonElement>("#start-btn")!;
  const messageEl = container.querySelector<HTMLParagraphElement>("#game-message")!;
  const lanesEl = container.querySelector<HTMLDivElement>("#lanes")!;
  const scoreEl = container.querySelector<HTMLElement>("#stat-score")!;
  const streakEl = container.querySelector<HTMLElement>("#stat-streak")!;
  const accuracyEl = container.querySelector<HTMLElement>("#stat-accuracy")!;

  for (const chart of LESSONS) {
    const option = document.createElement("option");
    option.value = chart.id;
    option.textContent = `${chart.name} (${chart.bpm} BPM)`;
    lessonSelect.appendChild(option);
  }

  let liveNotes: LiveNote[] = [];
  let laneElsByPiece = new Map<string, HTMLDivElement>();
  let startTimestamp = 0;
  let running = false;
  let rafId = 0;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let judgedCount = 0;
  let hitCount = 0;

  function currentChart(): Chart {
    return LESSONS.find((c) => c.id === lessonSelect.value) ?? LESSONS[0];
  }

  function buildLanes(chart: Chart): void {
    lanesEl.innerHTML = "";
    laneElsByPiece = new Map();
    for (const pieceId of chart.lanes) {
      const lane = document.createElement("div");
      lane.className = "lane";
      lane.innerHTML = `
        <div class="lane-label">${labelForPieceId(pieceId)}</div>
        <div class="hit-line"></div>
      `;
      lanesEl.appendChild(lane);
      laneElsByPiece.set(pieceId, lane);
    }
  }

  function buildNotes(chart: Chart): void {
    liveNotes = [];
    for (const note of chart.notes) {
      const lane = laneElsByPiece.get(note.pieceId);
      if (!lane) continue;
      const el = document.createElement("div");
      el.className = "note";
      lane.appendChild(el);
      liveNotes.push({ time: note.time, pieceId: note.pieceId, el, judged: null });
    }
  }

  function resetStats(): void {
    score = 0;
    streak = 0;
    bestStreak = 0;
    judgedCount = 0;
    hitCount = 0;
    updateStats();
  }

  function updateStats(): void {
    scoreEl.textContent = String(score);
    streakEl.textContent = String(streak);
    accuracyEl.textContent = judgedCount === 0 ? "—" : `${Math.round((hitCount / judgedCount) * 100)}%`;
  }

  function judgeNote(note: LiveNote, judgement: Judgement): void {
    note.judged = judgement;
    note.el.classList.add(`note--${judgement}`);
    note.el.classList.add("note--fade");

    score += JUDGEMENT_POINTS[judgement];
    judgedCount += 1;
    if (judgement === "miss") {
      streak = 0;
    } else {
      hitCount += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    }
    updateStats();

    window.setTimeout(() => note.el.remove(), 250);
  }

  function handleMidiEvent(evt: MidiEvent): void {
    if (!running || evt.kind !== "noteon" || evt.note === undefined) return;

    const noteToPiece = buildNoteToPieceMap(loadMidiMap());
    const pieceId = noteToPiece[evt.note];
    if (!pieceId) return;

    const currentTime = (performance.now() - startTimestamp) / 1000;

    let bestCandidate: LiveNote | null = null;
    let bestDiffMs = Infinity;
    for (const note of liveNotes) {
      if (note.judged || note.pieceId !== pieceId) continue;
      const diffMs = Math.abs((note.time - currentTime) * 1000);
      if (diffMs < bestDiffMs) {
        bestDiffMs = diffMs;
        bestCandidate = note;
      }
    }

    if (!bestCandidate || bestDiffMs > WINDOW_OK_MS) return;

    const judgement: Judgement =
      bestDiffMs <= WINDOW_PERFECT_MS ? "perfect" : bestDiffMs <= WINDOW_GOOD_MS ? "good" : "ok";
    judgeNote(bestCandidate, judgement);
  }

  function tick(): void {
    const chart = currentChart();
    const currentTime = (performance.now() - startTimestamp) / 1000;
    const hitLineY = lanesEl.clientHeight - HIT_LINE_OFFSET_PX;

    for (const note of liveNotes) {
      if (note.judged) continue;

      if (currentTime > note.time + WINDOW_OK_MS / 1000) {
        judgeNote(note, "miss");
        continue;
      }

      const progress = 1 - ((note.time - currentTime) * 1000) / TRAVEL_MS;
      note.el.style.top = `${progress * hitLineY}px`;
    }

    if (currentTime * 1000 > chart.durationSeconds * 1000 + END_BUFFER_MS) {
      finish();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function finish(): void {
    running = false;
    startBtn.disabled = false;
    lessonSelect.disabled = false;
    const accuracy = judgedCount === 0 ? 0 : Math.round((hitCount / judgedCount) * 100);
    messageEl.textContent = `Terminado. Precisión ${accuracy}% · racha máxima ${bestStreak}.`;
  }

  function start(): void {
    const chart = currentChart();
    resetStats();
    buildLanes(chart);
    buildNotes(chart);
    messageEl.textContent = "";
    startBtn.disabled = true;
    lessonSelect.disabled = true;
    running = true;
    startTimestamp = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  startBtn.addEventListener("click", start);
  buildLanes(currentChart());

  const unsubscribeEvents = midiHub.onEvent(handleMidiEvent);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    unsubscribeEvents();
    unmountSelector();
  };
}
