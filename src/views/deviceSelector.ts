import { midiHub } from "../midiHub";

// Panel de selección de dispositivo MIDI, reutilizado por detector y calibración.
export function mountDeviceSelector(container: HTMLElement): () => void {
  container.innerHTML = `
    <section class="panel">
      <label for="input-select">Dispositivo MIDI</label>
      <select id="input-select" disabled>
        <option>Buscando dispositivos…</option>
      </select>
      <p id="device-status" class="status"></p>
    </section>
  `;

  const selectEl = container.querySelector<HTMLSelectElement>("#input-select")!;
  const statusEl = container.querySelector<HTMLParagraphElement>("#device-status")!;

  function render(): void {
    const inputs = midiHub.inputs;
    selectEl.innerHTML = "";
    selectEl.disabled = inputs.length === 0;

    if (inputs.length === 0) {
      selectEl.innerHTML = "<option>No se detectaron dispositivos MIDI</option>";
      statusEl.textContent =
        "No se encontró ninguna batería MIDI. Conecta el TD-02 por USB y recarga la página.";
      statusEl.classList.add("status--error");
      return;
    }

    for (const input of inputs) {
      const option = document.createElement("option");
      option.value = input.id;
      option.textContent = input.name ?? input.id;
      option.selected = input.id === midiHub.selectedInput?.id;
      selectEl.appendChild(option);
    }

    statusEl.classList.remove("status--error");
    statusEl.textContent = `Escuchando: ${midiHub.selectedInput?.name ?? "—"}`;
  }

  selectEl.addEventListener("change", () => {
    midiHub.selectInput(selectEl.value);
  });

  const unsubscribe = midiHub.onStateChange(render);
  render();

  return unsubscribe;
}
