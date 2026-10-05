import {spawnSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {HslExecutableScene} from '../execution/types/execution';

interface LoudnormMeasurement {
  readonly input_i: string;
  readonly input_tp: string;
  readonly input_lra: string;
  readonly input_thresh: string;
  readonly target_offset: string;
}

export interface HslNarrationAudioQa {
  readonly status: 'NARRATION_AUDIO_QA_PASS';
  readonly integrated_lufs: number;
  readonly true_peak_dbtp: number;
  readonly loudness_range_lu: number;
  readonly sample_rate: 48000;
  readonly channels: 2;
  readonly codec: 'pcm_s16le';
}

function runFfmpeg(args: readonly string[], errorCode: string) {
  const result = spawnSync('ffmpeg', ['-nostdin', ...args], {encoding: 'utf8', maxBuffer: 1024 * 1024 * 20});
  if (result.status !== 0) {
    const processError = result.error ? `\n${result.error.name}: ${result.error.message}` : '';
    throw new Error(`${errorCode}:${result.stdout || ''}\n${result.stderr || ''}${processError}`);
  }
  return result;
}

function loudnessMeasurement(filePath: string): LoudnormMeasurement {
  const result = runFfmpeg([
    '-hide_banner', '-nostats', '-i', filePath,
    '-af', 'loudnorm=I=-16:LRA=7:TP=-1.5:print_format=json', '-f', 'null', '-'
  ], 'HSL_NARRATION_LOUDNESS_ANALYSIS_FAILED');
  const blocks = (result.stderr || '').match(/\{\s*"input_i"[\s\S]*?\}/g);
  if (!blocks?.length) throw new Error('HSL_NARRATION_LOUDNESS_MEASUREMENT_REQUIRED');
  const measurement = JSON.parse(blocks[blocks.length - 1]) as LoudnormMeasurement;
  const required = [measurement.input_i, measurement.input_tp, measurement.input_lra, measurement.input_thresh, measurement.target_offset].map(Number);
  if (required.some((value) => !Number.isFinite(value))) throw new Error('HSL_NARRATION_LOUDNESS_MEASUREMENT_INVALID');
  return measurement;
}

function audioProbe(filePath: string): {sampleRate: number; channels: number; codec: string} {
  const result = spawnSync('ffprobe', [
    '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name,sample_rate,channels', '-of', 'json', filePath
  ], {encoding: 'utf8'});
  if (result.status !== 0) throw new Error(`HSL_NARRATION_FFPROBE_FAILED:${result.stderr || ''}`);
  const stream = (JSON.parse(result.stdout) as {streams?: Array<{codec_name?: string; sample_rate?: string; channels?: number}>}).streams?.[0];
  return {sampleRate: Number(stream?.sample_rate || 0), channels: Number(stream?.channels || 0), codec: stream?.codec_name || ''};
}

export class NarrationPerformanceAgent {
  run(scenes: readonly HslExecutableScene[]) {
    return {
      schema: 'hsl.narration.performance-plan.v1',
      schema_version: '1.0.0',
      episode_id: scenes[0]?.episode_id || 'UNKNOWN',
      instruction_delivery: 'SIDECAR_ONLY_NOT_SPOKEN',
      scenes: scenes.map((scene) => ({
        scene_id: scene.scene_id,
        attention_role: scene.attention_role || 'NONE',
        delivery: this.delivery(scene),
        pause_after_ms: scene.pause_after_ms || 0
      })),
      status: 'NARRATION_PERFORMANCE_PLAN_APPROVED'
    } as const;
  }

  private delivery(scene: Readonly<HslExecutableScene>): string {
    if (scene.attention_role === 'HOOK') return 'FIRM_CONTAINED';
    if (scene.attention_role === 'PAYOFF') return 'SHORT_PRE_PAUSE_DIRECT';
    if (scene.attention_role === 'REFRAME') return 'SLOW_CLEAR_RESOLUTION';
    if (/constraint|failure/i.test(scene.narrative_function)) return 'CONTROLLED_DECELERATION';
    return 'CLEAR_STABLE_EXPLANATION';
  }
}

export class DialogLevelingAgent {
  level(inputPath: string, outputPath: string): string {
    if (!fs.existsSync(inputPath) || fs.statSync(inputPath).size === 0) throw new Error('HSL_NARRATION_AUDIO_REQUIRED');
    const measured = loudnessMeasurement(inputPath);
    const filter = [
      'loudnorm=I=-16:LRA=7:TP=-1.5',
      `measured_I=${measured.input_i}`,
      `measured_LRA=${measured.input_lra}`,
      `measured_TP=${measured.input_tp}`,
      `measured_thresh=${measured.input_thresh}`,
      `offset=${measured.target_offset}`,
      'linear=true',
      'print_format=summary'
    ].join(':');
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    runFfmpeg([
      '-y', '-hide_banner', '-loglevel', 'error', '-i', inputPath,
      '-af', filter, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', outputPath
    ], 'HSL_NARRATION_LEVELING_FAILED');
    const outputMeasurement = loudnessMeasurement(outputPath);
    const outputIntegratedLufs = Number(outputMeasurement.input_i);
    if (outputIntegratedLufs < -17 || outputIntegratedLufs > -15) {
      const correctionDb = Math.max(-6, Math.min(6, -16 - outputIntegratedLufs));
      const correctedPath = `${outputPath}.corrected.wav`;
      runFfmpeg([
        '-y', '-hide_banner', '-loglevel', 'error', '-i', outputPath,
        '-af', `volume=${correctionDb.toFixed(3)}dB`,
        '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', correctedPath
      ], 'HSL_NARRATION_LEVELING_CORRECTION_FAILED');
      fs.unlinkSync(outputPath);
      fs.renameSync(correctedPath, outputPath);
    }
    return outputPath;
  }
}

export class LoudnessQaAgent {
  validate(filePath: string): HslNarrationAudioQa {
    const measured = loudnessMeasurement(filePath);
    const probe = audioProbe(filePath);
    const integratedLufs = Number(measured.input_i);
    const truePeakDbtp = Number(measured.input_tp);
    const loudnessRangeLu = Number(measured.input_lra);
    if (integratedLufs < -17 || integratedLufs > -15) throw new Error(`HSL_NARRATION_INTEGRATED_LOUDNESS_INVALID:${integratedLufs}`);
    if (truePeakDbtp > -1) throw new Error(`HSL_NARRATION_TRUE_PEAK_INVALID:${truePeakDbtp}`);
    if (probe.sampleRate !== 48000 || probe.channels !== 2 || probe.codec !== 'pcm_s16le') throw new Error(`HSL_NARRATION_AUDIO_FORMAT_INVALID:${JSON.stringify(probe)}`);
    return {
      status: 'NARRATION_AUDIO_QA_PASS',
      integrated_lufs: integratedLufs,
      true_peak_dbtp: truePeakDbtp,
      loudness_range_lu: loudnessRangeLu,
      sample_rate: 48000,
      channels: 2,
      codec: 'pcm_s16le'
    };
  }
}
