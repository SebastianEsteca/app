import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Trophy } from 'lucide-react';
import { computeStats } from '../utils/tournamentAlgorithm';

export default function TablaGeneralPage() {
  const { tournament, refresh } = useOutletContext();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!tournament) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  }

  const stats = computeStats(tournament.teams || [], tournament.matchdays || [], tournament.matches_per_team);
  // Phase 1 sort: matches played desc, then by remaining opponents asc (more "settled"), then name
  const ranked = stats
    .map((s) => {
      const t = (tournament.teams || []).find((x) => x.name === s.team);
      return { ...s, color: t?.color, short: t?.short_name, logo: t?.logo };
    })
    .sort((a, b) => b.played - a.played || a.remainingOpponents.length - b.remainingOpponents.length || a.team.localeCompare(b.team));

  const qualifiers = tournament.qualifiers_count;

  return (
    <div className="min-h-screen">
      <div className="max-w-[1100px] mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-3">
          {tournament.primary_logo && <img src={tournament.primary_logo} alt="" className="w-12 h-12 object-contain rounded-md bg-white/5 p-1" />}
          <div>
            <p className="label-caps">Posiciones</p>
            <h1 className="text-3xl font-black tracking-tighter text-white">Tabla general</h1>
            <p className="text-sm text-gray-400">
              Los primeros <span className="text-orange-300 font-semibold">{qualifiers}</span> clasifican.
            </p>
          </div>
        </motion.div>

        <div className="bg-[#121830] border border-[#2A3458] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[50px_1fr_60px_60px_1fr_80px] gap-3 px-5 py-3 bg-[#0F1428] border-b border-[#2A3458]">
            <span className="label-caps">#</span>
            <span className="label-caps">Equipo</span>
            <span className="label-caps text-right">PJ</span>
            <span className="label-caps text-right">RR</span>
            <span className="label-caps">Rivales restantes</span>
            <span className="label-caps text-right">Estado</span>
          </div>

          {ranked.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">Aún no hay equipos registrados.</div>
          ) : (
            <div className="divide-y divide-[#2A3458]">
              {ranked.map((row, idx) => {
                const pos = idx + 1;
                const inZone = pos <= qualifiers;
                return (
                  <motion.div
                    key={row.team}
                    layout
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`grid grid-cols-[50px_1fr_60px_60px_1fr_80px] gap-3 px-5 py-3 items-center text-sm ${inZone ? 'bg-orange-500/[0.04]' : ''}`}
                    data-testid={`standings-row-${pos}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-md flex items-center justify-center font-['Outfit'] font-bold text-xs ${
                        inZone ? 'bg-orange-500 text-white' : 'bg-[#0A0E1F] border border-[#2A3458] text-gray-400'
                      }`}>{pos}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center font-['Outfit'] font-black text-[10px] text-white shrink-0 overflow-hidden" style={{ background: row.color || '#F26321' }}>
                        {row.logo ? <img src={row.logo} alt="" className="w-full h-full object-cover" /> : row.short || row.team.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-white font-semibold truncate">{row.team}</span>
                    </div>
                    <span className="text-right font-['Outfit'] font-bold text-white">{row.played}</span>
                    <span className="text-right text-gray-400">{row.remainingOpponents.length}</span>
                    <span className="text-gray-500 truncate text-xs">{row.remainingOpponents.slice(0, 4).join(', ')}{row.remainingOpponents.length > 4 ? '...' : ''}</span>
                    <div className="flex justify-end">
                      {inZone ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                          <Trophy className="w-3 h-3" />Clasifica
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 p-4 bg-[#121830] border border-[#2A3458] rounded-xl text-sm text-gray-400">
          <BarChart3 className="w-4 h-4 text-orange-400" />
          Las estadísticas avanzadas con goles, mejor ataque y defensa estarán en la siguiente fase.
        </div>
      </div>
    </div>
  );
}
