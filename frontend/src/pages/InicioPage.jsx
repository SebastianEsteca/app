import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Layers, Trophy } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { TournamentCard } from '../components/TournamentCard';
import { deleteTournament } from '../utils/api';
import { toast } from 'sonner';
import { COPA_LOGO } from '../components/Sidebar';

export default function InicioPage() {
  const { tournaments, refreshList } = useOutletContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  // Refresh list each time we enter the Inicio page
  useEffect(() => {
    refreshList();
  }, [refreshList]);

  /*
  const filtered = tournaments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  */

  const filtered = Array.isArray(tournaments)
  ? tournaments.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    )
  : [];

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await deleteTournament(confirmDel.id);
      toast.success(`Torneo "${confirmDel.name}" eliminado`);
      setConfirmDel(null);
      await refreshList();
    } catch (e) {
      toast.error('No se pudo eliminar el torneo');
    }
  };

  return (
    <div className="min-h-screen hero-grid">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-[#1A2240] via-[#121830] to-[#0F1428] border border-[#2A3458] rounded-2xl p-8 mb-10"
        >
          <div className="absolute inset-y-0 right-0 w-1/2 opacity-30 pointer-events-none float-slow">
            <img src={COPA_LOGO} alt="" className="w-full h-full object-contain object-right" />
          </div>
          <div className="relative max-w-2xl">
            <p className="label-caps">Comisión de Deportes</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white mt-2 leading-[1.05]">
              Copa <span className="gold-text">ESTECA</span> 2026
            </h1>
            <p className="mt-4 text-base text-gray-300 max-w-xl">
              Gestiona múltiples torneos, sorteos animados, jornadas dinámicas, tabla general y eliminación directa — todo desde un mismo tablero.
            </p>
            <Button
              data-testid="hero-create-button"
              onClick={() => navigate('/crear')}
              className="mt-6 h-12 px-6 bg-orange-500 hover:bg-orange-400 text-white font-bold tracking-tight shadow-[0_0_28px_rgba(242,99,33,0.35)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear nuevo torneo
            </Button>
          </div>
        </motion.div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <p className="label-caps">Tablero</p>
            <h2 className="text-2xl font-['Outfit'] font-bold text-white">Mis torneos</h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              data-testid="search-tournaments"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar torneo..."
              className="pl-9 bg-[#121830] border-[#2A3458] text-white placeholder:text-gray-500 focus-visible:ring-orange-500 focus-visible:border-orange-500 w-72"
            />
          </div>
        </div>

        {/* Tournaments grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[#2A3458] rounded-2xl bg-[#0F1428]/60">
            <Layers className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 mb-4">
              {tournaments.length === 0
                ? 'Aún no has creado ningún torneo'
                : 'No encontramos torneos con ese nombre'}
            </p>
            <Button
              data-testid="empty-create-button"
              onClick={() => navigate('/crear')}
              className="bg-orange-500 text-white hover:bg-orange-400 font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear el primero
            </Button>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
            data-testid="tournaments-grid"
          >
            {filtered.map((t, i) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                index={i}
                onOpen={() => navigate(`/t/${t.id}/sorteo`)}
                onDelete={() => setConfirmDel(t)}
              />
            ))}
          </div>
        )}

        {/* Stats footer */}
        {tournaments.length > 0 && (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryStat label="Torneos" value={tournaments.length} icon={Trophy} />
            <SummaryStat label="Equipos totales" value={tournaments.reduce((a, t) => a + t.teams_registered, 0)} icon={Layers} />
            <SummaryStat label="Partidos generados" value={tournaments.reduce((a, t) => a + (t.matches_played + (t.total_matches_target ? Math.floor(t.progress * t.total_matches_target) - t.matches_played : 0)), 0)} icon={Layers} />
            <SummaryStat label="Avance promedio" value={`${tournaments.length === 0 ? 0 : Math.round((tournaments.reduce((a, t) => a + (t.progress || 0), 0) / tournaments.length) * 100)}%`} icon={Trophy} />
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent className="bg-[#121830] border-[#2A3458] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar torneo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción borrará permanentemente <span className="text-orange-300 font-semibold">{confirmDel?.name}</span> y todos sus datos asociados. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#2A3458] text-white hover:bg-[#1A2240]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-tournament"
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const SummaryStat = ({ label, value, icon: Icon }) => (
  <div className="bg-[#121830] border border-[#2A3458] rounded-xl px-4 py-3 flex items-center gap-3">
    <div className="w-9 h-9 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
      <Icon className="w-4 h-4 text-orange-400" />
    </div>
    <div>
      <p className="label-caps !text-[10px]">{label}</p>
      <p className="font-['Outfit'] font-bold text-white text-lg leading-none">{value}</p>
    </div>
  </div>
);
