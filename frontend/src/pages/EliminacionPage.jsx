import { motion } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';

export default function EliminacionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl text-center bg-[#121830] border border-[#2A3458] rounded-2xl p-10"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4 float-slow">
          <Trophy className="w-7 h-7 text-orange-400" />
        </div>
        <p className="label-caps mb-2">Próximamente</p>
        <h1 className="text-3xl font-black tracking-tighter text-white">Eliminación directa</h1>
        <p className="text-gray-400 mt-3">
          El bracket dinámico (Octavos, Cuartos, Semifinal y Final) con generación automática basada en la tabla general llegará en la <span className="text-orange-300 font-semibold">Fase 2</span>.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-yellow-300">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">En desarrollo</span>
          <Sparkles className="w-4 h-4" />
        </div>
      </motion.div>
    </div>
  );
}
