import { motion } from 'framer-motion';
import { Calendar, Coffee, CheckCircle2, Swords } from 'lucide-react';
import { MATCHES_PER_MATCHDAY } from '../utils/tournamentAlgorithm';

export const MatchdayTable = ({ matchday, index }) => {
  const complete = matchday.matches.length >= MATCHES_PER_MATCHDAY;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`bg-[#111C11] border rounded-xl p-5 transition-all ${
        complete ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-[#1A2E1A]'
      }`}
      data-testid={`matchday-card-${matchday.number}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="label-caps">Jornada</p>
            <p className="text-xl font-['Outfit'] font-black text-white">
              {String(matchday.number).padStart(2, '0')}
            </p>
          </div>
        </div>
        {complete && (
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="label-caps !text-emerald-400">Completa</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {Array.from({ length: MATCHES_PER_MATCHDAY }).map((_, i) => {
          const match = matchday.matches[i];
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
                match
                  ? 'bg-[#050A05] border border-[#1A2E1A]'
                  : 'bg-transparent border border-dashed border-[#1A2E1A]/60'
              }`}
            >
              <span className="label-caps !text-[10px] w-14">P. {String(i + 1).padStart(2, '0')}</span>
              {match ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-white font-semibold truncate flex-1 text-right">
                    {match.teamA}
                  </span>
                  <Swords className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-white font-semibold truncate flex-1">
                    {match.teamB}
                  </span>
                </div>
              ) : (
                <span className="text-gray-600 italic flex-1 text-center">Sin asignar</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-md bg-[#050A05] border border-[#1A2E1A]/70">
        <Coffee className="w-4 h-4 text-amber-400/80" />
        <span className="label-caps">Descansa</span>
        <span className={`ml-auto font-['Outfit'] font-semibold ${matchday.resting ? 'text-amber-300' : 'text-gray-600 italic'}`}>
          {matchday.resting || 'Por definir'}
        </span>
      </div>
    </motion.div>
  );
};
