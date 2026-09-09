import {
  AlignedPhrase,
  AlignedWord,
  MotionAudioPolicy,
  NarrationAlignmentReceipt,
  NarrationInterval,
  PhraseRequest,
  RealAlignmentProviderResult
} from './contracts';
import {fail} from './errors';
import {sha256Canonical} from './hash';
import {literalWordSpan, normalizeWord, tokenizeScript} from './text';

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function assertIntervals(
  intervals: readonly NarrationInterval[],
  audioDurationMs: number,
  toleranceMs: number
): ReadonlyMap<string, NarrationInterval> {
  const byId = new Map<string, NarrationInterval>();
  let previousEnd = -1;
  for (const interval of intervals) {
    if (
      !interval.intervalId.trim() ||
      byId.has(interval.intervalId) ||
      !finite(interval.startMs) ||
      !finite(interval.endMs) ||
      interval.startMs < 0 ||
      interval.endMs <= interval.startMs ||
      interval.endMs > audioDurationMs + toleranceMs ||
      interval.startMs < previousEnd
    ) {
      fail('MOTION_AUDIO_INTERVAL_INVALID', interval.intervalId || '<empty>');
    }
    byId.set(interval.intervalId, interval);
    previousEnd = interval.endMs;
  }
  return byId;
}

export interface BuildAlignmentInput {
  readonly script: string;
  readonly scriptSha256: string;
  readonly audioSha256: string;
  readonly audioDurationSeconds: number;
  readonly providerResult: RealAlignmentProviderResult;
  readonly intervals: readonly NarrationInterval[];
  readonly phrases: readonly PhraseRequest[];
  readonly policy: MotionAudioPolicy;
}

/**
 * Validates real provider timestamps and derives phrase bounds only from those
 * timestamps. No duration or word-count interpolation is performed here.
 */
export function validateAndBuildAlignment(input: BuildAlignmentInput): NarrationAlignmentReceipt {
  const {providerResult: result, policy} = input;
  if (result.evidence !== 'forced_alignment' && result.evidence !== 'provider_timestamps') {
    fail('MOTION_AUDIO_REAL_ALIGNMENT_REQUIRED', String(result.evidence));
  }
  if (!result.provider.trim() || !result.model.trim()) {
    fail('MOTION_AUDIO_REAL_ALIGNMENT_REQUIRED', 'provider/model missing');
  }
  if (result.audioSha256 !== input.audioSha256 || result.scriptSha256 !== input.scriptSha256) {
    fail('MOTION_AUDIO_ALIGNMENT_HASH_MISMATCH');
  }

  const scriptWords = tokenizeScript(input.script);
  if (!scriptWords.length || result.words.length !== scriptWords.length) {
    fail('MOTION_AUDIO_ALIGNMENT_WORD_MISMATCH', `${result.words.length}/${scriptWords.length}`);
  }
  const durationMs = input.audioDurationSeconds * 1000;
  const words: AlignedWord[] = [];
  let previousEnd = -1;
  result.words.forEach((word, index) => {
    const expected = scriptWords[index];
    if (normalizeWord(word.text) !== expected.normalized) {
      fail('MOTION_AUDIO_ALIGNMENT_WORD_MISMATCH', `${index}:${word.text}/${expected.text}`);
    }
    if (
      !finite(word.startMs) ||
      !finite(word.endMs) ||
      word.startMs < 0 ||
      word.endMs <= word.startMs ||
      word.startMs < previousEnd ||
      word.endMs > durationMs + policy.intervalToleranceMs
    ) {
      fail('MOTION_AUDIO_ALIGNMENT_TIMING_INVALID', String(index));
    }
    if (
      !finite(word.confidence) ||
      word.confidence < policy.minimumWordConfidence ||
      word.confidence > 1
    ) {
      fail('MOTION_AUDIO_ALIGNMENT_CONFIDENCE_LOW', `${index}:${word.confidence}`);
    }
    words.push({
      index,
      text: expected.text,
      normalized: expected.normalized,
      startMs: word.startMs,
      endMs: word.endMs,
      confidence: word.confidence
    });
    previousEnd = word.endMs;
  });

  const intervals = assertIntervals(input.intervals, durationMs, policy.intervalToleranceMs);
  const phraseIds = new Set<string>();
  const phrases: AlignedPhrase[] = input.phrases.map(phrase => {
    const interval = intervals.get(phrase.intervalId);
    if (
      !phrase.phraseId.trim() ||
      phraseIds.has(phrase.phraseId) ||
      !interval ||
      !Number.isInteger(phrase.startWord) ||
      !Number.isInteger(phrase.endWord) ||
      phrase.startWord < 0 ||
      phrase.endWord <= phrase.startWord ||
      phrase.endWord > words.length
    ) {
      fail('MOTION_AUDIO_PHRASE_INVALID', phrase.phraseId || '<empty>');
    }
    phraseIds.add(phrase.phraseId);
    const startMs = words[phrase.startWord].startMs;
    const endMs = words[phrase.endWord - 1].endMs;
    if (
      startMs < interval.startMs - policy.intervalToleranceMs ||
      endMs > interval.endMs + policy.intervalToleranceMs
    ) {
      fail('MOTION_AUDIO_PHRASE_OUTSIDE_INTERVAL', phrase.phraseId);
    }
    return {
      ...phrase,
      text: literalWordSpan(input.script, scriptWords, phrase.startWord, phrase.endWord),
      startMs,
      endMs,
      confidence: Math.min(...words.slice(phrase.startWord, phrase.endWord).map(word => word.confidence))
    };
  });

  const unsigned = {
    evidence: result.evidence,
    provider: result.provider,
    model: result.model,
    audioSha256: input.audioSha256,
    scriptSha256: input.scriptSha256,
    words,
    phrases
  } as const;
  return {...unsigned, alignmentSha256: sha256Canonical(unsigned)};
}

export function validateNarrationIntervals(
  intervals: readonly NarrationInterval[],
  audioDurationSeconds: number,
  toleranceMs: number
): void {
  assertIntervals(intervals, audioDurationSeconds * 1000, toleranceMs);
}
