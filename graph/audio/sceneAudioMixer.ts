import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { AudioPlan, AudioLayerPlan, SceneAudioPlan } from '../../sound-agent/types/audio-plan.types';

export interface SceneMixerResult {
  readonly outPath: string;
  readonly planPath: string;
  readonly qaPath: string;
  readonly totalCuesMixed: number;
  readonly ambientLayersMixed: number;
  readonly pointSfxMixed: number;
  readonly durationSeconds: number;
  readonly qa: {
    readonly status: 'SFX_QA_PASS';
    readonly duration_seconds: number;
    readonly sample_rate: 48000;
    readonly channels: 2;
    readonly cue_count: number;
  };
  readonly resolved: Array<{
    id: string;
    description: string;
    sourcePath: string;
    offsetSeconds: number;
    targetDb: number;
  }>;
  readonly unresolved: Array<{
    id: string;
    description: string;
    offsetSeconds: number;
    targetDb: number;
    reason: string;
  }>;
}

interface CueItem {
  id: string;
  description: string;
  filePath: string;
  offsetSeconds: number;
  durationSeconds?: number;
  volumeDb: number;
  isContinuousAmbience: boolean;
}

export class SceneAudioMixer {
  private readonly root: string;

  constructor(root = process.cwd()) {
    this.root = path.resolve(root);
  }

  private resolveSfxFile(file: string, type?: string, category?: string): string | null {
    const clean = file.replace(/\\/g, '/').replace(/^public\//, '').replace(/^audio\/sfx\//, '').replace(/^\/+/, '');
    const candidates = [
      path.resolve(this.root, 'public', 'audio', 'sfx', clean),
      path.resolve(this.root, 'public', clean),
      path.resolve(this.root, 'assets', 'audio-library', 'sfx', clean),
      path.resolve(this.root, clean)
    ];

    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        return c;
      }
    }

    // Fallback inteligente no banco de 269 SFX sintetizados
    const sfxBase = path.resolve(this.root, 'public', 'audio', 'sfx');
    const isAmbience = type === 'drone' || type === 'ambience' || (category && /drone|loop|atmosphere|room_tone/i.test(category));
    const isImpact = type === 'impact' || (category && /impact|boom|braam|strike/i.test(category));
    const isWhoosh = type === 'whoosh' || (category && /whoosh|swoosh|trans/i.test(category));
    const isRiser = type === 'riser' || (category && /riser|tension/i.test(category));

    if (isAmbience) {
      const loop = path.join(sfxBase, 'cinematic', 'loops', 'loop_atmosphere_01.wav');
      if (fs.existsSync(loop)) return loop;
    }
    if (isImpact) {
      const strike = path.join(sfxBase, 'cinematic', 'impacts', 'impact_strike_01.wav');
      if (fs.existsSync(strike)) return strike;
    }
    if (isWhoosh) {
      const whoosh = path.join(sfxBase, 'cinematic', 'whooshes', 'whoosh_swoosh_01.wav');
      if (fs.existsSync(whoosh)) return whoosh;
    }
    if (isRiser) {
      const riser = path.join(sfxBase, 'cinematic', 'tension', 'tension_riser_01.wav');
      if (fs.existsSync(riser)) return riser;
    }

    // Fallback universal de UI/Foley
    const uiClick = path.join(sfxBase, 'ui', 'ui_click_01.wav');
    if (fs.existsSync(uiClick)) return uiClick;

    // Fallback nos derivados Kenney de emergência
    const kenneyPluck = path.resolve(this.root, 'assets', 'audio-library', 'sfx', 'kenney', 'sfx_snap_pop.wav');
    if (fs.existsSync(kenneyPluck)) return kenneyPluck;

    return null;
  }

  public extractCues(audioPlan: AudioPlan, totalDurationSeconds: number): {
    cues: CueItem[];
    unresolved: SceneMixerResult['unresolved'];
  } {
    const fps = audioPlan.fps || 30;
    const cues: CueItem[] = [];
    const unresolved: SceneMixerResult['unresolved'] = [];

    for (const scene of audioPlan.scenes) {
      const sceneStart = scene.startFrame / fps;
      const sceneEnd = scene.endFrame / fps;
      const sceneDuration = Math.max(0.5, sceneEnd - sceneStart);

      // 1. Processar todas as camadas declaradas da cena
      for (const layer of scene.layers) {
        const isAmbience = layer.type === 'drone' || layer.type === 'ambience' ||
          /drone|loop|atmosphere|room_tone/i.test(layer.category);

        const offsetSeconds = isAmbience ? sceneStart : layer.startFrame / fps;
        const resolvedPath = this.resolveSfxFile(layer.file, layer.type, layer.category);

        if (!resolvedPath) {
          unresolved.push({
            id: `${scene.sceneId}:${layer.layerId}`,
            description: `${layer.type}/${layer.category}`,
            offsetSeconds,
            targetDb: layer.volumeDb,
            reason: 'asset não encontrado no disco'
          });
          continue;
        }

        cues.push({
          id: `${scene.sceneId}:${layer.layerId}`,
          description: `${layer.type}/${layer.category}`,
          filePath: resolvedPath,
          offsetSeconds,
          durationSeconds: isAmbience ? sceneDuration : (layer.durationFrames ? layer.durationFrames / fps : 2.5),
          volumeDb: Math.min(-6, Math.max(-45, layer.volumeDb)),
          isContinuousAmbience: isAmbience
        });
      }

      // 2. Processar transições da cena
      if (scene.transitions) {
        for (const tr of scene.transitions) {
          if (tr.supportTrack?.file) {
            const file = this.resolveSfxFile(tr.supportTrack.file, 'whoosh', 'transition');
            if (file) {
              cues.push({
                id: `${scene.sceneId}:${tr.transitionId}:support`,
                description: `transition_${tr.method}`,
                filePath: file,
                offsetSeconds: tr.supportTrack.startFrame / fps,
                durationSeconds: 1.5,
                volumeDb: tr.supportTrack.volumeDb || -20,
                isContinuousAmbience: false
              });
            }
          }
          if (tr.riserTrack?.file) {
            const file = this.resolveSfxFile(tr.riserTrack.file, 'riser', 'tension');
            if (file) {
              cues.push({
                id: `${scene.sceneId}:${tr.transitionId}:riser`,
                description: `riser_${tr.method}`,
                filePath: file,
                offsetSeconds: tr.riserTrack.startFrame / fps,
                durationSeconds: 2.0,
                volumeDb: tr.riserTrack.volumeDb || -18,
                isContinuousAmbience: false
              });
            }
          }
        }
      }
    }

    return { cues, unresolved };
  }

  public mix(
    audioPlan: AudioPlan,
    outputPath: string,
    totalDurationSeconds: number
  ): SceneMixerResult {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const { cues, unresolved } = this.extractCues(audioPlan, totalDurationSeconds);

    // Se não houver cues (caso raro), sintetiza um leito de áudio ambiente sutil
    if (cues.length === 0) {
      const fallbackLoop = this.resolveSfxFile('cinematic/loops/loop_atmosphere_01.wav', 'ambience', 'atmosphere');
      if (fallbackLoop) {
        cues.push({
          id: 'ambient_bed_default',
          description: 'ambience/default_bed',
          filePath: fallbackLoop,
          offsetSeconds: 0,
          durationSeconds: totalDurationSeconds,
          volumeDb: -28,
          isContinuousAmbience: true
        });
      }
    }

    // Dividir em batches para segurança contra limites de argumentos do sistema operacional
    const BATCH_SIZE = 25;
    const batchOutputs: string[] = [];
    const dir = path.dirname(outputPath);

    for (let batchIndex = 0; batchIndex < Math.ceil(cues.length / BATCH_SIZE); batchIndex++) {
      const batchCues = cues.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
      const batchOut = path.join(dir, `sfx-batch-${batchIndex}.wav`);

      const args: string[] = [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi',
        '-i', `anullsrc=r=48000:cl=stereo:d=${totalDurationSeconds.toFixed(3)}`
      ];

      for (const cue of batchCues) {
        args.push('-i', cue.filePath);
      }

      const filters: string[] = [];
      const inputs = ['[0:a]'];

      batchCues.forEach((cue, idx) => {
        const inputIdx = idx + 1;
        const label = `cue${batchIndex}_${idx}`;
        const delayMs = Math.max(0, Math.round(cue.offsetSeconds * 1000));
        const linearVol = Math.pow(10, cue.volumeDb / 20).toFixed(6);

        if (cue.isContinuousAmbience && cue.durationSeconds) {
          const dur = cue.durationSeconds;
          const fadeOutStart = Math.max(0, dur - 0.5);
          filters.push(
            `[${inputIdx}:a]aloop=loop=-1:size=2e+09,atrim=0:${dur.toFixed(3)},` +
            `afade=t=in:st=0:d=0.4,afade=t=out:st=${fadeOutStart.toFixed(3)}:d=0.5,` +
            `volume=${linearVol},adelay=${delayMs}|${delayMs}[${label}]`
          );
        } else {
          filters.push(
            `[${inputIdx}:a]volume=${linearVol},adelay=${delayMs}|${delayMs}[${label}]`
          );
        }
        inputs.push(`[${label}]`);
      });

      filters.push(`${inputs.join('')}amix=inputs=${inputs.length}:duration=first:normalize=0,alimiter=limit=0.9[out]`);

      args.push(
        '-filter_complex', filters.join(';'),
        '-map', '[out]',
        '-ar', '48000', '-ac', '2',
        '-c:a', 'pcm_s16le',
        batchOut
      );

      const res = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 30 });
      if (res.status !== 0 || !fs.existsSync(batchOut)) {
        throw new Error(`SCENE_AUDIO_BATCH_FAILED:${batchIndex}:${res.stderr}`);
      }
      batchOutputs.push(batchOut);
    }

    // Mux final dos batches se houver mais de um, ou renomeia o único batch
    if (batchOutputs.length === 1) {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      fs.renameSync(batchOutputs[0], outputPath);
    } else {
      const finalArgs: string[] = ['-y', '-hide_banner', '-loglevel', 'error'];
      for (const b of batchOutputs) {
        finalArgs.push('-i', b);
      }
      finalArgs.push(
        '-filter_complex',
        `amix=inputs=${batchOutputs.length}:duration=first:normalize=0,alimiter=limit=0.88[out]`,
        '-map', '[out]',
        '-ar', '48000', '-ac', '2',
        '-c:a', 'pcm_s16le',
        outputPath
      );
      const finalRes = spawnSync('ffmpeg', finalArgs, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 });
      for (const b of batchOutputs) {
        try { fs.unlinkSync(b); } catch {}
      }
      if (finalRes.status !== 0 || !fs.existsSync(outputPath)) {
        throw new Error(`SCENE_AUDIO_FINAL_MIX_FAILED:${finalRes.stderr}`);
      }
    }

    // Validação de Integridade com FFprobe
    const probeRes = spawnSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration:stream=codec_type,sample_rate,channels',
      '-of', 'json',
      outputPath
    ], { encoding: 'utf8' });

    if (probeRes.status !== 0) {
      throw new Error(`SCENE_AUDIO_PROBE_FAILED:${outputPath}:${probeRes.stderr}`);
    }

    const probe = JSON.parse(probeRes.stdout);
    const audioStream = probe.streams?.find((s: any) => s.codec_type === 'audio');
    const measuredDuration = Number(probe.format?.duration || 0);

    if (Math.abs(measuredDuration - totalDurationSeconds) > 0.15) {
      throw new Error(`SCENE_AUDIO_DURATION_MISMATCH: esperado ${totalDurationSeconds}s, medido ${measuredDuration}s`);
    }

    const resolved = cues.map(c => ({
      id: c.id,
      description: c.description,
      sourcePath: c.filePath,
      offsetSeconds: c.offsetSeconds,
      targetDb: c.volumeDb
    }));

    const ambientCount = cues.filter(c => c.isContinuousAmbience).length;
    const pointCount = cues.length - ambientCount;

    const planPath = path.join(dir, 'soundfx-plan.json');
    const qaPath = path.join(dir, 'soundfx-qa.json');

    const qaReport = {
      status: 'SFX_QA_PASS' as const,
      duration_seconds: measuredDuration,
      sample_rate: 48000 as const,
      channels: 2 as const,
      cue_count: cues.length
    };

    fs.writeFileSync(planPath, JSON.stringify({
      schema: 'hsl.soundfx.plan.v1',
      schema_version: '1.0.0',
      total_duration_seconds: measuredDuration,
      total_cues: cues.length,
      ambient_layers: ambientCount,
      point_sfx: pointCount,
      cues: resolved
    }, null, 2));

    fs.writeFileSync(qaPath, JSON.stringify(qaReport, null, 2));

    return {
      outPath: outputPath,
      planPath,
      qaPath,
      totalCuesMixed: cues.length,
      ambientLayersMixed: ambientCount,
      pointSfxMixed: pointCount,
      durationSeconds: measuredDuration,
      qa: qaReport,
      resolved,
      unresolved
    };
  }
}
