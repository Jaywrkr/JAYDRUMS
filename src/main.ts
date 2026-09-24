import "./style.css";
import { requestMidiAccess, parseMidiMessage } from "./midi";
import { labelForNote } from "./drumMap";

const MAX_LOG_ROWS = 200;

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div class="page">
    <h1>J-Drums — Detector MIDI</h1>
    <p class="subtitle">Fase 1: verificar el mapa MIDI de tu batería antes de calibrar.</p>

    <section class="panel">
      <label for="input-select">Dispositivo MIDI</label>
      <select id="input-select" disabled>
        <option>Buscando dispositivos…</option>
      </select>
      <p id="status" class="status"></p>
    </section>

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

const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const selectEl = document.querySelector<HTMLSelectElement>("#input-select")!;
const lastHitEl = document.querySelector<HTMLDivElement>("#last-hit")!;
const logBody = document.querySelector<HTMLTableSectionElement>("#log-body")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clear-log")!;

clearBtn.addEventListener("click", () => {
  logBody.innerHTML = "";
});

function setStatus(message: string, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("status--error", isError);
}

function formatTime(timestamp: number): string {
  const totalMs = Math.round(timestamp);
  const seconds = Math.floor(totalMs / 1000) % 60;
  const ms = totalMs % 1000;
  const minutes = Math.floor(totalMs / 60000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function attachInput(input: MIDIInput) {
  input.onmidimessage = (event) => {
    const parsed = parseMidiMessage(event.data, performance.now());
    renderEvent(parsed);
  };
  setStatus(`Escuchando: ${input.name ?? input.id}`);
}

function renderEvent(evt: ReturnType<typeof parseMidiMessage>) {
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

function populateInputs(access: MIDIAccess) {
  const inputs = Array.from(access.inputs.values());

  selectEl.innerHTML = "";
  selectEl.disabled = inputs.length === 0;

  if (inputs.length === 0) {
    selectEl.innerHTML = "<option>No se detectaron dispositivos MIDI</option>";
    setStatus(
      "No se encontró ninguna batería MIDI. Conecta el TD-02 por USB y recarga la página.",
      true,
    );
    return;
  }

  for (const input of inputs) {
    const option = document.createElement("option");
    option.value = input.id;
    option.textContent = input.name ?? input.id;
    selectEl.appendChild(option);
  }

  selectEl.addEventListener("change", () => {
    const selected = access.inputs.get(selectEl.value);
    if (selected) attachInput(selected);
  });

  attachInput(inputs[0]);
}

async function main() {
  try {
    setStatus("Solicitando acceso MIDI…");
    const access = await requestMidiAccess();
    populateInputs(access);
    access.onstatechange = () => populateInputs(access);
  } catch (err) {
    setStatus(err instanceof Error ? err.message : String(err), true);
  }
}

main();
