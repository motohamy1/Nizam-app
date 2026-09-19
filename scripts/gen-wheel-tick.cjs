// Generates assets/sounds/wheel_tick.wav — a short mechanical "watch crown" tick:
// a sharp noise transient + two high damped resonances, ~55 ms total.
const fs = require('fs');
const path = require('path');

const SR = 44100;
const DUR = 0.055;
const N = Math.floor(SR * DUR);
const samples = new Float64Array(N);

// Deterministic pseudo-random for the noise transient
let seed = 1337;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return (seed / 4294967296) * 2 - 1;
};

for (let i = 0; i < N; i++) {
  const t = i / SR;
  // Click transient: noise with very fast decay
  const noise = rand() * Math.exp(-t * 2200) * 0.55;
  // Metallic resonances (like a tiny escapement click)
  const r1 = Math.sin(2 * Math.PI * 2650 * t) * Math.exp(-t * 900) * 0.5;
  const r2 = Math.sin(2 * Math.PI * 4300 * t + 0.6) * Math.exp(-t * 1300) * 0.35;
  // Low body knock for warmth
  const r3 = Math.sin(2 * Math.PI * 720 * t) * Math.exp(-t * 500) * 0.2;
  samples[i] = noise + r1 + r2 + r3;
}

// Normalize to ~0.85 of full scale
let peak = 0;
for (const s of samples) peak = Math.max(peak, Math.abs(s));
const gain = 0.85 / peak;

// Write 16-bit PCM mono WAV
const data = Buffer.alloc(N * 2);
for (let i = 0; i < N; i++) {
  let v = Math.round(samples[i] * gain * 32767);
  v = Math.max(-32768, Math.min(32767, v));
  data.writeInt16LE(v, i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);          // fmt chunk size
header.writeUInt16LE(1, 20);           // PCM
header.writeUInt16LE(1, 22);           // mono
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 2, 28);      // byte rate
header.writeUInt16LE(2, 32);           // block align
header.writeUInt16LE(16, 34);          // bits per sample
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

const out = path.join(__dirname, '..', 'assets', 'sounds', 'wheel_tick.wav');
fs.writeFileSync(out, Buffer.concat([header, data]));
console.log('wrote', out, (44 + data.length) + ' bytes');
