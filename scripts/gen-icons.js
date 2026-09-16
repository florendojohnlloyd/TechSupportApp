const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const svgPath = path.join(assetsDir, 'icon.svg');
const svg = fs.readFileSync(svgPath);

async function gen() {
  // Main icon 1024x1024
  await sharp(svg).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ icon.png');

  // Adaptive icon (foreground) 1024x1024
  await sharp(svg).resize(1024, 1024).png().toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png');

  // Splash icon 1024x1024 (transparent-ish center used by expo splash)
  await sharp(svg).resize(1024, 1024).png().toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('✓ splash-icon.png');

  // Favicon 48x48
  await sharp(svg).resize(48, 48).png().toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ favicon.png');

  console.log('All icons generated.');
}

gen().catch(e => { console.error(e); process.exit(1); });
