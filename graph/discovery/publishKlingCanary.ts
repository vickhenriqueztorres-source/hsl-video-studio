import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { requireSuccess, spawnTool } from '../lib/proc';

const root = path.resolve(__dirname, '..', '..');
const source = path.join(root, 'runs', 'phase2-discovery', 'kling25-canary', 'runtime',
  'saida', 'HSL_PHASE2_KLING25_CLEAN_PROFILE.mp4');
const destination = path.join(root, 'out', 'test', 'HSL_EPISODE_011-kling25-turbo-canary.mp4');
const receipt = path.join(root, 'runs', 'phase2-discovery', 'kling25-canary', 'ffprobe.json');

async function main(): Promise<void> {
  if (!fs.existsSync(source)) throw new Error(`KLING_CANARY_OUTPUT_MISSING: ${source}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  const probe = requireSuccess(await spawnTool('ffprobe', [
    '-v', 'error', '-show_entries',
    'format=duration,format_name,size:stream=index,codec_type,codec_name,width,height,avg_frame_rate,pix_fmt',
    '-of', 'json', destination,
  ], { cwd: root, logPath: path.join(path.dirname(receipt), 'ffprobe.log') }), 'KLING_CANARY_FFPROBE');
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(destination)).digest('hex');
  const result = { source, destination, sha256, ...JSON.parse(probe.stdout) };
  fs.writeFileSync(receipt, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
