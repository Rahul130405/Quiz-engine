/**
 * ─────────────────────────────────────────────────────
 *  ALGORITHM: Fisher–Yates Shuffle  (O(n) time, O(1) space)
 * ─────────────────────────────────────────────────────
 *
 * Classic unbiased array shuffle. Each element has an exactly
 * equal 1/n probability of ending up in any position.
 *
 * How it works:
 *   Iterate from the last element backward to index 1.
 *   At each index i, pick a random index j where 0 <= j <= i.
 *   Swap elements[i] with elements[j].
 *
 * This guarantees every permutation is equally likely — unlike
 * the naive Math.random() sort trick which is biased.
 */

/**
 * Shuffles an array in-place using Fisher–Yates.
 * @param {Array} array - The array to shuffle (mutated directly)
 * @returns {Array} The same array, now shuffled
 */
function fisherYatesShuffle(array) {
  const arr = [...array]; // Work on a copy to keep inputs pure

  for (let i = arr.length - 1; i > 0; i--) {
    // Pick a random index from 0..i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));

    // Swap arr[i] and arr[j] using destructuring
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * Shuffle and return only the first `count` elements.
 * Used to pick N random non-repeating questions from a pool.
 *
 * @param {Array}  array - Full question pool
 * @param {number} count - How many to pick
 * @returns {Array} Sliced shuffled array
 */
function pickRandom(array, count) {
  const shuffled = fisherYatesShuffle(array);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

module.exports = { fisherYatesShuffle, pickRandom };
