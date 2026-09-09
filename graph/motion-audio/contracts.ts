export const MOTION_NARRATION_RECEIPT_SCHEMA = 'hsl.motion-narration.receipt.v1' as const;

export type AlignmentEvidence = 'forced_alignment' | 'provider_timestamps';

export interface AudioProbe {
  readonly hasAudio: boolean;
  readonly durationSeconds: number;
  readonly sampleRate?: number;
  readonly channels?: number;
}

export interface NarrationInterval {
  readonly intervalId: string;
  readonly startMs: number;
  readonly endMs: number;
}

export interface PhraseRequest {
  readonly phraseId: string;
  readonly intervalId: string;
  /** Inclusive, zero-based word index in the canonical script tokenization. */
  readonly startWord: number;
  /** Exclusive, zero-based word index in the canonical script tokenization. */
  readonly endWord: number;
}

export interface ProviderAlignedWord {
  readonly text: string;
  readonly startMs: number;
  readonly endMs: number;
  /** Confidence reported by the alignment engine, in the closed interval [0, 1]. */
  readonly confidence: number;
}

export interface RealAlignmentProviderResult {
  readonly evidence: AlignmentEvidence;
  readonly provider: string;
  readonly model: string;
  readonly audioSha256: string;
  readonly scriptSha256: string;
  readonly words: readonly ProviderAlignedWord[];
}

export interface RealAlignmentProvider {
  align(input: Readonly<{
    audioPath: string;
    audioSha256: string;
    script: string;
    scriptSha256: string;
  }>): Promise<RealAlignmentProviderResult>;
}

export interface AudioSynchronizer {
  synchronize(input: Readonly<{
    sourcePath: string;
    outputPath: string;
    targetDurationSeconds: number;
  }>): Promise<Readonly<{outputPath: string; method: string}>>;
}

export interface MotionAudioDependencies {
  probeAudio(filePath: string): Promise<AudioProbe>;
  hashFile(filePath: string): Promise<string>;
  readonly aligner?: RealAlignmentProvider;
  readonly synchronizer?: AudioSynchronizer;
  nowIso?(): string;
}

export interface MotionAudioPolicy {
  readonly durationToleranceMs: number;
  readonly intervalToleranceMs: number;
  readonly cueToleranceMs: number;
  readonly minimumWordConfidence: number;
}

export interface AlignedWord {
  readonly index: number;
  readonly text: string;
  readonly normalized: string;
  readonly startMs: number;
  readonly endMs: number;
  readonly confidence: number;
}

export interface AlignedPhrase {
  readonly phraseId: string;
  readonly intervalId: string;
  readonly text: string;
  readonly startWord: number;
  readonly endWord: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly confidence: number;
}

export interface NarrationLockReceipt {
  readonly sourcePath: string;
  readonly sourceAudioSha256: string;
  readonly lockedPath: string;
  readonly lockedAudioSha256: string;
  readonly durationSeconds: number;
  readonly targetDurationSeconds?: number;
  readonly synchronized: boolean;
  readonly synchronizationMethod?: string;
}

export interface NarrationAlignmentReceipt {
  readonly evidence: AlignmentEvidence;
  readonly provider: string;
  readonly model: string;
  readonly audioSha256: string;
  readonly scriptSha256: string;
  readonly words: readonly AlignedWord[];
  readonly phrases: readonly AlignedPhrase[];
  readonly alignmentSha256: string;
}

export interface MotionNarrationReceipt {
  readonly schema: typeof MOTION_NARRATION_RECEIPT_SCHEMA;
  readonly scriptSha256: string;
  readonly lock: NarrationLockReceipt;
  readonly alignment: NarrationAlignmentReceipt;
  readonly intervals: readonly NarrationInterval[];
  readonly createdAt: string;
  /** Hash of every receipt field except this property. */
  readonly receiptSha256: string;
}

export type MotionCueAnchor = Readonly<
  | {kind: 'word'; wordIndex: number; edge: 'start' | 'end'}
  | {kind: 'phrase'; phraseId: string; edge: 'start' | 'end'}
>;

export interface MotionCue {
  readonly cueId: string;
  readonly intervalId: string;
  readonly atMs: number;
  readonly durationMs?: number;
  readonly anchor: MotionCueAnchor;
  readonly audioSha256: string;
  readonly alignmentSha256: string;
}

export interface CueValidationReceipt {
  readonly schema: 'hsl.motion-cues.validation.v1';
  readonly audioSha256: string;
  readonly alignmentSha256: string;
  readonly cueCount: number;
  readonly cueIds: readonly string[];
  readonly cuesSha256: string;
}

export type InvalidatedArtifact = 'alignment' | 'cues' | 'motion_renders';

export interface NarrationReceiptFreshness {
  readonly valid: boolean;
  readonly reasons: readonly string[];
  readonly invalidates: readonly InvalidatedArtifact[];
}
