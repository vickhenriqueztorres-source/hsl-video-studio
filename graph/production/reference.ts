import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { runMasterEpisodePipeline } from '../../hsl/pipeline/masterOrchestrator';
import { DIRECT_MUSIC_TRACKS } from '../../music-agent/musicCatalog';
import { MusicDownloader } from '../../music-agent/musicDownloader';
import { normalizeMusicTrack } from '../../music-agent/musicProcessor';
import { REPO_ROOT } from '../checkpointer';
import { probe } from './lib/ffmpeg';
import { readJson, writeJson } from './runtime';
import { referencePrefix } from './parity';

// Explicit baseline harness. The original CLI ignores positional episode IDs;
// invoke its exported function without changing a line of the reference.
async function main() {
  const args = process.argv.slice(2);
  const episodeId = args[args.indexOf('--episode') + 1] || 'HSL_EPISODE_011';
  if (!/^[A-Za-z0-9_-]+$/.test(episodeId)) throw new Error('episodeId inválido');
  const dir = path.join(REPO_ROOT, 'docs/graph/reference'), prefix = referencePrefix(episodeId);
  const marker = path.join(REPO_ROOT, 'runs', episodeId, 'graph', 'reference-attempt.json');
  const previous = readJson<{ exitCode?: number; attempts?: number; observedChildExitCode?: number }>(marker);
  const attempts = previous ? (previous.attempts ?? 1) + 1 : 1;
  if (previous && attempts === 2 && (!args.includes('--retry-once') || previous.exitCode !== 1)) throw new Error('A segunda tentativa requer --retry-once após exit 1.');
  if (attempts === 3) {
    if (!args.includes('--third-after-render-check') || previous?.observedChildExitCode !== 1) throw new Error('A terceira tentativa requer autorização e --third-after-render-check.');
    const diagnostic = readJson<{ trials?: { name: string; result: { exitCode?: number } }[] }>(path.join(REPO_ROOT, 'runs', episodeId, 'graph', 'render-diagnostic', 'receipt.json'));
    if (!diagnostic?.trials?.some(trial => trial.name === 'default' && trial.result.exitCode === 0)) throw new Error('Render isolado default não passou; terceira referência bloqueada.');
    const narration = path.join(REPO_ROOT, 'runs', episodeId, 'audio', 'narration.mp3');
    const expected = 'd408730b84fe985b4945b2512fb499d4333bea4f61a71756b5d7b8404fb2a291';
    const actual = fs.existsSync(narration) ? createHash('sha256').update(fs.readFileSync(narration)).digest('hex') : '';
    if (actual !== expected) throw new Error(`Cache de narração divergente: ${actual || 'ausente'}`);
  } else if (previous && attempts > 3) throw new Error('Nenhuma tentativa adicional está autorizada.');
  const music = path.join(REPO_ROOT, 'assets/audio-library/music/cinematic/suspense/suspense_oppressive_gloom.mp3');
  if (!fs.existsSync(music)) {
    const track = DIRECT_MUSIC_TRACKS.find(t => t.id === 'incompetech-oppressive-gloom')!;
    const download = path.join(REPO_ROOT, 'runs', episodeId, 'graph', 'oppressive-gloom-original.mp3');
    await new MusicDownloader().downloadTrack(track, download);
    const meta = normalizeMusicTrack(download, music);
    writeJson(path.join(REPO_ROOT, 'runs', episodeId, 'graph', 'music-source.json'), { ...track, ...meta });
  }
  const startedAt = new Date().toISOString();
  writeJson(marker, { episodeId, attempts, startedAt, status: 'RUNNING' });
  process.once('exit', code => { writeJson(marker, { episodeId, attempts, startedAt, endedAt: new Date().toISOString(), exitCode: code }); });
  const result = await runMasterEpisodePipeline({ episodeId });
  // Freeze all reference evidence before the production graph touches the run.
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(REPO_ROOT, 'runs', episodeId, 'run-manifest.json'), path.join(dir, prefix + '-run-manifest.json'));
  writeJson(path.join(dir, prefix + '-compliance.json'), result.complianceReport);
  writeJson(path.join(dir, prefix + '-ffprobe.json'), await probe(result.videoPath));
  fs.copyFileSync(result.videoPath, path.join(dir, prefix + '-reference.mp4'));
  console.log('REFERENCE_SAVED: ' + dir);
}
if (require.main === module) main().catch(e => { console.error('REFERENCE_FAILED:', e instanceof Error ? e.stack : e); process.exitCode = 1; });
