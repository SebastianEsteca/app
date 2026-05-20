import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import {
  Calendar, BarChart3, Trophy, Eye, Lock, Coffee, Swords, Zap, Repeat,
  Crown, Home, TrendingUp, Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { computeStandings } from '../utils/standings';
import { COPA_LOGO, ESTECA_LOGO } from '../components/Sidebar';

const TABS = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'jornadas', label: 'Jornadas', icon: Calendar },
  { id: 'tabla', label: 'Tabla', icon: BarChart3 },
  { id: 'bracket', label: 'Eliminación', icon: Trophy },
];

export default function ViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [tab, setTab] = useState('home');
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get(`/public/tournaments/${id}`)
      .then((r) => mounted && setTournament(r.data))
      .catch(() => mounted && setError('Torneo no encontrado'));
    return () => { mounted = false; };
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center bg-[#121830] border border-[#2A3458] rounded-2xl p-10 max-w-md">
          <Lock className="w-10 h-10 mx-auto text-gray-500 mb-3" />
          <h2 className="text-xl font-['Outfit'] font-bold text-white">Torneo no disponible</h2>
          <p className="text-sm text-gray-400 mt-2">El enlace que estás usando no corresponde a ningún torneo.</p>
          <Button onClick={() => navigate('/')} className="mt-5 bg-orange-500 hover:bg-orange-400 text-white">Volver al inicio</Button>
        </div>
      </div>
    );
  }
  if (!tournament) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando torneo...</div>;
  }

  const standings = computeStandings(tournament.teams || [], tournament.matchdays || []);
  const totalScheduled = (tournament.matchdays || []).reduce((a, md) => a + md.matches.length, 0);
  const totalFinished = (tournament.matchdays || []).reduce(
    (a, md) => a + md.matches.filter((m) => m.status === 'finished').length, 0
  );
  const progress = totalScheduled > 0 ? (totalFinished / totalScheduled) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1F]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#0F1428]/90 backdrop-blur-xl border-b border-[#2A3458]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {tournament.primary_logo && (
              <img src={tournament.primary_logo} alt="" className="w-10 h-10 object-contain rounded-md bg-white/5 p-0.5" />
            )}
            <div className="min-w-0">
              <p className="label-caps !text-[9px]">Modo Espectador</p>
              <h1 className="text-base sm:text-lg font-['Outfit'] font-bold text-white truncate">{tournament.name}</h1>
            </div>
          </div>
          <Link
            to={`/t/${id}/sorteo`}
            data-testid="viewer-enter-admin"
            className="hidden sm:flex items-center gap-2 text-xs px-3 py-2 rounded-md bg-[#1A2240] border border-[#2A3458] text-gray-300 hover:text-orange-300 hover:border-orange-500/50 transition"
          >
            {/*  <Lock className="w-3.5 h-3.5" />Acceso administrador */}
          </Link>
        </div>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-6 pb-2 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              data-testid={`viewer-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-bold tracking-tight px-3 py-2 rounded-md transition ${
                tab === t.id
                  ? 'bg-orange-500 text-white shadow-[0_0_18px_rgba(242,99,33,0.30)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'home' && (
              <ViewerHome tournament={tournament} standings={standings} progress={progress} totalFinished={totalFinished} totalScheduled={totalScheduled} />
            )}
            {tab === 'jornadas' && <ViewerJornadas tournament={tournament} />}
            {tab === 'tabla' && <ViewerTabla tournament={tournament} standings={standings} />}
            {tab === 'bracket' && <ViewerBracket tournament={tournament} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-[#2A3458] mt-12 py-6">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-center gap-3 text-xs text-gray-500">
          <img src={ESTECA_LOGO} alt="" className="w-6 h-6 rounded-full" />
          <span>ESTECA-PC · Comisión de Deportes</span>
        </div>
      </footer>
    </div>
  );
}

// ---------- Sub-tabs ----------

// Visual class for podium positions (gold/silver/bronze)
const podiumClass = (idx) => {
  if (idx === 0) return 'bg-yellow-500 text-black';
  if (idx === 1) return 'bg-gray-300 text-black';
  return 'bg-orange-700 text-white';
};

// DG color class (positive = gold, negative = red, zero = neutral)
const dgColor = (dg) => {
  if (dg > 0) return 'text-yellow-300';
  if (dg < 0) return 'text-red-300';
  return 'text-gray-400';
};

const ViewerHome = ({ tournament, standings, progress, totalFinished, totalScheduled }) => {
  // Find next pending matches (first 5 across all matchdays)
  const upcoming = [];
  (tournament.matchdays || []).forEach((md) => {
    md.matches.forEach((m) => {
      if (m.status !== 'finished' && upcoming.length < 6) {
        upcoming.push({ ...m, mdNumber: md.number, mdExtra: md.is_extra });
      }
    });
  });
  const top3 = standings.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A2240] via-[#121830] to-[#0F1428] border border-[#2A3458] p-6 sm:p-8">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 opacity-20 float-slow pointer-events-none">
          {tournament.primary_logo && <img src={tournament.primary_logo} alt="" className="w-full h-full object-contain" />}
        </div>
        <p className="label-caps">{tournament.name}</p>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white mt-2">Bienvenido al torneo</h2>
        <p className="text-gray-400 mt-2 max-w-xl">
          Equipos: <span className="text-orange-300 font-semibold">{(tournament.teams || []).length}</span> · Jornadas: <span className="text-orange-300 font-semibold">{(tournament.matchdays || []).length}</span> · Clasifican: <span className="text-orange-300 font-semibold">{tournament.qualifiers_count}</span>
        </p>

        <div className="mt-5 max-w-md">
          <div className="flex items-center justify-between mb-1.5">
            <p className="label-caps">Progreso</p>
            <p className="text-orange-300 font-['Outfit'] font-bold">{Math.round(progress)}%</p>
          </div>
          <Progress value={progress} className="h-2 bg-[#0A0E1F] [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-yellow-400" />
          <p className="text-xs text-gray-500 mt-1.5">{totalFinished} de {totalScheduled} partidos jugados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="bg-[#121830] border border-[#2A3458] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <h3 className="font-['Outfit'] font-bold text-white">Próximos partidos</h3>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">No hay partidos pendientes.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((m) => (
                <div key={m.id} className="flex items-center gap-3 bg-[#0A0E1F] border border-[#2A3458] rounded-md px-3 py-2.5">
                  <span className="label-caps !text-[10px] w-10">J{m.mdNumber}</span>
                  <span className="text-white font-semibold flex-1 text-right truncate">{m.teamA}</span>
                  <Swords className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-white font-semibold flex-1 truncate">{m.teamB}</span>
                  {m.date && (
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      {new Date(m.date).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })}{m.time && ` ${m.time}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-[#121830] border border-[#2A3458] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-yellow-400" />
            <h3 className="font-['Outfit'] font-bold text-white">Top 3</h3>
          </div>
          {top3.length === 0 || top3.every((s) => s.PJ === 0) ? (
            <p className="text-sm text-gray-500">Aún sin partidos finalizados.</p>
          ) : (
            <div className="space-y-2">
              {top3.map((row, i) => (
                <div key={row.team} className="flex items-center gap-3 bg-[#0A0E1F] border border-[#2A3458] rounded-md px-3 py-2.5">
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center font-['Outfit'] font-black text-xs ${podiumClass(i)}`}>{i + 1}</span>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white overflow-hidden" style={{ background: row.color || '#F26321' }}>
                    {row.logo ? <img src={row.logo} alt="" className="w-full h-full object-cover" /> : row.short || row.team.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-white font-semibold flex-1 truncate">{row.team}</span>
                  <span className="font-['Outfit'] font-bold text-orange-300">{row.Pts} pts</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const ViewerJornadas = ({ tournament }) => {
  const matchdays = tournament.matchdays || [];
  return (
    <div className="space-y-5">
      {matchdays.map((md, mdIdx) => {
        const counts = new Map();
        md.matches.forEach((m) => {
          counts.set(m.teamA, (counts.get(m.teamA) || 0) + 1);
          counts.set(m.teamB, (counts.get(m.teamB) || 0) + 1);
        });
        const doubles = new Set();
        counts.forEach((c, t) => { if (c > 1) doubles.add(t); });
        const extraIdx = md.is_extra
          ? matchdays.slice(0, mdIdx + 1).filter((m) => m.is_extra).length
          : 0;

        return (
          <div key={md.number} className="bg-[#121830] border border-[#2A3458] rounded-xl overflow-hidden" data-testid={`viewer-jornada-${md.number}`}>
            <div className="px-5 py-3 flex items-center gap-3 flex-wrap bg-[#0F1428] border-b border-[#2A3458]">
              <Calendar className="w-4 h-4 text-orange-400" />
              <p className="text-white font-['Outfit'] font-bold">
                {md.is_extra ? `Jornada Extra ${extraIdx}` : `Jornada ${String(md.number).padStart(2, '0')}`}
              </p>
              {md.is_extra && (
                <span
                  title="Jornada generada automáticamente para equilibrar los partidos"
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />Generada automáticamente
                </span>
              )}
              {doubles.size > 0 && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                  <Repeat className="w-3 h-3" />Doble
                </span>
              )}
            </div>
            {md.matches.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-500">Aún no hay partidos.</p>
            ) : (
              <div className="divide-y divide-[#2A3458]">
                {md.matches.map((m) => (
                  <div key={m.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 px-5 py-3">
                    <span className="text-white font-semibold text-right truncate">{m.teamA}</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0A0E1F] border border-[#2A3458] min-w-[80px] justify-center">
                      {m.scoreA !== null && m.scoreB !== null ? (
                        <span className="font-['Outfit'] font-bold text-orange-300">{m.scoreA} - {m.scoreB}</span>
                      ) : (
                        <Swords className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </div>
                    <span className="text-white font-semibold truncate">{m.teamB}</span>
                    <span className="text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap" style={statusStyle(m.status)}>
                      {statusLabel(m.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {md.resting && (
              <div className="px-5 py-2 flex items-center gap-2 bg-[#0F1428] border-t border-[#2A3458]">
                <Coffee className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-300">Descansa: {md.resting}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ViewerTabla = ({ tournament, standings }) => {
  const qualifiers = tournament.qualifiers_count;
  return (
    <div className="bg-[#121830] border border-[#2A3458] rounded-xl overflow-hidden">
      <div className="hidden md:grid grid-cols-[50px_1.5fr_45px_45px_45px_45px_50px_50px_55px_60px] gap-2 px-5 py-3 bg-[#0F1428] border-b border-[#2A3458]">
        <span className="label-caps">#</span>
        <span className="label-caps">Equipo</span>
        <span className="label-caps text-right">PJ</span>
        <span className="label-caps text-right">PG</span>
        <span className="label-caps text-right">PE</span>
        <span className="label-caps text-right">PP</span>
        <span className="label-caps text-right">GF</span>
        <span className="label-caps text-right">GC</span>
        <span className="label-caps text-right">DG</span>
        <span className="label-caps text-right">PTS</span>
      </div>
      {standings.length === 0 ? (
        <p className="p-10 text-center text-gray-500 text-sm">Aún no hay equipos.</p>
      ) : (
        <div className="divide-y divide-[#2A3458]">
          {standings.map((row, idx) => {
            const pos = idx + 1;
            const inZone = pos <= qualifiers;
            return (
              <motion.div
                key={row.team}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className={`grid grid-cols-[50px_1.5fr_45px_45px_45px_45px_50px_50px_55px_60px] gap-2 px-5 py-3 items-center text-sm ${inZone ? 'bg-orange-500/[0.05]' : ''}`}
              >
                <span className={`w-7 h-7 rounded-md flex items-center justify-center font-['Outfit'] font-bold text-xs ${inZone ? 'bg-orange-500 text-white' : 'bg-[#0A0E1F] border border-[#2A3458] text-gray-400'}`}>{pos}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold text-white overflow-hidden" style={{ background: row.color || '#F26321' }}>
                    {row.logo ? <img src={row.logo} alt="" className="w-full h-full object-cover" /> : row.short || row.team.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-white font-semibold truncate">{row.team}</span>
                </div>
                <span className="text-right text-white">{row.PJ}</span>
                <span className="text-right text-yellow-300">{row.PG}</span>
                <span className="text-right text-gray-400">{row.PE}</span>
                <span className="text-right text-red-300">{row.PP}</span>
                <span className="text-right text-gray-300">{row.GF}</span>
                <span className="text-right text-gray-300">{row.GC}</span>
                <span className={`text-right font-bold ${dgColor(row.DG)}`}>{row.DG > 0 ? '+' : ''}{row.DG}</span>
                <span className="text-right font-['Outfit'] font-black text-orange-300">{row.Pts}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ViewerBracket = ({ tournament }) => {
  const rounds = tournament.bracket || [];
  if (rounds.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-[#2A3458] rounded-2xl bg-[#0F1428]/60">
        <Trophy className="w-12 h-12 mx-auto text-gray-600 mb-3" />
        <p className="text-gray-400">El bracket aún no se ha generado.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {rounds.map((round) => (
          <div key={round.name} className="flex flex-col gap-4 min-w-[260px]">
            <div className="text-center">
              <p className="label-caps">Ronda</p>
              <h3 className="font-['Outfit'] font-bold text-white">{round.name}</h3>
            </div>
            <div className="flex-1 flex flex-col justify-around gap-3">
              {round.matches.map((m) => (
                <div key={m.id} className="bg-[#121830] border border-[#2A3458] rounded-lg overflow-hidden">
                  <BracketRow name={m.teamA} score={m.scoreA} isWinner={m.winner && m.winner === m.teamA} />
                  <div className="border-t border-[#2A3458]" />
                  <BracketRow name={m.teamB} score={m.scoreB} isWinner={m.winner && m.winner === m.teamB} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const bracketNameClass = ({ isWinner, name }) => {
  if (isWinner) return 'text-yellow-300';
  if (name) return 'text-white';
  return 'text-gray-500 italic';
};

const BracketRow = ({ name, score, isWinner }) => (
  <div className={`flex items-center justify-between px-4 py-3 ${isWinner ? 'bg-orange-500/10' : ''}`}>
    <span className={`font-semibold truncate ${bracketNameClass({ isWinner, name })}`}>
      {name || 'Por definir'}
    </span>
    <span className={`font-['Outfit'] font-bold ${isWinner ? 'text-yellow-300' : 'text-gray-400'}`}>
      {score !== null ? score : '—'}
    </span>
  </div>
);

const statusLabel = (s) => ({ pending: 'Pendiente', in_progress: 'En juego', finished: 'Finalizado' }[s] || 'Pendiente');
const statusStyle = (s) => ({
  pending:     { background: 'rgba(100,116,143,0.12)', color: '#94A3B8', border: '1px solid rgba(100,116,143,0.25)' },
  in_progress: { background: 'rgba(242,99,33,0.18)',   color: '#FFB088', border: '1px solid rgba(242,99,33,0.40)' },
  finished:    { background: 'rgba(255,193,7,0.15)',   color: '#FFD54F', border: '1px solid rgba(255,193,7,0.30)' },
}[s]);
