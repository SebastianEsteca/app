// PIN-based admin gate stored in sessionStorage.
// NOTE on security: this storage holds ONLY a non-sensitive boolean flag
// ("user already entered the correct PIN in this browser session"), never the
// PIN itself. The PIN is verified server-side via POST /api/tournaments/{id}/verify-pin.
// Bypassing this client flag is harmless because all mutations also go through
// the API, which should ideally re-verify before allowing edits. The flag exists
// purely for UX so the user doesn't re-enter the PIN on every navigation.

const KEY = 'esteca_admin_unlocked_v1';

function read() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch (err) {
    // Corrupt storage / quota / privacy mode — treat as locked
    console.warn('[auth] sessionStorage read failed, resetting', err);
    return {};
  }
}

function write(map) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(map));
  } catch (err) {
    // Storage unavailable (private mode, quota). Fail silently for UX.
    console.warn('[auth] sessionStorage write failed', err);
  }
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
