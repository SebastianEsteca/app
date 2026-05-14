import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { Sidebar, MobileTopBar } from './Sidebar';
import { ShareModal } from './ShareModal';
import { PinPrompt } from './PinPrompt';
import { Button } from './ui/button';
import { Share2, Lock, Eye } from 'lucide-react';
import { getTournament, listTournaments } from '../utils/api';
import { isAdmin, clearAdmin } from '../utils/auth';

export const AppLayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tournament, setTournament] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const refreshList = useCallback(async () => {
    const list = await listTournaments();
    setTournaments(list);
  }, []);

  const loadTournament = useCallback(async (tid) => {
    if (!tid) { setTournament(null); return; }
    setLoading(true);
    try {
      const data = await getTournament(tid);
      setTournament(data);
    } catch (err) {
      console.warn('[AppLayout] failed to load tournament', tid, err);
      setTournament(null);
    } finally {
      setLoading(false);
    }
  }, []); // deps intentionally empty: getTournament & setState fns are stable refs

  useEffect(() => { refreshList(); }, [refreshList]);
  useEffect(() => { loadTournament(id); }, [id, loadTournament]);

  const refresh = useCallback(() => loadTournament(id), [id, loadTournament]);

  // Admin gate: if user is on /t/:id/* and tournament has PIN and not unlocked → redirect to viewer
  useEffect(() => {
    if (!tournament) return;
    if (!location.pathname.startsWith('/t/')) return;
    if (!isAdmin(tournament.id, tournament)) {
      setShowPin(true);
    }
  }, [tournament, location.pathname]);

  const adminActive = tournament ? isAdmin(tournament.id, tournament) : true;

  const handlePinUnlock = () => {
    setShowPin(false);
    refresh();
  };

  const handleLogoutAdmin = () => {
    if (!tournament) return;
    clearAdmin(tournament.id);
    navigate(`/v/${tournament.id}`);
  };

  return (
    <div className="flex min-h-screen bg-[#0A0E1F] text-white">
      <Sidebar activeTournament={tournament} />
      <main className="flex-1 min-w-0">
        <MobileTopBar activeTournament={tournament} />

        {/* Tournament-scoped top toolbar (share / admin badge / view as spectator) */}
        {tournament && location.pathname.startsWith('/t/') && (
          <div className="hidden lg:flex sticky top-0 z-20 bg-[#0F1428]/85 backdrop-blur-xl border-b border-[#2A3458] px-6 py-2.5 items-center justify-end gap-2">
            {tournament.admin_pin && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/30 flex items-center gap-1.5">
                <Lock className="w-3 h-3" />Modo Administrador
              </span>
            )}
            <Button
              variant="outline" size="sm"
              onClick={() => navigate(`/v/${tournament.id}`)}
              data-testid="view-as-spectator"
              className="border-[#2A3458] text-white hover:border-yellow-500 hover:text-yellow-300 hover:bg-transparent h-8"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />Ver como espectador
            </Button>
            <Button
              size="sm"
              onClick={() => setShowShare(true)}
              data-testid="share-button"
              className="h-8 bg-orange-500 hover:bg-orange-400 text-white font-bold"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />Compartir
            </Button>
            {tournament.admin_pin && (
              <Button
                size="sm" variant="ghost"
                onClick={handleLogoutAdmin}
                className="h-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
              >
                Salir admin
              </Button>
            )}
          </div>
        )}

        <Outlet
          context={{
            tournament,
            tournaments,
            loading,
            refresh,
            refreshList,
            setTournament,
            adminActive,
            openShare: () => setShowShare(true),
          }}
        />

        <ShareModal open={showShare} onOpenChange={setShowShare} tournament={tournament} />
        <PinPrompt
          open={showPin}
          onOpenChange={(o) => {
            setShowPin(o);
            // If user closes without unlocking, send them to viewer
            if (!o && tournament && !isAdmin(tournament.id, tournament)) {
              navigate(`/v/${tournament.id}`);
            }
          }}
          tournamentId={id}
          onUnlock={handlePinUnlock}
        />
      </main>
    </div>
  );
};
