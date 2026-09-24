import { buildChart, type Chart } from "./chart";

// Currículo para principiantes: niveles cortos (10-20s), un elemento nuevo
// por nivel, y en orden de dificultad creciente (se desbloquean en orden en
// la pestaña Práctica). El currículo completo por estilos (fase 7) se
// agrega después sin tocar este formato.
export const LESSONS: Chart[] = [
  buildChart({
    id: "nivel1-primer-golpe",
    name: "Nivel 1: Tu primer golpe",
    bpm: 70,
    lanes: ["kick"],
    bars: 4,
    pattern: [
      { beat: 0, pieceId: "kick" },
      { beat: 1, pieceId: "kick" },
      { beat: 2, pieceId: "kick" },
      { beat: 3, pieceId: "kick" },
    ],
  }),
  buildChart({
    id: "nivel2-suma-caja",
    name: "Nivel 2: Sumá la caja",
    bpm: 75,
    lanes: ["kick", "snare"],
    bars: 4,
    pattern: [
      { beat: 0, pieceId: "kick" },
      { beat: 1, pieceId: "snare" },
      { beat: 2, pieceId: "kick" },
      { beat: 3, pieceId: "snare" },
    ],
  }),
  buildChart({
    id: "nivel3-hihat-magico",
    name: "Nivel 3: Hi-hat mágico",
    bpm: 80,
    lanes: ["hihat_closed", "kick", "snare"],
    bars: 4,
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
  buildChart({
    id: "nivel4-groove-completo",
    name: "Nivel 4: Groove completo",
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
