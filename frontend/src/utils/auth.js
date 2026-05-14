// Simple PIN-based admin gate stored in sessionStorage.
// Layout: { [tournamentId]: true } when admin verified.

const KEY = 'esteca_admin_unlocked_v1';

function read() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

function write(map) {
  try { sessionStorage.setItem(KEY, JSON.stringify(map)); }
  catch { /* noop */ }
}

export function isAdmin(tournamentId, tournament) {
  // If tournament has no PIN configured, admin access is open.
  if (!tournament?.admin_pin || !tournament.admin_pin.trim()) return true;
  const map = read();
  return !!map[tournamentId];
}

export function setAdminUnlocked(tournamentId) {
  const map = read();
  map[tournamentId] = true;
  write(map);
}

export function clearAdmin(tournamentId) {
  const map = read();
  delete map[tournamentId];
  write(map);
}
