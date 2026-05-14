import { motion } from 'framer-motion';
import { Award, Users } from 'lucide-react';
import { ESTECA_LOGO, COPA_LOGO } from '../components/Sidebar';

const members = [
  { name: 'Sebastián Reyes', role: 'Coordinador' },
  { name: 'Ana Girón', role: 'Comisión' },
  { name: 'Herbeth Ruano', role: 'Comisión' },
  { name: 'Estuardo del Cid', role: 'Comisión' },
];

const initials = (full) => full.split(' ').map((p) => p[0]).slice(0, 2).join('');

export default function CreditosPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="label-caps">Créditos</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mt-2">
            Comisión de <span className="gold-text">Deportes</span>
          </h1>
          <p className="text-gray-400 mt-2">Equipo que organiza y coordina la Copa ESTECA 2026.</p>
        </motion.div>

        {/* School branding card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-[#1A2240] via-[#121830] to-[#0F1428] border border-[#2A3458] rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-[160px_1fr_160px] items-center gap-6"
        >
          <img src={ESTECA_LOGO} alt="ESTECA-PC" className="w-32 h-32 mx-auto object-contain drop-shadow-[0_4px_20px_rgba(255,193,7,0.2)] float-slow" />
          <div className="text-center">
            <p className="label-caps">Establecimiento Educativo</p>
            <h2 className="text-2xl font-['Outfit'] font-black text-white mt-2">ESTECA-PC</h2>
            <p className="text-sm text-gray-400 mt-1">Primaria · Básico · Diversificado · Since 2002</p>
          </div>
          <img src={COPA_LOGO} alt="Copa ESTECA 2026" className="w-32 h-32 mx-auto object-contain drop-shadow-[0_4px_20px_rgba(242,99,33,0.25)] float-slow" />
        </motion.div>

        {/* Members */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((m, idx) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
              className="group bg-[#121830] border border-[#2A3458] rounded-xl p-5 flex items-center gap-4 hover:border-orange-500/50 hover:shadow-[0_0_24px_rgba(242,99,33,0.15)] transition-all"
              data-testid={`credit-member-${idx}`}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-['Outfit'] font-black text-white text-lg shrink-0"
                style={{
                  background: idx % 2 === 0
                    ? 'linear-gradient(135deg, #F26321 0%, #FFC107 100%)'
                    : 'linear-gradient(135deg, #2D2A75 0%, #4F46E5 100%)',
                }}
              >
                {initials(m.name)}
              </div>
              <div className="min-w-0">
                <p className="text-white font-['Outfit'] font-bold text-lg leading-tight truncate">{m.name}</p>
                <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-orange-400" />
                  {m.role}
                </p>
              </div>
              <Award className="w-5 h-5 text-yellow-400/60 ml-auto group-hover:text-yellow-300 transition" />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-gray-600 mt-10"
        >
          Hecho con dedicación para la comunidad educativa ESTECA-PC.
        </motion.p>
      </div>
    </div>
  );
}
