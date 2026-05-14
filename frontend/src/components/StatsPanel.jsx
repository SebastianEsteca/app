import { motion } from 'framer-motion';
import { Activity, Users, Coffee, TrendingUp } from 'lucide-react';
import {
  computeStats,
  tournamentProgress,
  teamsRested,
  TOTAL_MATCHDAYS,
  MATCHES_PER_MATCHDAY,
} from '../utils/tournamentAlgorithm';
import { Progress } from '../components/ui/progress';

export const StatsPanel = ({ teams, matchdays }) => {
  const stats = computeStats(teams, matchdays);
  const progress = tournamentProgress(matchdays);
  const rested = teamsRested(matchdays);
  const totalScheduled = matchdays.reduce((acc, md) => acc + md.matches.length, 0);
  const totalPossible = TOTAL_MATCHDAYS * MATCHES_PER_MATCHDAY;

  return (
    <div className="space-y-4" data-testid="stats-panel">
      {/* Overall progress */}
      <div className="bg-[#0A120A] border border-[#1A2E1A] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <p className="label-caps">Progreso del torneo</p>
          </div>
          <p className="font-['Outfit'] font-bold text-emerald-400 text-lg">
            {Math.round(progress * 100)}%
          </p>
        </div>
        <Progress
          value={progress * 100}
          className="h-2 bg-[#050A05] [&>div]:bg-emerald-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          {totalScheduled} de {totalPossible} partidos asignados
        </p>
      </div>

      {/* Rested teams */}
      <div className="bg-[#0A120A] border border-[#1A2E1A] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Coffee className="w-4 h-4 text-amber-400" />
          <p className="label-caps">Equipos que descansaron</p>
        </div>
        {rested.size === 0 ? (
          <p className="text-sm text-gray-500 italic">Ninguno todavía</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {[...rested].map((t) => (
              <span
                key={t}
                className="text-xs font-medium px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Per-team breakdown */}
      <div className="bg-[#0A120A] border border-[#1A2E1A] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-emerald-400" />
          <p className="label-caps">Estadísticas por equipo</p>
        </div>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {stats.map((s, i) => (
            <motion.div
              key={s.team}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-[#050A05] border border-[#1A2E1A]"
              data-testid={`team-stat-${i}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-white font-semibold truncate">{s.team}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-['JetBrains_Mono'] text-xs text-emerald-300">
                  {s.played}/6
                </span>
                <span className="text-xs text-gray-500" title="Rivales disponibles">
                  {s.remainingOpponents.length} rivales
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
