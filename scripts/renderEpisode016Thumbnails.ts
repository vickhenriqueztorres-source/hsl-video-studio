import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const episodeId = 'HSL_EPISODE_016';

const imgFace = path.resolve('C:/Users/brend/AntigravityProfiles/work/.gemini/antigravity/brain/75ff6459-bcd2-4274-8ba5-5411e1358472/thumbnail_variant_a_1789049445614.jpg');
const imgSplit = path.resolve('C:/Users/brend/AntigravityProfiles/work/.gemini/antigravity/brain/75ff6459-bcd2-4274-8ba5-5411e1358472/thumbnail_variant_b_1789049468372.jpg');
const imgHero = path.resolve('C:/Users/brend/AntigravityProfiles/work/.gemini/antigravity/brain/75ff6459-bcd2-4274-8ba5-5411e1358472/thumbnail_variant_c_1789049498532.jpg');

const runThumbsDir = path.resolve(root, 'runs', episodeId, 'thumbnails');
const deliveryThumbsDir = path.resolve(root, 'deliveries', episodeId, 'thumbnails');
fs.mkdirSync(runThumbsDir, { recursive: true });
fs.mkdirSync(deliveryThumbsDir, { recursive: true });

function renderVariantA(): string {
  const base64 = fs.readFileSync(imgFace).toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="textShadowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#030407" stop-opacity="0.94"/>
      <stop offset="48%" stop-color="#030407" stop-opacity="0.75"/>
      <stop offset="72%" stop-color="#030407" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#030407" stop-opacity="0.0"/>
    </linearGradient>
    <filter id="heavyShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.95"/>
    </filter>
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <style>
      .heavy { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; letter-spacing: 2px; }
      .badge { font-family: Consolas, 'Courier New', monospace; font-weight: 800; letter-spacing: 3px; }
    </style>
  </defs>

  <!-- 1. Photographic 35mm Background Image -->
  <image href="data:image/jpeg;base64,${base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>

  <!-- 2. Dramatic Chiaroscuro Overlay -->
  <rect width="1920" height="1080" fill="url(#textShadowGrad)"/>

  <!-- 3. Corner Precision Reticles -->
  <text x="50" y="60" class="mono" font-size="28" fill="#FFE500" opacity="0.8">+</text>
  <text x="1870" y="60" class="mono" font-size="28" fill="#FFE500" opacity="0.8" text-anchor="end">+</text>
  <text x="50" y="1030" class="mono" font-size="28" fill="#FFE500" opacity="0.8">+</text>
  <text x="1870" y="1030" class="mono" font-size="28" fill="#FFE500" opacity="0.8" text-anchor="end">+</text>

  <!-- 4. Category / Warning Badge -->
  <g transform="translate(100 130)" filter="url(#heavyShadow)">
    <rect width="560" height="52" rx="6" fill="#0A0C14" stroke="#FFE500" stroke-width="2.5"/>
    <rect x="0" y="0" width="12" height="52" fill="#FFE500"/>
    <text x="32" y="34" class="badge" font-size="22" fill="#FFE500">SYSTEM BOTTLENECK // 150 PSI</text>
  </g>

  <!-- 5. Giant Impact Headline -->
  <g filter="url(#heavyShadow)">
    <text x="95" y="340" class="heavy" font-size="145" fill="#FFFFFF" letter-spacing="-2px">NO FUEL?</text>
    <text x="95" y="490" class="heavy" font-size="145" fill="#FFE500" letter-spacing="-2px">150 PSI MAIN</text>
  </g>

  <!-- 6. Critical Telemetry Hud Pill -->
  <g transform="translate(100 580)" filter="url(#heavyShadow)">
    <rect width="700" height="74" rx="8" fill="#0A0D18" stroke="#00D8FF" stroke-width="2"/>
    <circle cx="36" cy="37" r="10" fill="#00D8FF" filter="url(#neonGlow)"/>
    <text x="64" y="45" class="mono" font-size="24" fill="#00D8FF">52M GALLONS // ZERO TRUCKS // JET A-1</text>
  </g>

  <!-- 7. Optical Attention Pointer to Schematic -->
  <g transform="translate(1180 780)" filter="url(#heavyShadow)">
    <rect width="320" height="46" rx="4" fill="#140808" stroke="#FF2E00" stroke-width="2"/>
    <text x="25" y="30" class="mono" font-size="20" fill="#FF2E00">CRITICAL FAILURE POINT</text>
    <line x1="0" y1="23" x2="-60" y2="23" stroke="#FF2E00" stroke-width="3" stroke-dasharray="6,4"/>
  </g>

  <!-- 8. HSL Channel Bug -->
  <g transform="translate(1820 1025)" filter="url(#heavyShadow)">
    <text x="0" y="0" class="mono" font-size="22" fill="#F4F4F0" opacity="0.8" text-anchor="end">HIDDEN SYSTEMS LAB // 4K</text>
  </g>
</svg>`;
}

function renderVariantB(): string {
  const base64 = fs.readFileSync(imgSplit).toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="topBottomVignette" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#030407" stop-opacity="0.90"/>
      <stop offset="28%" stop-color="#030407" stop-opacity="0.60"/>
      <stop offset="60%" stop-color="#030407" stop-opacity="0.0"/>
      <stop offset="78%" stop-color="#030407" stop-opacity="0.70"/>
      <stop offset="100%" stop-color="#030407" stop-opacity="0.95"/>
    </linearGradient>
    <filter id="heavyShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.95"/>
    </filter>
    <style>
      .heavy { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; letter-spacing: 2px; }
      .badge { font-family: Consolas, 'Courier New', monospace; font-weight: 800; letter-spacing: 3px; }
    </style>
  </defs>

  <!-- 1. Photographic 35mm Background Image -->
  <image href="data:image/jpeg;base64,${base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>

  <!-- 2. Dramatic Vignette Overlay -->
  <rect width="1920" height="1080" fill="url(#topBottomVignette)"/>

  <!-- 3. Corner Precision Reticles -->
  <text x="50" y="60" class="mono" font-size="28" fill="#00D8FF" opacity="0.8">+</text>
  <text x="1870" y="60" class="mono" font-size="28" fill="#FF2E00" opacity="0.8" text-anchor="end">+</text>
  <text x="50" y="1030" class="mono" font-size="28" fill="#00D8FF" opacity="0.8">+</text>
  <text x="1870" y="1030" class="mono" font-size="28" fill="#FF2E00" opacity="0.8" text-anchor="end">+</text>

  <!-- 4. Left vs Right Status Badges -->
  <g transform="translate(100 120)" filter="url(#heavyShadow)">
    <rect width="360" height="48" rx="6" fill="#061220" stroke="#00D8FF" stroke-width="2.5"/>
    <text x="25" y="32" class="badge" font-size="20" fill="#00D8FF">TAKEOFF: 1,200 GPM</text>
  </g>
  <g transform="translate(1460 120)" filter="url(#heavyShadow)">
    <rect width="360" height="48" rx="6" fill="#200606" stroke="#FF2E00" stroke-width="2.5"/>
    <text x="25" y="32" class="badge" font-size="20" fill="#FF2E00">GROUNDED: 0 PSI</text>
  </g>

  <!-- 5. Giant Impact Headline Centered -->
  <g filter="url(#heavyShadow)">
    <text x="960" y="240" class="heavy" font-size="140" fill="#FFFFFF" text-anchor="middle" letter-spacing="-2px">100,000 FLIGHTS</text>
    <text x="960" y="370" class="heavy" font-size="140" fill="#FFE500" text-anchor="middle" letter-spacing="-2px">PARALYZED IN 60s</text>
  </g>

  <!-- 6. Bottom Telemetry Dual Status -->
  <g transform="translate(100 920)" filter="url(#heavyShadow)">
    <rect width="800" height="74" rx="8" fill="#080C14" stroke="#00D8FF" stroke-width="2"/>
    <text x="30" y="46" class="mono" font-size="24" fill="#00D8FF">NORMAL: 52M GALLONS JET A-1 // 150 PSI</text>
  </g>
  <g transform="translate(1020 920)" filter="url(#heavyShadow)">
    <rect width="800" height="74" rx="8" fill="#140808" stroke="#FF2E00" stroke-width="2"/>
    <text x="30" y="46" class="mono" font-size="24" fill="#FF2E00">COLLAPSE: MANIFOLD PRESSURE VALVE FAILS</text>
  </g>

  <!-- 7. HSL Channel Bug -->
  <g transform="translate(960 1035)" filter="url(#heavyShadow)">
    <text x="0" y="0" class="mono" font-size="20" fill="#F4F4F0" opacity="0.8" text-anchor="middle">HIDDEN SYSTEMS LAB // EPISODE 016</text>
  </g>
</svg>`;
}

function renderVariantC(): string {
  const base64 = fs.readFileSync(imgHero).toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="textShadowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#030407" stop-opacity="0.95"/>
      <stop offset="42%" stop-color="#030407" stop-opacity="0.80"/>
      <stop offset="68%" stop-color="#030407" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#030407" stop-opacity="0.0"/>
    </linearGradient>
    <filter id="heavyShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.95"/>
    </filter>
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <style>
      .heavy { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; letter-spacing: 2px; }
      .badge { font-family: Consolas, 'Courier New', monospace; font-weight: 800; letter-spacing: 3px; }
    </style>
  </defs>

  <!-- 1. Photographic 35mm Background Image -->
  <image href="data:image/jpeg;base64,${base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>

  <!-- 2. Dramatic Chiaroscuro Overlay -->
  <rect width="1920" height="1080" fill="url(#textShadowGrad)"/>

  <!-- 3. Corner Precision Reticles -->
  <text x="50" y="60" class="mono" font-size="28" fill="#FFE500" opacity="0.8">+</text>
  <text x="1870" y="60" class="mono" font-size="28" fill="#FFE500" opacity="0.8" text-anchor="end">+</text>
  <text x="50" y="1030" class="mono" font-size="28" fill="#FFE500" opacity="0.8">+</text>
  <text x="1870" y="1030" class="mono" font-size="28" fill="#FFE500" opacity="0.8" text-anchor="end">+</text>

  <!-- 4. Category Badge -->
  <g transform="translate(100 130)" filter="url(#heavyShadow)">
    <rect width="560" height="52" rx="6" fill="#0A0C14" stroke="#FFE500" stroke-width="2.5"/>
    <rect x="0" y="0" width="12" height="52" fill="#FFE500"/>
    <text x="32" y="34" class="badge" font-size="22" fill="#FFE500">SINGLE POINT OF FAILURE</text>
  </g>

  <!-- 5. Giant Impact Headline -->
  <g filter="url(#heavyShadow)">
    <text x="95" y="340" class="heavy" font-size="145" fill="#FFFFFF" letter-spacing="-2px">ONE VALVE</text>
    <text x="95" y="490" class="heavy" font-size="145" fill="#FFE500" letter-spacing="-2px">100,000 FLIGHTS</text>
  </g>

  <!-- 6. Micro-Channel Telemetry Hud Pill -->
  <g transform="translate(100 580)" filter="url(#heavyShadow)">
    <rect width="720" height="74" rx="8" fill="#0A0D18" stroke="#00D8FF" stroke-width="2"/>
    <circle cx="36" cy="37" r="10" fill="#00D8FF" filter="url(#neonGlow)"/>
    <text x="64" y="45" class="mono" font-size="24" fill="#00D8FF">150 PSI HYDRANT MANIFOLD // JET A-1 GRID</text>
  </g>

  <!-- 7. Optical Precision Target Reticle on Pressure Gauge -->
  <g transform="translate(960 420)" filter="url(#heavyShadow)">
    <circle cx="0" cy="0" r="140" fill="none" stroke="#FFE500" stroke-width="2.5" stroke-dasharray="14,10"/>
    <circle cx="0" cy="0" r="35" fill="none" stroke="#00D8FF" stroke-width="2"/>
    <circle cx="0" cy="0" r="8" fill="#FF2E00"/>
    <line x1="-180" y1="0" x2="-50" y2="0" stroke="#FFE500" stroke-width="2"/>
    <line x1="50" y1="0" x2="180" y2="0" stroke="#FFE500" stroke-width="2"/>
    <line x1="0" y1="-180" x2="0" y2="-50" stroke="#FFE500" stroke-width="2"/>
    <line x1="0" y1="50" x2="0" y2="180" stroke="#FFE500" stroke-width="2"/>
    <text x="160" y="-30" class="mono" font-size="22" fill="#FFE500">150 PSI ACTIVE</text>
  </g>

  <!-- 8. HSL Channel Bug -->
  <g transform="translate(1820 1025)" filter="url(#heavyShadow)">
    <text x="0" y="0" class="mono" font-size="22" fill="#F4F4F0" opacity="0.8" text-anchor="end">HIDDEN SYSTEMS LAB // 4K</text>
  </g>
</svg>`;
}

function renderAndSave(svg: string, filename: string) {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1920 },
    font: { loadSystemFonts: true }
  }).render().asPng();

  const p1 = path.join(runThumbsDir, filename);
  const p2 = path.join(deliveryThumbsDir, filename);
  fs.writeFileSync(p1, png);
  fs.writeFileSync(p2, png);
  console.log(`✅ Thumbnail renderizada: ${p2} (${png.length} bytes)`);
}

console.log('🚀 Renderizando thumbnails fotorrealistas para HSL_EPISODE_016...');
renderAndSave(renderVariantA(), 'thumbnail_variant_A_face.png');
renderAndSave(renderVariantB(), 'thumbnail_variant_B_split.png');
renderAndSave(renderVariantC(), 'thumbnail_variant_C_object.png');
console.log('🎉 Todas as 3 thumbnails fotorrealistas foram atualizadas com sucesso!');