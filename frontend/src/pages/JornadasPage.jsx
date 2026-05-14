import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Coffee, Swords, CheckCircle2, Edit3, AlertTriangle, Zap, Repeat,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { MatchEditor } from '../components/MatchEditor';
import { updateTournament } from '../utils/api';
import { toast } from 'sonner';
import { isAdmin } from '../utils/auth';

const statusLabel = (s) => ({ pending: 'Pendiente', in_progress: 'En juego', finished: 'Finalizado' }[s] || 'Pendiente');
const statusStyle = (s) => ({
  pending:     { background: 'rgba(100,116,143,0.12)', color: '#94A3B8', border: '1px solid rgba(100,116,143,0.25)' },
  in_progress: { background: 'rgba(242,99,33,0.18)',   color: '#FFB088', border: '1px solid rgba(242,99,33,0.40)' },
  finished:    { background: 'rgba(255,193,7,0.15)',   color: '#FFD54F', border: '1px solid rgba(255,193,7,0.30)' },
}[s]);

export default function JornadasPage() {
  const { id } = useParams();
  const { tournament, refresh } = useOutletContext();
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { refresh(); }, [refresh]);

  if (!tournament) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  }

  const admin = isAdmin(tournament.id, tournament);
  const matchdays = tournament.matchdays || [];

  // Detect teams playing twice in same matchday
  const doubleByMd = matchdays.map((md) => {
    const count = new Map();
    md.matches.forEach((m) => {
      count.set(m.teamA, (count.get(m.teamA) || 0) + 1);
      count.set(m.teamB, (count.get(m.teamB) || 0) + 1);
    });
    const doubles = new Set();
    count.forEach((c, t) => { if (c > 1) doubles.add(t); });
    return doubles;
  });

  const saveMatch = async (mdIndex, updatedMatch) => {
    const next = matchdays.map((md, i) =>
      i === mdIndex
        ? { ...md, matches: md.matches.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)) }
        : md
    );
    try {
      await updateTournament(id, { matchdays: next });
      await refresh();
      setEditingId(null);
      toast.success('Partido actualizado');
    } catch {
      toast.error('Error al guardar');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-3">
          {tournament.primary_logo && <img src={tournament.primary_logo} alt="" className="w-12 h-12 object-contain rounded-md bg-white/5 p-1" />}
          <div className="flex-1 min-w-0">
            <p className="label-caps">Calendario</p>
            <h1 className="text-3xl font-black tracking-tighter text-white">Jornadas y partidos</h1>
            <p className="text-sm text-gray-400 truncate">{tournament.name}</p>
          </div>
          {!admin && (
            <span className="text-xs px-3 py-1.5 rounded-md bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">Modo lectura</span>
          )}
        </motion.div>

        <div className="space-y-5">
          {matchdays.map((md, mdIdx) => {
            const expected = Math.floor(tournament.teams_count / 2);
            const complete = md.matches.length >= expected && expected > 0 && !md.is_extra;
            const isExtra = !!md.is_extra;
            const doubles = doubleByMd[mdIdx];

            return (
              <motion.div
                key={md.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mdIdx * 0.04 }}
                className={`bg-[#121830] border rounded-xl overflow-hidden ${
                  isExtra ? 'border-orange-500/50 shadow-[0_0_18px_rgba(242,99,33,0.15)]'
                  : complete ? 'border-yellow-500/50' : 'border-[#2A3458]'
                }`}
                data-testid={`jornada-${md.number}`}
              >
                <div className="px-5 py-3 flex items-center justify-between gap-2 bg-[#0F1428] border-b border-[#2A3458]">
                  <div className="flex items-center gap-3 min-w-0">
                    <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                    <p className="text-white font-['Outfit'] font-bold">
                      Jornada {String(md.number).padStart(2, '0')}
                    </p>
                    {isExtra && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3" />Extra
                      </span>
                    )}
                    {doubles.size > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                        <Repeat className="w-3 h-3" />Doble
                      </span>
                    )}
                  </div>
                  {complete && (
                    <span className="flex items-center gap-1 text-yellow-300 label-caps !text-yellow-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />Completa
                    </span>
                  )}
                </div>

                {md.matches.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 text-sm">
                    Aún no hay partidos asignados a esta jornada.
                  </div>
                ) : (
                  <div className="divide-y divide-[#2A3458]">
                    {md.matches.map((m, i) => {
                      const isDouble = doubles.has(m.teamA) || doubles.has(m.teamB);
                      const isEditing = editingId === m.id;
                      return (
                        <div key={m.id} className={`px-5 py-3 ${isDouble ? 'bg-yellow-500/[0.03]' : ''}`}>
                          {isEditing ? (
                            <MatchEditor
                              match={m}
                              onSave={(updated) => saveMatch(mdIdx, updated)}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <div className="grid grid-cols-[40px_1fr_auto_1fr_auto_auto] items-center gap-3 hover:bg-[#1A2240] transition rounded-md -mx-2 px-2 py-1">
                              <span className="label-caps">P. {String(i + 1).padStart(2, '0')}</span>
                              <span className="text-white font-semibold text-right truncate flex items-center justify-end gap-1.5">
                                {doubles.has(m.teamA) && <Repeat className="w-3 h-3 text-yellow-400" />}
                                {m.teamA}
                              </span>
                              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#0A0E1F] border border-[#2A3458] min-w-[90px] justify-center">
                                {m.scoreA !== null && m.scoreB !== null ? (
                                  <span className="font-['Outfit'] font-bold text-orange-300">{m.scoreA} - {m.scoreB}</span>
                                ) : (
                                  <Swords className="w-3.5 h-3.5 text-gray-500" />
                                )}
                              </div>
                              <span className="text-white font-semibold truncate flex items-center gap-1.5">
                                {m.teamB}
                                {doubles.has(m.teamB) && <Repeat className="w-3 h-3 text-yellow-400" />}
                              </span>
                              <span className="text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap" style={statusStyle(m.status)}>
                                {statusLabel(m.status)}
                              </span>
                              {admin && (
                                <Button
                                  data-testid={`edit-match-${m.id}`}
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingId(m.id)}
                                  className="w-8 h-8 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          )}
                          {m.date && (
                            <p className="text-xs text-gray-500 mt-1 ml-12">
                              {new Date(m.date).toLocaleDateString('es-GT', { weekday: 'short', day: '2-digit', month: 'short' })}
                              {m.time && ` · ${m.time}`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {md.resting && (
                  <div className="px-5 py-3 flex items-center gap-2 bg-[#0F1428] border-t border-[#2A3458]">
                    <Coffee className="w-4 h-4 text-yellow-400" />
                    <span className="label-caps">Descansa</span>
                    <span className="ml-auto font-['Outfit'] font-semibold text-yellow-300">{md.resting}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {!admin && (
          <div className="mt-6 flex items-center gap-2 p-4 bg-[#121830] border border-[#2A3458] rounded-xl text-sm text-gray-400">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Estás en modo espectador. Para editar resultados, ingresa al modo administrador con el PIN del torneo.
          </div>
        )}
      </div>
    </div>
  );
}
