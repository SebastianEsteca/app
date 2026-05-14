import { motion } from 'framer-motion';
import { BarChart3, Sparkles } from 'lucide-react';

export default function EstadisticasPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl text-center bg-[#121830] border border-[#2A3458] rounded-2xl p-10"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-4 float-slow">
          <BarChart3 className="w-7 h-7 text-yellow-400" />
        </div>
        <p className="label-caps mb-2">Próximamente</p>
        <h1 className="text-3xl font-black tracking-tighter text-white">Estadísticas avanzadas</h1>
        <p className="text-gray-400 mt-3">
          Gráficos de rendimiento, mejor ataque y defensa, goles por equipo y más estarán en la <span className="text-yellow-300 font-semibold">Fase 2</span>.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-orange-300">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">En desarrollo</span>
          <Sparkles className="w-4 h-4" />
        </div>
      </motion.div>
    </div>
  );
}
