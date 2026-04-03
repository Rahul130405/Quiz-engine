/**
 * Client-side algorithm utilities
 * These mirror backend algorithms to enable real-time score previews
 * without an extra network round-trip per question.
 */

// ── Fisher–Yates Shuffle ──────────────────────────────────────────────────────
export function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Greedy Score Engine (stateful, client-side) ───────────────────────────────
export class ScoreEngine {
  constructor() {
    this.totalScore    = 0;
    this.currentStreak = 0;
    this.maxStreak     = 0;
    this.totalStreakBonus = 0;
  }

  record(isCorrect, timedOut = false) {
    let base = 0;
    let streakBonus = 0;

    if (timedOut) {
      base = 0;
      // Streak is not broken on timeout
    } else if (isCorrect) {
      base = 5;
      this.currentStreak += 1;
      this.maxStreak = Math.max(this.maxStreak, this.currentStreak);
      // Apply streak bonus
      if      (this.currentStreak % 5 === 0) streakBonus = 5;
      else if (this.currentStreak % 3 === 0) streakBonus = 2;
    } else {
      base = -1;
      this.currentStreak = 0;
    }

    const change = base + streakBonus;
    this.totalScore       = Math.max(0, this.totalScore + change);
    this.totalStreakBonus += streakBonus;

    return { base, streakBonus, change, totalScore: this.totalScore };
  }

  getState() {
    return {
      totalScore:       this.totalScore,
      currentStreak:    this.currentStreak,
      maxStreak:        this.maxStreak,
      totalStreakBonus: this.totalStreakBonus,
    };
  }
}

// ── Sort helpers ──────────────────────────────────────────────────────────────
const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 };

export function sortByDifficulty(questions) {
  return [...questions].sort(
    (a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]
  );
}

export function sortLeaderboard(entries) {
  return [...entries].sort((a, b) =>
    b.score !== a.score ? b.score - a.score : a.name?.localeCompare(b.name)
  );
}

// ── Format time mm:ss ─────────────────────────────────────────────────────────
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Difficulty colour map ─────────────────────────────────────────────────────
export const DIFFICULTY_COLORS = {
  easy:   "#22c55e",
  medium: "#f59e0b",
  hard:   "#ef4444",
};
