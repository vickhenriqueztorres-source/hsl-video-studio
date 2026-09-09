import {
  MOTION_NARRATION_RECEIPT_SCHEMA,
  MotionAudioDependencies,
  MotionAudioPolicy,
  MotionNarrationReceipt,
  NarrationInterval,
  PhraseRequest
} from './contracts';
import {validateAndBuildAlignment, validateNarrationIntervals} from './alignment';
import {fail} from './errors';
import {sha256Canonical, sha256Text} from './hash';
import {tokenizeScript} from './text';

export const DEFAULT_MOTION_AUDIO_POLICY: MotionAudioPolicy = Object.freeze({
  durationToleranceMs: 34,
  intervalToleranceMs: 34,
  cueToleranceMs: 50,
  minimumWordConfidence: 0.5
});

export interface PrepareMotionNarrationInput {
  readonly script: string;
  readonly sourceAudioPath: string;
  readonly targetDurationSeconds?: number;
  /** Required only when synchronization is needed. The source is never overwritten. */
  readonly synchronizedAudioPath?: string;
  readonly intervals: readonly NarrationInterval[];
  readonly phrases: readonly PhraseRequest[];
  readonly policy?: Partial<MotionAudioPolicy>;
}

function policyFrom(input?: Partial<MotionAudioPolicy>): MotionAudioPolicy {
  const policy = {...DEFAULT_MOTION_AUDIO_POLICY, ...input};
  for (const [name, value] of Object.entries(policy)) {
    if (!Number.isFinite(value) || value < 0 || (name === 'minimumWordConfidence' && value > 1)) {
      fail('MOTION_AUDIO_ALIGNMENT_CONFIDENCE_LOW', `${name}:${value}`);
    }
  }
  return policy;
}

function assertProbe(probe: Readonly<{hasAudio: boolean; durationSeconds: number}>, label: string): void {
  if (!probe.hasAudio) fail('MOTION_AUDIO_STREAM_MISSING', label);
  if (!Number.isFinite(probe.durationSeconds) || probe.durationSeconds <= 0) {
    fail('MOTION_AUDIO_INVALID_DURATION', `${label}:${probe.durationSeconds}`);
  }
}

/**
 * Freezes the final narration before motion authorship. Any duration adjustment
 * occurs before hashing and forced alignment. The returned receipt is therefore
 * safe to use as the lineage root for cues and renders.
 */
export async function prepareMotionNarration(
  input: PrepareMotionNarrationInput,
  dependencies: MotionAudioDependencies
): Promise<MotionNarrationReceipt> {
  const script = input.script.trim();
  if (!script || !tokenizeScript(script).length) fail('MOTION_AUDIO_SCRIPT_EMPTY');
  const policy = policyFrom(input.policy);
  if (
    input.targetDurationSeconds !== undefined &&
    (!Number.isFinite(input.targetDurationSeconds) || input.targetDurationSeconds <= 0)
  ) {
    fail('MOTION_AUDIO_INVALID_DURATION', `target:${input.targetDurationSeconds}`);
  }

  const sourceProbe = await dependencies.probeAudio(input.sourceAudioPath);
  assertProbe(sourceProbe, 'source');
  const sourceAudioSha256 = await dependencies.hashFile(input.sourceAudioPath);
  let lockedPath = input.sourceAudioPath;
  let synchronized = false;
  let synchronizationMethod: string | undefined;

  if (input.targetDurationSeconds !== undefined) {
    const driftMs = Math.abs(sourceProbe.durationSeconds - input.targetDurationSeconds) * 1000;
    if (driftMs > policy.durationToleranceMs) {
      if (!dependencies.synchronizer || !input.synchronizedAudioPath) {
        fail('MOTION_AUDIO_SYNC_REQUIRED', `${driftMs.toFixed(3)}ms`);
      }
      if (input.synchronizedAudioPath === input.sourceAudioPath) {
        fail('MOTION_AUDIO_SYNC_OUTPUT_INVALID', 'source overwrite is forbidden');
      }
      const result = await dependencies.synchronizer.synchronize({
        sourcePath: input.sourceAudioPath,
        outputPath: input.synchronizedAudioPath,
        targetDurationSeconds: input.targetDurationSeconds
      });
      if (result.outputPath !== input.synchronizedAudioPath || !result.method.trim()) {
        fail('MOTION_AUDIO_SYNC_OUTPUT_INVALID', result.outputPath);
      }
      if (await dependencies.hashFile(input.sourceAudioPath) !== sourceAudioSha256) {
        fail('MOTION_AUDIO_SYNC_OUTPUT_INVALID', 'source changed during synchronization');
      }
      lockedPath = result.outputPath;
      synchronized = true;
      synchronizationMethod = result.method;
    }
  }

  const lockedProbe = await dependencies.probeAudio(lockedPath);
  assertProbe(lockedProbe, 'locked');
  if (
    input.targetDurationSeconds !== undefined &&
    Math.abs(lockedProbe.durationSeconds - input.targetDurationSeconds) * 1000 > policy.durationToleranceMs
  ) {
    fail('MOTION_AUDIO_SYNC_OUTPUT_INVALID', `duration:${lockedProbe.durationSeconds}`);
  }
  validateNarrationIntervals(input.intervals, lockedProbe.durationSeconds, policy.intervalToleranceMs);
  const lockedAudioSha256 = await dependencies.hashFile(lockedPath);
  const scriptSha256 = sha256Text(script);
  if (!dependencies.aligner) fail('MOTION_AUDIO_REAL_ALIGNMENT_REQUIRED', 'aligner missing');
  const providerResult = await dependencies.aligner.align({
    audioPath: lockedPath,
    audioSha256: lockedAudioSha256,
    script,
    scriptSha256
  });
  const alignment = validateAndBuildAlignment({
    script,
    scriptSha256,
    audioSha256: lockedAudioSha256,
    audioDurationSeconds: lockedProbe.durationSeconds,
    providerResult,
    intervals: input.intervals,
    phrases: input.phrases,
    policy
  });

  const unsigned = {
    schema: MOTION_NARRATION_RECEIPT_SCHEMA,
    scriptSha256,
    lock: {
      sourcePath: input.sourceAudioPath,
      sourceAudioSha256,
      lockedPath,
      lockedAudioSha256,
      durationSeconds: lockedProbe.durationSeconds,
      targetDurationSeconds: input.targetDurationSeconds,
      synchronized,
      synchronizationMethod
    },
    alignment,
    intervals: [...input.intervals],
    createdAt: dependencies.nowIso?.() ?? new Date().toISOString()
  } as const;
  return {...unsigned, receiptSha256: sha256Canonical(unsigned)};
}
