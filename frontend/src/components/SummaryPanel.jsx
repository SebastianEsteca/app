import { motion } from 'framer-motion';
import { Scale, AlertTriangle, CheckCircle2, Layers, Users } from 'lucide-react';
import { tournamentSummary } from '../utils/tournamentAlgorithm';
import { Progress } from './ui/progress';

export const SummaryPanel = ({ teams, matchdays, targetMatches }) => {
  const s = tournamentSummary(teams, matchdays, targetMatches);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#121830] border border-[#2A3458] rounded-xl p-5"
      data-testid="summary-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-orange-400" />
          <p className="label-caps">Resumen del torneo</p>
        </div>
        {s.isBalanced ? (
          <span className="flex items-center gap-1 text-yellow-300 label-caps !text-yellow-300">
            <CheckCircle2 className="w-3.5 h-3.5" />Equilibrado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-orange-300 label-caps !text-orange-300">
            <AlertTriangle className="w-3.5 h-3.5" />Pendiente
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Stat label="Partidos programados" value={s.totalScheduled} />
        <Stat label="Partidos requeridos" value={s.totalNeeded} />
        <Stat label="Equipos con pendientes" value={s.pendingTeams.length} />
        <Stat label="Jornadas extra" value={s.extraMatchdays} />
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="label-caps">Calidad del equilibrio</p>
          <p className="text-orange-300 font-['Outfit'] font-bold text-sm">{s.balance}%</p>
        </div>
        <Progress
          value={s.balance}
          className="h-1.5 bg-[#0A0E1F] [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-yellow-400"
        />
      </div>

      {s.pendingTeams.length > 0 && (
        <div className="mt-3 p-3 rounded-md bg-yellow-500/5 border border-yellow-500/20">
          <p className="label-caps !text-yellow-300 mb-1.5">Faltan partidos</p>
          <div className="flex flex-wrap gap-1">
            {s.pendingTeams.slice(0, 8).map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-200 border border-yellow-500/20">
                {t} ({s.counts[t]}/{targetMatches})
              </span>
            ))}
            {s.pendingTeams.length > 8 && (
              <span className="text-xs text-gray-500">+{s.pendingTeams.length - 8}</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const Stat = ({ label, value }) => (
  <div className="bg-[#0A0E1F] border border-[#2A3458] rounded-md px-3 py-2">
    <p className="label-caps !text-[10px]">{label}</p>
    <p className="font-['Outfit'] font-bold text-white text-lg leading-none mt-1">{value}</p>
  </div>
);
