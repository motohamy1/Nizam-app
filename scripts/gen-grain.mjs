import sharp from 'sharp';
import { randomBytes } from 'node:crypto';

const W = 1080;
const H = 2340;
const bytes = randomBytes(W * H);
const rgba = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
  const n = bytes[p] / 255;
  // Punchy speckle: mostly faint, with distinct bright grains
  const a = n > 0.72 ? 40 + n * 200 : n * 46;
  rgba[p * 4] = 255;
  rgba[p * 4 + 1] = 255;
  rgba[p * 4 + 2] = 255;
  rgba[p * 4 + 3] = Math.min(255, Math.floor(a));
}

await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .png()
  .toFile('assets/images/grain.png');

console.log('grain.png written');
