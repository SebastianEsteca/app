import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target } from 'lucide-react';
import { playTick, playReveal, playSuccess } from '../utils/sounds';

const ITEM_HEIGHT = 64;
const VISIBLE = 5;

/**
 * Roulette animation. Receives:
 * - selectedTeam: team for which we're picking an opponent
 * - candidates: list of valid opponents
 * - onPicked(opponent): callback
 */
export const Roulette = ({ selectedTeam, candidates, onPicked }) => {
  const [phase, setPhase] = useState('spinning'); // spinning -> revealed
  const [pickedIndex, setPickedIndex] = useState(0);
  const reelRef = useRef(null);

  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    const finalIdx = Math.floor(Math.random() * candidates.length);
    setPickedIndex(finalIdx);

    // Build expanded reel: many cycles + landing position
    const cycles = 6;
    const totalSteps = cycles * candidates.length + finalIdx;
    let step = 0;
    const startDelay = 200;

    const tickInterval = (s) => {
      // ease-out: longer delays near the end
      const t = s / totalSteps;
      const eased = Math.pow(t, 2.5);
      return 35 + eased * 220;
    };

    let timeoutId = null;
    const advance = () => {
      step += 1;
      playTick();
      if (reelRef.current) {
        reelRef.current.style.transform = `translateY(-${step * ITEM_HEIGHT}px)`;
      }
      if (step >= totalSteps) {
        playReveal();
        setTimeout(() => {
          setPhase('revealed');
          playSuccess();
          setTimeout(() => onPicked(candidates[finalIdx]), 900);
        }, 350);
        return;
      }
      timeoutId = setTimeout(advance, tickInterval(step));
    };

    const startId = setTimeout(advance, startDelay);
    return () => {
      clearTimeout(startId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [candidates, onPicked]);

  if (!candidates || candidates.length === 0) return null;

  // Repeat candidates for endless feel
  const reel = [];
  const repeat = 8;
  for (let i = 0; i < repeat; i++) reel.push(...candidates);

  const totalSteps = 6 * candidates.length + pickedIndex;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#050A05] border border-emerald-500/30 rounded-xl p-6 glow-border"
      data-testid="roulette-container"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400 pulse-ring" />
          <p className="label-caps">Sorteando rival para</p>
        </div>
        <p className="font-['Outfit'] font-bold text-emerald-400">{selectedTeam}</p>
      </div>

      <div
        className="relative overflow-hidden rounded-lg bg-[#0A120A] border border-[#1A2E1A]"
        style={{ height: `${ITEM_HEIGHT * VISIBLE}px` }}
      >
        {/* Highlight band */}
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none border-y-2 border-emerald-500/60 bg-emerald-500/5"
          style={{ top: `${ITEM_HEIGHT * 2}px`, height: `${ITEM_HEIGHT}px` }}
        />
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#0A120A] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0A120A] to-transparent z-10 pointer-events-none" />

        <div
          ref={reelRef}
          className="will-change-transform"
          style={{
            transform: `translateY(0px)`,
            transition: phase === 'revealed' ? 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          }}
        >
          {reel.map((name, i) => {
            const isWinner = phase === 'revealed' && i === totalSteps + 2;
            return (
              <div
                key={i}
                className={`roulette-item border-b border-[#1A2E1A] ${
                  isWinner ? 'text-emerald-300 font-black scale-105' : 'text-gray-400'
                }`}
              >
                {name}
              </div>
            );
          })}
        </div>
      </div>

      {phase === 'revealed' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center justify-center gap-2 text-emerald-300"
          data-testid="roulette-result"
        >
          <Sparkles className="w-5 h-5" />
          <p className="font-['Outfit'] font-bold text-lg">
            ¡{selectedTeam} vs {candidates[pickedIndex]}!
          </p>
          <Sparkles className="w-5 h-5" />
        </motion.div>
      )}
    </motion.div>
  );
};
