import fs from 'node:fs';
import path from 'node:path';
import { spawnTool, requireSuccess } from '../lib/proc';
import { REPO_ROOT } from '../checkpointer';
import { HslLongFormProjectPlan } from '../../hsl/core/types';
import { inspectMediaWithFfprobe } from '../../hsl/core/hslPathResolver';
import { readJson, writeJson } from './runtime';
import { threadId } from './state';

// Explicit preparation utility for an existing scene plan. The production node
// still calls the original adapter; this works around its unquoted shell paths
// by preparing genuine Edge-TTS audio using a file, never a synthetic fixture.
async function main() {
  const episodeId = process.argv[2] || 'HSL_EPISODE_011'; threadId(episodeId);
  const run = path.join(REPO_ROOT, 'runs', episodeId);
  const output = path.join(run, 'audio', 'narration.mp3');
  if (fs.existsSync(output) && fs.statSync(output).size > 10000 && inspectMediaWithFfprobe(output).durationSeconds > 0) return;
  const plan = readJson<HslLongFormProjectPlan>(path.join(run, 'scene-plan.json'));
  if (!plan?.beats) throw new Error('scene-plan.json ausente');
  const textFile = path.join(run, 'graph', 'narration-input.txt');
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.mkdirSync(path.dirname(textFile), { recursive: true });
  fs.writeFileSync(textFile, plan.beats.map(b => b.voiceoverScript).join(' '), 'utf8');
  const result = requireSuccess(await spawnTool('edge-tts', ['--voice', 'en-US-ChristopherNeural', '--file', textFile, '--write-media', output], {
    cwd: REPO_ROOT, timeoutMs: 300000, logPath: path.join(run, 'graph', 'prepare-narration.log'),
  }), 'NARRATION_CACHE_PREPARATION_FAILED');
  const info = inspectMediaWithFfprobe(output);
  if (!info.hasAudio || info.durationSeconds <= 0) throw new Error('Cache TTS inválido');
  writeJson(path.join(run, 'graph', 'narration-cache-provenance.json'), { engine: 'edge-tts', voice: 'en-US-ChristopherNeural', textFile, output, info, durationMs: result.durationMs, createdAt: new Date().toISOString() });
  console.log(JSON.stringify({ output, info }));
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
