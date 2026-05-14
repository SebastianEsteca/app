import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Target, Shield, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { tournamentStats } from '../utils/standings';

export default function EstadisticasPage() {
  const { tournament, refresh } = useOutletContext();

  useEffect(() => { refresh(); }, [refresh]);

  if (!tournament) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  }

  const s = tournamentStats(tournament.teams || [], tournament.matchdays || []);
  const goalsData = s.standings.map((r) => ({ name: r.short || r.team.slice(0, 4), GF: r.GF, GC: r.GC }));
  const pointsData = s.standings.map((r) => ({ name: r.short || r.team.slice(0, 4), Puntos: r.Pts }));

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-3">
          {tournament.primary_logo && <img src={tournament.primary_logo} alt="" className="w-12 h-12 object-contain rounded-md bg-white/5 p-1" />}
          <div>
            <p className="label-caps">Análisis</p>
            <h1 className="text-3xl font-black tracking-tighter text-white">Estadísticas</h1>
            <p className="text-sm text-gray-400">{tournament.name}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KpiCard icon={Target} label="Goles totales" value={s.totalGoals} color="orange" />
          <KpiCard icon={BarChart3} label="Partidos jugados" value={s.finishedMatches} color="yellow" />
          <KpiCard icon={Trophy} label="Mejor ataque" value={s.bestAttack && s.bestAttack.GF > 0 ? `${s.bestAttack.team} (${s.bestAttack.GF})` : '—'} color="orange" small />
          <KpiCard icon={Shield} label="Mejor defensa" value={s.bestDefense && s.bestDefense.PJ > 0 ? `${s.bestDefense.team} (${s.bestDefense.GC})` : '—'} color="yellow" small />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Goles a favor vs en contra">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={goalsData}>
                <CartesianGrid stroke="#2A3458" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#121830', border: '1px solid #2A3458', color: '#fff' }} />
                <Legend />
                <Bar dataKey="GF" fill="#F26321" radius={[4, 4, 0, 0]} />
                <Bar dataKey="GC" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Puntos por equipo">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pointsData}>
                <CartesianGrid stroke="#2A3458" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#121830', border: '1px solid #2A3458', color: '#fff' }} />
                <Bar dataKey="Puntos" fill="#FFC107" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="mt-6 bg-[#121830] border border-[#2A3458] rounded-xl p-5">
          <p className="label-caps mb-2">Promedio</p>
          <p className="text-white">
            <span className="font-['Outfit'] font-black text-orange-300 text-2xl">{s.avgGoalsPerMatch}</span>
            <span className="text-gray-400 ml-2 text-sm">goles por partido finalizado</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const KpiCard = ({ icon: Icon, label, value, color, small }) => (
  <div className="bg-[#121830] border border-[#2A3458] rounded-xl px-4 py-3">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-3.5 h-3.5 ${color === 'yellow' ? 'text-yellow-400' : 'text-orange-400'}`} />
      <p className="label-caps !text-[10px]">{label}</p>
    </div>
    <p className={`font-['Outfit'] font-bold text-white leading-tight truncate ${small ? 'text-sm' : 'text-2xl'}`}>{value}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-[#121830] border border-[#2A3458] rounded-xl p-5">
    <p className="label-caps mb-4">{title}</p>
    {children}
  </div>
);
