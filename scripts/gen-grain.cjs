// Generates assets/images/grain.png — a seamless-tileable, granulated film
// grain: fine per-pixel noise, thousands of discrete 1-2px silver grains,
// and a scattering of developed clumps, mostly bright with a few dark
// pits for depth. Encoded as an 8-bit grayscale+alpha PNG (small file).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 512;

// Deterministic PRNG (mulberry32)
let s = 0x9e3779b9;
const rnd = () => {
  s |= 0; s = (s + 0x6D2B79F5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Luminance + alpha buffers
const lum = new Float64Array(SIZE * SIZE);
const alp = new Float64Array(SIZE * SIZE);

const put = (x, y, L, A) => {
  // wrap for seamless tiling
  x = ((x % SIZE) + SIZE) % SIZE;
  y = ((y % SIZE) + SIZE) % SIZE;
  const i = y * SIZE + x;
  // alpha-weighted luminance blend (max coverage wins softly)
  if (A > alp[i]) {
    alp[i] = A;
    lum[i] = L;
  }
};

// 1. Fine per-pixel sensor noise — subtle, low alpha
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    if (rnd() < 0.28) {
      const a = 6 + rnd() * 16;
      const L = rnd() < 0.5 ? 235 + rnd() * 20 : 15 + rnd() * 25;
      put(x, y, L, a);
    }
  }
}

// 2. Discrete silver grains — the main granulation
const GRAINS = 7200;
for (let g = 0; g < GRAINS; g++) {
  const cx = Math.floor(rnd() * SIZE);
  const cy = Math.floor(rnd() * SIZE);
  const big = rnd();
  const r = big < 0.72 ? 0.5 : big < 0.96 ? 1.1 : 1.6; // radius px
  const dark = rnd() < 0.12;
  const L = dark ? 8 + rnd() * 22 : 225 + rnd() * 30;
  const A0 = dark ? 70 + rnd() * 90 : 90 + rnd() * 130;
  const ri = Math.ceil(r);
  for (let dy = -ri; dy <= ri; dy++) {
    for (let dx = -ri; dx <= ri; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r + 0.35) continue;
      const falloff = 1 - d / (r + 0.6);
      const a = A0 * Math.max(falloff, 0.15) * (0.75 + rnd() * 0.35);
      put(cx + dx, cy + dy, L, Math.min(255, a));
    }
  }
}

// 3. Developed clumps — a few bunched grains for an organic, non-uniform field
const CLUMPS = 260;
for (let c = 0; c < CLUMPS; c++) {
  const cx = Math.floor(rnd() * SIZE);
  const cy = Math.floor(rnd() * SIZE);
  const n = 3 + Math.floor(rnd() * 5);
  for (let k = 0; k < n; k++) {
    const dx = Math.round((rnd() - 0.5) * 5);
    const dy = Math.round((rnd() - 0.5) * 5);
    const L = 230 + rnd() * 25;
    put(cx + dx, cy + dy, L, 120 + rnd() * 115);
  }
}

// ---- Encode PNG (grayscale + alpha, colorType 4, bitDepth 8) ----
const raw = Buffer.alloc(SIZE * (SIZE * 3 + 1));
let o = 0;
for (let y = 0; y < SIZE; y++) {
  raw[o++] = 0; // filter: none
  for (let x = 0; x < SIZE; x++) {
    const i = y * SIZE + x;
    raw[o++] = Math.round(lum[i]);
    raw[o++] = Math.round(alp[i]);
  }
}

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 4;  // color type: grayscale + alpha
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = path.join(__dirname, '..', 'assets', 'images', 'grain.png');
fs.writeFileSync(out, png);
console.log('wrote', out, (png.length / 1024).toFixed(1) + ' KB', SIZE + 'x' + SIZE);
