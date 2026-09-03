import {spawnSync} from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  KENNEY_CC0_LICENSE_URL, KENNEY_SFX_PACKS, KENNEY_SFX_SELECTIONS, kenneySoundFxRoot
} from '../../config/kenneySoundFxCatalog';

// The sound designer consumes this projection; it does not manufacture visual
// approval fields from HslExecutableScene when called by the production graph.
export interface SoundFxScene {
  readonly scene_id: string;
  readonly episode_id: string;
  readonly chapter_id: string;
  readonly planned_duration_seconds: number;
  readonly narrative_function: string;
  readonly visual_subject: string;
  readonly micro_events: readonly {at_percent: number; action: string; subject: string}[];
  readonly remotion_choreography: readonly {type: string; at_percent: number}[];
}
export interface SoundFxTools {
  ffmpeg(args: readonly string[], errorCode: string): void;
  probe(filePath: string): {duration: number; sampleRate: number; channels: number};
}

export type HslSoundFxCueType = 'SNAP_POP' | 'SUBTLE_STRIKE' | 'CHAPTER_DROP';

export interface HslSoundFxCue {
  readonly cue_id: string;
  readonly scene_id: string;
  readonly type: HslSoundFxCueType;
  readonly frame: number;
  readonly time_seconds: number;
  readonly duration_seconds: number;
  readonly gain_db: number;
  readonly narrative_reason: string;
  readonly asset_path: string;
  readonly asset_sha256: string;
  readonly provenance: 'KENNEY_CC0_DERIVATIVE';
  readonly source_page_url: string;
  readonly source_file_sha256: string;
  readonly license: 'CC0-1.0';
  readonly license_url: string;
}

export interface HslSoundFxPlan {
  readonly schema: 'hsl.soundfx.plan.v1';
  readonly schema_version: '1.0.0';
  readonly episode_id: string;
  readonly fps: number;
  readonly total_duration_seconds: number;
  readonly mix_policy: Readonly<{
    narration_priority: true;
    music_ducking_db_during_narration: -18;
    silence_is_valid: true;
    max_cues_per_second: 3;
  }>;
  readonly cues: readonly HslSoundFxCue[];
  readonly status: 'SFX_PLAN_APPROVED';
}

export interface HslSoundFxRuntimeResult {
  readonly planPath: string;
  readonly bedPath: string;
  readonly plan: HslSoundFxPlan;
  readonly qa: Readonly<{
    status: 'SFX_QA_PASS';
    duration_seconds: number;
    sample_rate: 48000;
    channels: 2;
    cue_count: number;
  }>;
}

interface SoundFxAsset {
  readonly type: HslSoundFxCueType;
  readonly filePath: string;
  readonly durationSeconds: number;
  readonly sha256: string;
  readonly sourcePageUrl: string;
  readonly sourceFileSha256: string;
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sha256(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function runFfmpeg(args: readonly string[], errorCode: string): void {
  const result = spawnSync('ffmpeg', [...args], {encoding: 'utf8', maxBuffer: 1024 * 1024 * 10});
  if (result.status !== 0) {
    const processError = result.error ? `\n${result.error.name}: ${result.error.message}` : '';
    throw new Error(`${errorCode}:${result.stdout || ''}\n${result.stderr || ''}${processError}`);
  }
}

function audioProbe(filePath: string): {duration: number; sampleRate: number; channels: number} {
  const result = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,sample_rate,channels', '-of', 'json', filePath
  ], {encoding: 'utf8'});
  if (result.status !== 0) throw new Error(`HSL_SFX_FFPROBE_FAILED:${filePath}:${result.stderr || ''}`);
  const parsed = JSON.parse(result.stdout) as {
    format?: {duration?: string};
    streams?: Array<{codec_type?: string; sample_rate?: string; channels?: number}>;
  };
  const stream = parsed.streams?.find((item) => item.codec_type === 'audio');
  return {
    duration: Number(parsed.format?.duration || 0),
    sampleRate: Number(stream?.sample_rate || 0),
    channels: Number(stream?.channels || 0)
  };
}

export class KenneySoundFxAssetAgent {
  constructor(private readonly tools: SoundFxTools = {ffmpeg: runFfmpeg, probe: audioProbe},
    private readonly projectRoot = process.cwd()) {}
  ensure(outputDirectory: string): ReadonlyMap<HslSoundFxCueType, SoundFxAsset> {
    fs.mkdirSync(outputDirectory, {recursive: true});
    const sourceRoot = kenneySoundFxRoot(this.projectRoot);
    const assets = new Map<HslSoundFxCueType, SoundFxAsset>();
    for (const selection of KENNEY_SFX_SELECTIONS) {
      const sourcePath = path.join(sourceRoot, selection.packId, ...selection.pathInPack.split('/'));
      if (!fs.existsSync(sourcePath)) throw new Error(`HSL_KENNEY_SFX_SYNC_REQUIRED:npm run hsl:sfx-sync:${sourcePath}`);
      if (sha256(sourcePath) !== selection.sourceSha256) throw new Error(`HSL_KENNEY_SOURCE_HASH_MISMATCH:${selection.pathInPack}`);
      const filePath = path.join(outputDirectory, selection.canonicalName);
      const ffmpegArgs = [
        '-y', '-hide_banner', '-loglevel', 'error', '-i', sourcePath,
        '-af', `${selection.ffmpegFilter},aformat=sample_fmts=s16:channel_layouts=stereo`,
        '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le'
      ];
      if (selection.maxDurationSeconds) ffmpegArgs.push('-t', String(selection.maxDurationSeconds));
      ffmpegArgs.push(filePath);
      this.tools.ffmpeg(ffmpegArgs, `HSL_KENNEY_SFX_TRANSCODE_FAILED:${selection.cueType}`);
      const probe = this.tools.probe(filePath);
      if (probe.sampleRate !== 48000 || probe.channels !== 2 || probe.duration <= 0) {
        throw new Error(`HSL_SFX_ASSET_INVALID:${selection.cueType}:${JSON.stringify(probe)}`);
      }
      const pack = KENNEY_SFX_PACKS.find((item) => item.id === selection.packId)!;
      assets.set(selection.cueType, {
        type: selection.cueType, filePath, durationSeconds: probe.duration, sha256: sha256(filePath),
        sourcePageUrl: pack.pageUrl, sourceFileSha256: selection.sourceSha256
      });
    }
    return assets;
  }
}

interface PendingCue {
  readonly sceneId: string;
  readonly type: HslSoundFxCueType;
  readonly timeSeconds: number;
  readonly gainDb: number;
  readonly reason: string;
}

export class SoundFxDesignAgent {
  plan(
    scenes: readonly SoundFxScene[],
    assets: ReadonlyMap<HslSoundFxCueType, SoundFxAsset>,
    fps = 30,
    suppressSceneIds: ReadonlySet<string> = new Set()
  ): HslSoundFxPlan {
    if (!scenes.length) throw new Error('HSL_SFX_SCENES_REQUIRED');
    const pending: PendingCue[] = [];
    let sceneStart = 0;
    scenes.forEach((scene, index) => {
      if (suppressSceneIds.has(scene.scene_id)) {
        sceneStart += scene.planned_duration_seconds;
        return;
      }
      if (index > 0 && scene.chapter_id !== scenes[index - 1].chapter_id) {
        pending.push({
          sceneId: scene.scene_id, type: 'CHAPTER_DROP', timeSeconds: sceneStart + 0.04,
          gainDb: -16, reason: 'chapter transition'
        });
      }
      for (const cue of scene.remotion_choreography.filter((item) => item.type === 'flow_line').slice(0, 2)) {
        pending.push({
          sceneId: scene.scene_id, type: 'SNAP_POP',
          timeSeconds: sceneStart + scene.planned_duration_seconds * cue.at_percent / 100,
          gainDb: -10, reason: 'kinetic flow or arrow emphasis'
        });
      }
      const semanticText = [
        scene.narrative_function, scene.visual_subject,
        ...scene.micro_events.flatMap((event) => [event.action, event.subject])
      ].join(' ').toLowerCase();
      if (/(bottleneck|constraint|failure|alert|blocked|gargalo|falha|limite)/.test(semanticText)) {
        const event = scene.micro_events.find((item) => /(bottleneck|constraint|failure|alert|blocked|gargalo|falha|limite)/i.test(`${item.action} ${item.subject}`));
        pending.push({
          sceneId: scene.scene_id, type: 'SUBTLE_STRIKE',
          timeSeconds: sceneStart + scene.planned_duration_seconds * (event?.at_percent ?? 55) / 100,
          gainDb: -14, reason: 'constraint, alert or bottleneck reveal'
        });
      }
      sceneStart += scene.planned_duration_seconds;
    });
    const sorted = pending.sort((a, b) => a.timeSeconds - b.timeSeconds);
    const accepted = sorted.filter((cue, index) => {
      const nearby = sorted.slice(0, index).filter((previous) => cue.timeSeconds - previous.timeSeconds < 1);
      return nearby.length < 3;
    });
    const cues = accepted.map((cue, index): HslSoundFxCue => {
      const asset = assets.get(cue.type);
      if (!asset) throw new Error(`HSL_SFX_ASSET_REQUIRED:${cue.type}`);
      return {
        cue_id: `SFX_${String(index + 1).padStart(3, '0')}`,
        scene_id: cue.sceneId,
        type: cue.type,
        frame: Math.max(0, Math.round(cue.timeSeconds * fps)),
        time_seconds: Number(cue.timeSeconds.toFixed(3)),
        duration_seconds: asset.durationSeconds,
        gain_db: cue.gainDb,
        narrative_reason: cue.reason,
        asset_path: asset.filePath,
        asset_sha256: asset.sha256,
        provenance: 'KENNEY_CC0_DERIVATIVE',
        source_page_url: asset.sourcePageUrl,
        source_file_sha256: asset.sourceFileSha256,
        license: 'CC0-1.0',
        license_url: KENNEY_CC0_LICENSE_URL
      };
    });
    return {
      schema: 'hsl.soundfx.plan.v1', schema_version: '1.0.0', episode_id: scenes[0].episode_id,
      fps, total_duration_seconds: Number(sceneStart.toFixed(3)),
      mix_policy: {
        narration_priority: true, music_ducking_db_during_narration: -18,
        silence_is_valid: true, max_cues_per_second: 3
      },
      cues, status: 'SFX_PLAN_APPROVED'
    };
  }
}

export class SoundFxMixAgent {
  constructor(private readonly tools: SoundFxTools = {ffmpeg: runFfmpeg, probe: audioProbe}) {}
  mix(plan: HslSoundFxPlan, outputPath: string): void {
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    const args: string[] = [
      '-y', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi',
      '-i', `anullsrc=r=48000:cl=stereo:d=${plan.total_duration_seconds}`
    ];
    for (const cue of plan.cues) args.push('-i', cue.asset_path);
    const filters: string[] = [];
    const inputs = ['[0:a]'];
    plan.cues.forEach((cue, index) => {
      const label = `sfx${index + 1}`;
      const delayMs = Math.max(0, Math.round(cue.time_seconds * 1000));
      const volume = Math.pow(10, cue.gain_db / 20).toFixed(6);
      filters.push(`[${index + 1}:a]volume=${volume},adelay=${delayMs}|${delayMs}[${label}]`);
      inputs.push(`[${label}]`);
    });
    filters.push(`${inputs.join('')}amix=inputs=${inputs.length}:duration=first:normalize=0,alimiter=limit=0.7[out]`);
    args.push(
      '-filter_complex', filters.join(';'), '-map', '[out]', '-ar', '48000', '-ac', '2',
      '-c:a', 'pcm_s16le', outputPath
    );
    this.tools.ffmpeg(args, 'HSL_SFX_MIX_FAILED');
  }
}

export class SoundFxQaAgent {
  constructor(private readonly tools: SoundFxTools = {ffmpeg: runFfmpeg, probe: audioProbe}) {}
  validate(plan: HslSoundFxPlan, bedPath: string): HslSoundFxRuntimeResult['qa'] {
    if (!fs.existsSync(bedPath) || fs.statSync(bedPath).size === 0) throw new Error('HSL_SFX_BED_REQUIRED');
    for (const cue of plan.cues) {
      if (cue.time_seconds < 0 || cue.time_seconds >= plan.total_duration_seconds) throw new Error(`HSL_SFX_CUE_OUT_OF_RANGE:${cue.cue_id}`);
      if (!fs.existsSync(cue.asset_path) || sha256(cue.asset_path) !== cue.asset_sha256) throw new Error(`HSL_SFX_ASSET_HASH_MISMATCH:${cue.cue_id}`);
    }
    const probe = this.tools.probe(bedPath);
    if (probe.sampleRate !== 48000 || probe.channels !== 2 || Math.abs(probe.duration - plan.total_duration_seconds) > 0.08) {
      throw new Error(`HSL_SFX_BED_QA_FAILED:${JSON.stringify(probe)}`);
    }
    return {
      status: 'SFX_QA_PASS', duration_seconds: probe.duration,
      sample_rate: 48000, channels: 2, cue_count: plan.cues.length
    };
  }
}

export class HslSoundFxRuntime {
  constructor(private readonly tools: SoundFxTools = {ffmpeg: runFfmpeg, probe: audioProbe},
    private readonly projectRoot = process.cwd()) {}
  run(input: Readonly<{
    scenes: readonly SoundFxScene[];
    outputDirectory: string;
    fps?: number;
    suppressSceneIds?: ReadonlySet<string>;
  }>): HslSoundFxRuntimeResult {
    const outputRoot = path.resolve(input.outputDirectory);
    const assets = new KenneySoundFxAssetAgent(this.tools, this.projectRoot).ensure(path.join(outputRoot, 'assets'));
    const plan = new SoundFxDesignAgent().plan(input.scenes, assets, input.fps || 30, input.suppressSceneIds);
    const planPath = path.join(outputRoot, 'soundfx-plan.json');
    writeJson(planPath, plan);
    const bedPath = path.join(outputRoot, 'soundfx-bed.wav');
    new SoundFxMixAgent(this.tools).mix(plan, bedPath);
    const qa = new SoundFxQaAgent(this.tools).validate(plan, bedPath);
    writeJson(path.join(outputRoot, 'soundfx-qa.json'), qa);
    return {planPath, bedPath, plan, qa};
  }
}
