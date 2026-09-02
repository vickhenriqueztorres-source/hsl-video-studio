import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const episodeId = 'HSL_EPISODE_011_MEGASHIP_HYDRODYNAMICS';
const runThumbDir = path.resolve(root, 'runs', episodeId, 'thumbnails');
const deliveryThumbDir = path.resolve(root, 'deliveries', episodeId, 'thumbnails');
fs.mkdirSync(runThumbDir, { recursive: true });
fs.mkdirSync(deliveryThumbDir, { recursive: true });

const act1Base64 = fs.readFileSync(path.resolve(root, 'public/images/megaship/act1.jpg')).toString('base64');
const act5Base64 = fs.readFileSync(path.resolve(root, 'public/images/megaship/act5.jpg')).toString('base64');
const act6Base64 = fs.readFileSync(path.resolve(root, 'public/images/megaship/act6.jpg')).toString('base64');

// -----------------------------------------------------------------------------
// VARIANTE A: THE HERO SCALE // 5 KM TO BRAKE
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
    <rect width="560" height="48" rx="6" fill="#0A0D16" stroke="#FFE500" stroke-width="2.5"/>
    <circle cx="28" cy="24" r="7" fill="#FFE500"/>
    <text x="48" y="32" class="mono" font-size="22" fill="#FFE500" letter-spacing="2">240,000 TONS // HYDRODYNAMIC INERTIA</text>
  </g>

  <g transform="translate(80 410)">
    <rect x="-16" y="-140" width="760" height="155" rx="8" fill="#07090F" opacity="0.85"/>
    <text x="10" y="-20" class="impact" font-size="160" fill="#FFFFFF" letter-spacing="-2" filter="url(#shadowA)">5 KM</text>
  </g>
  <g transform="translate(80 580)">
    <rect x="-16" y="-140" width="760" height="155" rx="8" fill="#07090F" opacity="0.85"/>
    <text x="10" y="-20" class="impact" font-size="160" fill="#FFE500" letter-spacing="-2" filter="url(#shadowA)">TO BRAKE</text>
  </g>

  <g transform="translate(80 730)">
    <rect width="680" height="64" rx="6" fill="#0A0D16" stroke="#2B3245" stroke-width="2"/>
    <text x="24" y="40" class="mono" font-size="22" fill="#00D8FF" letter-spacing="1">STOPPING DISTANCE: 5,200M // 14:00 MIN</text>
  </g>

  <text x="1840" y="1040" class="mono" font-size="22" fill="#FFFFFF" text-anchor="end" opacity="0.7">HIDDEN SYSTEMS LAB // 4K</text>
</svg>`;

  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 1920 },
    font: { loadSystemFonts: true }
  }).render().asPng();
};

// -----------------------------------------------------------------------------
// VARIANTE B: SPLIT SCREEN (OPEN SEA vs SUEZ LOCK)
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
    <g transform="translate(50 50)">
      <rect width="360" height="48" rx="6" fill="rgba(7,9,14,0.92)" stroke="#00E5FF" stroke-width="2"/>
      <text x="20" y="32" class="mono" font-size="20" fill="#00E5FF">OPEN OCEAN // 22 KNOTS</text>
    </g>
  </g>

  <g clip-path="url(#rightHalf)">
    <image href="data:image/jpeg;base64,${act5Base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>
    <rect x="960" y="0" width="960" height="1080" fill="url(#splitVignette)"/>
    <g transform="translate(1420 50)">
      <rect width="450" height="48" rx="6" fill="rgba(255,46,0,0.95)"/>
      <text x="24" y="32" class="mono" font-size="20" fill="#FFFFFF">SUEZ FAIRWAY // 8-SEC LOCK</text>
    </g>
  </g>

  <line x1="960" y1="0" x2="960" y2="1080" stroke="#FFFFFF" stroke-width="6"/>
  <line x1="960" y1="0" x2="960" y2="1080" stroke="#FF2E00" stroke-width="16" opacity="0.5"/>

  <g transform="translate(960 690)">
    <rect x="-260" y="-120" width="520" height="46" rx="6" fill="#07090F" stroke="#FF2E00" stroke-width="2"/>
    <text x="0" y="-90" class="mono" font-size="22" fill="#FF2E00" text-anchor="middle">BERNOULLI SQUAT EFFECT</text>

    <rect x="-560" y="-60" width="1120" height="135" rx="8" fill="#07090F" opacity="0.90"/>
    <text x="0" y="45" class="impact" font-size="130" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1" filter="url(#shadowB)">1.2M CLEARANCE</text>

    <rect x="-420" y="85" width="840" height="135" rx="8" fill="#07090F" opacity="0.90"/>
    <text x="0" y="190" class="impact" font-size="130" fill="#FF2E00" text-anchor="middle" letter-spacing="-1" filter="url(#shadowB)">SUEZ LOCK</text>
  </g>
</svg>`;

  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 1920 },
    font: { loadSystemFonts: true }
  }).render().asPng();
};

// -----------------------------------------------------------------------------
// VARIANTE C: BANK SUCTION // 14 OCEAN TUGS
// -----------------------------------------------------------------------------
const renderVariantC = (): Buffer => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="vignetteC" cx="60%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#05070C" stop-opacity="0.1"/>
      <stop offset="55%" stop-color="#05070C" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#05070C" stop-opacity="0.95"/>
    </radialGradient>
    <filter id="shadowC" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.98"/>
    </filter>
    <style>
      .impact { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 800; }
    </style>
  </defs>

  <image href="data:image/jpeg;base64,${act6Base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1920" height="1080" fill="url(#vignetteC)"/>

  <g transform="translate(1380 460)">
    <circle cx="0" cy="0" r="190" fill="none" stroke="#FF2E00" stroke-width="3" stroke-dasharray="16 8"/>
    <circle cx="0" cy="0" r="120" fill="none" stroke="#FFE500" stroke-width="2"/>
    <line x1="-220" y1="0" x2="220" y2="0" stroke="#FF2E00" stroke-width="2" opacity="0.6"/>
    <line x1="0" y1="-220" x2="0" y2="220" stroke="#FF2E00" stroke-width="2" opacity="0.6"/>
    <rect x="-180" y="130" width="360" height="38" rx="4" fill="#FF2E00"/>
    <text x="0" y="156" class="mono" font-size="18" fill="#FFFFFF" text-anchor="middle">LOCK: 2,500T BOLLARD PULL</text>
  </g>

  <g transform="translate(80 80)">
    <rect width="480" height="46" rx="6" fill="rgba(7,9,14,0.92)" stroke="#FFE500" stroke-width="2"/>
    <text x="24" y="30" class="mono" font-size="20" fill="#FFE500">HIDDEN SYSTEMS LAB // EPISODE 011</text>
  </g>

  <g transform="translate(80 500)">
    <rect x="0" y="-28" width="460" height="42" rx="4" fill="#0A0D16" stroke="#FFE500" stroke-width="2"/>
    <text x="18" y="0" class="mono" font-size="20" fill="#FFE500">14 SALVAGE TUGS // $9.6B DAILY</text>
  </g>
  <g transform="translate(80 660)">
    <rect x="-16" y="-135" width="580" height="150" rx="8" fill="#07090F" opacity="0.90"/>
    <text x="10" y="-18" class="impact" font-size="155" fill="#FFFFFF" letter-spacing="-2" filter="url(#shadowC)">BANK</text>
  </g>
  <g transform="translate(80 820)">
    <rect x="-16" y="-135" width="680" height="150" rx="8" fill="#07090F" opacity="0.90"/>
    <text x="10" y="-18" class="impact" font-size="155" fill="#FF2E00" letter-spacing="-2" filter="url(#shadowC)">SUCTION</text>
  </g>

  <g transform="translate(80 940)">
    <rect width="640" height="54" rx="4" fill="#0A0D16" stroke="#2B3245" stroke-width="2"/>
    <text x="20" y="35" class="mono" font-size="20" fill="#00D8FF">SINGLE POINT OF FAILURE // 300M CHOKEPOINT</text>
  </g>
</svg>`;

  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 1920 },
    font: { loadSystemFonts: true }
  }).render().asPng();
};

console.log('🎨 Renderizando Variant A...');
const pngA = renderVariantA();
fs.writeFileSync(path.join(runThumbDir, 'thumbnail_variant_A_face.png'), pngA);
fs.writeFileSync(path.join(deliveryThumbDir, 'thumbnail_variant_A_face.png'), pngA);

console.log('🎨 Renderizando Variant B...');
const pngB = renderVariantB();
fs.writeFileSync(path.join(runThumbDir, 'thumbnail_variant_B_split.png'), pngB);
fs.writeFileSync(path.join(deliveryThumbDir, 'thumbnail_variant_B_split.png'), pngB);

console.log('🎨 Renderizando Variant C...');
const pngC = renderVariantC();
fs.writeFileSync(path.join(runThumbDir, 'thumbnail_variant_C_object.png'), pngC);
fs.writeFileSync(path.join(deliveryThumbDir, 'thumbnail_variant_C_object.png'), pngC);

console.log('✅ TODAS AS 3 THUMBNAILS 4K RENDERIZADAS COM SUCESSO!');
