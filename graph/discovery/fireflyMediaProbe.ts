import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from '../checkpointer';
import { requireSuccess, spawnTool } from '../lib/proc';

const agentRoot = process.env.HSL_FIREFLY_AGENT_DIR;
if (!agentRoot) throw new Error('HSL_FIREFLY_AGENT_DIR_REQUIRED');

async function main(): Promise<void> {
  const output = path.join(REPO_ROOT, 'runs', 'phase2-discovery', 'firefly-media-probe.json');
  const candidates = ['FIREFLY_CANARY_2026-08-31T23-27-53-710Z.mp4', 'HSL_001_V01_TAKE_01.mp4', 'OOL_001.mp4'];
  const items = [];
  for (const name of candidates) {
    const file = path.join(agentRoot!, 'saida', name);
    if (!fs.existsSync(file)) { items.push({ name, missing: true }); continue; }
    const result = requireSuccess(await spawnTool('ffprobe', [
      '-v', 'error', '-show_entries',
      'format=duration,format_name:stream=index,codec_type,codec_name,width,height,avg_frame_rate,pix_fmt',
      '-of', 'json', file,
    ], { cwd: REPO_ROOT, logPath: path.join(REPO_ROOT, 'runs', 'phase2-discovery', 'firefly-media-probe.log') }), `FFPROBE:${name}`);
    items.push({ name, bytes: fs.statSync(file).size, ...JSON.parse(result.stdout) });
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify({ agentRoot, items }, null, 2) + '\n');
  console.log(JSON.stringify({ output, items }, null, 2));
}

main().catch(error => { console.error(error instanceof Error ? error.stack || error.message : String(error)); process.exitCode = 1; });
