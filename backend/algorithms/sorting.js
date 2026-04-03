/**
 * ─────────────────────────────────────────────────────
 *  ALGORITHM: Sorting System
 * ─────────────────────────────────────────────────────
 *
 * Centralised sorting utilities used by leaderboard and question
 * controllers. All sort functions return new arrays (pure/immutable).
 */

// Difficulty order used for sorting easy → medium → hard
const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 };

/**
 * Sort leaderboard entries by score descending.
 * Ties are broken alphabetically by name (ascending).
 *
 * @param {Array<{name, score, ...}>} entries
 * @returns {Array} Sorted copy
 */
function sortLeaderboard(entries) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score; // higher score first
    return a.name.localeCompare(b.name);               // alphabetical tiebreak
  });
}

/**
 * Sort questions by difficulty: easy → medium → hard.
 * Within same difficulty, sort by creation date ascending.
 *
 * @param {Array<{difficulty, createdAt, ...}>} questions
 * @returns {Array} Sorted copy
 */
function sortQuestionsByDifficulty(questions) {
  return [...questions].sort((a, b) => {
    const diff = DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
    if (diff !== 0) return diff;
    // Within same difficulty, order by creation date (oldest first)
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

/**
 * Generic multi-field sort.
 * Accepts an array of sort descriptors: { field, order: 'asc'|'desc' }
 *
 * Example:
 *   dynamicSort(users, [{ field: 'score', order: 'desc' }, { field: 'name', order: 'asc' }])
 *
 * @param {Array}  array
 * @param {Array<{field: string, order: 'asc'|'desc'}>} sortDescriptors
 * @returns {Array} Sorted copy
 */
function dynamicSort(array, sortDescriptors) {
  return [...array].sort((a, b) => {
    for (const { field, order } of sortDescriptors) {
      const dir = order === "desc" ? -1 : 1;
      if (a[field] < b[field]) return -1 * dir;
      if (a[field] > b[field]) return  1 * dir;
    }
    return 0; // All criteria equal
  });
}

module.exports = { sortLeaderboard, sortQuestionsByDifficulty, dynamicSort, DIFFICULTY_ORDER };
