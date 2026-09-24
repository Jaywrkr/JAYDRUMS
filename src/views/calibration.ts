import { midiHub } from "../midiHub";
import { DRUM_PIECES, type DrumPiece } from "../pieces";
import { loadMidiMap, setPieceNote, type MidiMap } from "../storage";
import type { MidiEvent } from "../midi";
import { mountDeviceSelector } from "./deviceSelector";

const AUTO_ADVANCE_MS = 1200;

export function mountCalibration(container: HTMLElement): () => void {
  container.innerHTML = `
    <div class="page">
      <h1>J-Drums — Calibración</h1>
      <p class="subtitle">Toca cada pieza cuando se te indique. Se guarda la nota que reciba la app.</p>

      <div id="device-selector"></div>

      <section class="panel">
        <p class="calib-progress" id="calib-progress"></p>
        <h2 id="calib-piece"></h2>
        <p id="calib-instruction"></p>
        <div id="calib-result" class="last-hit last-hit--empty">Esperando el golpe…</div>
        <div class="calib-actions">
          <button id="calib-repeat">Repetir esta pieza</button>
          <button id="calib-skip">Saltar</button>
        </div>
      </section>

      <section class="panel">
        <h2>Mapa actual</h2>
        <table class="log">
          <thead>
            <tr><th>Pieza</th><th>Nota</th><th></th></tr>
          </thead>
          <tbody id="map-body"></tbody>
        </table>
      </section>
    </div>
  `;

  const unmountSelector = mountDeviceSelector(
    container.querySelector<HTMLDivElement>("#device-selector")!,
  );

  const progressEl = container.querySelector<HTMLParagraphElement>("#calib-progress")!;
  const pieceEl = container.querySelector<HTMLHeadingElement>("#calib-piece")!;
  const instructionEl = container.querySelector<HTMLParagraphElement>("#calib-instruction")!;
  const resultEl = container.querySelector<HTMLDivElement>("#calib-result")!;
  const repeatBtn = container.querySelector<HTMLButtonElement>("#calib-repeat")!;
  const skipBtn = container.querySelector<HTMLButtonElement>("#calib-skip")!;
  const mapBody = container.querySelector<HTMLTableSectionElement>("#map-body")!;

  let map: MidiMap = loadMidiMap();
  let currentIndex = 0;
  let waiting = true;
  let autoAdvanceTimer: number | undefined;

  function currentPiece(): DrumPiece {
    return DRUM_PIECES[currentIndex];
  }

  function goToPiece(index: number): void {
    window.clearTimeout(autoAdvanceTimer);
    currentIndex = ((index % DRUM_PIECES.length) + DRUM_PIECES.length) % DRUM_PIECES.length;
    waiting = true;
    renderStep();
  }

  function nextPiece(): void {
    goToPiece(currentIndex + 1);
  }

  function renderStep(): void {
    const piece = currentPiece();
    progressEl.textContent = `Paso ${currentIndex + 1} de ${DRUM_PIECES.length}`;
    pieceEl.textContent = piece.label;
    instructionEl.textContent = piece.instruction;
    resultEl.className = "last-hit last-hit--empty";
    resultEl.textContent = "Esperando el golpe…";
    renderMap();
  }

  function renderMap(): void {
    mapBody.innerHTML = "";
    for (const [index, piece] of DRUM_PIECES.entries()) {
      const row = document.createElement("tr");
      const isCurrent = index === currentIndex;
      row.innerHTML = `
        <td>${piece.label}${isCurrent ? " ←" : ""}</td>
        <td>${map[piece.id]}</td>
        <td><button data-index="${index}" class="recalibrate">Recalibrar</button></td>
      `;
      mapBody.appendChild(row);
    }

    mapBody.querySelectorAll<HTMLButtonElement>(".recalibrate").forEach((btn) => {
      btn.addEventListener("click", () => {
        goToPiece(Number(btn.dataset.index));
      });
    });
  }

  function handleEvent(evt: MidiEvent): void {
    if (!waiting || evt.kind !== "noteon" || evt.note === undefined) return;

    waiting = false;
    map = setPieceNote(currentPiece().id, evt.note);

    resultEl.classList.remove("last-hit--empty");
    resultEl.innerHTML = `
      <span class="last-hit__piece">Nota ${evt.note} guardada</span>
      <span class="last-hit__detail">velocity ${evt.velocity} · avanzando…</span>
    `;
    renderMap();

    autoAdvanceTimer = window.setTimeout(nextPiece, AUTO_ADVANCE_MS);
  }

  repeatBtn.addEventListener("click", () => goToPiece(currentIndex));
  skipBtn.addEventListener("click", () => nextPiece());

  const unsubscribeEvents = midiHub.onEvent(handleEvent);
  renderStep();

  return () => {
    window.clearTimeout(autoAdvanceTimer);
    unsubscribeEvents();
    unmountSelector();
  };
}
