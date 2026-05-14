import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Shuffle,
  Wand2,
  RotateCcw,
  Download,
  FileImage,
  FileText,
  Volume2,
  VolumeX,
  ArrowLeft,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Roulette } from './Roulette';
import { MatchdayTable } from './MatchdayTable';
import { StatsPanel } from './StatsPanel';
import {
  generateMatchday,
  generateFullTournament,
  getValidOpponents,
  emptyMatchdays,
  TOTAL_MATCHDAYS,
  MATCHES_PER_MATCHDAY,
  pairKey,
  buildPlayedPairs,
  buildMatchCount,
  TARGET_MATCHES_PER_TEAM,
} from '../utils/tournamentAlgorithm';
import { playSuccess, playError, isSoundEnabled, setSoundEnabled } from '../utils/sounds';
import { exportElementToImage, exportElementToPDF } from '../utils/exporter';

export const Dashboard = ({ teams, matchdays, onUpdate, onReset, onBack }) => {
  const [activeMatchday, setActiveMatchday] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [drawState, setDrawState] = useState(null); // { selectedTeam, candidates }
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const exportRef = useRef(null);

  const validOpponents = useMemo(() => {
    if (!selectedTeam) return [];
    return getValidOpponents(selectedTeam, activeMatchday, teams, matchdays);
  }, [selectedTeam, activeMatchday, teams, matchdays]);

  const teamsAvailableForSelection = useMemo(() => {
    const playedPairs = buildPlayedPairs(matchdays);
    const matchCount = buildMatchCount(teams, matchdays);
    const busy = new Set();
    matchdays[activeMatchday].matches.forEach((m) => {
      busy.add(m.teamA);
      busy.add(m.teamB);
    });
    if (matchdays[activeMatchday].resting) busy.add(matchdays[activeMatchday].resting);

    return teams.filter((t) => {
      if (busy.has(t)) return false;
      if ((matchCount[t] || 0) >= TARGET_MATCHES_PER_TEAM) return false;
      // has at least one valid opponent not busy
      const opp = teams.some(
        (o) =>
          o !== t &&
          !busy.has(o) &&
          !playedPairs.has(pairKey(t, o)) &&
          (matchCount[o] || 0) < TARGET_MATCHES_PER_TEAM
      );
      return opp;
    });
  }, [teams, matchdays, activeMatchday]);

  const handleStartDraw = () => {
    if (!selectedTeam) {
      toast.error('Selecciona un equipo primero');
      playError();
      return;
    }
    if (validOpponents.length === 0) {
      toast.error(`${selectedTeam} no tiene rivales disponibles en esta jornada`);
      playError();
      return;
    }
    setDrawState({ selectedTeam, candidates: validOpponents });
  };

  const handlePicked = (opponent) => {
    const md = matchdays[activeMatchday];
    const updated = matchdays.map((m, i) =>
      i === activeMatchday
        ? {
            ...m,
            matches: [
              ...m.matches,
              {
                id: crypto.randomUUID(),
                matchday: m.number,
                teamA: selectedTeam,
                teamB: opponent,
              },
            ],
          }
        : m
    );
    // If matchday now has 10 players but no resting, assign rest
    const newMatches = updated[activeMatchday].matches;
    const playing = new Set();
    newMatches.forEach((m) => {
      playing.add(m.teamA);
      playing.add(m.teamB);
    });
    if (!updated[activeMatchday].resting && newMatches.length === MATCHES_PER_MATCHDAY) {
      const rest = teams.find((t) => !playing.has(t));
      if (rest) {
        updated[activeMatchday] = { ...updated[activeMatchday], resting: rest };
      }
    }
    onUpdate(updated);
    setDrawState(null);
    setSelectedTeam('');
    toast.success(`¡Emparejamiento confirmado: ${selectedTeam} vs ${opponent}!`);
  };

  const handleAutoMatchday = () => {
    const res = generateMatchday(activeMatchday, teams, matchdays);
    if (!res.success) {
      toast.error(res.message);
      playError();
      return;
    }
    onUpdate(res.matchdays);
    playSuccess();
    toast.success(`Jornada ${activeMatchday + 1} generada automáticamente`);
  };

  const handleAutoTournament = () => {
    try {
      const next = generateFullTournament(teams);
      onUpdate(next);
      playSuccess();
      toast.success('¡Torneo completo generado!');
    } catch (e) {
      toast.error(e.message);
      playError();
    }
  };

  const handleReset = () => {
    onUpdate(emptyMatchdays());
    onReset();
    toast.info('Torneo reiniciado');
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  };

  const handleExportImage = async () => {
    toast.info('Generando imagen...');
    await exportElementToImage(exportRef.current, 'torneo-jornadas.png');
    toast.success('Imagen descargada');
  };

  const handleExportPDF = async () => {
    toast.info('Generando PDF...');
    await exportElementToPDF(exportRef.current, 'torneo-jornadas.pdf');
    toast.success('PDF descargado');
  };

  return (
    <div className="min-h-screen w-full">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#050A05]/85 border-b border-[#1A2E1A]">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              data-testid="back-to-teams"
              onClick={onBack}
              className="w-10 h-10 rounded-md flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="label-caps">Tablero de control</p>
              <h2 className="text-lg font-bold tracking-tight text-white">Sorteo de Jornadas</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              data-testid="toggle-sound-button"
              variant="ghost"
              size="icon"
              onClick={handleToggleSound}
              className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10"
              aria-label="Sonido"
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-testid="export-button"
                  variant="outline"
                  className="border-[#1A2E1A] text-white hover:border-emerald-500 hover:text-emerald-400 hover:bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0A120A] border-[#1A2E1A] text-white">
                <DropdownMenuItem
                  data-testid="export-pdf-button"
                  onClick={handleExportPDF}
                  className="focus:bg-emerald-500/10 focus:text-emerald-300 cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid="export-image-button"
                  onClick={handleExportImage}
                  className="focus:bg-emerald-500/10 focus:text-emerald-300 cursor-pointer"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  Exportar imagen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  data-testid="reset-tournament-button"
                  variant="outline"
                  className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reiniciar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0A120A] border-[#1A2E1A] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">¿Reiniciar el torneo?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Se eliminarán todos los partidos generados. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-[#1A2E1A] text-white hover:bg-[#111C11]">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-testid="confirm-reset-button"
                    onClick={handleReset}
                    className="bg-red-500 text-white hover:bg-red-400"
                  >
                    Sí, reiniciar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Draw control + matchday tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Draw Control */}
          <div className="bg-[#0A120A] border border-[#1A2E1A] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <p className="label-caps">Sorteo manual</p>
                <h3 className="text-xl font-bold text-white">Selecciona equipo y rival</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  data-testid="generate-matchday-button"
                  onClick={handleAutoMatchday}
                  variant="outline"
                  className="border-[#1A2E1A] text-white hover:border-emerald-500 hover:text-emerald-400 hover:bg-transparent"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Generar jornada
                </Button>
                <Button
                  data-testid="generate-tournament-button"
                  onClick={handleAutoTournament}
                  className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Torneo completo
                </Button>
              </div>
            </div>

            {/* Matchday selector */}
            <div className="grid grid-cols-6 gap-1.5 mb-5">
              {matchdays.map((md, i) => {
                const active = i === activeMatchday;
                const complete = md.matches.length >= MATCHES_PER_MATCHDAY;
                return (
                  <button
                    key={i}
                    data-testid={`matchday-tab-${i + 1}`}
                    onClick={() => setActiveMatchday(i)}
                    className={`relative py-2 rounded-md text-xs font-['Outfit'] font-bold tracking-tight transition-all border ${
                      active
                        ? 'bg-emerald-500 text-black border-emerald-500'
                        : complete
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60'
                          : 'bg-transparent text-gray-400 border-[#1A2E1A] hover:border-emerald-500/40'
                    }`}
                  >
                    J{i + 1}
                    {complete && !active && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {!drawState && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger
                    data-testid="team-select-trigger"
                    className="bg-[#050A05] border-[#1A2E1A] text-white h-12 focus:ring-emerald-500"
                  >
                    <SelectValue placeholder="Elige un equipo para sortear..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A120A] border-[#1A2E1A] text-white">
                    {teamsAvailableForSelection.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Sin equipos disponibles</div>
                    ) : (
                      teamsAvailableForSelection.map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                          className="focus:bg-emerald-500/10 focus:text-emerald-300"
                        >
                          {t}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  data-testid="start-roulette-button"
                  onClick={handleStartDraw}
                  disabled={!selectedTeam}
                  className="h-12 px-6 bg-emerald-500 text-black hover:bg-emerald-400 font-bold disabled:opacity-40"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Sortear rival
                </Button>
              </div>
            )}

            {selectedTeam && validOpponents.length === 0 && !drawState && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  {selectedTeam} no tiene rivales válidos para esta jornada. Selecciona otro equipo o ve a otra jornada.
                </span>
              </div>
            )}

            <AnimatePresence>
              {drawState && (
                <motion.div
                  key="roulette"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 overflow-hidden"
                >
                  <Roulette
                    selectedTeam={drawState.selectedTeam}
                    candidates={drawState.candidates}
                    onPicked={handlePicked}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Matchday tables */}
          <div ref={exportRef} className="bg-[#050A05] p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <p className="label-caps">Calendario · {TOTAL_MATCHDAYS} jornadas</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchdays.map((md, i) => (
                <MatchdayTable key={md.number} matchday={md} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-[100px]">
            <StatsPanel teams={teams} matchdays={matchdays} />
          </div>
        </div>
      </div>
    </div>
  );
};
