// Knockout bracket helpers.
// Generate a single-elimination bracket from sorted qualifiers (top to bottom).

const ROUND_NAMES = {
  2: ['Final'],
  4: ['Semifinal', 'Final'],
  8: ['Cuartos', 'Semifinal', 'Final'],
  16: ['Octavos', 'Cuartos', 'Semifinal', 'Final'],
  32: ['Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'],
};

/** Snap qualifiers count to next valid bracket size (2,4,8,16,32). */
export function bracketSizeFor(n) {
  const allowed = [2, 4, 8, 16, 32];
  return allowed.find((s) => s >= n) || 32;
}

/** Determine winner of a single bracket match (handles BYEs and ties). */
function computeMatchWinner(m) {
  if (m.scoreA != null && m.scoreB != null) {
    if (m.scoreA > m.scoreB) return m.teamA;
    if (m.scoreB > m.scoreA) return m.teamB;
    return null; // tie, no winner yet
  }
  if (m.teamA && !m.teamB) return m.teamA; // BYE
  if (m.teamB && !m.teamA) return m.teamB; // BYE
  return null;
}

/** Generate empty bracket from standings. Top qualifiers fill first round. */
export function generateBracket(standings, qualifiersCount) {
  const size = bracketSizeFor(qualifiersCount);
  const seeds = standings.slice(0, qualifiersCount).map((s) => s.team);
  while (seeds.length < size) seeds.push(null); // BYE

  const names = ROUND_NAMES[size] || ['Final'];

  // First round pairings: 1 vs size, 2 vs size-1, ...
  const firstRound = [];
  for (let i = 0; i < size / 2; i++) {
    const a = seeds[i];
    const b = seeds[size - 1 - i];
    firstRound.push({
      id: crypto.randomUUID(),
      teamA: a,
      teamB: b,
      scoreA: null,
      scoreB: null,
      winner: a && !b ? a : b && !a ? b : null,
    });
  }

  const rounds = [{ name: names[0], matches: firstRound }];

  // Subsequent rounds: empty placeholders
  for (let r = 1; r < names.length; r++) {
    const prevCount = rounds[r - 1].matches.length;
    const matches = Array.from({ length: prevCount / 2 }, () => ({
      id: crypto.randomUUID(),
      teamA: null,
      teamB: null,
      scoreA: null,
      scoreB: null,
      winner: null,
    }));
    rounds.push({ name: names[r], matches });
  }

  return propagateWinners(rounds);
}

/** Recompute winners and propagate them to subsequent rounds. */
export function propagateWinners(rounds) {
  const out = rounds.map((r) => ({
    ...r,
    matches: r.matches.map((m) => ({ ...m })),
  }));
  for (let r = 0; r < out.length; r++) {
    const rd = out[r];
    rd.matches.forEach((m) => { m.winner = computeMatchWinner(m); });
    // Propagate to next round
    const next = out[r + 1];
    if (!next) continue;
    next.matches.forEach((nm, i) => {
      nm.teamA = rd.matches[i * 2]?.winner || null;
      nm.teamB = rd.matches[i * 2 + 1]?.winner || null;
    });
  }
  return out;
}

export function getChampion(rounds) {
  if (!rounds || rounds.length === 0) return null;
  const final = rounds[rounds.length - 1];
  if (!final || final.matches.length === 0) return null;
  return final.matches[0].winner;
}
