import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trophy, Shield, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { playTick, playSuccess, playError } from '../utils/sounds';

const REQUIRED_TEAMS = 11;

export const TeamsSetup = ({ teams, onTeamsChange, onStart }) => {
  const [name, setName] = useState('');

  const handleAdd = () => {
    const value = name.trim();
    if (!value) {
      toast.error('Ingresa un nombre de equipo');
      playError();
      return;
    }
    if (teams.length >= REQUIRED_TEAMS) {
      toast.error(`Solo se permiten ${REQUIRED_TEAMS} equipos`);
      playError();
      return;
    }
    if (teams.some((t) => t.toLowerCase() === value.toLowerCase())) {
      toast.error('Ese equipo ya está en la lista');
      playError();
      return;
    }
    onTeamsChange([...teams, value]);
    setName('');
    playTick();
  };

  const handleRemove = (t) => {
    onTeamsChange(teams.filter((x) => x !== t));
    playTick();
  };

  const handleStart = () => {
    if (teams.length !== REQUIRED_TEAMS) {
      toast.error(`Necesitas exactamente ${REQUIRED_TEAMS} equipos`);
      playError();
      return;
    }
    playSuccess();
    onStart();
  };

  const onKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="min-h-screen w-full hero-grid">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30">
              <Trophy className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="label-caps">Torneo · Configuración</p>
              <h2 className="text-xl font-bold tracking-tight text-white">Liga de 11 Equipos</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="label-caps">Equipos</p>
            <p className="text-3xl font-black text-emerald-400 font-['Outfit']">
              {teams.length}<span className="text-gray-500">/{REQUIRED_TEAMS}</span>
            </p>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-[1.05]">
            Crea tu <span className="text-emerald-400">torneo</span> de fútbol
          </h1>
          <p className="mt-4 text-base text-gray-400 max-w-2xl">
            Agrega los <span className="text-emerald-400 font-semibold">{REQUIRED_TEAMS} equipos</span> participantes para iniciar el sorteo de las <span className="text-emerald-400 font-semibold">6 jornadas</span>. Cada equipo jugará hasta 6 partidos sin repetir rival.
          </p>
        </motion.div>

        {/* Add team form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0A120A] border border-[#1A2E1A] rounded-xl p-6 mb-8"
        >
          <p className="label-caps mb-3">Agregar equipo</p>
          <div className="flex gap-3">
            <Input
              data-testid="add-team-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ej. Real Sporting"
              maxLength={32}
              className="flex-1 bg-[#050A05] border-[#1A2E1A] text-white placeholder:text-gray-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 h-12"
              disabled={teams.length >= REQUIRED_TEAMS}
            />
            <Button
              data-testid="add-team-button"
              onClick={handleAdd}
              disabled={teams.length >= REQUIRED_TEAMS}
              className="h-12 px-6 bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-md shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-40"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar equipo
            </Button>
          </div>
        </motion.div>

        {/* Teams list */}
        <div className="mb-10" data-testid="teams-list">
          <p className="label-caps mb-4">Lista de equipos registrados</p>
          {teams.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-[#1A2E1A] rounded-xl">
              <Shield className="w-10 h-10 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-500">Aún no has agregado equipos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {teams.map((team, idx) => (
                  <motion.div
                    key={team}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.04 }}
                    className="group relative bg-[#111C11] border border-[#1A2E1A] rounded-lg p-4 hover:border-emerald-500/60 transition-all"
                    data-testid={`team-card-${idx}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-['Outfit'] text-emerald-400 font-bold text-sm">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <p className="text-white font-semibold truncate flex-1">{team}</p>
                    </div>
                    <button
                      data-testid={`remove-team-${idx}`}
                      onClick={() => handleRemove(team)}
                      aria-label={`Eliminar ${team}`}
                      className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Start tournament */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end"
        >
          <Button
            data-testid="start-draw-button"
            onClick={handleStart}
            disabled={teams.length !== REQUIRED_TEAMS}
            className="h-14 px-8 bg-emerald-500 text-black hover:bg-emerald-400 font-black text-base tracking-tight rounded-md shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-40 disabled:shadow-none"
          >
            Comenzar sorteo
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
