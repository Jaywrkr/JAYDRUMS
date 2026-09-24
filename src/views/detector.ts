import { midiHub } from "../midiHub";
import { labelForNote } from "../drumMap";
import type { MidiEvent } from "../midi";
import { mountDeviceSelector } from "./deviceSelector";

const MAX_LOG_ROWS = 200;

export function mountDetector(container: HTMLElement): () => void {
  container.innerHTML = `
    <div class="page">
      <h1>J-Drums — Detector MIDI</h1>
      <p class="subtitle">Verifica el mapa MIDI de tu batería antes de calibrar.</p>

      <div id="device-selector"></div>

      <section class="panel">
        <h2>Último golpe</h2>
        <div id="last-hit" class="last-hit last-hit--empty">Esperando golpes…</div>
      </section>

      <section class="panel">
        <div class="log-header">
          <h2>Registro en vivo</h2>
          <button id="clear-log">Limpiar</button>
        </div>
        <table class="log">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Tipo</th>
              <th>Nota</th>
              <th>Pieza (mapa por defecto)</th>
              <th>Velocity</th>
              <th>CC</th>
              <th>Valor</th>
              <th>Canal</th>
              <th>Raw</th>
            </tr>
          </thead>
          <tbody id="log-body"></tbody>
        </table>
      </section>
    </div>
  `;

  const unmountSelector = mountDeviceSelector(
    container.querySelector<HTMLDivElement>("#device-selector")!,
  );

  const lastHitEl = container.querySelector<HTMLDivElement>("#last-hit")!;
  const logBody = container.querySelector<HTMLTableSectionElement>("#log-body")!;
  const clearBtn = container.querySelector<HTMLButtonElement>("#clear-log")!;

  clearBtn.addEventListener("click", () => {
    logBody.innerHTML = "";
  });

  function formatTime(timestamp: number): string {
    const totalMs = Math.round(timestamp);
    const seconds = Math.floor(totalMs / 1000) % 60;
    const ms = totalMs % 1000;
    const minutes = Math.floor(totalMs / 60000);
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
  }

  function renderEvent(evt: MidiEvent): void {
    if (evt.kind === "noteon" && evt.note !== undefined) {
      lastHitEl.classList.remove("last-hit--empty");
      lastHitEl.innerHTML = `
        <span class="last-hit__piece">${labelForNote(evt.note)}</span>
        <span class="last-hit__detail">nota ${evt.note} · velocity ${evt.velocity}</span>
      `;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatTime(evt.timestamp)}</td>
      <td>${evt.kind}</td>
      <td>${evt.note ?? ""}</td>
      <td>${evt.note !== undefined ? labelForNote(evt.note) : evt.kind === "cc" ? "CC (pedal hi-hat u otro)" : ""}</td>
      <td>${evt.velocity ?? ""}</td>
      <td>${evt.controller ?? ""}</td>
      <td>${evt.value ?? ""}</td>
      <td>${evt.channel}</td>
      <td>${evt.raw.join(" ")}</td>
    `;
    logBody.prepend(row);

    while (logBody.rows.length > MAX_LOG_ROWS) {
      logBody.deleteRow(logBody.rows.length - 1);
    }
  }

  const unsubscribeEvents = midiHub.onEvent(renderEvent);

  return () => {
    unsubscribeEvents();
    unmountSelector();
  };
}
