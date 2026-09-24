import { DRUM_PIECES } from "./pieces";

export type MidiMap = Record<string, number>;

const STORAGE_KEY = "jaydrums.midiMap";

function defaultMidiMap(): MidiMap {
  const map: MidiMap = {};
  for (const piece of DRUM_PIECES) map[piece.id] = piece.defaultNote;
  return map;
}

export function loadMidiMap(): MidiMap {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as MidiMap;
      return { ...defaultMidiMap(), ...parsed };
    } catch {
      // Datos corruptos: se ignoran y se usa el mapa por defecto.
    }
  }
  return defaultMidiMap();
}

export function saveMidiMap(map: MidiMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function setPieceNote(pieceId: string, note: number): MidiMap {
  const map = loadMidiMap();
  map[pieceId] = note;
  saveMidiMap(map);
  return map;
}
