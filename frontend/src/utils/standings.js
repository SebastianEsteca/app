// Compute standings from finished matches.

export function computeStandings(teams, matchdays) {
  const rows = Object.fromEntries(
    teams.map((t) => [
      t.name,
      {
        team: t.name,
        color: t.color,
        short: t.short_name,
        logo: t.logo,
        PJ: 0, PG: 0, PE: 0, PP: 0,
        GF: 0, GC: 0, DG: 0, Pts: 0,
      },
    ])
  );

  matchdays.forEach((md) => {
    md.matches.forEach((m) => {
      if (m.status !== 'finished' || m.scoreA == null || m.scoreB == null) return;
      const a = rows[m.teamA];
      const b = rows[m.teamB];
      if (!a || !b) return;
      a.PJ++; b.PJ++;
      a.GF += m.scoreA; a.GC += m.scoreB;
      b.GF += m.scoreB; b.GC += m.scoreA;
      if (m.scoreA > m.scoreB) { a.PG++; a.Pts += 3; b.PP++; }
      else if (m.scoreA < m.scoreB) { b.PG++; b.Pts += 3; a.PP++; }
      else { a.PE++; b.PE++; a.Pts++; b.Pts++; }
    });
  });

  Object.values(rows).forEach((r) => { r.DG = r.GF - r.GC; });

  return Object.values(rows).sort(
    (a, b) =>
      b.Pts - a.Pts ||
      b.DG - a.DG ||
      b.GF - a.GF ||
      a.team.localeCompare(b.team)
  );
}

export function tournamentStats(teams, matchdays) {
  const standings = computeStandings(teams, matchdays);
  const totalGoals = standings.reduce((a, t) => a + t.GF, 0);
  const finishedMatches = matchdays.reduce(
    (a, md) => a + md.matches.filter((m) => m.status === 'finished').length, 0
  );
  const totalMatches = matchdays.reduce((a, md) => a + md.matches.length, 0);
  const bestAttack = standings.slice().sort((a, b) => b.GF - a.GF)[0];
  const bestDefense = standings.slice().sort((a, b) => a.GC - b.GC)[0];
  return {
    standings,
    totalGoals,
    finishedMatches,
    totalMatches,
    bestAttack,
    bestDefense,
    avgGoalsPerMatch: finishedMatches > 0 ? (totalGoals / finishedMatches).toFixed(2) : '0.00',
  };
}
