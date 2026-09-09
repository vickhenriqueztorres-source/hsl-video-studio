import {
  CueValidationReceipt,
  MotionAudioPolicy,
  MotionCue,
  MotionNarrationReceipt,
  NarrationInterval
} from './contracts';
import {fail} from './errors';
import {sha256Canonical} from './hash';
import {assertNarrationReceiptCurrent} from './invalidation';
import {DEFAULT_MOTION_AUDIO_POLICY} from './narrationLock';

function anchorTime(cue: MotionCue, receipt: MotionNarrationReceipt): number {
  if (cue.anchor.kind === 'word') {
    const word = receipt.alignment.words[cue.anchor.wordIndex];
    if (!word) fail('MOTION_AUDIO_CUE_INVALID', `${cue.cueId}:word:${cue.anchor.wordIndex}`);
    return cue.anchor.edge === 'start' ? word.startMs : word.endMs;
  }
  const anchor = cue.anchor;
  const phrase = receipt.alignment.phrases.find(item => item.phraseId === anchor.phraseId);
  if (!phrase) fail('MOTION_AUDIO_CUE_INVALID', `${cue.cueId}:phrase:${anchor.phraseId}`);
  return anchor.edge === 'start' ? phrase.startMs : phrase.endMs;
}

function intervalMap(receipt: MotionNarrationReceipt): ReadonlyMap<string, NarrationInterval> {
  return new Map(receipt.intervals.map(interval => [interval.intervalId, interval]));
}

export function validateMotionCues(
  cues: readonly MotionCue[],
  receipt: MotionNarrationReceipt,
  current: Readonly<{lockedAudioSha256: string; scriptSha256: string}>,
  policyInput?: Partial<MotionAudioPolicy>
): CueValidationReceipt {
  assertNarrationReceiptCurrent(receipt, current);
  const policy = {...DEFAULT_MOTION_AUDIO_POLICY, ...policyInput};
  if (!Number.isFinite(policy.cueToleranceMs) || policy.cueToleranceMs < 0) {
    fail('MOTION_AUDIO_CUE_INVALID', `tolerance:${policy.cueToleranceMs}`);
  }
  const intervals = intervalMap(receipt);
  const seen = new Set<string>();
  for (const cue of cues) {
    if (
      !cue.cueId.trim() ||
      seen.has(cue.cueId) ||
      !Number.isFinite(cue.atMs) ||
      cue.atMs < 0 ||
      (cue.durationMs !== undefined && (!Number.isFinite(cue.durationMs) || cue.durationMs < 0))
    ) {
      fail('MOTION_AUDIO_CUE_INVALID', cue.cueId || '<empty>');
    }
    seen.add(cue.cueId);
    if (
      cue.audioSha256 !== receipt.lock.lockedAudioSha256 ||
      cue.alignmentSha256 !== receipt.alignment.alignmentSha256
    ) {
      fail('MOTION_AUDIO_CUE_HASH_MISMATCH', cue.cueId);
    }
    const interval = intervals.get(cue.intervalId);
    if (!interval) fail('MOTION_AUDIO_CUE_INVALID', `${cue.cueId}:interval`);
    const endMs = cue.atMs + (cue.durationMs ?? 0);
    if (
      cue.atMs < interval.startMs - policy.intervalToleranceMs ||
      endMs > interval.endMs + policy.intervalToleranceMs
    ) {
      fail('MOTION_AUDIO_CUE_OUTSIDE_INTERVAL', cue.cueId);
    }
    const expected = anchorTime(cue, receipt);
    if (Math.abs(cue.atMs - expected) > policy.cueToleranceMs) {
      fail('MOTION_AUDIO_CUE_ALIGNMENT_MISMATCH', `${cue.cueId}:${cue.atMs}/${expected}`);
    }
  }

  const canonicalCues = [...cues].sort((left, right) => left.atMs - right.atMs || left.cueId.localeCompare(right.cueId));
  return {
    schema: 'hsl.motion-cues.validation.v1',
    audioSha256: receipt.lock.lockedAudioSha256,
    alignmentSha256: receipt.alignment.alignmentSha256,
    cueCount: canonicalCues.length,
    cueIds: canonicalCues.map(cue => cue.cueId),
    cuesSha256: sha256Canonical(canonicalCues)
  };
}
