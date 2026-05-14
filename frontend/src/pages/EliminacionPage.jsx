import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Crown, Wand2, RefreshCw, Edit3, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { computeStandings } from '../utils/standings';
import { generateBracket, propagateWinners, getChampion } from '../utils/bracket';
import { updateTournament } from '../utils/api';
import { toast } from 'sonner';
import { isAdmin } from '../utils/auth';

export default function EliminacionPage() {
  const { id } = useParams();
  const { tournament, refresh } = useOutletContext();
  const [rounds, setRounds] = useState([]);
  const [editing, setEditing] = useState(null); // {roundIdx, matchIdx}
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (tournament) setRounds(tournament.bracket || []);
  }, [tournament]);

  if (!tournament) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  }

  const admin = isAdmin(tournament.id, tournament);
  const standings = computeStandings(tournament.teams || [], tournament.matchdays || []);
  const champion = getChampion(rounds);

  const handleGenerate = async () => {
    if ((tournament.teams || []).length < 2) {
      toast.error('Necesitas al menos 2 equipos');
      return;
    }
    if (standings.length === 0 || standings.every((s) => s.PJ === 0)) {
      toast.message('Generando con orden actual de equipos (sin resultados aún)');
    }
    const next = generateBracket(standings.length ? standings : (tournament.teams || []).map((t) => ({ team: t.name })), tournament.qualifiers_count);
    setRounds(next);
    try {
      await updateTournament(id, { bracket: next });
      toast.success('Bracket generado');
    } catch {
      toast.error('No se pudo guardar el bracket');
    }
  };

  const startEdit = (rIdx, mIdx) => {
    const m = rounds[rIdx].matches[mIdx];
    setEditing({ rIdx, mIdx });
    setScoreA(m.scoreA ?? '');
    setScoreB(m.scoreB ?? '');
  };

  const saveScore = async () => {
    if (!editing) return;
    const a = scoreA === '' ? null : parseInt(scoreA, 10);
    const b = scoreB === '' ? null : parseInt(scoreB, 10);
    const next = rounds.map((r, ri) => ({
      ...r,
      matches: r.matches.map((m, mi) =>
        ri === editing.rIdx && mi === editing.mIdx
          ? { ...m, scoreA: Number.isFinite(a) ? a : null, scoreB: Number.isFinite(b) ? b : null }
          : m
      ),
    }));
    const propagated = propagateWinners(next);
    setRounds(propagated);
    setEditing(null);
    try {
      await updateTournament(id, { bracket: propagated });
      toast.success('Resultado guardado');
    } catch {
      toast.error('Error al guardar');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {tournament.primary_logo && <img src={tournament.primary_logo} alt="" className="w-12 h-12 object-contain rounded-md bg-white/5 p-1" />}
            <div>
              <p className="label-caps">Fase final</p>
              <h1 className="text-3xl font-black tracking-tighter text-white">Eliminación directa</h1>
              <p className="text-sm text-gray-400">
                Bracket de los <span className="text-orange-300 font-semibold">{tournament.qualifiers_count}</span> mejores clasificados.
              </p>
            </div>
          </div>
          {admin && (
            <div className="flex gap-2">
              <Button
                data-testid="generate-bracket-button"
                onClick={handleGenerate}
                className="bg-orange-500 hover:bg-orange-400 text-white font-bold shadow-[0_0_18px_rgba(242,99,33,0.30)]"
              >
                {rounds.length > 0 ? <RefreshCw className="w-4 h-4 mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                {rounds.length > 0 ? 'Regenerar bracket' : 'Generar bracket'}
              </Button>
            </div>
          )}
        </motion.div>

        {champion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 relative overflow-hidden bg-gradient-to-r from-yellow-500/20 via-orange-500/15 to-yellow-500/20 border border-yellow-500/40 rounded-2xl p-6 text-center"
          >
            <Crown className="w-10 h-10 text-yellow-300 mx-auto mb-2 float-slow" />
            <p className="label-caps !text-yellow-300">Campeón</p>
            <h2 className="text-4xl font-['Outfit'] font-black gold-text mt-1">{champion}</h2>
          </motion.div>
        )}

        {rounds.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[#2A3458] rounded-2xl bg-[#0F1428]/60">
            <Trophy className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 mb-4">Aún no se ha generado el bracket de eliminación.</p>
            {admin && (
              <Button onClick={handleGenerate} className="bg-orange-500 hover:bg-orange-400 text-white font-bold">
                <Wand2 className="w-4 h-4 mr-2" />Generar ahora
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max">
              {rounds.map((round, rIdx) => (
                <div key={rIdx} className="flex flex-col gap-4 min-w-[280px]" data-testid={`bracket-round-${rIdx}`}>
                  <div className="text-center">
                    <p className="label-caps">Ronda</p>
                    <h3 className="text-lg font-['Outfit'] font-bold text-white">{round.name}</h3>
                  </div>
                  <div className="flex-1 flex flex-col justify-around gap-4">
                    {round.matches.map((m, mIdx) => {
                      const isEditing = editing?.rIdx === rIdx && editing?.mIdx === mIdx;
                      const winA = m.winner && m.winner === m.teamA;
                      const winB = m.winner && m.winner === m.teamB;
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, x: rIdx * 4 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-[#121830] border border-[#2A3458] rounded-lg overflow-hidden hover:border-orange-500/50 transition"
                        >
                          <BracketTeamRow name={m.teamA} score={m.scoreA} isWinner={winA} />
                          <div className="border-t border-[#2A3458]" />
                          <BracketTeamRow name={m.teamB} score={m.scoreB} isWinner={winB} />
                          {admin && (
                            <div className="px-3 py-2 bg-[#0F1428] border-t border-[#2A3458]">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    data-testid={`bracket-score-a-${rIdx}-${mIdx}`}
                                    type="number" min="0" value={scoreA}
                                    onChange={(e) => setScoreA(e.target.value)}
                                    className="w-12 h-8 text-center bg-[#0A0E1F] border-[#2A3458] text-white"
                                  />
                                  <span className="text-gray-500">-</span>
                                  <Input
                                    data-testid={`bracket-score-b-${rIdx}-${mIdx}`}
                                    type="number" min="0" value={scoreB}
                                    onChange={(e) => setScoreB(e.target.value)}
                                    className="w-12 h-8 text-center bg-[#0A0E1F] border-[#2A3458] text-white"
                                  />
                                  <Button size="sm" onClick={saveScore} className="h-8 ml-auto bg-orange-500 hover:bg-orange-400 text-white">
                                    <Check className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEdit(rIdx, mIdx)}
                                  disabled={!m.teamA || !m.teamB}
                                  data-testid={`bracket-edit-${rIdx}-${mIdx}`}
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-300 disabled:opacity-30 transition"
                                >
                                  <Edit3 className="w-3 h-3" /> Marcar resultado
                                </button>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const BracketTeamRow = ({ name, score, isWinner }) => (
  <div className={`flex items-center justify-between px-4 py-3 ${isWinner ? 'bg-orange-500/10' : ''}`}>
    <span className={`font-semibold truncate ${isWinner ? 'text-yellow-300' : name ? 'text-white' : 'text-gray-500 italic'}`}>
      {name || 'Por definir'}
    </span>
    <span className={`font-['Outfit'] font-bold ${isWinner ? 'text-yellow-300' : 'text-gray-400'}`}>
      {score !== null ? score : '—'}
    </span>
  </div>
);
