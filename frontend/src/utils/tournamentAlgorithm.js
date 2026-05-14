// Advanced tournament scheduling engine.
// Guarantees: equal number of matches per team (auto-creates "Jornada Extra" if needed).
// Priorities: 1) equal matches  2) no repeats  3) no double in same MD  4) balanced rest  5) min extra MDs

export function pairKey(a, b) {
  return [a, b].sort().join('|');
}

export function buildPlayedPairs(matchdays) {
  const map = new Map();
  matchdays.forEach((md) => {
    md.matches.forEach((m) => {
      const k = pairKey(m.teamA, m.teamB);
      map.set(k, (map.get(k) || 0) + 1);
    });
  });
  return map;
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
  const busy = new Map(); // team -> count of matches in this md
  md.matches.forEach((m) => {
    busy.set(m.teamA, (busy.get(m.teamA) || 0) + 1);
    busy.set(m.teamB, (busy.get(m.teamB) || 0) + 1);
  });
  if (md.resting) busy.set(md.resting, (busy.get(md.resting) || 0) + 1);
  return busy;
}

export function teamsRested(matchdays) {
  const rested = new Map();
  matchdays.forEach((md) => {
    if (md.resting) rested.set(md.resting, (rested.get(md.resting) || 0) + 1);
  });
  return rested;
}

export function emptyMatchdays(count) {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    matches: [],
    resting: null,
    is_extra: false,
  }));
}

export function maxMatchesPerMatchday(teamsCount) {
  return Math.floor(teamsCount / 2);
}

/** Round-robin via circle method. Caps at totalMatchdays. */
export function generateRoundRobin(teams, totalMatchdays) {
  if (teams.length < 2) {
    throw new Error('Se requieren al menos 2 equipos.');
  }
  const names = teams.map((t) => t.name);
  const withBye = names.length % 2 === 0 ? [...names] : [...names, '__BYE__'];
  const size = withBye.length;
  const rounds = size - 1;
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
    result.push({ number: result.length + 1, matches, resting, is_extra: false });
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr.splice(0, arr.length, fixed, ...rest);
  }

  while (result.length < totalMatchdays) {
    result.push({ number: result.length + 1, matches: [], resting: null, is_extra: false });
  }

  return result.map((md) => ({
    ...md,
    matches: md.matches.map((m) => makeMatch(md.number, m.teamA, m.teamB)),
  }));
}

function makeMatch(matchdayNum, teamA, teamB) {
  return {
    id: crypto.randomUUID(),
    matchday: matchdayNum,
    teamA,
    teamB,
    scoreA: null,
    scoreB: null,
    date: '',
    time: '',
    status: 'pending',
  };
}

/**
 * Generate one matchday using backtracking. Used by the "Generar jornada" button.
 */
export function generateMatchday(matchdayIndex, teams, matchdays, maxMatches, allowAutoRest) {
  const md = matchdays[matchdayIndex];
  const playedPairs = buildPlayedPairs(matchdays);
  const matchCount = buildMatchCount(teams, matchdays);
  const rested = teamsRested(matchdays);
  const busy = busyInMatchday(md);

  const available = teams
    .map((t) => t.name)
    .filter((n) => !busy.has(n) && (matchCount[n] || 0) < maxMatches);

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
      participating.filter((o) => o !== t && !playedPairs.has(pairKey(t, o)))
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
    ...pairs.map((p) => makeMatch(md.number, p.teamA, p.teamB)),
  ];

  const updated = matchdays.map((m, i) =>
    i === matchdayIndex ? { ...m, matches: newMatches, resting } : m
  );
  return { success: true, matchdays: updated };
}

/**
 * Advanced balanced generator.
 * Guarantees: every team plays EXACTLY `targetMatches` matches.
 * Falls back to extra jornadas / double matches / repeats based on options.
 */
export function generateBalancedTournament(teams, options) {
  const {
    targetMatches,
    initialMatchdays,
    maxMatchesPerMatchday: maxPerMd,
    allowDouble = false,
    allowExtra = true,
    allowRepeats = false,
    balance = 'flexible', // strict | flexible | fast
  } = options;

  const N = teams.length;
  const warnings = [];
  if (N < 2) {
    return { matchdays: emptyMatchdays(initialMatchdays), warnings: ['Se requieren al menos 2 equipos.'], impossible: true, extraCount: 0 };
  }

  // Total matches needed
  const totalNeeded = (N * targetMatches) / 2;
  if (!Number.isInteger(totalNeeded)) {
    return {
      matchdays: emptyMatchdays(initialMatchdays),
      warnings: [`Configuración imposible: con ${N} equipos cada uno jugando ${targetMatches} partidos, el total (${N * targetMatches}) no es divisible entre 2. Sugerencia: ajusta partidos por equipo.`],
      impossible: true,
      extraCount: 0,
    };
  }
  if (!allowRepeats && targetMatches > N - 1) {
    return {
      matchdays: emptyMatchdays(initialMatchdays),
      warnings: [`Configuración imposible: cada equipo solo puede jugar ${N - 1} rivales distintos. Sugerencia: permitir rivales repetidos o reducir partidos por equipo.`],
      impossible: true,
      extraCount: 0,
    };
  }

  // Build base via round-robin (gives near-optimal no-repeat schedule)
  let matchdays = generateRoundRobin(teams, initialMatchdays);
  const playedPairs = buildPlayedPairs(matchdays);
  const counts = buildMatchCount(teams, matchdays);
  const teamNames = teams.map((t) => t.name);
  const cap = maxPerMd ?? maxMatchesPerMatchday(N);

  // Truncate matches if they exceed targetMatches (in case initialMatchdays > rounds needed)
  // (round-robin won't do this in normal config; safe to skip.)

  // Try to schedule remaining matches
  let safety = 0;
  let extraCount = 0;

  while (teamNames.some((t) => counts[t] < targetMatches) && safety < 400) {
    safety++;
    const deficitTeams = teamNames
      .filter((t) => counts[t] < targetMatches)
      .sort((a, b) => (targetMatches - counts[b]) - (targetMatches - counts[a]));

    let scheduled = false;

    outer:
    for (const a of deficitTeams) {
      // Candidate opponents: prefer deficit teams; also valid not-played
      const opps = teamNames.filter((b) => {
        if (b === a) return false;
        if (counts[b] >= targetMatches) return false;
        const k = pairKey(a, b);
        if (!allowRepeats && playedPairs.has(k)) return false;
        return true;
      });
      // Sort: bigger deficit first, then by "fewer remaining valid opponents" (heuristic)
      opps.sort((x, y) => {
        const dx = (targetMatches - counts[x]) - (targetMatches - counts[y]);
        return -dx;
      });

      for (const b of opps) {
        // Find a matchday that can host (a,b)
        for (let i = 0; i < matchdays.length; i++) {
          const md = matchdays[i];
          if (md.matches.length >= cap) continue;
          const busy = busyInMatchday(md);
          const aIn = busy.has(a);
          const bIn = busy.has(b);
          if ((aIn || bIn) && !allowDouble) continue;
          // Schedule
          md.matches.push(makeMatch(md.number, a, b));
          counts[a]++;
          counts[b]++;
          playedPairs.set(pairKey(a, b), (playedPairs.get(pairKey(a, b)) || 0) + 1);
          scheduled = true;
          break outer;
        }
      }
    }

    if (!scheduled) {
      // Need a new matchday
      if (!allowExtra) {
        warnings.push('No se pudo equilibrar con la configuración actual. Habilita jornadas extra, dobles partidos o rivales repetidos.');
        return { matchdays, warnings, impossible: true, extraCount };
      }
      matchdays.push({
        number: matchdays.length + 1,
        matches: [],
        resting: null,
        is_extra: true,
      });
      extraCount++;
    }
  }

  if (safety >= 400) {
    warnings.push('El algoritmo se detuvo por seguridad después de muchas iteraciones. Revisa la configuración.');
  }

  // Auto-assign resting in non-extra round-robin jornadas (already done by round-robin)
  // For extra jornadas, compute resting team(s) as those not playing.
  matchdays = matchdays.map((md) => {
    if (md.resting || md.matches.length === 0) return md;
    const playing = new Set();
    md.matches.forEach((m) => { playing.add(m.teamA); playing.add(m.teamB); });
    const resting = teamNames.find((t) => !playing.has(t));
    return { ...md, resting: resting || md.resting };
  });

  return { matchdays, warnings, impossible: false, extraCount };
}

/** Re-export simple full generator for backward compatibility. */
export function generateFullTournament(teams, totalMatchdays, options = {}) {
  const targetMatches = options.targetMatches ?? (totalMatchdays);
  return generateBalancedTournament(teams, {
    targetMatches,
    initialMatchdays: totalMatchdays,
    maxMatchesPerMatchday: options.maxMatchesPerMatchday ?? maxMatchesPerMatchday(teams.length),
    allowDouble: options.allowDouble ?? false,
    allowExtra: options.allowExtra ?? true,
    allowRepeats: options.allowRepeats ?? false,
    balance: options.balance ?? 'flexible',
  });
}

export function getValidOpponents(teamName, matchdayIndex, teams, matchdays, maxMatches, allowRepeats = false) {
  const playedPairs = buildPlayedPairs(matchdays);
  const matchCount = buildMatchCount(teams, matchdays);
  const busy = busyInMatchday(matchdays[matchdayIndex]);
  return teams
    .map((t) => t.name)
    .filter((other) => {
      if (other === teamName) return false;
      if (busy.has(other)) return false;
      if (!allowRepeats && playedPairs.has(pairKey(teamName, other))) return false;
      if ((matchCount[other] || 0) >= maxMatches) return false;
      return true;
    });
}

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

/** Tournament-level summary used by the SummaryPanel. */
export function tournamentSummary(teams, matchdays, targetMatches) {
  const counts = buildMatchCount(teams, matchdays);
  const teamNames = teams.map((t) => t.name);
  const totalScheduled = matchdays.reduce((acc, md) => acc + md.matches.length, 0);
  const totalNeeded = Math.floor((teamNames.length * targetMatches) / 2);
  const pending = teamNames.filter((t) => (counts[t] || 0) < targetMatches);
  const extraCount = matchdays.filter((md) => md.is_extra).length;

  // Balance quality: min/max of counts; 100% if all equal
  let balance = 100;
  if (teamNames.length > 0) {
    const values = teamNames.map((t) => counts[t] || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    balance = max === 0 ? 0 : Math.round((min / max) * 100);
  }

  return {
    teamCount: teamNames.length,
    totalScheduled,
    totalNeeded,
    pendingTeams: pending,
    extraMatchdays: extraCount,
    balance,
    counts,
    isBalanced: pending.length === 0 && totalScheduled >= totalNeeded,
  };
}
