import { motion } from 'framer-motion';
import { Calendar, Coffee, CheckCircle2, Swords } from 'lucide-react';
import { maxMatchesPerMatchday } from '../utils/tournamentAlgorithm';

export const MatchdayTable = ({ matchday, index, totalTeams, extraIndex = 0 }) => {
  const expected = maxMatchesPerMatchday(totalTeams);
  const complete = matchday.matches.length >= expected && expected > 0 && !matchday.is_extra;
  const isExtra = !!matchday.is_extra;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-[#121830] border rounded-xl p-5 transition-all ${
        isExtra
          ? 'border-orange-500/60 shadow-[0_0_22px_rgba(242,99,33,0.18)]'
          : complete
            ? 'border-yellow-500/60 shadow-[0_0_22px_rgba(255,193,7,0.18)]'
            : 'border-[#2A3458]'
      }`}
      data-testid={`matchday-card-${matchday.number}`}
    >
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="label-caps">{isExtra ? 'Jornada Extra' : 'Jornada'}</p>
            <p className="text-xl font-['Outfit'] font-black text-white">
              {isExtra ? extraIndex : String(matchday.number).padStart(2, '0')}
            </p>
          </div>
        </div>
        {isExtra && (
          <span
            title="Jornada generada automáticamente para equilibrar los partidos"
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30"
          >
            Generada auto.
          </span>
        )}
        {complete && !isExtra && (
          <div className="flex items-center gap-1 text-yellow-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="label-caps !text-yellow-300">Completa</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {Array.from({ length: Math.max(expected, matchday.matches.length) }).map((_, i) => {
          const match = matchday.matches[i];
          // Use match.id when present (stable across reorders); fallback to slot index for empty slots
          const slotKey = match?.id || `slot-${matchday.number}-${i}`;
          return (
            <div
              key={slotKey}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
                match
                  ? 'bg-[#0A0E1F] border border-[#2A3458]'
                  : 'bg-transparent border border-dashed border-[#2A3458]/60'
              }`}
            >
              <span className="label-caps !text-[10px] w-14">P. {String(i + 1).padStart(2, '0')}</span>
              {match ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-white font-semibold truncate flex-1 text-right">{match.teamA}</span>
                  <Swords className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="text-white font-semibold truncate flex-1">{match.teamB}</span>
                </div>
              ) : (
                <span className="text-gray-600 italic flex-1 text-center">Sin asignar</span>
              )}
            </div>
          );
        })}
      </div>

      {(matchday.resting || totalTeams % 2 === 1) && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-md bg-[#0A0E1F] border border-[#2A3458]/70">
          <Coffee className="w-4 h-4 text-yellow-400/80" />
          <span className="label-caps">Descansa</span>
          <span className={`ml-auto font-['Outfit'] font-semibold ${matchday.resting ? 'text-yellow-300' : 'text-gray-600 italic'}`}>
            {matchday.resting || 'Por definir'}
          </span>
        </div>
      )}
    </motion.div>
  );
};
