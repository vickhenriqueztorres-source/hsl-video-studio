import fs from 'fs';
import { spawnSync } from 'child_process';

const testSvg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0D0E15"/>
  <circle cx="960" cy="540" r="200" fill="#FFE500"/>
  <text x="960" y="550" fill="#0D0E15" font-size="48" font-family="monospace" text-anchor="middle" font-weight="bold">TEST SVG TO PNG</text>
</svg>`;

fs.writeFileSync('temp_test.svg', testSvg, 'utf8');
const res = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', 'temp_test.svg', 'temp_test.png'], {encoding: 'utf8'});
console.log('FFmpeg exit status:', res.status);
console.log('PNG created:', fs.existsSync('temp_test.png'), 'Size:', fs.existsSync('temp_test.png') ? fs.statSync('temp_test.png').size : 0);

if (fs.existsSync('temp_test.svg')) fs.unlinkSync('temp_test.svg');
if (fs.existsSync('temp_test.png')) fs.unlinkSync('temp_test.png');
