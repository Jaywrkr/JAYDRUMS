import { midiHub } from "../midiHub";
import { labelForPieceId, colorForPieceId } from "../pieces";
import { loadMidiMap, buildNoteToPieceMap } from "../storage";
import { LESSONS } from "../lessons";
import { scheduleMetronome } from "../metronome";
import { getBestScore, recordScore } from "../scores";
import type { Chart } from "../chart";
import type { MidiEvent } from "../midi";
import { mountDeviceSelector } from "./deviceSelector";

const TRAVEL_MS = 1800; // tiempo que tarda una nota en llegar desde el spawn hasta la línea de golpe
const HIT_LINE_OFFSET_PX = 40; // vertical: distancia desde abajo. horizontal: distancia desde la izquierda.
const WINDOW_PERFECT_MS = 30;
const WINDOW_GOOD_MS = 70;
const WINDOW_OK_MS = 150;
const END_BUFFER_MS = TRAVEL_MS + 500;
const LEAD_IN_MS = 100; // margen para agendar el audio con precisión
const MAX_MULTIPLIER = 4;
const COMBO_STEP = 10; // cada 10 golpes seguidos sube el multiplicador

type Judgement = "perfect" | "good" | "ok" | "miss";
type Orientation = "vertical" | "horizontal";

const JUDGEMENT_POINTS: Record<Judgement, number> = {
  perfect: 100,
  good: 70,
  ok: 30,
  miss: 0,
};

const JUDGEMENT_LABEL: Record<Judgement, string> = {
  perfect: "¡Perfecto!",
  good: "Bien",
  ok: "Flojo",
  miss: "Fallo",
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
      <h2 class="view-title">Práctica</h2>
      <p class="subtitle">Toca sobre el patrón. Calibra tu kit primero en la pestaña Calibración.</p>

      <div id="device-selector"></div>

      <section class="panel">
        <div class="lesson-row">
          <div>
            <label for="lesson-select">Lección</label>
            <select id="lesson-select"></select>
          </div>
          <div class="best-score">
            <span class="best-score__label">Mejor puntaje</span>
            <span class="best-score__value" id="best-score-value">—</span>
          </div>
        </div>

        <div class="game-options">
          <div class="orientation-toggle" role="group" aria-label="Dirección de las notas">
            <button data-orientation="vertical" class="orient-btn orient-btn--active">↓ Arriba a abajo</button>
            <button data-orientation="horizontal" class="orient-btn">← Derecha a izquierda</button>
          </div>
          <label class="metronome-toggle">
            <input type="checkbox" id="metronome-toggle" checked />
            Metrónomo
          </label>
        </div>

        <div class="game-controls">
          <button id="start-btn">Empezar</button>
          <div class="game-stats">
            <span>Puntaje: <b id="stat-score">0</b></span>
            <span>Racha: <b id="stat-streak">0</b> <span id="stat-multiplier" class="multiplier"></span></span>
            <span>Precisión: <b id="stat-accuracy">—</b></span>
          </div>
        </div>
        <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
        <p id="game-message" class="status"></p>

        <div id="results" class="results" hidden>
          <h3 id="results-title"></h3>
          <div class="results-grid">
            <div class="results-stat"><span class="dot dot--perfect"></span>Perfecto <b id="res-perfect">0</b></div>
            <div class="results-stat"><span class="dot dot--good"></span>Bien <b id="res-good">0</b></div>
            <div class="results-stat"><span class="dot dot--ok"></span>Flojo <b id="res-ok">0</b></div>
            <div class="results-stat"><span class="dot dot--miss"></span>Fallo <b id="res-miss">0</b></div>
          </div>
          <p id="results-summary"></p>
        </div>
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
  const bestScoreValueEl = container.querySelector<HTMLSpanElement>("#best-score-value")!;
  const startBtn = container.querySelector<HTMLButtonElement>("#start-btn")!;
  const messageEl = container.querySelector<HTMLParagraphElement>("#game-message")!;
  const lanesEl = container.querySelector<HTMLDivElement>("#lanes")!;
  const scoreEl = container.querySelector<HTMLElement>("#stat-score")!;
  const streakEl = container.querySelector<HTMLElement>("#stat-streak")!;
  const multiplierEl = container.querySelector<HTMLElement>("#stat-multiplier")!;
  const accuracyEl = container.querySelector<HTMLElement>("#stat-accuracy")!;
  const progressFillEl = container.querySelector<HTMLDivElement>("#progress-fill")!;
  const metronomeToggle = container.querySelector<HTMLInputElement>("#metronome-toggle")!;
  const orientBtns = container.querySelectorAll<HTMLButtonElement>(".orient-btn");
  const resultsEl = container.querySelector<HTMLDivElement>("#results")!;
  const resultsTitleEl = container.querySelector<HTMLHeadingElement>("#results-title")!;
  const resultsSummaryEl = container.querySelector<HTMLParagraphElement>("#results-summary")!;
  const resultCountEls: Record<Judgement, HTMLElement> = {
    perfect: container.querySelector<HTMLElement>("#res-perfect")!,
    good: container.querySelector<HTMLElement>("#res-good")!,
    ok: container.querySelector<HTMLElement>("#res-ok")!,
    miss: container.querySelector<HTMLElement>("#res-miss")!,
  };

  for (const chart of LESSONS) {
    const option = document.createElement("option");
    option.value = chart.id;
    option.textContent = `${chart.name} (${chart.bpm} BPM)`;
    lessonSelect.appendChild(option);
  }

  let orientation: Orientation = "vertical";
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
  let judgementCounts: Record<Judgement, number> = { perfect: 0, good: 0, ok: 0, miss: 0 };
  let audioCtx: AudioContext | null = null;

  function currentChart(): Chart {
    return LESSONS.find((c) => c.id === lessonSelect.value) ?? LESSONS[0];
  }

  function renderBestScore(): void {
    const best = getBestScore(currentChart().id);
    bestScoreValueEl.textContent = best
      ? `${best.bestScore} pts · ${best.bestAccuracy}% · racha ${best.bestStreak}`
      : "—";
  }

  function buildLanes(chart: Chart): void {
    lanesEl.innerHTML = "";
    lanesEl.classList.toggle("lanes--horizontal", orientation === "horizontal");
    laneElsByPiece = new Map();

    for (const pieceId of chart.lanes) {
      const lane = document.createElement("div");
      lane.className = orientation === "horizontal" ? "lane lane--horizontal" : "lane";
      const hitLineClass = orientation === "horizontal" ? "hit-line hit-line--horizontal" : "hit-line";
      lane.innerHTML = `
        <div class="lane-label">${labelForPieceId(pieceId)}</div>
        <div class="${hitLineClass}"></div>
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
      el.className = orientation === "horizontal" ? "note note--horizontal" : "note note--vertical";
      el.style.backgroundColor = colorForPieceId(note.pieceId);
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
    judgementCounts = { perfect: 0, good: 0, ok: 0, miss: 0 };
    updateStats();
    progressFillEl.style.width = "0%";
    resultsEl.hidden = true;
  }

  function currentMultiplier(): number {
    return Math.min(MAX_MULTIPLIER, 1 + Math.floor(streak / COMBO_STEP));
  }

  function updateStats(): void {
    scoreEl.textContent = String(score);
    streakEl.textContent = String(streak);
    const multiplier = currentMultiplier();
    multiplierEl.textContent = multiplier > 1 ? `x${multiplier}` : "";
    accuracyEl.textContent = judgedCount === 0 ? "—" : `${Math.round((hitCount / judgedCount) * 100)}%`;
  }

  function spawnPopup(note: LiveNote, judgement: Judgement, points: number): void {
    const lane = note.el.parentElement;
    if (!lane) return;
    const popup = document.createElement("span");
    popup.className = `judgement-popup judgement-popup--${judgement} judgement-popup--${orientation}`;
    popup.textContent = points > 0 ? `${JUDGEMENT_LABEL[judgement]} +${points}` : JUDGEMENT_LABEL[judgement];
    lane.appendChild(popup);
    window.setTimeout(() => popup.remove(), 650);
  }

  function judgeNote(note: LiveNote, judgement: Judgement): void {
    note.judged = judgement;
    note.el.style.backgroundColor = "";
    note.el.classList.add(`note--${judgement}`, "note--fade");

    judgementCounts[judgement] += 1;
    judgedCount += 1;

    let points = 0;
    if (judgement === "miss") {
      streak = 0;
    } else {
      points = JUDGEMENT_POINTS[judgement] * currentMultiplier();
      score += points;
      hitCount += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    }

    spawnPopup(note, judgement, points);
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

  function positionNote(note: LiveNote, currentTime: number): void {
    const progress = 1 - ((note.time - currentTime) * 1000) / TRAVEL_MS;

    if (orientation === "vertical") {
      const hitY = lanesEl.clientHeight - HIT_LINE_OFFSET_PX;
      note.el.style.top = `${progress * hitY}px`;
    } else {
      const spawnX = lanesEl.clientWidth;
      const hitX = HIT_LINE_OFFSET_PX;
      note.el.style.left = `${spawnX - progress * (spawnX - hitX)}px`;
    }
  }

  function tick(): void {
    const chart = currentChart();
    const currentTime = (performance.now() - startTimestamp) / 1000;

    if (currentTime < 0) {
      const secondsPerBeat = 60 / chart.bpm;
      const beatsLeft = Math.ceil(-currentTime / secondsPerBeat);
      messageEl.textContent = beatsLeft > 0 ? `Preparate… ${beatsLeft}` : "¡Ya!";
      rafId = requestAnimationFrame(tick);
      return;
    }

    if (messageEl.textContent.startsWith("Preparate") || messageEl.textContent === "¡Ya!") {
      messageEl.textContent = "";
    }

    for (const note of liveNotes) {
      if (note.judged) continue;

      if (currentTime > note.time + WINDOW_OK_MS / 1000) {
        judgeNote(note, "miss");
        continue;
      }

      positionNote(note, currentTime);
    }

    progressFillEl.style.width = `${Math.min(100, (currentTime / chart.durationSeconds) * 100)}%`;

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
    orientBtns.forEach((btn) => (btn.disabled = false));

    const accuracy = judgedCount === 0 ? 0 : Math.round((hitCount / judgedCount) * 100);
    const previousBest = getBestScore(currentChart().id);
    const result = recordScore(currentChart().id, score, accuracy, bestStreak);
    const isNewBest = !previousBest || result.bestScore === score;

    resultsTitleEl.textContent = isNewBest ? "¡Nuevo mejor puntaje!" : "Lección terminada";
    for (const judgement of Object.keys(resultCountEls) as Judgement[]) {
      resultCountEls[judgement].textContent = String(judgementCounts[judgement]);
    }
    resultsSummaryEl.textContent = `${score} puntos · ${accuracy}% de precisión · racha máxima ${bestStreak}.`;
    resultsEl.hidden = false;
    renderBestScore();
  }

  function getAudioContext(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  }

  function start(): void {
    const chart = currentChart();
    resetStats();
    buildLanes(chart);
    buildNotes(chart);
    messageEl.textContent = "";
    startBtn.disabled = true;
    lessonSelect.disabled = true;
    orientBtns.forEach((btn) => (btn.disabled = true));
    running = true;

    const secondsPerBeat = 60 / chart.bpm;
    const countInBeats = chart.beatsPerBar;
    const countInSeconds = countInBeats * secondsPerBeat;

    // El tiempo 0 del patrón (donde caen las notas) arranca después de la
    // cuenta de entrada, para que el usuario ya sienta el tempo.
    startTimestamp = performance.now() + LEAD_IN_MS + countInSeconds * 1000;

    if (metronomeToggle.checked) {
      const ctx = getAudioContext();
      void ctx.resume();
      const audioStart = ctx.currentTime + LEAD_IN_MS / 1000;
      const chartBeats = Math.round(chart.durationSeconds / secondsPerBeat);
      scheduleMetronome(ctx, audioStart, chart.bpm, chart.beatsPerBar, countInBeats + chartBeats);
    }

    rafId = requestAnimationFrame(tick);
  }

  startBtn.addEventListener("click", start);

  orientBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      orientation = btn.dataset.orientation as Orientation;
      orientBtns.forEach((b) => b.classList.toggle("orient-btn--active", b === btn));
      buildLanes(currentChart());
    });
  });

  lessonSelect.addEventListener("change", () => {
    buildLanes(currentChart());
    renderBestScore();
    resultsEl.hidden = true;
  });

  buildLanes(currentChart());
  renderBestScore();

  const unsubscribeEvents = midiHub.onEvent(handleMidiEvent);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    unsubscribeEvents();
    unmountSelector();
    if (audioCtx) void audioCtx.close();
  };
}
