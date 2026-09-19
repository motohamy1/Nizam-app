import sharp from 'sharp';

const SRC = 'assets/images/icon.jpg';
const OUT = 'assets/images';

const circleMask = Buffer.from(
  '<svg width="680" height="680"><circle cx="340" cy="340" r="340" fill="white"/></svg>'
);

const meta = await sharp(SRC).metadata();
console.log('source:', meta.width, 'x', meta.height, meta.format);

// 1. App icon / favicon / splash source: full-bleed 1024x1024 PNG
await sharp(SRC).resize(1024, 1024, { fit: 'cover' }).png().toFile(`${OUT}/nizam.png`);

// 2. Android adaptive icon foreground: dark canvas, circular badge inside the 66dp safe zone
const badge = await sharp(SRC)
  .resize(680, 680, { fit: 'cover' })
  .composite([{ input: circleMask, blend: 'dest-in' }])
  .extend({ top: 172, bottom: 172, left: 172, right: 172, background: 'transparent' })
  .png()
  .toBuffer();

await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: '#0E0F14' },
})
  .composite([{ input: badge, gravity: 'centre' }])
  .png()
  .toFile(`${OUT}/adaptive-icon.png`);

// 3. Monochrome (themed icon): white silhouette, luminance -> alpha
const gray = await sharp(SRC)
  .resize(680, 680, { fit: 'cover' })
  .grayscale()
  .linear(1.6, -40)
  .raw()
  .toBuffer({ resolveWithObject: true });

const rgba = Buffer.alloc(gray.info.width * gray.info.height * 4);
for (let p = 0; p < gray.info.width * gray.info.height; p++) {
  rgba[p * 4] = 255;
  rgba[p * 4 + 1] = 255;
  rgba[p * 4 + 2] = 255;
  rgba[p * 4 + 3] = gray.data[p * gray.info.channels];
}

await sharp(rgba, { raw: { width: gray.info.width, height: gray.info.height, channels: 4 } })
  .composite([{ input: circleMask, blend: 'dest-in' }])
  .extend({ top: 172, bottom: 172, left: 172, right: 172, background: 'transparent' })
  .png()
  .toFile(`${OUT}/adaptive-icon-monochrome.png`);

console.log('done');
