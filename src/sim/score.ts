/** true once either score reaches the first-to-N target. */
export function isMatchOver(score1: number, score2: number, matchLength: number): boolean {
  return score1 >= matchLength || score2 >= matchLength;
}

/** winner given two scores; ties resolve to whoever is strictly higher (1 by default). */
export function winnerOf(score1: number, score2: number): 1 | 2 {
  return score1 >= score2 ? 1 : 2;
}
