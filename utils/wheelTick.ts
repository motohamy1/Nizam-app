import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

/**
 * Plays the mechanical "watch crown" tick used by the planner month wheel.
 * A tiny round-robin pool of preloaded players lets rapid wheel drags
 * re-trigger the click without seeking-glitches on a single player.
 */
const POOL_SIZE = 4;
let pool: AudioPlayer[] | null = null;
let next = 0;

function getPool(): AudioPlayer[] | null {
  if (pool) return pool;
  try {
    pool = Array.from({ length: POOL_SIZE }, () => {
      const p = createAudioPlayer(require('../assets/sounds/wheel_tick.wav'));
      p.volume = 0.5;
      return p;
    });
  } catch {
    pool = null;
  }
  return pool;
}

export function playWheelTick(): void {
  try {
    const players = getPool();
    if (!players) return;
    const p = players[next % POOL_SIZE];
    next++;
    p.seekTo(0).then(() => p.play()).catch(() => {});
  } catch {
    // Sound is a nice-to-have; never break the interaction.
  }
}
