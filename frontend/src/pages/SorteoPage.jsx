import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Shuffle, Wand2, RotateCcw, AlertTriangle, Zap, Trophy,
  Volume2, VolumeX, Image as ImageIcon, Upload, Download, FileImage, FileText,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '../components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Roulette } from '../components/Roulette';
import { MatchdayTable } from '../components/MatchdayTable';
import { SummaryPanel } from '../components/SummaryPanel';
import { updateTournament } from '../utils/api';
import { playTick, playSuccess, playError, isSoundEnabled, setSoundEnabled } from '../utils/sounds';
import {
  emptyMatchdays, generateMatchday, generateBalancedTournament, getValidOpponents,
  buildPlayedPairs, buildMatchCount, maxMatchesPerMatchday, pairKey,
} from '../utils/tournamentAlgorithm';
import { exportElementToImage, exportElementToPDF } from '../utils/exporter';

const COLORS = ['#F26321', '#FFC107', '#10B981', '#3B82F6', '#EF4444', '#A855F7', '#EC4899', '#06B6D4', '#F59E0B', '#84CC16'];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export default function SorteoPage() {
  const { id } = useParams();
  const { tournament, refresh } = useOutletContext();
  const navigate = useNavigate();

  // Local working copy
  const [teams, setTeams] = useState([]);
  const [matchdays, setMatchdays] = useState([]);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [logo, setLogo] = useState('');
  const fileRef = useRef(null);

  const [activeMd, setActiveMd] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [drawState, setDrawState] = useState(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const exportRef = useRef(null);

  // Sync from tournament
  useEffect(() => {
    if (!tournament) return;
    setTeams(tournament.teams || []);
    setMatchdays(
      tournament.matchdays && tournament.matchdays.length === tournament.matchdays_count
        ? tournament.matchdays
        : emptyMatchdays(tournament.matchdays_count)
    );
  }, [tournament]);

  // Debounced auto-save. Intentional empty/limited deps:
  // - `tournament` is referenced read-only and may change frequently when the
  //   parent context refreshes; depending on it would trigger redundant saves
  //   (the same teams/matchdays already being persisted).
  // - `updateTournament` is a module import (stable reference).
  // For critical operations we use `saveNow()` below which bypasses debounce.
  useEffect(() => {
    if (!tournament) return;
    const t = setTimeout(() => {
      updateTournament(tournament.id, { teams, matchdays }).catch((err) =>
        console.warn('[SorteoPage] save failed', err)
      );
    }, 250);
    return () => clearTimeout(t);
  }, [teams, matchdays]); // eslint-disable-line react-hooks/exhaustive-deps

  // Immediate save (used for critical operations to avoid debounce races)
  const saveNow = async (nextTeams, nextMatchdays) => {
    if (!tournament) return;
    try {
      await updateTournament(tournament.id, {
        teams: nextTeams ?? teams,
        matchdays: nextMatchdays ?? matchdays,
      });
    } catch {
      toast.error('No se pudo guardar');
    }
  };

  const isFull = (tournament?.teams_count ?? 0) > 0 && teams.length >= (tournament?.teams_count ?? 0);
  const maxPerMd = maxMatchesPerMatchday(tournament?.teams_count ?? 0);

  // ---------- Team ops ----------
  const addTeam = () => {
    const value = name.trim();
    if (!value) {
      toast.error('Ingresa un nombre de equipo');
      return;
    }
    if (teams.length >= tournament.teams_count) {
      toast.error(`Solo se permiten ${tournament.teams_count} equipos`);
      return;
    }
    if (teams.some((t) => t.name.toLowerCase() === value.toLowerCase())) {
      toast.error('Ese equipo ya está en la lista');
      return;
    }
    const newTeam = {
      id: crypto.randomUUID(),
      name: value,
      short_name: shortName.trim() || value.slice(0, 3).toUpperCase(),
      color,
      logo,
    };
    const nextTeams = [...teams, newTeam];
    setTeams(nextTeams);
    saveNow(nextTeams, matchdays);
    setName('');
    setShortName('');
    setLogo('');
    setColor(COLORS[(teams.length + 1) % COLORS.length]);
    playTick();
  };

  const removeTeam = (id) => {
    const t = teams.find((x) => x.id === id);
    const nextTeams = teams.filter((x) => x.id !== id);
    let nextMatchdays = matchdays;
    if (t) {
      nextMatchdays = matchdays.map((md) => ({
        ...md,
        matches: md.matches.filter((m) => m.teamA !== t.name && m.teamB !== t.name),
        resting: md.resting === t.name ? null : md.resting,
      }));
      setMatchdays(nextMatchdays);
    }
    setTeams(nextTeams);
    saveNow(nextTeams, nextMatchdays);
  };

  const handleLogoUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024) {
      toast.error('Logo debe ser menor a 1 MB');
      return;
    }
    const url = await fileToDataUrl(f);
    setLogo(url);
  };

  // ---------- Draw ops ----------
  const matchesPerTeam = tournament?.matches_per_team ?? 0;
  const validOpponents = useMemo(() => {
    if (!selectedTeam || !tournament) return [];
    return getValidOpponents(selectedTeam, activeMd, teams, matchdays, matchesPerTeam);
  }, [selectedTeam, activeMd, teams, matchdays, matchesPerTeam, tournament]);

  const teamsAvailable = useMemo(() => {
    if (!tournament) return [];
    const playedPairs = buildPlayedPairs(matchdays);
    const counts = buildMatchCount(teams, matchdays);
    const md = matchdays[activeMd] || { matches: [], resting: null };
    const busy = new Set();
    md.matches.forEach((m) => { busy.add(m.teamA); busy.add(m.teamB); });
    if (md.resting) busy.add(md.resting);

    return teams.filter((t) => {
      if (busy.has(t.name)) return false;
      if ((counts[t.name] || 0) >= matchesPerTeam) return false;
      return teams.some(
        (o) => o.name !== t.name && !busy.has(o.name)
          && !playedPairs.has(pairKey(t.name, o.name))
          && (counts[o.name] || 0) < matchesPerTeam
      );
    });
  }, [teams, matchdays, activeMd, matchesPerTeam, tournament]);

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Cargando torneo...
      </div>
    );
  }

  const startDraw = () => {
    if (!selectedTeam) { toast.error('Selecciona un equipo'); playError(); return; }
    if (validOpponents.length === 0) {
      toast.error(`${selectedTeam} no tiene rivales válidos`); playError(); return;
    }
    setDrawState({ selectedTeam, candidates: validOpponents });
  };

  const onPicked = (opponent) => {
    const updated = matchdays.map((md, i) =>
      i === activeMd
        ? {
            ...md,
            matches: [
              ...md.matches,
              {
                id: crypto.randomUUID(),
                matchday: md.number,
                teamA: selectedTeam,
                teamB: opponent,
                scoreA: null, scoreB: null, date: '', time: '', status: 'pending',
              },
            ],
          }
        : md
    );
    // Auto-rest if completed and odd
    const newMatches = updated[activeMd].matches;
    const playing = new Set();
    newMatches.forEach((m) => { playing.add(m.teamA); playing.add(m.teamB); });
    if (!updated[activeMd].resting && newMatches.length === maxPerMd && teams.length % 2 === 1) {
      const rest = teams.find((t) => !playing.has(t.name));
      if (rest) updated[activeMd] = { ...updated[activeMd], resting: rest.name };
    }
    setMatchdays(updated);
    saveNow(teams, updated);
    setDrawState(null);
    setSelectedTeam('');
    toast.success(`¡${selectedTeam} vs ${opponent}!`);
  };

  const handleAutoMd = () => {
    if (!isFull) { toast.error('Agrega todos los equipos primero'); playError(); return; }
    const res = generateMatchday(activeMd, teams, matchdays, tournament.matches_per_team, tournament.allow_auto_rest);
    if (!res.success) { toast.error(res.message); playError(); return; }
    setMatchdays(res.matchdays);
    saveNow(teams, res.matchdays);
    playSuccess();
    toast.success(`Jornada ${activeMd + 1} generada`);
  };

  const handleAutoTournament = () => {
    if (!isFull) { toast.error('Agrega todos los equipos primero'); playError(); return; }
    const result = generateBalancedTournament(teams, {
      targetMatches: tournament.matches_per_team,
      initialMatchdays: tournament.matchdays_count,
      maxMatchesPerMatchday: tournament.max_matches_per_matchday || maxMatchesPerMatchday(tournament.teams_count),
      allowDouble: tournament.allow_double_matches,
      allowExtra: tournament.allow_extra_matchdays,
      allowRepeats: tournament.allow_repeated_opponents,
      balance: tournament.balance_level,
    });
    if (result.impossible) {
      toast.error(result.warnings[0] || 'Configuración imposible.');
      playError();
      return;
    }
    setMatchdays(result.matchdays);
    saveNow(teams, result.matchdays);
    playSuccess();
    if (result.extraCount > 0) {
      toast.success(`Torneo generado con ${result.extraCount} jornada(s) extra para equilibrar.`);
    } else {
      toast.success('¡Torneo completo generado!');
    }
    result.warnings.forEach((w) => toast.message(w));
  };

  const handleReset = () => {
    const empty = emptyMatchdays(tournament.matchdays_count);
    setMatchdays(empty);
    saveNow(teams, empty);
    toast.info('Torneo reiniciado');
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  };

  const handleExportImage = async () => {
    toast.info('Generando imagen...');
    await exportElementToImage(exportRef.current, `${tournament.name}-jornadas.png`);
    toast.success('Imagen descargada');
  };
  const handleExportPDF = async () => {
    toast.info('Generando PDF...');
    await exportElementToPDF(exportRef.current, `${tournament.name}-jornadas.pdf`);
    toast.success('PDF descargado');
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[#2A3458] bg-[#0F1428]/70 backdrop-blur-xl sticky top-0 lg:top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {tournament.primary_logo && (
              <img src={tournament.primary_logo} alt="" className="w-11 h-11 object-contain rounded-md bg-white/5 p-1" />
            )}
            <div className="min-w-0">
              <p className="label-caps">Sorteo</p>
              <h2 className="text-lg font-bold text-white truncate">{tournament.name}</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleSound} className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/10" data-testid="toggle-sound-button">
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="export-button" className="border-[#2A3458] text-white hover:border-orange-500 hover:text-orange-300 hover:bg-transparent">
                  <Download className="w-4 h-4 mr-2" />Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#121830] border-[#2A3458] text-white">
                <DropdownMenuItem data-testid="export-pdf-button" onClick={handleExportPDF} className="focus:bg-orange-500/10 focus:text-orange-300 cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="export-image-button" onClick={handleExportImage} className="focus:bg-orange-500/10 focus:text-orange-300 cursor-pointer">
                  <FileImage className="w-4 h-4 mr-2" />Exportar imagen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" data-testid="reset-tournament-button" className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50">
                  <RotateCcw className="w-4 h-4 mr-2" />Reiniciar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#121830] border-[#2A3458] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">¿Reiniciar el torneo?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">Se eliminarán todos los partidos. Esta acción no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-[#2A3458] text-white hover:bg-[#1A2240]">Cancelar</AlertDialogCancel>
                  <AlertDialogAction data-testid="confirm-reset-button" onClick={handleReset} className="bg-red-500 text-white hover:bg-red-400">Sí, reiniciar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* TEAMS ENTRY */}
          {!isFull && (
            <div className="bg-[#121830] border border-[#2A3458] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="label-caps">Equipos</p>
                  <h3 className="text-xl font-bold text-white">Agregar equipos</h3>
                </div>
                <p className="font-['Outfit'] font-black text-orange-400 text-2xl">
                  {teams.length}<span className="text-gray-600">/{tournament.teams_count}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_140px_auto] gap-3 items-end">
                <div>
                  <p className="label-caps mb-1.5">Nombre</p>
                  <Input
                    data-testid="add-team-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                    placeholder="Ej. Halcones FC"
                    className="bg-[#0A0E1F] border-[#2A3458] text-white h-11 focus-visible:ring-orange-500"
                  />
                </div>
                <div>
                  <p className="label-caps mb-1.5">Abreviatura</p>
                  <Input
                    data-testid="add-short-input"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value.slice(0, 4).toUpperCase())}
                    placeholder="HFC"
                    className="bg-[#0A0E1F] border-[#2A3458] text-white h-11 uppercase focus-visible:ring-orange-500"
                  />
                </div>
                <div>
                  <p className="label-caps mb-1.5">Color</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-md transition transform ${color === c ? 'scale-110 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                        style={{ background: c }}
                        aria-label={`color ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={addTeam} data-testid="add-team-button" className="h-11 bg-orange-500 text-white hover:bg-orange-400 font-bold shadow-[0_0_18px_rgba(242,99,33,0.30)]">
                  <Plus className="w-4 h-4 mr-2" />Agregar
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" data-testid="add-team-logo-input" />
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-xs text-gray-400 hover:text-orange-300 transition">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {logo ? 'Logo cargado' : 'Subir logo de equipo (opcional)'}
                </button>
                {logo && (
                  <img src={logo} alt="" className="w-8 h-8 rounded object-cover border border-[#2A3458]" />
                )}
              </div>

              {/* Teams list */}
              {teams.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  <AnimatePresence mode="popLayout">
                    {teams.map((t, idx) => (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative bg-[#0A0E1F] border border-[#2A3458] rounded-md p-2.5 hover:border-orange-500/60 transition"
                        data-testid={`team-card-${idx}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md flex items-center justify-center font-['Outfit'] font-black text-xs text-white shrink-0 overflow-hidden" style={{ background: t.color }}>
                            {t.logo ? <img src={t.logo} alt="" className="w-full h-full object-cover" /> : (t.short_name || t.name.slice(0, 2).toUpperCase())}
                          </div>
                          <span className="text-white text-sm font-semibold truncate flex-1">{t.name}</span>
                        </div>
                        <button
                          data-testid={`remove-team-${idx}`}
                          onClick={() => removeTeam(t.id)}
                          className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                          aria-label="Eliminar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* DRAW CONTROL */}
          {isFull && (
            <div className="bg-[#121830] border border-[#2A3458] rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <p className="label-caps">Sorteo manual</p>
                  <h3 className="text-xl font-bold text-white">Selecciona equipo y rival</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button data-testid="generate-matchday-button" onClick={handleAutoMd} variant="outline" className="border-[#2A3458] text-white hover:border-orange-500 hover:text-orange-300 hover:bg-transparent">
                    <Zap className="w-4 h-4 mr-2" />Generar jornada
                  </Button>
                  <Button data-testid="generate-tournament-button" onClick={handleAutoTournament} className="bg-orange-500 text-white hover:bg-orange-400 font-bold shadow-[0_0_20px_rgba(242,99,33,0.25)]">
                    <Wand2 className="w-4 h-4 mr-2" />Torneo completo
                  </Button>
                </div>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
                {matchdays.map((md, i) => {
                  const complete = md.matches.length >= maxPerMd && maxPerMd > 0;
                  const active = i === activeMd;
                  // Use matchday.number for a stable key (matchdays may grow with extras)
                  const tabKey = `md-${md.number}`;
                  let tabClass = 'bg-transparent text-gray-400 border-[#2A3458] hover:border-orange-500/40';
                  if (active) tabClass = 'bg-orange-500 text-white border-orange-500';
                  else if (complete) tabClass = 'bg-orange-500/10 text-orange-300 border-orange-500/30 hover:border-orange-500/60';
                  return (
                    <button
                      key={tabKey}
                      data-testid={`matchday-tab-${i + 1}`}
                      onClick={() => setActiveMd(i)}
                      className={`shrink-0 py-2 px-3.5 rounded-md text-xs font-['Outfit'] font-bold tracking-tight transition-all border ${tabClass}`}
                    >
                      J{i + 1}
                      {complete && !active && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-orange-400 align-middle" />}
                    </button>
                  );
                })}
              </div>

              {!drawState && (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger data-testid="team-select-trigger" className="bg-[#0A0E1F] border-[#2A3458] text-white h-12 focus:ring-orange-500">
                      <SelectValue placeholder="Elige un equipo para sortear..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121830] border-[#2A3458] text-white">
                      {teamsAvailable.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Sin equipos disponibles</div>
                      ) : teamsAvailable.map((t) => (
                        <SelectItem key={t.id} value={t.name} className="focus:bg-orange-500/10 focus:text-orange-300">{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button data-testid="start-roulette-button" onClick={startDraw} disabled={!selectedTeam} className="h-12 px-6 bg-orange-500 text-white hover:bg-orange-400 font-bold disabled:opacity-40">
                    <Shuffle className="w-4 h-4 mr-2" />Sortear rival
                  </Button>
                </div>
              )}

              {selectedTeam && validOpponents.length === 0 && !drawState && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{selectedTeam} no tiene rivales válidos para esta jornada.</span>
                </div>
              )}

              <AnimatePresence>
                {drawState && (
                  <motion.div
                    key="roul" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-5 overflow-hidden"
                  >
                    <Roulette selectedTeam={drawState.selectedTeam} candidates={drawState.candidates} onPicked={onPicked} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* MATCHDAY TABLES */}
          {isFull && (
            <div ref={exportRef} className="bg-[#0A0E1F] p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Trophy className="w-4 h-4 text-orange-400" />
                <p className="label-caps">Calendario · {matchdays.length} jornadas{matchdays.filter((m) => m.is_extra).length > 0 ? ` (${matchdays.filter((m) => m.is_extra).length} extra)` : ''}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchdays.map((md, i) => {
                  const extraIndex = md.is_extra
                    ? matchdays.slice(0, i + 1).filter((m) => m.is_extra).length
                    : 0;
                  return (
                    <MatchdayTable
                      key={md.number}
                      matchday={md}
                      index={i}
                      totalTeams={tournament.teams_count}
                      extraIndex={extraIndex}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick links + Summary */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-[100px] space-y-3">
            {isFull && (
              <SummaryPanel teams={teams} matchdays={matchdays} targetMatches={tournament.matches_per_team} />
            )}
            <QuickLink onClick={() => navigate(`/t/${id}/jornadas`)} title="Jornadas y partidos" desc="Ver y editar el calendario" />
            <QuickLink onClick={() => navigate(`/t/${id}/tabla`)} title="Tabla general" desc="Posiciones y clasificación" />
            <QuickLink onClick={() => navigate(`/t/${id}/eliminacion`)} title="Eliminación directa" desc="Bracket de finales" />
            <div className="bg-[#121830] border border-[#2A3458] rounded-xl p-5">
              <p className="label-caps mb-3">Resumen rápido</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex justify-between"><span className="text-gray-500">Equipos</span><span>{teams.length}/{tournament.teams_count}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Jornadas</span><span>{matchdays.length}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Clasifican</span><span>{tournament.qualifiers_count}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Partidos/equipo</span><span>{tournament.matches_per_team}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const QuickLink = ({ onClick, title, desc }) => (
  <button
    onClick={onClick}
    className="w-full text-left bg-[#121830] border border-[#2A3458] rounded-xl p-4 hover:border-orange-500/50 hover:bg-[#1A2240] transition group"
  >
    <p className="text-white font-['Outfit'] font-bold group-hover:text-orange-300 transition">{title}</p>
    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
  </button>
);
