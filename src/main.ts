import "./style.css";
import { midiHub } from "./midiHub";
import { mountDetector } from "./views/detector";
import { mountCalibration } from "./views/calibration";
import { mountLatency } from "./views/latency";
import { mountGame } from "./views/game";

type ViewId = "detector" | "calibration" | "latency" | "game";

const VIEW_MOUNTERS: Record<ViewId, (container: HTMLElement) => () => void> = {
  detector: mountDetector,
  calibration: mountCalibration,
  latency: mountLatency,
  game: mountGame,
};

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <header class="app-header">
    <div class="app-header__brand">
      <span class="app-header__logo">🥁</span>
      <div>
        <h1 class="app-header__title">J-Drums</h1>
        <p class="app-header__tagline">Batería electrónica, evaluada en tiempo real</p>
      </div>
    </div>
  </header>
  <nav class="tabs">
    <button data-view="detector" class="tab tab--active">Detector</button>
    <button data-view="calibration" class="tab">Calibración</button>
    <button data-view="latency" class="tab">Latencia</button>
    <button data-view="game" class="tab">Práctica</button>
  </nav>
  <div id="view"></div>
`;

const viewContainer = app.querySelector<HTMLDivElement>("#view")!;
const tabButtons = app.querySelectorAll<HTMLButtonElement>(".tab");

let unmountCurrentView: (() => void) | null = null;

function showView(view: ViewId): void {
  unmountCurrentView?.();
  tabButtons.forEach((btn) => btn.classList.toggle("tab--active", btn.dataset.view === view));
  unmountCurrentView = VIEW_MOUNTERS[view](viewContainer);
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view as ViewId));
});

async function main(): Promise<void> {
  try {
    await midiHub.init();
  } catch (err) {
    viewContainer.innerHTML = `<div class="page"><p class="status status--error">${
      err instanceof Error ? err.message : String(err)
    }</p></div>`;
    return;
  }
  showView("detector");
}

main();
