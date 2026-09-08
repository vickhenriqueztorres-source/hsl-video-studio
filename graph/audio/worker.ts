import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {SoundFxDesignAgent, SoundFxMixAgent, SoundFxQaAgent, SoundFxTools,
  SoundFxScene, HslSoundFxPlan, HslSoundFxCueType} from '../../hsl/postproduction/soundFxRuntime';
import {KENNEY_SFX_SELECTIONS, KENNEY_SFX_PACKS, kenneySoundFxRoot} from '../../config/kenneySoundFxCatalog';
import {spawnToolSync, requireSuccess} from '../lib/proc';
import {assertWithin} from '../production/lib/assets';
import {digest} from './import';

export interface SoundWorkerInput {root: string; out: string; scenes?: SoundFxScene[]; fps?: number; planPath?: string}
const write = (file: string, data: unknown) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
export function soundTools(root: string, dir: string): SoundFxTools {
  const logPath = path.join(dir, 'soundfx-process.log');
  return {
    ffmpeg(argv, label) {
      // FFmpeg 9 removed the old -filter_complex_script option. Keep the
      // filter graph inline; SoundFxMixAgent already supplies a complete
      // -filter_complex argument and spawnToolSync preserves it verbatim.
      requireSuccess(spawnToolSync('ffmpeg', [...argv], {cwd: root, logPath}), label);
    },
    probe(file) {
      const r = requireSuccess(spawnToolSync('ffprobe', ['-v', 'error', '-show_entries',
        'format=duration:stream=codec_type,sample_rate,channels', '-of', 'json', file], {cwd: root, logPath}), 'SFX_PROBE');
      const p = JSON.parse(r.stdout), audio = p.streams?.find((s: any) => s.codec_type === 'audio');
      return {duration: Number(p.format?.duration), sampleRate: Number(audio?.sample_rate), channels: Number(audio?.channels)};
    },
  };
}

export async function ensureAudioLibrary(root: string, tools: SoundFxTools): Promise<void> {
  const bank = path.join(root, 'assets/audio-library');
  const indexFile = path.join(bank, 'library-index.json');
  const sourceRoot = kenneySoundFxRoot(root);
  fs.mkdirSync(bank, {recursive: true});

  let needsBuild = !fs.existsSync(indexFile);
  if (!needsBuild) {
    try {
      const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
      for (const selection of KENNEY_SFX_SELECTIONS) {
        const entry = index.items?.find((item: any) => item.role === 'sfx' && item.cueType === selection.cueType);
        if (!entry || !fs.existsSync(path.resolve(root, entry.path))) {
          needsBuild = true;
          break;
        }
      }
    } catch {
      needsBuild = true;
    }
  }

  if (needsBuild) {
    const items: any[] = [];
    for (const selection of KENNEY_SFX_SELECTIONS) {
      const srcFile = path.join(sourceRoot, selection.packId, ...selection.pathInPack.split('/'));
      if (!fs.existsSync(srcFile)) {
        throw new Error(`SFX_KENNEY_SOURCE_MISSING:${srcFile}`);
      }
      const srcDest = path.join(bank, 'sources/kenney', selection.packId, selection.pathInPack);
      fs.mkdirSync(path.dirname(srcDest), {recursive: true});
      fs.copyFileSync(srcFile, srcDest);
      const srcSha = await digest(srcDest);
      if (srcSha !== selection.sourceSha256) {
        throw new Error(`SFX_KENNEY_SOURCE_HASH_INVALID:${selection.cueType}`);
      }
      items.push({
        path: path.relative(root, srcDest).replace(/\\/g, '/'),
        sha256: srcSha,
        role: 'source',
        license: 'CC0-1.0'
      });

      const sfxDir = path.join(bank, 'sfx/kenney');
      fs.mkdirSync(sfxDir, {recursive: true});
      const wavPath = path.join(sfxDir, selection.canonicalName);
      const args = [
        '-y', '-hide_banner', '-loglevel', 'error', '-i', srcDest,
        '-af', `${selection.ffmpegFilter},aformat=sample_fmts=s16:channel_layouts=stereo`,
        '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le'
      ];
      if (selection.maxDurationSeconds) args.push('-t', String(selection.maxDurationSeconds));
      args.push(wavPath);
      tools.ffmpeg(args, `SFX_TRANSCODE_${selection.cueType}`);

      const probe = tools.probe(wavPath);
      if (probe.sampleRate !== 48000 || probe.channels !== 2 || !(probe.duration > 0)) {
        throw new Error(`SFX_DERIVATIVE_FORMAT_INVALID:${selection.cueType}`);
      }
      const wavSha = await digest(wavPath);
      items.push({
        path: path.relative(root, wavPath).replace(/\\/g, '/'),
        sha256: wavSha,
        role: 'sfx',
        cueType: selection.cueType,
        sourceSha256: selection.sourceSha256,
        sourcePageUrl: KENNEY_SFX_PACKS.find(p => p.id === selection.packId)!.pageUrl,
        license: 'CC0-1.0'
      });
    }

    const indexData = {
      schema: 'hsl.audio-library.v1',
      items,
      totalBytes: items.reduce((n, item) => n + (fs.existsSync(path.resolve(root, item.path)) ? fs.statSync(path.resolve(root, item.path)).size : 0), 0)
    };
    fs.writeFileSync(indexFile, JSON.stringify(indexData, null, 2) + '\n');
  }
}

export async function runSoundWorker(input: SoundWorkerInput) {
  const {root} = input, out = assertWithin(root, input.out), dir = path.dirname(out);
  fs.mkdirSync(dir, {recursive: true});
  const tools = soundTools(root, dir), bank = path.join(root, 'assets/audio-library');
  await ensureAudioLibrary(root, tools);
  const index = JSON.parse(fs.readFileSync(path.join(bank, 'library-index.json'), 'utf8'));
  const assets = new Map<HslSoundFxCueType, {type: HslSoundFxCueType; filePath: string; durationSeconds: number;
    sha256: string; sourcePageUrl: string; sourceFileSha256: string}>();
  for (const selection of KENNEY_SFX_SELECTIONS) {
    const entry = index.items.find((item: any) => item.role === 'sfx' && item.cueType === selection.cueType);
    if (!entry) throw new Error(`SFX_LIBRARY_ASSET_MISSING:${selection.cueType}`);
    const file = assertWithin(bank, path.resolve(root, entry.path));
    if (await digest(file) !== entry.sha256 || entry.sourceSha256 !== selection.sourceSha256)
      throw new Error(`SFX_LIBRARY_HASH_MISMATCH:${selection.cueType}`);
    const source = assertWithin(bank, path.join(bank, 'sources/kenney', selection.packId, selection.pathInPack));
    if (await digest(source) !== selection.sourceSha256) throw new Error(`SFX_LIBRARY_SOURCE_HASH:${selection.cueType}`);
    const probe = tools.probe(file);
    if (probe.sampleRate !== 48000 || probe.channels !== 2 || !(probe.duration > 0))
      throw new Error(`SFX_LIBRARY_FORMAT:${selection.cueType}`);
    assets.set(selection.cueType, {type: selection.cueType, filePath: file, durationSeconds: probe.duration,
      sha256: entry.sha256, sourceFileSha256: entry.sourceSha256,
      sourcePageUrl: KENNEY_SFX_PACKS.find(p => p.id === selection.packId)!.pageUrl});
  }
  const plan: HslSoundFxPlan = input.planPath
    ? JSON.parse(fs.readFileSync(assertWithin(root, input.planPath), 'utf8'))
    : new SoundFxDesignAgent().plan(input.scenes ?? [], assets, input.fps);
  const localPlan: HslSoundFxPlan = {...plan, cues: plan.cues.map(cue => ({...cue,
    asset_path: assertWithin(bank, path.resolve(root, cue.asset_path))}))};
  if (!(localPlan.total_duration_seconds > 0) || !Number.isFinite(localPlan.total_duration_seconds)) throw new Error('SFX_DURATION_INVALID');
  const cues = [...localPlan.cues].sort((a, b) => a.time_seconds - b.time_seconds);
  for (let i = 0; i < cues.length; i++) {
    if (i >= 3 && cues[i].time_seconds - cues[i - 3].time_seconds < 1) throw new Error('SFX_DENSITY_EXCEEDED');
    if (!Number.isFinite(cues[i].time_seconds) || !Number.isFinite(cues[i].gain_db) || cues[i].gain_db > 0) throw new Error(`SFX_CUE_INVALID:${cues[i].cue_id}`);
    if (await digest(cues[i].asset_path) !== cues[i].asset_sha256) throw new Error(`SFX_PLAN_ASSET_HASH:${cues[i].cue_id}`);
  }
  const planPath = path.join(dir, 'soundfx-plan.json'), qaPath = path.join(dir, 'soundfx-qa.json');
  const cachePath = path.join(dir, 'soundfx-cache.json');
  const codeHash = await digest(path.join(__dirname, '../../hsl/postproduction/soundFxRuntime.ts'));
  const workerHash = await digest(__filename);
  const signature = crypto.createHash('sha256').update(JSON.stringify({localPlan, codeHash, workerHash})).digest('hex');
  let cached = false;
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    cached = cache.signature === signature && cache.bedSha256 === await digest(out) && cache.planSha256 === await digest(planPath);
  } catch { /* Only a complete verified cache can bypass mixing. */ }
  if (!cached) {
    const staging = path.join(dir, 'soundfx-staging.wav');
    new SoundFxMixAgent(tools).mix(localPlan, staging);
    new SoundFxQaAgent(tools).validate(localPlan, staging);
    fs.renameSync(staging, out);
    write(planPath, localPlan);
  }
  const qa = new SoundFxQaAgent(tools).validate(localPlan, out);
  write(qaPath, qa);
  write(cachePath, {signature, bedSha256: await digest(out), planSha256: await digest(planPath)});
  return {planPath, qaPath, cached, qa, resolved: localPlan.cues.map(cue => ({id: cue.cue_id,
    description: cue.narrative_reason, sourcePath: cue.asset_path, offsetSeconds: cue.time_seconds,
    targetDb: cue.gain_db, sha256: cue.asset_sha256}))};
}
if (require.main === module) {
  const [input, result] = process.argv.slice(2);
  if (!input || !result) throw new Error('Use worker.ts <input.json> <result.json>');
  runSoundWorker(JSON.parse(fs.readFileSync(input, 'utf8'))).then(output => write(result, output))
    .catch(e => {console.error(e.message); process.exitCode = 1;});
}
