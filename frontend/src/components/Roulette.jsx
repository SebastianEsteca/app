import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target } from 'lucide-react';
import { playTick, playReveal, playSuccess } from '../utils/sounds';

const ITEM_HEIGHT = 64;
const VISIBLE = 5;
const HIGHLIGHT_OFFSET = 2; // middle visible row index

/**
 * Roulette animation. The displayed winner ALWAYS matches `onPicked`.
 * Fix: highlight band sits at visible index 2; we align so the final
 *      candidate at `pickedIndex` lands exactly under the band.
 */
export const Roulette = ({ selectedTeam, candidates, onPicked }) => {
  const [phase, setPhase] = useState('spinning');
  const [pickedIndex] = useState(() => Math.floor(Math.random() * candidates.length));
  const [step, setStep] = useState(0);
  const reelRef = useRef(null);

  const cycles = 6;
  // We want reel[finalStep + HIGHLIGHT_OFFSET] === candidates[pickedIndex]
  // reel is repeats of candidates → reel[i] = candidates[i % len]
  // So we need (finalStep + HIGHLIGHT_OFFSET) % len === pickedIndex
  // Hence finalStep = cycles * len + (pickedIndex - HIGHLIGHT_OFFSET + len) % len + offset
  // Simpler: pick a large base, then add the modular adjustment.
  const len = candidates.length;
  const baseSteps = cycles * len;
  const modAdjust = (pickedIndex - HIGHLIGHT_OFFSET + len) % len;
  const totalSteps = baseSteps + modAdjust;

  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    let timeoutId = null;
    let s = 0;

    const tickInterval = (cur) => {
      const t = cur / totalSteps;
      const eased = Math.pow(t, 2.6);
      return 32 + eased * 240;
    };

    const advance = () => {
      s += 1;
      setStep(s);
      playTick();
      if (s >= totalSteps) {
        playReveal();
        setTimeout(() => {
          setPhase('revealed');
          playSuccess();
          setTimeout(() => onPicked(candidates[pickedIndex]), 900);
        }, 320);
        return;
      }
      timeoutId = setTimeout(advance, tickInterval(s));
    };

    const startId = setTimeout(advance, 220);
    return () => {
      clearTimeout(startId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [candidates, onPicked, pickedIndex, totalSteps]);

  if (!candidates || candidates.length === 0) return null;

  // Build a long reel so we never run out of items
  const reel = [];
  const repeat = cycles + 4;
  for (let i = 0; i < repeat; i++) reel.push(...candidates);
  // Pad a few extra for the visible window after the winner
  for (let i = 0; i < VISIBLE; i++) reel.push(...candidates);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#0A0E1F] border border-orange-500/30 rounded-xl p-5 glow-border-primary"
      data-testid="roulette-container"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-400 pulse-ring" />
          <p className="label-caps">Sorteando rival para</p>
        </div>
        <p className="font-['Outfit'] font-bold text-orange-400 truncate">{selectedTeam}</p>
      </div>

      <div
        className="relative overflow-hidden rounded-lg bg-[#121830] border border-[#2A3458]"
        style={{ height: `${ITEM_HEIGHT * VISIBLE}px` }}
      >
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none border-y-2 border-orange-500/70 bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-orange-500/10"
          style={{ top: `${ITEM_HEIGHT * HIGHLIGHT_OFFSET}px`, height: `${ITEM_HEIGHT}px` }}
        />
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#121830] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#121830] to-transparent z-10 pointer-events-none" />

        <div
          ref={reelRef}
          className="will-change-transform"
          style={{
            transform: `translateY(-${step * ITEM_HEIGHT}px)`,
            transition: phase === 'revealed' ? 'transform 0.45s cubic-bezier(0.18, 0.85, 0.20, 1)' : 'none',
          }}
        >
          {reel.map((name, i) => {
            const isWinner = phase === 'revealed' && i === step + HIGHLIGHT_OFFSET;
            return (
              <div
                key={i}
                className={`roulette-item border-b border-[#2A3458]/60 ${
                  isWinner ? 'text-orange-300 font-black scale-105' : 'text-gray-400'
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center justify-center gap-2 text-yellow-300"
          data-testid="roulette-result"
        >
          <Sparkles className="w-5 h-5" />
          <p className="font-['Outfit'] font-bold text-lg">
            ¡{selectedTeam} <span className="text-gray-400 text-sm font-medium">vs</span> {candidates[pickedIndex]}!
          </p>
          <Sparkles className="w-5 h-5" />
        </motion.div>
      )}
    </motion.div>
  );
};
