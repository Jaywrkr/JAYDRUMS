export function starsForAccuracy(accuracyPercent: number): number {
  if (accuracyPercent >= 90) return 3;
  if (accuracyPercent >= 70) return 2;
  if (accuracyPercent >= 40) return 1;
  return 0;
}

export function starGlyphs(stars: number): string {
  const clamped = Math.max(0, Math.min(3, stars));
  return "★★★".slice(0, clamped) + "☆☆☆".slice(0, 3 - clamped);
}

const CELEBRATION_MESSAGES: Record<number, string> = {
  3: "¡Increíble! 🎉",
  2: "¡Muy bien! 👏",
  1: "¡Seguí así! 💪",
  0: "Casi... ¡probá de nuevo!",
};

export function celebrationMessage(stars: number): string {
  return CELEBRATION_MESSAGES[stars] ?? CELEBRATION_MESSAGES[0];
}
