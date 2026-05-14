import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Trophy, TrendingUp } from 'lucide-react';
import { computeStandings } from '../utils/standings';

export default function TablaGeneralPage() {
  const { tournament, refresh } = useOutletContext();

  useEffect(() => { refresh(); }, [refresh]);

  if (!tournament) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  }

  const standings = computeStandings(tournament.teams || [], tournament.matchdays || []);
  const qualifiers = tournament.qualifiers_count;
  const anyFinished = standings.some((s) => s.PJ > 0);

  return (
    <div className="min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-3">
          {tournament.primary_logo && <img src={tournament.primary_logo} alt="" className="w-12 h-12 object-contain rounded-md bg-white/5 p-1" />}
          <div>
            <p className="label-caps">Posiciones</p>
            <h1 className="text-3xl font-black tracking-tighter text-white">Tabla general</h1>
            <p className="text-sm text-gray-400">
              Los primeros <span className="text-orange-300 font-semibold">{qualifiers}</span> equipos clasifican a la eliminación directa.
            </p>
          </div>
        </motion.div>

        <div className="bg-[#121830] border border-[#2A3458] rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[50px_1.6fr_45px_45px_45px_45px_50px_50px_55px_60px] gap-2 px-5 py-3 bg-[#0F1428] border-b border-[#2A3458]">
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
            <div className="p-12 text-center text-gray-500 text-sm">Aún no hay equipos registrados.</div>
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
                    transition={{ delay: idx * 0.025 }}
                    className={`grid grid-cols-[50px_1.6fr_45px_45px_45px_45px_50px_50px_55px_60px] gap-2 px-5 py-3 items-center text-sm ${inZone ? 'bg-orange-500/[0.05]' : ''}`}
                    data-testid={`standings-row-${pos}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`w-7 h-7 rounded-md flex items-center justify-center font-['Outfit'] font-bold text-xs ${
                        inZone ? 'bg-orange-500 text-white' : 'bg-[#0A0E1F] border border-[#2A3458] text-gray-400'
                      }`}>{pos}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center font-['Outfit'] font-black text-[9px] text-white shrink-0 overflow-hidden" style={{ background: row.color || '#F26321' }}>
                        {row.logo ? <img src={row.logo} alt="" className="w-full h-full object-cover" /> : row.short || row.team.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-white font-semibold truncate">{row.team}</span>
                      {pos === 1 && row.PJ > 0 && <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                    </div>
                    <span className="text-right text-white">{row.PJ}</span>
                    <span className="text-right text-yellow-300">{row.PG}</span>
                    <span className="text-right text-gray-400">{row.PE}</span>
                    <span className="text-right text-red-300">{row.PP}</span>
                    <span className="text-right text-gray-300">{row.GF}</span>
                    <span className="text-right text-gray-300">{row.GC}</span>
                    <span className={`text-right font-bold ${row.DG > 0 ? 'text-yellow-300' : row.DG < 0 ? 'text-red-300' : 'text-gray-400'}`}>
                      {row.DG > 0 ? '+' : ''}{row.DG}
                    </span>
                    <span className="text-right font-['Outfit'] font-black text-orange-300 text-base">{row.Pts}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {!anyFinished && (
          <div className="mt-6 flex items-center gap-2 p-4 bg-[#121830] border border-[#2A3458] rounded-xl text-sm text-gray-400">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            La tabla se actualizará automáticamente cuando ingreses resultados en la sección de Jornadas y partidos.
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-gray-400">
          <Legend color="#FFC107" label="PG · Partidos ganados" />
          <Legend color="#94A3B8" label="PE · Partidos empatados" />
          <Legend color="#F87171" label="PP · Partidos perdidos" />
          <Legend color="#F26321" label="PTS · Puntos (3-1-0)" />
        </div>
      </div>
    </div>
  );
}

const Legend = ({ color, label }) => (
  <div className="bg-[#121830] border border-[#2A3458] rounded-md px-3 py-2 flex items-center gap-2">
    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
    {label}
  </div>
);
