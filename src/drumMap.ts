// Mapa MIDI por defecto del Roland TD-02 (referencia oficial + notas a verificar).
// Se usa solo como ayuda visual en el detector; la calibración real vendrá en la fase 2.
export const DEFAULT_DRUM_MAP: Record<number, string> = {
  36: "Kick",
  38: "Snare (parche)",
  40: "Snare (aro)",
  37: "Snare (cross-stick)",
  48: "Tom 1",
  45: "Tom 2",
  43: "Tom 3",
  46: "Hi-hat abierto (bow)",
  26: "Hi-hat abierto (edge)",
  42: "Hi-hat cerrado (verificar)",
  44: "Hi-hat pedal (verificar)",
  49: "Crash (verificar)",
  51: "Ride (verificar)",
};

export function labelForNote(note: number): string {
  return DEFAULT_DRUM_MAP[note] ?? `Nota ${note}`;
}
