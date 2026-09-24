import "./style.css";
import { midiHub } from "./midiHub";
import { mountDetector } from "./views/detector";
import { mountCalibration } from "./views/calibration";
import { mountGame } from "./views/game";

type ViewId = "detector" | "calibration" | "game";

const VIEW_MOUNTERS: Record<ViewId, (container: HTMLElement) => () => void> = {
  detector: mountDetector,
  calibration: mountCalibration,
  game: mountGame,
};

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <nav class="tabs">
    <button data-view="detector" class="tab tab--active">Detector</button>
    <button data-view="calibration" class="tab">Calibración</button>
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
