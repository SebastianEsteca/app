import { motion } from 'framer-motion';
import { Users, Calendar, TrendingUp, Trash2, ArrowRight, Layers } from 'lucide-react';
import { Progress } from './ui/progress';

const formatLabel = {
  liga: 'Liga regular',
  liga_ko: 'Liga + Eliminación',
  ko: 'Eliminación directa',
};

export const TournamentCard = ({ tournament, onOpen, onDelete, index = 0 }) => {
  const pct = Math.round((tournament.progress || 0) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-[#121830] border border-[#2A3458] rounded-xl overflow-hidden hover:border-orange-500/60 hover:shadow-[0_0_28px_rgba(242,99,33,0.18)] transition-all"
      data-testid={`tournament-card-${tournament.id}`}
    >
      <div className="relative aspect-[16/8] bg-gradient-to-br from-[#1A2240] via-[#232C4D] to-[#0F1428] flex items-center justify-center overflow-hidden">
        {tournament.primary_logo ? (
          <img
            src={tournament.primary_logo}
            alt={tournament.name}
            className="max-h-[80%] max-w-[70%] object-contain drop-shadow-[0_4px_24px_rgba(255,193,7,0.25)]"
          />
        ) : (
          <Layers className="w-16 h-16 text-orange-500/40" />
        )}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] font-semibold tracking-wider uppercase text-orange-300">
          {formatLabel[tournament.format] || tournament.format}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-['Outfit'] font-bold text-white mb-1 truncate">{tournament.name}</h3>
        <p className="text-xs text-gray-500 mb-4">
          Creado el {new Date(tournament.created_at).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <Stat icon={Users} label="Equipos" value={`${tournament.teams_registered}/${tournament.teams_count}`} />
          <Stat icon={Calendar} label="Jornada" value={`${tournament.current_matchday}/${tournament.matchdays_count}`} />
          <Stat icon={TrendingUp} label="Avance" value={`${pct}%`} />
        </div>

        <div className="mb-4">
          <Progress value={pct} className="h-1.5 bg-[#1A2240] [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-yellow-400" />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onOpen}
            data-testid={`open-tournament-${tournament.id}`}
            className="flex-1 h-10 px-4 rounded-md bg-orange-500 text-white hover:bg-orange-400 font-bold text-sm tracking-tight shadow-[0_0_18px_rgba(242,99,33,0.30)] transition flex items-center justify-center gap-2"
          >
            Abrir
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            data-testid={`delete-tournament-${tournament.id}`}
            className="w-10 h-10 rounded-md flex items-center justify-center text-red-400 bg-transparent border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 transition"
            aria-label="Eliminar torneo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Stat = ({ icon: Icon, label, value }) => (
  <div className="bg-[#0A0E1F] border border-[#2A3458] rounded-md px-2.5 py-2">
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className="w-3 h-3 text-orange-400" />
      <p className="label-caps !text-[9px]">{label}</p>
    </div>
    <p className="font-['Outfit'] font-bold text-white text-sm leading-none">{value}</p>
  </div>
);
