import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {
  AudioProbe,
  MotionAudioDependencies,
  ProviderAlignedWord,
  RealAlignmentProvider,
  RealAlignmentProviderResult
} from './contracts';
import {fail} from './errors';
import {hashFileSha256} from './nodeFileHash';

export interface CommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface CommandRunner {
  run(input: Readonly<{
    command: string;
    args: readonly string[];
    cwd?: string;
    stdin?: string;
    env?: Readonly<Record<string, string>>;
    timeoutMs?: number;
  }>): Promise<CommandResult>;
}

function minimalProcessEnvironment(): Record<string, string> {
  const keys = ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'TEMP', 'TMP', 'ComSpec', 'COMSPEC', 'PATHEXT'];
  return Object.fromEntries(keys.flatMap(key => process.env[key] === undefined ? [] : [[key, process.env[key] as string]]));
}

/** Process runner with no shell and an allowlisted base environment. */
export const nodeCommandRunner: CommandRunner = {
  run(input) {
    return new Promise((resolve, reject) => {
      const child = spawn(input.command, [...input.args], {
        cwd: input.cwd,
        env: {...minimalProcessEnvironment(), ...input.env},
        shell: false,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      let stdout = '';
      let stderr = '';
      const maxOutput = 16 * 1024 * 1024;
      let settled = false;
      const finish = (action: () => void) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        action();
      };
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        stdout += chunk;
        if (stdout.length > maxOutput) child.kill();
      });
      child.stderr.on('data', (chunk: string) => {
        stderr += chunk;
        if (stderr.length > maxOutput) child.kill();
      });
      child.on('error', error => finish(() => reject(error)));
      child.on('close', code => finish(() => resolve({exitCode: code ?? -1, stdout, stderr})));
      const timer = setTimeout(() => {
        child.kill();
        finish(() => reject(new Error(`MOTION_AUDIO_PROCESS_TIMEOUT:${input.command}`)));
      }, input.timeoutMs ?? 300_000);
      child.stdin.end(input.stdin ?? '');
    });
  }
};

function diagnostic(value: string, secrets: readonly string[]): string {
  let safe = value.replace(/[\r\n]+/g, ' ').slice(0, 1000);
  for (const secret of secrets.filter(Boolean)) safe = safe.split(secret).join('[redacted]');
  return safe;
}

export interface LocalForcedAlignerOptions {
  /** Executable implementing the JSON stdin/stdout protocol below. No shell is used. */
  readonly command: string;
  readonly args?: readonly string[];
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly timeoutMs?: number;
  readonly secretsToRedact?: readonly string[];
  readonly runner?: CommandRunner;
}

interface LocalAlignmentOutput {
  readonly provider: string;
  readonly model: string;
  readonly words: readonly ProviderAlignedWord[];
}

/**
 * Adapter for a local forced aligner. It sends one JSON object on stdin and
 * expects `{provider, model, words:[{text,startMs,endMs,confidence}]}` on stdout.
 * Audio and script hashes are attached by this adapter to the result that it
 * actually requested; the child process receives no project credentials.
 */
export class LocalJsonForcedAligner implements RealAlignmentProvider {
  private readonly runner: CommandRunner;

  constructor(private readonly options: LocalForcedAlignerOptions) {
    if (!options.command.trim()) fail('MOTION_AUDIO_REAL_ALIGNMENT_REQUIRED', 'local aligner command missing');
    this.runner = options.runner ?? nodeCommandRunner;
  }

  async align(input: Readonly<{
    audioPath: string;
    audioSha256: string;
    script: string;
    scriptSha256: string;
  }>): Promise<RealAlignmentProviderResult> {
    const result = await this.runner.run({
      command: this.options.command,
      args: this.options.args ?? [],
      cwd: this.options.cwd,
      env: this.options.env,
      timeoutMs: this.options.timeoutMs,
      stdin: JSON.stringify({
        schema: 'hsl.motion-audio.align-request.v1',
        audioPath: path.resolve(input.audioPath),
        audioSha256: input.audioSha256,
        script: input.script,
        scriptSha256: input.scriptSha256
      })
    });
    if (result.exitCode !== 0) {
      fail('MOTION_AUDIO_REAL_ALIGNMENT_REQUIRED', diagnostic(result.stderr || `exit ${result.exitCode}`, this.options.secretsToRedact ?? []));
    }
    let output: LocalAlignmentOutput;
    try {
      output = JSON.parse(result.stdout) as LocalAlignmentOutput;
    } catch {
      fail('MOTION_AUDIO_REAL_ALIGNMENT_REQUIRED', 'local aligner returned invalid JSON');
    }
    if (!output.provider?.trim() || !output.model?.trim() || !Array.isArray(output.words)) {
      fail('MOTION_AUDIO_REAL_ALIGNMENT_REQUIRED', 'local aligner response incomplete');
    }
    return {
      evidence: 'forced_alignment',
      provider: output.provider,
      model: output.model,
      audioSha256: input.audioSha256,
      scriptSha256: input.scriptSha256,
      words: output.words
    };
  }
}

function requireCommandSuccess(result: CommandResult, label: string): string {
  if (result.exitCode !== 0) fail('MOTION_AUDIO_SYNC_OUTPUT_INVALID', `${label}:${diagnostic(result.stderr, [])}`);
  return result.stdout;
}

export interface NodeMotionAudioOptions {
  readonly ffmpegPath?: string;
  readonly ffprobePath?: string;
  readonly cwd?: string;
  readonly runner?: CommandRunner;
  readonly aligner?: RealAlignmentProvider;
  readonly localAligner?: LocalForcedAlignerOptions;
  readonly nowIso?: () => string;
}

function atempoFilter(factor: number): string {
  if (!Number.isFinite(factor) || factor <= 0) fail('MOTION_AUDIO_INVALID_DURATION', `atempo:${factor}`);
  const parts: number[] = [];
  let remaining = factor;
  while (remaining < 0.5) { parts.push(0.5); remaining /= 0.5; }
  while (remaining > 2) { parts.push(2); remaining /= 2; }
  parts.push(remaining);
  return parts.map(value => `atempo=${value.toFixed(8)}`).join(',');
}

/** Creates production dependencies without making a provider call during setup. */
export function createNodeMotionAudioDependencies(options: NodeMotionAudioOptions = {}): MotionAudioDependencies {
  const runner = options.runner ?? nodeCommandRunner;
  const ffprobe = options.ffprobePath ?? 'ffprobe';
  const ffmpeg = options.ffmpegPath ?? 'ffmpeg';
  const probeAudio = async (filePath: string): Promise<AudioProbe> => {
    const result = await runner.run({
      command: ffprobe,
      args: ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,sample_rate,channels', '-of', 'json', filePath],
      cwd: options.cwd
    });
    const stdout = requireCommandSuccess(result, 'ffprobe');
    let value: {format?: {duration?: string}; streams?: Array<{codec_type?: string; sample_rate?: string; channels?: number}>};
    try { value = JSON.parse(stdout); }
    catch { fail('MOTION_AUDIO_STREAM_MISSING', 'ffprobe invalid JSON'); }
    const audio = value.streams?.find(stream => stream.codec_type === 'audio');
    return {
      hasAudio: Boolean(audio),
      durationSeconds: Number(value.format?.duration),
      sampleRate: audio?.sample_rate === undefined ? undefined : Number(audio.sample_rate),
      channels: audio?.channels
    };
  };

  const configuredAligner = options.aligner ?? (
    options.localAligner
      ? new LocalJsonForcedAligner({...options.localAligner, runner: options.localAligner.runner ?? runner})
      : undefined
  );
  return {
    probeAudio,
    hashFile: hashFileSha256,
    aligner: configuredAligner,
    nowIso: options.nowIso,
    synchronizer: {
      async synchronize(input) {
        const source = await probeAudio(input.sourcePath);
        if (!source.hasAudio || !(source.durationSeconds > 0)) fail('MOTION_AUDIO_STREAM_MISSING', input.sourcePath);
        const outputDirectory = path.dirname(input.outputPath);
        fs.mkdirSync(outputDirectory, {recursive: true});
        if (fs.existsSync(input.outputPath)) fail('MOTION_AUDIO_SYNC_OUTPUT_INVALID', 'output already exists');
        const extension = path.extname(input.outputPath) || '.wav';
        const temporary = path.join(outputDirectory, `.${path.basename(input.outputPath, extension)}.${randomUUID()}${extension}`);
        const factor = source.durationSeconds / input.targetDurationSeconds;
        const codec = /\.wav$/i.test(extension)
          ? ['-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le']
          : ['-ar', '48000', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k'];
        try {
          const result = await runner.run({
            command: ffmpeg,
            args: ['-y', '-nostdin', '-hide_banner', '-loglevel', 'error', '-i', input.sourcePath,
              '-filter:a', atempoFilter(factor), ...codec, temporary],
            cwd: options.cwd,
            timeoutMs: 3_600_000
          });
          requireCommandSuccess(result, 'ffmpeg');
          const probe = await probeAudio(temporary);
          if (!probe.hasAudio || !(probe.durationSeconds > 0)) fail('MOTION_AUDIO_SYNC_OUTPUT_INVALID', 'ffmpeg output');
          fs.renameSync(temporary, input.outputPath);
          return {outputPath: input.outputPath, method: `ffmpeg-atempo:${factor.toFixed(8)}`};
        } finally {
          try { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); } catch { /* exact staging file only */ }
        }
      }
    }
  };
}

export function localAlignerOptionsFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env
): LocalForcedAlignerOptions | undefined {
  const command = environment.HSL_MOTION_ALIGNER_COMMAND?.trim();
  if (!command) return undefined;
  let args: readonly string[] = [];
  if (environment.HSL_MOTION_ALIGNER_ARGS_JSON) {
    const parsed: unknown = JSON.parse(environment.HSL_MOTION_ALIGNER_ARGS_JSON);
    if (!Array.isArray(parsed) || parsed.some(value => typeof value !== 'string')) {
      fail('MOTION_AUDIO_REAL_ALIGNMENT_REQUIRED', 'HSL_MOTION_ALIGNER_ARGS_JSON must be a JSON string array');
    }
    args = parsed as string[];
  }
  return {
    command,
    args,
    cwd: environment.HSL_MOTION_ALIGNER_CWD,
    timeoutMs: environment.HSL_MOTION_ALIGNER_TIMEOUT_MS
      ? Number(environment.HSL_MOTION_ALIGNER_TIMEOUT_MS)
      : undefined
  };
}

/** Factory used by production wiring; remains fail-closed when no aligner is configured. */
export function createConfiguredNodeMotionAudioDependencies(
  options: Omit<NodeMotionAudioOptions, 'localAligner'> = {},
  environment: NodeJS.ProcessEnv = process.env
): MotionAudioDependencies {
  return createNodeMotionAudioDependencies({
    ...options,
    localAligner: options.aligner ? undefined : localAlignerOptionsFromEnvironment(environment)
  });
}
