export interface DrumPiece {
  id: string;
  label: string;
  instruction: string;
  defaultNote: number;
}

// Orden pensado para el flujo de calibración: piezas centrales primero,
// variantes de caja y hi-hat después, platillos al final.
export const DRUM_PIECES: DrumPiece[] = [
  { id: "kick", label: "Bombo", instruction: "Golpea el bombo", defaultNote: 36 },
  {
    id: "snare",
    label: "Caja (parche)",
    instruction: "Golpea la caja en el centro del parche",
    defaultNote: 38,
  },
  {
    id: "snare_rim",
    label: "Caja (aro)",
    instruction: "Golpea el aro de la caja (rimshot / aro solo)",
    defaultNote: 40,
  },
  {
    id: "snare_cross",
    label: "Caja (cross-stick)",
    instruction: "Toca un cross-stick en la caja",
    defaultNote: 37,
  },
  { id: "tom1", label: "Tom 1", instruction: "Golpea el tom 1 (más agudo)", defaultNote: 48 },
  { id: "tom2", label: "Tom 2", instruction: "Golpea el tom 2 (medio)", defaultNote: 45 },
  { id: "tom3", label: "Tom 3", instruction: "Golpea el tom 3 (más grave)", defaultNote: 43 },
  {
    id: "hihat_closed",
    label: "Hi-hat cerrado",
    instruction: "Golpea el hi-hat con el pedal presionado (cerrado)",
    defaultNote: 42,
  },
  {
    id: "hihat_bow",
    label: "Hi-hat abierto (campana)",
    instruction: "Golpea el hi-hat abierto, en la campana",
    defaultNote: 46,
  },
  {
    id: "hihat_edge",
    label: "Hi-hat abierto (borde)",
    instruction: "Golpea el hi-hat abierto, en el borde",
    defaultNote: 26,
  },
  {
    id: "hihat_pedal",
    label: "Hi-hat pedal (chick)",
    instruction: "Pisa el pedal del hi-hat sin usar la baqueta (chick)",
    defaultNote: 44,
  },
  { id: "crash", label: "Crash", instruction: "Golpea el platillo crash", defaultNote: 49 },
  { id: "ride", label: "Ride", instruction: "Golpea el platillo ride", defaultNote: 51 },
];

const PIECES_BY_ID = new Map(DRUM_PIECES.map((piece) => [piece.id, piece]));

export function labelForPieceId(pieceId: string): string {
  return PIECES_BY_ID.get(pieceId)?.label ?? pieceId;
}

// Color base de cada pieza antes de ser evaluada (el color de juicio
// -perfecto/bien/flojo/fallo- lo reemplaza al golpearla).
export const PIECE_COLORS: Record<string, string> = {
  kick: "#8a7fe0",
  snare: "#56c1c9",
  snare_rim: "#3fa9b3",
  snare_cross: "#2f8992",
  tom1: "#c98ee0",
  tom2: "#b06fd1",
  tom3: "#8a4fc2",
  hihat_closed: "#9aa5b1",
  hihat_bow: "#7c8794",
  hihat_edge: "#626b76",
  hihat_pedal: "#4d545c",
  crash: "#e0b34f",
  ride: "#d99a3f",
};

export function colorForPieceId(pieceId: string): string {
  return PIECE_COLORS[pieceId] ?? "#5aa9e6";
}
