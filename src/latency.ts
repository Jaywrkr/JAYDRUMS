const STORAGE_KEY = "jaydrums.latencyOffsetMs";

// Offset promedio (ms) entre el click del metrónomo y el golpe real del
// usuario. Positivo = el usuario/sistema tiende a registrar el golpe tarde;
// se resta al tiempo del golpe antes de evaluarlo contra el patrón.
export function loadLatencyOffsetMs(): number {
  const raw = localStorage.getItem(STORAGE_KEY);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function saveLatencyOffsetMs(value: number): void {
  localStorage.setItem(STORAGE_KEY, String(Math.round(value)));
}
