import { buildChart, type Chart } from "./chart";

// Lecciones de prueba para la fase 3 (motor de juego). El currículo completo
// (fase 7) reemplazará esto por un set más grande cargado desde JSON/MIDI.
export const LESSONS: Chart[] = [
  buildChart({
    id: "negras-bombo-caja",
    name: "Fundamentos: negras, bombo y caja",
    bpm: 80,
    lanes: ["kick", "snare"],
    bars: 8,
    pattern: [
      { beat: 0, pieceId: "kick" },
      { beat: 1, pieceId: "snare" },
      { beat: 2, pieceId: "kick" },
      { beat: 3, pieceId: "snare" },
    ],
  }),
  buildChart({
    id: "groove-rock-basico",
    name: "Groove rock básico (hi-hat en corcheas)",
    bpm: 90,
    lanes: ["hihat_closed", "kick", "snare"],
    bars: 8,
    pattern: [
      { beat: 0, pieceId: "hihat_closed" },
      { beat: 0, pieceId: "kick" },
      { beat: 0.5, pieceId: "hihat_closed" },
      { beat: 1, pieceId: "hihat_closed" },
      { beat: 1, pieceId: "snare" },
      { beat: 1.5, pieceId: "hihat_closed" },
      { beat: 2, pieceId: "hihat_closed" },
      { beat: 2, pieceId: "kick" },
      { beat: 2.5, pieceId: "hihat_closed" },
      { beat: 3, pieceId: "hihat_closed" },
      { beat: 3, pieceId: "snare" },
      { beat: 3.5, pieceId: "hihat_closed" },
    ],
  }),
];
