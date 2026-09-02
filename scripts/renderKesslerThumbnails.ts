import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const episodeId = 'HSL_EPISODE_010_KESSLER_SYNDROME';

const imgFace = path.resolve('C:/Users/brend/AntigravityProfiles/work/.gemini/antigravity/brain/14e79f94-0e0b-404d-91a3-2af54a39b9ab/thumb_kessler_face_1788214513342.jpg');
const imgSplit = path.resolve('C:/Users/brend/AntigravityProfiles/work/.gemini/antigravity/brain/14e79f94-0e0b-404d-91a3-2af54a39b9ab/thumb_kessler_split_1788214530229.jpg');
const imgHero = path.resolve('C:/Users/brend/AntigravityProfiles/work/.gemini/antigravity/brain/14e79f94-0e0b-404d-91a3-2af54a39b9ab/thumb_kessler_hero_1788214551635.jpg');

const runThumbsDir = path.resolve(root, 'runs', episodeId, 'thumbnails');
const deliveryThumbsDir = path.resolve(root, 'deliveries', episodeId, 'thumbnails');
fs.mkdirSync(runThumbsDir, { recursive: true });
fs.mkdirSync(deliveryThumbsDir, { recursive: true });

function renderVariantA(): string {
  const base64 = fs.readFileSync(imgFace).toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <!-- Dark Gradient for Left-Side Typography Contrast -->
    <linearGradient id="textShadowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#030407" stop-opacity="0.92"/>
      <stop offset="45%" stop-color="#030407" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="#030407" stop-opacity="0.25"/>
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

  <!-- 2. Dramatic Chiaroscuro Overlay for Extreme Text Readability -->
  <rect width="1920" height="1080" fill="url(#textShadowGrad)"/>

  <!-- 3. Corner Precision Reticles -->
  <text x="50" y="60" class="mono" font-size="28" fill="#FFE500" opacity="0.8">+</text>
  <text x="1870" y="60" class="mono" font-size="28" fill="#FFE500" opacity="0.8" text-anchor="end">+</text>
  <text x="50" y="1030" class="mono" font-size="28" fill="#FFE500" opacity="0.8">+</text>
  <text x="1870" y="1030" class="mono" font-size="28" fill="#FFE500" opacity="0.8" text-anchor="end">+</text>

  <!-- 4. Category / Warning Badge -->
  <g transform="translate(100 130)" filter="url(#heavyShadow)">
    <rect width="560" height="52" rx="6" fill="#0A0C14" stroke="#FF2E00" stroke-width="2.5"/>
    <rect x="0" y="0" width="12" height="52" fill="#FF2E00"/>
    <text x="32" y="34" class="badge" font-size="22" fill="#FF2E00">ORBITAL COLLISION // 1CM DEBRIS</text>
  </g>

  <!-- 5. Giant Impact Headline -->
  <g filter="url(#heavyShadow)">
    <text x="95" y="340" class="heavy" font-size="140" fill="#FFFFFF" letter-spacing="-2px">28,000 KM/H</text>
    <text x="95" y="490" class="heavy" font-size="140" fill="#FFE500" letter-spacing="-2px">DEBRIS STRIKE</text>
  </g>

  <!-- 6. Critical Telemetry Hud Pill -->
  <g transform="translate(100 580)" filter="url(#heavyShadow)">
    <rect width="700" height="74" rx="8" fill="#0A0D18" stroke="#00D8FF" stroke-width="2"/>
    <circle cx="36" cy="37" r="10" fill="#00D8FF" filter="url(#neonGlow)"/>
    <text x="64" y="45" class="mono" font-size="24" fill="#00D8FF">550 KM LEO // 35,000 TRACKED OBJECTS</text>
  </g>

  <!-- 7. Optical Attention Pointer to Collision Warning (Right Side) -->
  <g transform="translate(1180 780)" filter="url(#heavyShadow)">
    <rect width="360" height="46" rx="4" fill="#140808" stroke="#FF2E00" stroke-width="2"/>
    <text x="25" y="30" class="mono" font-size="20" fill="#FF2E00">IMPACT TRAJECTORY</text>
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
    <!-- Top & Bottom Gradient for Typography -->
    <linearGradient id="topBottomVignette" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#030407" stop-opacity="0.92"/>
      <stop offset="28%" stop-color="#030407" stop-opacity="0.60"/>
      <stop offset="50%" stop-color="#030407" stop-opacity="0.10"/>
      <stop offset="72%" stop-color="#030407" stop-opacity="0.60"/>
      <stop offset="100%" stop-color="#030407" stop-opacity="0.94"/>
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

  <!-- 2. Top & Bottom Cinematic Vignette -->
  <rect width="1920" height="1080" fill="url(#topBottomVignette)"/>

  <!-- 3. Corner Precision Reticles -->
  <text x="50" y="60" class="mono" font-size="28" fill="#00D8FF" opacity="0.8">+</text>
  <text x="1870" y="60" class="mono" font-size="28" fill="#FF2E00" opacity="0.8" text-anchor="end">+</text>
  <text x="50" y="1030" class="mono" font-size="28" fill="#00D8FF" opacity="0.8">+</text>
  <text x="1870" y="1030" class="mono" font-size="28" fill="#FF2E00" opacity="0.8" text-anchor="end">+</text>

  <!-- 4. Left vs Right Status Badges -->
  <g transform="translate(100 120)" filter="url(#heavyShadow)">
    <rect width="400" height="48" rx="6" fill="#061220" stroke="#00D8FF" stroke-width="2.5"/>
    <text x="25" y="32" class="badge" font-size="20" fill="#00D8FF">ORBIT: 10,000 SATELLITES</text>
  </g>
  <g transform="translate(1420 120)" filter="url(#heavyShadow)">
    <rect width="400" height="48" rx="6" fill="#200606" stroke="#FF2E00" stroke-width="2.5"/>
    <text x="25" y="32" class="badge" font-size="20" fill="#FF2E00">KESSLER CASCADE // 72H</text>
  </g>

  <!-- 5. Giant Impact Headline Centered -->
  <g filter="url(#heavyShadow)">
    <text x="960" y="240" class="heavy" font-size="140" fill="#FFFFFF" text-anchor="middle" letter-spacing="-2px">10,000 SATELLITES</text>
    <text x="960" y="370" class="heavy" font-size="140" fill="#FF2E00" text-anchor="middle" letter-spacing="-2px">CASCADE COLLAPSE</text>
  </g>

  <!-- 6. Bottom Telemetry Dual Status -->
  <g transform="translate(100 920)" filter="url(#heavyShadow)">
    <rect width="800" height="74" rx="8" fill="#080C14" stroke="#00D8FF" stroke-width="2"/>
    <text x="30" y="46" class="mono" font-size="24" fill="#00D8FF">NORMAL: 550 KM MEGA-CONSTELLATION</text>
  </g>
  <g transform="translate(1020 920)" filter="url(#heavyShadow)">
    <rect width="800" height="74" rx="8" fill="#140808" stroke="#FF2E00" stroke-width="2"/>
    <text x="30" y="46" class="mono" font-size="24" fill="#FF2E00">COLLAPSE: 11.7 KM/S IMPACT OBLITERATION</text>
  </g>

  <!-- 7. HSL Channel Bug -->
  <g transform="translate(960 1035)" filter="url(#heavyShadow)">
    <text x="0" y="0" class="mono" font-size="20" fill="#F4F4F0" opacity="0.8" text-anchor="middle">HIDDEN SYSTEMS LAB // EPISODE 010</text>
  </g>
</svg>`;
}

function renderVariantC(): string {
  const base64 = fs.readFileSync(imgHero).toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <!-- Left Chiaroscuro Gradient for Hero Object Typography -->
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

  <!-- 2. Dramatic Chiaroscuro Overlay for Typography Readability -->
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
    <text x="32" y="34" class="badge" font-size="22" fill="#FFE500">DEFENSE BOTTLENECK // WHIPPLE SHIELD</text>
  </g>

  <!-- 5. Giant Impact Headline -->
  <g filter="url(#heavyShadow)">
    <text x="95" y="340" class="heavy" font-size="145" fill="#FFFFFF" letter-spacing="-2px">ONE SHIELD</text>
    <text x="95" y="490" class="heavy" font-size="145" fill="#FFE500" letter-spacing="-2px">11.3 KM/S</text>
  </g>

  <!-- 6. Whipple Shield Telemetry Hud Pill -->
  <g transform="translate(100 580)" filter="url(#heavyShadow)">
    <rect width="720" height="74" rx="8" fill="#0A0D18" stroke="#00D8FF" stroke-width="2"/>
    <circle cx="36" cy="37" r="10" fill="#00D8FF" filter="url(#neonGlow)"/>
    <text x="64" y="45" class="mono" font-size="24" fill="#00D8FF">1.27MM SACRIFICIAL BUMPER // 120 GPA SHOCK</text>
  </g>

  <!-- 7. Optical Precision Target Reticle on Impact Crater (Right Side) -->
  <g transform="translate(1100 520)" filter="url(#heavyShadow)">
    <circle cx="0" cy="0" r="120" fill="none" stroke="#FFE500" stroke-width="2.5" stroke-dasharray="14,10"/>
    <circle cx="0" cy="0" r="30" fill="none" stroke="#00D8FF" stroke-width="2"/>
    <circle cx="0" cy="0" r="6" fill="#FF2E00"/>
    <line x1="-150" y1="0" x2="-40" y2="0" stroke="#FFE500" stroke-width="2"/>
    <line x1="40" y1="0" x2="150" y2="0" stroke="#FFE500" stroke-width="2"/>
    <line x1="0" y1="-150" x2="0" y2="-40" stroke="#FFE500" stroke-width="2"/>
    <line x1="0" y1="40" x2="0" y2="150" stroke="#FFE500" stroke-width="2"/>
    <text x="140" y="-30" class="mono" font-size="20" fill="#FFE500">50 KILOJOULES</text>
  </g>

  <!-- 8. HSL Channel Bug -->
  <g transform="translate(1820 1025)" filter="url(#heavyShadow)">
    <text x="0" y="0" class="mono" font-size="22" fill="#F4F4F0" opacity="0.8" text-anchor="end">HIDDEN SYSTEMS LAB // 4K</text>
  </g>
</svg>`;
}

async function renderAll() {
  console.log('Rendering 3 Ultra-Photorealistic 4K Thumbnails via Resvg...');

  const thumbs = [
    { name: 'thumbnail_variant_A_face.png', svg: renderVariantA() },
    { name: 'thumbnail_variant_B_split.png', svg: renderVariantB() },
    { name: 'thumbnail_variant_C_object.png', svg: renderVariantC() }
  ];

  for (const t of thumbs) {
    const resvg = new Resvg(t.svg, {
      fitTo: { mode: 'width', value: 3840 }, // Render directly at 4K UHD (3840x2160)
      font: { loadSystemFonts: true }
    });
    const png = resvg.render().asPng();
    const runPath = path.join(runThumbsDir, t.name);
    const deliveryPath = path.join(deliveryThumbsDir, t.name);
    fs.writeFileSync(runPath, png);
    fs.writeFileSync(deliveryPath, png);
    console.log(`✅ Exported 4K Thumbnail: ${runPath} (${(png.length / 1024 / 1024).toFixed(2)} MB)`);
  }
}

renderAll().catch(err => {
  console.error('Error rendering thumbnails:', err);
  process.exit(1);
});
