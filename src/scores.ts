export interface LessonScore {
  bestScore: number;
  bestAccuracy: number;
  bestStreak: number;
  updatedAt: string;
}

const STORAGE_KEY = "jaydrums.scores";

type ScoreBoard = Record<string, LessonScore>;

function loadBoard(): ScoreBoard {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ScoreBoard;
  } catch {
    return {};
  }
}

function saveBoard(board: ScoreBoard): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
}

export function getBestScore(lessonId: string): LessonScore | null {
  return loadBoard()[lessonId] ?? null;
}

export function recordScore(
  lessonId: string,
  score: number,
  accuracy: number,
  bestStreak: number,
): LessonScore {
  const board = loadBoard();
  const existing = board[lessonId];
  const isNewBest = !existing || score > existing.bestScore;
  const result: LessonScore = isNewBest
    ? { bestScore: score, bestAccuracy: accuracy, bestStreak, updatedAt: new Date().toISOString() }
    : existing;

  if (isNewBest) {
    board[lessonId] = result;
    saveBoard(board);
  }

  return result;
}
