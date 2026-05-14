import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Coffee, Swords, Clock, CheckCircle2 } from 'lucide-react';
import { maxMatchesPerMatchday } from '../utils/tournamentAlgorithm';

export default function JornadasPage() {
  const { tournament } = useOutletContext();

  if (!tournament) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  }

  const matchdays = tournament.matchdays || [];
  const totalTeams = tournament.teams_count;
  const expected = maxMatchesPerMatchday(totalTeams);

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-3">
          {tournament.primary_logo && <img src={tournament.primary_logo} alt="" className="w-12 h-12 object-contain rounded-md bg-white/5 p-1" />}
          <div>
            <p className="label-caps">Calendario</p>
            <h1 className="text-3xl font-black tracking-tighter text-white">Jornadas y partidos</h1>
            <p className="text-sm text-gray-400">{tournament.name}</p>
          </div>
        </motion.div>

        <div className="space-y-5">
          {matchdays.map((md, idx) => {
            const complete = md.matches.length >= expected && expected > 0;
            return (
              <motion.div
                key={md.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`bg-[#121830] border rounded-xl overflow-hidden ${complete ? 'border-yellow-500/50' : 'border-[#2A3458]'}`}
                data-testid={`jornada-${md.number}`}
              >
                <div className="px-5 py-3 flex items-center justify-between bg-[#0F1428] border-b border-[#2A3458]">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <p className="text-white font-['Outfit'] font-bold">
                      Jornada {String(md.number).padStart(2, '0')}
                    </p>
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
                    {md.matches.map((m, i) => (
                      <div key={m.id} className="grid grid-cols-[40px_1fr_auto_1fr_auto] items-center gap-3 px-5 py-3 hover:bg-[#1A2240] transition">
                        <span className="label-caps">P. {String(i + 1).padStart(2, '0')}</span>
                        <span className="text-white font-semibold text-right truncate">{m.teamA}</span>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#0A0E1F] border border-[#2A3458] min-w-[80px] justify-center">
                          {m.scoreA !== null && m.scoreB !== null ? (
                            <span className="font-['Outfit'] font-bold text-orange-300">{m.scoreA} - {m.scoreB}</span>
                          ) : (
                            <Swords className="w-3.5 h-3.5 text-gray-500" />
                          )}
                        </div>
                        <span className="text-white font-semibold truncate">{m.teamB}</span>
                        <span className="text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap"
                          style={statusStyle(m.status)}>
                          {statusLabel(m.status)}
                        </span>
                      </div>
                    ))}
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

        <div className="mt-6 flex items-center gap-2 p-4 bg-[#121830] border border-[#2A3458] rounded-xl text-sm text-gray-400">
          <Clock className="w-4 h-4 text-orange-400" />
          La edición de fecha, hora y resultados llegará en la siguiente fase.
        </div>
      </div>
    </div>
  );
}

const statusLabel = (s) => ({ pending: 'Pendiente', in_progress: 'En curso', finished: 'Finalizado' }[s] || 'Pendiente');
const statusStyle = (s) => ({
  pending:     { background: 'rgba(100,116,143,0.12)', color: '#94A3B8', border: '1px solid rgba(100,116,143,0.25)' },
  in_progress: { background: 'rgba(242,99,33,0.12)',   color: '#F26321', border: '1px solid rgba(242,99,33,0.30)' },
  finished:    { background: 'rgba(255,193,7,0.12)',   color: '#FFC107', border: '1px solid rgba(255,193,7,0.30)' },
}[s]);
