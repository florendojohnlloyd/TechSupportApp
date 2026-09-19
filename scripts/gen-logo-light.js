// Generates a light variant of the ES PRINT logo for dark backgrounds:
// keeps red "ES" and transparency, recolors dark "PRINT" pixels to white.
const sharp = require('sharp');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const src = path.join(assetsDir, 'brand-logo.png');
const out = path.join(assetsDir, 'brand-logo-light.png');

async function gen() {
  const img = sharp(src).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // channels === 4 (RGBA)

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a === 0) continue; // keep transparent
    // Red pixels: high R, low G/B -> keep as-is
    const isRed = r > 120 && g < 110 && b < 110;
    if (isRed) continue;
    // Dark/near-black pixels (the "PRINT" text) -> recolor to white, keep alpha
    const isDark = r < 90 && g < 90 && b < 90;
    if (isDark) {
      data[i] = 248; data[i + 1] = 250; data[i + 2] = 252; // #F8FAFC
    }
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(out);
  console.log('✓ brand-logo-light.png generated at', out);
}

gen().catch(e => { console.error(e); process.exit(1); });
