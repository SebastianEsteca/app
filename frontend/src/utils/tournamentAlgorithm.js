// Generic tournament pairing logic. Supports any team count and matchday count.
// Constraints:
// - No repeated opponents (canonical pair key).
// - No team plays twice in the same matchday.
// - Resting team(s) when odd number of teams; allows auto-rest assignment.

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

export function buildMatchCount(teams, matchdays) {
  const counts = Object.fromEntries(teams.map((t) => [t.name, 0]));
  matchdays.forEach((md) => {
    md.matches.forEach((m) => {
      counts[m.teamA] = (counts[m.teamA] || 0) + 1;
      counts[m.teamB] = (counts[m.teamB] || 0) + 1;
    });
  });
  return counts;
}

export function busyInMatchday(md) {
  const busy = new Set();
  md.matches.forEach((m) => {
    busy.add(m.teamA);
    busy.add(m.teamB);
  });
  if (md.resting) busy.add(md.resting);
  return busy;
}

export function teamsRested(matchdays) {
  const rested = new Set();
  matchdays.forEach((md) => {
    if (md.resting) rested.add(md.resting);
  });
  return rested;
}

export function getValidOpponents(teamName, matchdayIndex, teams, matchdays, maxMatches) {
  const playedPairs = buildPlayedPairs(matchdays);
  const matchCount = buildMatchCount(teams, matchdays);
  const busy = busyInMatchday(matchdays[matchdayIndex]);
  return teams
    .map((t) => t.name)
    .filter((other) => {
      if (other === teamName) return false;
      if (busy.has(other)) return false;
      if (playedPairs.has(pairKey(teamName, other))) return false;
      if ((matchCount[other] || 0) >= maxMatches) return false;
      return true;
    });
}

export function emptyMatchdays(count) {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    matches: [],
    resting: null,
  }));
}

/**
 * Round-robin via circle method. Generates `totalMatchdays` matchdays.
 * If team count is odd, a phantom BYE rotates and whoever pairs with BYE rests.
 */
export function generateRoundRobin(teams, totalMatchdays) {
  if (teams.length < 2) {
    throw new Error('Se requieren al menos 2 equipos.');
  }
  const names = teams.map((t) => t.name);
  const withBye = names.length % 2 === 0 ? [...names] : [...names, '__BYE__'];
  const size = withBye.length;
  const rounds = size - 1; // maximum possible matchdays for full round-robin
  const arr = [...withBye];
  const result = [];

  for (let r = 0; r < Math.min(rounds, totalMatchdays); r++) {
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
    // rotate (keep first fixed)
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr.splice(0, arr.length, fixed, ...rest);
  }

  // Pad with empty matchdays if totalMatchdays > rounds
  while (result.length < totalMatchdays) {
    result.push({ number: result.length + 1, matches: [], resting: null });
  }

  return result.map((md) => ({
    ...md,
    matches: md.matches.map((m) => ({
      id: crypto.randomUUID(),
      matchday: md.number,
      teamA: m.teamA,
      teamB: m.teamB,
      scoreA: null,
      scoreB: null,
      date: '',
      time: '',
      status: 'pending',
    })),
  }));
}

/** Generate one matchday using backtracking on remaining teams. */
export function generateMatchday(matchdayIndex, teams, matchdays, maxMatches, allowAutoRest) {
  const md = matchdays[matchdayIndex];
  const playedPairs = buildPlayedPairs(matchdays);
  const matchCount = buildMatchCount(teams, matchdays);
  const rested = teamsRested(matchdays);
  const busy = busyInMatchday(md);

  const available = teams
    .map((t) => t.name)
    .filter(
      (n) => !busy.has(n) && (matchCount[n] || 0) < maxMatches
    );

  let resting = md.resting;
  const participating = available.slice();

  if (allowAutoRest && !resting && participating.length % 2 === 1) {
    const fresh = participating.filter((t) => !rested.has(t));
    resting = (fresh.length > 0 ? fresh : participating)[0];
    const idx = participating.indexOf(resting);
    if (idx >= 0) participating.splice(idx, 1);
  }

  const possible = new Map();
  participating.forEach((t) => {
    possible.set(
      t,
      participating.filter(
        (o) => o !== t && !playedPairs.has(pairKey(t, o))
      )
    );
  });

  function backtrack(remaining) {
    if (remaining.length === 0) return [];
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
      if (rest !== null) return [{ teamA: team, teamB: opp }, ...rest];
    }
    return null;
  }

  const pairs = backtrack(participating.slice());
  if (pairs === null) {
    return { success: false, message: 'No se pudo emparejar esta jornada sin repetir rivales.' };
  }

  const newMatches = [
    ...md.matches,
    ...pairs.map((p) => ({
      id: crypto.randomUUID(),
      matchday: md.number,
      teamA: p.teamA,
      teamB: p.teamB,
      scoreA: null,
      scoreB: null,
      date: '',
      time: '',
      status: 'pending',
    })),
  ];

  const updated = matchdays.map((m, i) =>
    i === matchdayIndex ? { ...m, matches: newMatches, resting } : m
  );
  return { success: true, matchdays: updated };
}

export function generateFullTournament(teams, totalMatchdays) {
  return generateRoundRobin(teams, totalMatchdays);
}

/** Stats per team. */
export function computeStats(teams, matchdays, maxMatches) {
  const matchCount = buildMatchCount(teams, matchdays);
  const playedPairs = buildPlayedPairs(matchdays);
  const rested = teamsRested(matchdays);
  return teams.map((t) => {
    const remaining = teams
      .map((x) => x.name)
      .filter((o) => o !== t.name && !playedPairs.has(pairKey(t.name, o)));
    return {
      team: t.name,
      played: matchCount[t.name] || 0,
      maxMatches,
      remainingOpponents: remaining,
      hasRested: rested.has(t.name),
    };
  });
}

export function tournamentProgress(matchdays, maxPossible) {
  const totalScheduled = matchdays.reduce((acc, md) => acc + md.matches.length, 0);
  return maxPossible > 0 ? Math.min(1, totalScheduled / maxPossible) : 0;
}

/** Max matches per matchday for given participants. */
export function maxMatchesPerMatchday(teamsCount) {
  return Math.floor(teamsCount / 2);
}
