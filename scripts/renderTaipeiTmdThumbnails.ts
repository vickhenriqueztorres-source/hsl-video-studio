import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const episodeId = 'HSL_EPISODE_012_TAIPEI_TMD';
const runThumbDir = path.resolve(root, 'runs', episodeId, 'thumbnails');
const deliveryThumbDir = path.resolve(root, 'deliveries', episodeId, 'thumbnails');
fs.mkdirSync(runThumbDir, { recursive: true });
fs.mkdirSync(deliveryThumbDir, { recursive: true });

const act1Base64 = fs.readFileSync(path.resolve(root, 'public/images/taipei101_tmd/act1.jpg')).toString('base64');
const act2Base64 = fs.readFileSync(path.resolve(root, 'public/images/taipei101_tmd/act2.jpg')).toString('base64');
const act3Base64 = fs.readFileSync(path.resolve(root, 'public/images/taipei101_tmd/act3.jpg')).toString('base64');

// -----------------------------------------------------------------------------
// VARIANTE A: THE HERO SCALE // 660 TONS TO DAMPEN
// -----------------------------------------------------------------------------
const renderVariantA = (): Buffer => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="vignetteA" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#05070C" stop-opacity="0.96"/>
      <stop offset="35%" stop-color="#05070C" stop-opacity="0.82"/>
      <stop offset="65%" stop-color="#05070C" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#05070C" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="shadowA" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.98"/>
    </filter>
    <style>
      .impact { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 800; }
    </style>
  </defs>

  <image href="data:image/jpeg;base64,${act1Base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1920" height="1080" fill="url(#vignetteA)"/>

  <text x="40" y="55" class="mono" font-size="28" fill="#FFE500">+</text>
  <text x="1880" y="55" class="mono" font-size="28" fill="#FFE500" text-anchor="end">+</text>
  <text x="40" y="1045" class="mono" font-size="28" fill="#FFE500">+</text>
  <text x="1880" y="1045" class="mono" font-size="28" fill="#FFE500" text-anchor="end">+</text>

  <g transform="translate(80 180)">
    <rect width="580" height="48" rx="6" fill="#0A0D16" stroke="#FFE500" stroke-width="2.5"/>
    <circle cx="28" cy="24" r="7" fill="#FFE500"/>
    <text x="48" y="32" class="mono" font-size="22" fill="#FFE500" letter-spacing="2">660 TONS // TUNED MASS DAMPER</text>
  </g>

  <g transform="translate(80 410)">
    <rect x="-16" y="-140" width="760" height="155" rx="8" fill="#07090F" opacity="0.85"/>
    <text x="10" y="-20" class="impact" font-size="160" fill="#FFFFFF" letter-spacing="-2" filter="url(#shadowA)">660 TONS</text>
  </g>
  <g transform="translate(80 580)">
    <rect x="-16" y="-140" width="760" height="155" rx="8" fill="#07090F" opacity="0.85"/>
    <text x="10" y="-20" class="impact" font-size="160" fill="#FFE500" letter-spacing="-2" filter="url(#shadowA)">TO DAMPEN</text>
  </g>

  <g transform="translate(80 730)">
    <rect width="680" height="64" rx="6" fill="#0A0D16" stroke="#2B3245" stroke-width="2"/>
    <text x="24" y="40" class="mono" font-size="22" fill="#00D8FF" letter-spacing="1">TAIPEI 101 // 508M // 250 KM/H TYPHOON</text>
  </g>

  <text x="1840" y="1040" class="mono" font-size="22" fill="#FFFFFF" text-anchor="end" opacity="0.7">HIDDEN SYSTEMS LAB // 4K</text>
</svg>`;

  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 1920 },
    font: { loadSystemFonts: true }
  }).render().asPng();
};

// -----------------------------------------------------------------------------
// VARIANTE B: SPLIT SCREEN (TOWER SWAY vs DAMPER INERTIA)
// -----------------------------------------------------------------------------
const renderVariantB = (): Buffer => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <clipPath id="leftHalf"><rect x="0" y="0" width="960" height="1080"/></clipPath>
    <clipPath id="rightHalf"><rect x="960" y="0" width="960" height="1080"/></clipPath>
    <linearGradient id="splitVignette" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#05070C" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="#05070C" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#05070C" stop-opacity="0.92"/>
    </linearGradient>
    <filter id="shadowB" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.98"/>
    </filter>
    <style>
      .impact { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 800; }
    </style>
  </defs>

  <g clip-path="url(#leftHalf)">
    <image href="data:image/jpeg;base64,${act1Base64}" x="-240" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>
    <rect x="0" y="0" width="960" height="1080" fill="url(#splitVignette)"/>
  </g>

  <g clip-path="url(#rightHalf)">
    <image href="data:image/jpeg;base64,${act3Base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>
    <rect x="960" y="0" width="960" height="1080" fill="url(#splitVignette)"/>
  </g>

  <line x1="960" y1="0" x2="960" y2="1080" stroke="#FFE500" stroke-width="8"/>
  <circle cx="960" cy="540" r="28" fill="#05070C" stroke="#FFE500" stroke-width="5"/>
  <text x="960" y="548" class="mono" font-size="24" fill="#FFE500" text-anchor="middle">VS</text>

  <g transform="translate(80 120)">
    <rect width="400" height="44" rx="4" fill="#0A0D16" stroke="#00D8FF" stroke-width="2"/>
    <text x="20" y="28" class="mono" font-size="20" fill="#00D8FF" letter-spacing="1">TOWER SWAY // +1.5 METERS</text>
  </g>

  <g transform="translate(1440 120)">
    <rect width="400" height="44" rx="4" fill="#0A0D16" stroke="#FF2E00" stroke-width="2"/>
    <text x="20" y="28" class="mono" font-size="20" fill="#FF2E00" letter-spacing="1">DAMPER LAG // -1.5 METERS</text>
  </g>

  <g transform="translate(960 760)" filter="url(#shadowB)">
    <rect x="-440" y="-120" width="880" height="140" rx="8" fill="#07090F" opacity="0.90"/>
    <text x="0" y="-15" class="impact" font-size="130" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">1.5M SWAY</text>
  </g>
  <g transform="translate(960 900)" filter="url(#shadowB)">
    <rect x="-440" y="-120" width="880" height="140" rx="8" fill="#07090F" opacity="0.90"/>
    <text x="0" y="-15" class="impact" font-size="130" fill="#FFE500" text-anchor="middle" letter-spacing="-1">ANTI-PHASE</text>
  </g>

  <g transform="translate(960 990)">
    <rect x="-320" y="0" width="640" height="48" rx="6" fill="#0A0D16" stroke="#2B3245" stroke-width="1.5"/>
    <text x="0" y="32" class="mono" font-size="20" fill="#00D8FF" text-anchor="middle" letter-spacing="1">90° PHASE OPPOSITION // -42% SWAY REDUCTION</text>
  </g>
</svg>`;

  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 1920 },
    font: { loadSystemFonts: true }
  }).render().asPng();
};

// -----------------------------------------------------------------------------
// VARIANTE C: CRISIS HERO // 8 CABLES RETICLE TARGET
// -----------------------------------------------------------------------------
const renderVariantC = (): Buffer => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="vignetteC" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="#05070C" stop-opacity="0.1"/>
      <stop offset="55%" stop-color="#05070C" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#05070C" stop-opacity="0.96"/>
    </radialGradient>
    <filter id="shadowC" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.98"/>
    </filter>
    <style>
      .impact { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 800; }
    </style>
  </defs>

  <image href="data:image/jpeg;base64,${act2Base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1920" height="1080" fill="url(#vignetteC)"/>

  <!-- Target Reticle on Cable Coupling -->
  <g transform="translate(1080 480)">
    <circle cx="0" cy="0" r="140" fill="none" stroke="#FF2E00" stroke-width="4" stroke-dasharray="16 10"/>
    <circle cx="0" cy="0" r="100" fill="none" stroke="#FF2E00" stroke-width="2"/>
    <line x1="-160" y1="0" x2="-110" y2="0" stroke="#FF2E00" stroke-width="3"/>
    <line x1="110" y1="0" x2="160" y2="0" stroke="#FF2E00" stroke-width="3"/>
    <line x1="0" y1="-160" x2="0" y2="-110" stroke="#FF2E00" stroke-width="3"/>
    <line x1="0" y1="110" x2="0" y2="160" stroke="#FF2E00" stroke-width="3"/>
    <rect x="130" y="-25" width="280" height="50" rx="4" fill="#0A0D16" stroke="#FF2E00" stroke-width="2"/>
    <text x="145" y="6" class="mono" font-size="18" fill="#FF2E00" letter-spacing="1">LOCK: 42MM BRAIDED ROPE</text>
    <text x="145" y="24" class="mono" font-size="14" fill="#FFE500">TENSILE: 6.5 MN CAPACITY</text>
  </g>

  <g transform="translate(80 180)">
    <rect width="560" height="48" rx="6" fill="#0A0D16" stroke="#FF2E00" stroke-width="2.5"/>
    <circle cx="28" cy="24" r="7" fill="#FF2E00"/>
    <text x="48" y="32" class="mono" font-size="22" fill="#FF2E00" letter-spacing="2">8 CABLES // 4X SAFETY FACTOR</text>
  </g>

  <g transform="translate(80 410)">
    <rect x="-16" y="-140" width="760" height="155" rx="8" fill="#07090F" opacity="0.85"/>
    <text x="10" y="-20" class="impact" font-size="160" fill="#FFFFFF" letter-spacing="-2" filter="url(#shadowC)">8 CABLES</text>
  </g>
  <g transform="translate(80 580)">
    <rect x="-16" y="-140" width="760" height="155" rx="8" fill="#07090F" opacity="0.85"/>
    <text x="10" y="-20" class="impact" font-size="160" fill="#FF2E00" letter-spacing="-2" filter="url(#shadowC)">660 TONS</text>
  </g>

  <g transform="translate(80 730)">
    <rect width="680" height="64" rx="6" fill="#0A0D16" stroke="#2B3245" stroke-width="2"/>
    <text x="24" y="40" class="mono" font-size="22" fill="#00D8FF" letter-spacing="1">CRITICAL SHEAR JOINT // FLOOR 92</text>
  </g>

  <text x="1840" y="1040" class="mono" font-size="22" fill="#FFFFFF" text-anchor="end" opacity="0.7">HIDDEN SYSTEMS LAB // 4K</text>
</svg>`;

  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 1920 },
    font: { loadSystemFonts: true }
  }).render().asPng();
};

export function renderAllTaipeiTmdThumbnails() {
  console.log('[TaipeiTmdThumbnails] Renderizando 3 Thumbnails 4K de alta qualidade...');
  
  const thumbA = renderVariantA();
  const thumbB = renderVariantB();
  const thumbC = renderVariantC();

  fs.writeFileSync(path.join(runThumbDir, 'thumbnail_variant_A_face.png'), thumbA);
  fs.writeFileSync(path.join(runThumbDir, 'thumbnail_variant_B_split.png'), thumbB);
  fs.writeFileSync(path.join(runThumbDir, 'thumbnail_variant_C_object.png'), thumbC);

  fs.writeFileSync(path.join(deliveryThumbDir, 'thumbnail_variant_A_face.png'), thumbA);
  fs.writeFileSync(path.join(deliveryThumbDir, 'thumbnail_variant_B_split.png'), thumbB);
  fs.writeFileSync(path.join(deliveryThumbDir, 'thumbnail_variant_C_object.png'), thumbC);

  console.log('✅ [TaipeiTmdThumbnails] 3x Thumbnails 4K geradas e sincronizadas com sucesso.');
}

if (require.main === module) {
  renderAllTaipeiTmdThumbnails();
}
