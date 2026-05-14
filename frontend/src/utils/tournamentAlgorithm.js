// Tournament pairing logic for 11 teams, 6 matchdays.
// Constraints:
// - Max 1 match between any pair (no repeats).
// - Each team plays at most once per matchday.
// - Each matchday: 5 matches + 1 resting team (with 11 teams).
// - Each team rests at most once across the 6 matchdays.

export const TOTAL_MATCHDAYS = 6;
export const MATCHES_PER_MATCHDAY = 5;
export const TARGET_MATCHES_PER_TEAM = 6;

/** Build the set of "played pairs" as canonical "A|B" (sorted). */
export function pairKey(a, b) {
  return [a, b].sort().join('|');
}

export function buildPlayedPairs(matchdays) {
  const set = new Set();
  matchdays.forEach((md) => {
    md.matches.forEach((m) => set.add(pairKey(m.teamA, m.teamB)));
  });
  return set;
}

/** Compute how many matches each team has played overall. */
export function buildMatchCount(teams, matchdays) {
  const counts = Object.fromEntries(teams.map((t) => [t, 0]));
  matchdays.forEach((md) => {
    md.matches.forEach((m) => {
      counts[m.teamA] = (counts[m.teamA] || 0) + 1;
      counts[m.teamB] = (counts[m.teamB] || 0) + 1;
    });
  });
  return counts;
}

/** Teams already busy in given matchday (playing or resting). */
export function busyInMatchday(md) {
  const busy = new Set();
  md.matches.forEach((m) => {
    busy.add(m.teamA);
    busy.add(m.teamB);
  });
  if (md.resting) busy.add(md.resting);
  return busy;
}

/** Teams that have rested in any matchday. */
export function teamsRested(matchdays) {
  const rested = new Set();
  matchdays.forEach((md) => {
    if (md.resting) rested.add(md.resting);
  });
  return rested;
}

/** Get valid opponents for a given team in a given matchday. */
export function getValidOpponents(team, matchdayIndex, teams, matchdays) {
  const playedPairs = buildPlayedPairs(matchdays);
  const matchCount = buildMatchCount(teams, matchdays);
  const busy = busyInMatchday(matchdays[matchdayIndex]);

  return teams.filter((other) => {
    if (other === team) return false;
    if (busy.has(other)) return false;
    if (playedPairs.has(pairKey(team, other))) return false;
    if ((matchCount[other] || 0) >= TARGET_MATCHES_PER_TEAM) return false;
    return true;
  });
}

/** Initialize empty matchdays. */
export function emptyMatchdays() {
  return Array.from({ length: TOTAL_MATCHDAYS }, (_, i) => ({
    number: i + 1,
    matches: [],
    resting: null,
  }));
}

/**
 * Circle method (round-robin) for odd number of teams.
 * For 11 teams, we add a phantom "BYE" and rotate. Whoever plays BYE rests.
 * Returns array of TOTAL_MATCHDAYS matchdays.
 */
export function generateRoundRobin(teams) {
  if (teams.length !== 11) {
    throw new Error('Se requieren exactamente 11 equipos para generar el torneo.');
  }
  const n = teams.length;
  const withBye = [...teams, '__BYE__'];
  const size = withBye.length; // 12
  const rounds = size - 1; // 11 possible matchdays, but we only need 6

  const arr = [...withBye];
  const result = [];

  for (let r = 0; r < rounds && result.length < TOTAL_MATCHDAYS; r++) {
    const matches = [];
    let resting = null;
    for (let i = 0; i < size / 2; i++) {
      const a = arr[i];
      const b = arr[size - 1 - i];
      if (a === '__BYE__') resting = b;
      else if (b === '__BYE__') resting = a;
      else matches.push({ teamA: a, teamB: b });
    }
    result.push({ number: result.length + 1, matches, resting });
    // Rotate: keep first fixed, rotate the rest clockwise
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr.splice(0, arr.length, fixed, ...rest);
  }

  // Assign ids
  return result.map((md) => ({
    ...md,
    matches: md.matches.map((m) => ({
      id: crypto.randomUUID(),
      matchday: md.number,
      ...m,
    })),
  }));
}

/**
 * Generate matches for one specific matchday using greedy + backtracking,
 * prioritizing teams with fewest remaining valid opponents.
 */
export function generateMatchday(matchdayIndex, teams, matchdays) {
  const md = matchdays[matchdayIndex];
  const playedPairs = buildPlayedPairs(matchdays);
  const matchCount = buildMatchCount(teams, matchdays);
  const rested = teamsRested(matchdays);
  const busy = busyInMatchday(md);

  // Candidates: not busy in this matchday yet
  const available = teams.filter(
    (t) => !busy.has(t) && (matchCount[t] || 0) < TARGET_MATCHES_PER_TEAM
  );

  // Pick a resting team if none assigned yet and we have 11 available
  let resting = md.resting;
  const newMatches = [...md.matches];

  // Helper: which teams can still participate?
  const participating = available.slice();

  // If no resting yet and odd participants, pick one that hasn't rested yet
  if (!resting && participating.length % 2 === 1) {
    const candidates = participating.filter((t) => !rested.has(t));
    resting = (candidates.length > 0 ? candidates : participating)[0];
    const idx = participating.indexOf(resting);
    if (idx >= 0) participating.splice(idx, 1);
  }

  // Build adjacency: each team -> valid opponents within participating
  const possible = new Map();
  participating.forEach((t) => {
    possible.set(
      t,
      participating.filter(
        (o) => o !== t && !playedPairs.has(pairKey(t, o))
      )
    );
  });

  // Backtracking pairing
  function backtrack(remaining) {
    if (remaining.length === 0) return [];
    // Pick the team with fewest options
    remaining.sort(
      (a, b) =>
        (possible.get(a)?.filter((x) => remaining.includes(x)).length || 0) -
        (possible.get(b)?.filter((x) => remaining.includes(x)).length || 0)
    );
    const team = remaining[0];
    const opts = (possible.get(team) || []).filter((x) => remaining.includes(x));
    if (opts.length === 0) return null;
    for (const opp of opts) {
      const next = remaining.filter((t) => t !== team && t !== opp);
      const rest = backtrack(next);
      if (rest !== null) {
        return [{ teamA: team, teamB: opp }, ...rest];
      }
    }
    return null;
  }

  const pairs = backtrack(participating.slice());
  if (pairs === null) {
    return { success: false, message: 'No se pudo emparejar esta jornada sin repetir rivales.' };
  }

  pairs.forEach((p) => {
    newMatches.push({
      id: crypto.randomUUID(),
      matchday: md.number,
      teamA: p.teamA,
      teamB: p.teamB,
    });
  });

  const updated = matchdays.map((m, i) =>
    i === matchdayIndex ? { ...m, matches: newMatches, resting } : m
  );
  return { success: true, matchdays: updated };
}

/** Generate full tournament from scratch using round-robin. */
export function generateFullTournament(teams) {
  return generateRoundRobin(teams);
}

/** Statistics per team */
export function computeStats(teams, matchdays) {
  const matchCount = buildMatchCount(teams, matchdays);
  const playedPairs = buildPlayedPairs(matchdays);
  const rested = teamsRested(matchdays);

  return teams.map((t) => {
    const remaining = teams.filter(
      (o) => o !== t && !playedPairs.has(pairKey(t, o))
    );
    return {
      team: t,
      played: matchCount[t] || 0,
      remainingOpponents: remaining,
      hasRested: rested.has(t),
    };
  });
}

/** Tournament completion ratio (0..1) based on total possible matches (30). */
export function tournamentProgress(matchdays) {
  const totalScheduled = matchdays.reduce((acc, md) => acc + md.matches.length, 0);
  const maxMatches = TOTAL_MATCHDAYS * MATCHES_PER_MATCHDAY; // 30
  return Math.min(1, totalScheduled / maxMatches);
}
