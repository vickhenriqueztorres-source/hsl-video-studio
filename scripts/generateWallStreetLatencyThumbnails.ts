import fs from 'fs';
import path from 'path';
import {Resvg} from '@resvg/resvg-js';

const episodeId = 'HSL_EPISODE_008_WALL_STREET_LATENCY';
const root = process.cwd();
const outDir = path.resolve(root, 'runs', episodeId, 'thumbnails');

const esc = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const readImageData = (relativePath: string): string =>
  fs.readFileSync(path.resolve(root, relativePath)).toString('base64');

const renderThumbnail = (
  fileName: string,
  baseImagePath: string,
  lines: readonly string[],
  badge: string,
  accentColor: string
): void => {
  const imageData = readImageData(baseImagePath);
  const titleText = lines.map((line, index) => {
    const fontSize = line.length > 8 ? 118 : 168;
    const y = 805 + index * 150;
    const color = index === 0 ? '#F4F4F0' : accentColor;
    return `<text x="84" y="${y}" class="sans" font-size="${fontSize}" fill="${color}" filter="url(#shadow)">${esc(line)}</text>`;
  }).join('\n');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <filter id="shadow">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#000" flood-opacity="0.85"/>
    </filter>
    <linearGradient id="fade" x1="0" x2="1">
      <stop offset="0" stop-color="#020309" stop-opacity="0.98"/>
      <stop offset="0.48" stop-color="#020309" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#020309" stop-opacity="0.78"/>
    </linearGradient>
    <style>
      .sans { font-family: Inter, Arial Black, Arial, sans-serif; font-weight: 900; }
      .mono { font-family: Consolas, Courier New, monospace; font-weight: 800; }
    </style>
  </defs>
  <image href="data:image/png;base64,${imageData}" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1920" height="1080" fill="url(#fade)"/>
  <rect x="0" y="0" width="1920" height="150" fill="#020309" opacity="0.72"/>
  <rect x="0" y="600" width="1920" height="480" fill="#020309" opacity="0.70"/>
  <rect x="78" y="64" width="18" height="18" fill="${accentColor}"/>
  <text x="114" y="82" class="mono" font-size="34" fill="#F4F4F0" letter-spacing="4">HIDDEN SYSTEMS LAB // EPISODE 004</text>
  <text x="92" y="690" class="mono" font-size="34" fill="${accentColor}">${esc(badge)}</text>
  ${titleText}
  <line x1="1120" y1="520" x2="1810" y2="328" stroke="${accentColor}" stroke-width="13" opacity="0.85"/>
  <circle cx="1120" cy="520" r="24" fill="${accentColor}"/>
  <text x="1160" y="586" class="mono" font-size="31" fill="#F4F4F0">MICROWAVE // FIBER // MATCHING ENGINE</text>
</svg>`;

  const png = new Resvg(svg, {
    fitTo: {mode: 'width', value: 1920},
    font: {loadSystemFonts: true}
  }).render().asPng();

  fs.mkdirSync(outDir, {recursive: true});
  fs.writeFileSync(path.join(outDir, fileName), png);
};

renderThumbnail(
  'thumbnail_variant_A_face.png',
  `public/runs/${episodeId}/frames/SCENE_001.png`,
  ['3 MS', 'QUEUE WINS'],
  'CHICAGO-NJ // PRICE-TIME PRIORITY',
  '#FFE500'
);

renderThumbnail(
  'thumbnail_variant_B_split.png',
  `public/runs/${episodeId}/frames/SCENE_016.png`,
  ['FIBER', 'VS AIR'],
  'C / 1.5 GLASS VS C / 1.0003 AIR',
  '#0038FF'
);

renderThumbnail(
  'thumbnail_variant_C_object.png',
  'public/images/wall-street-latency/microwave-tower-hero.png',
  ['3', 'MILLISECONDS'],
  'MICROWAVE TOWER LINE OF SIGHT',
  '#FFE500'
);

console.log(JSON.stringify(
  fs.readdirSync(outDir)
    .filter((file) => file.endsWith('.png'))
    .map((file) => ({file, size: fs.statSync(path.join(outDir, file)).size})),
  null,
  2
));
