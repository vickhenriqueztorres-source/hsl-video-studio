import {
  InvalidatedArtifact,
  MOTION_NARRATION_RECEIPT_SCHEMA,
  MotionNarrationReceipt,
  NarrationReceiptFreshness
} from './contracts';
import {fail} from './errors';
import {sha256Canonical} from './hash';
import {sha256Text} from './hash';

const ALL_DOWNSTREAM: readonly InvalidatedArtifact[] = ['alignment', 'cues', 'motion_renders'];

function receiptPayload(receipt: MotionNarrationReceipt): Omit<MotionNarrationReceipt, 'receiptSha256'> {
  const {receiptSha256: _ignored, ...payload} = receipt;
  return payload;
}

function alignmentPayload(receipt: MotionNarrationReceipt) {
  const {alignmentSha256: _ignored, ...payload} = receipt.alignment;
  return payload;
}

export interface CurrentNarrationIdentity {
  readonly lockedAudioSha256: string;
  readonly scriptSha256: string;
  readonly sourceAudioSha256?: string;
}

/** Reports exactly which derived artifacts become unusable after identity drift. */
export function inspectNarrationReceipt(
  receipt: MotionNarrationReceipt,
  current: CurrentNarrationIdentity
): NarrationReceiptFreshness {
  const reasons: string[] = [];
  if (receipt.schema !== MOTION_NARRATION_RECEIPT_SCHEMA) reasons.push('schema_mismatch');
  if (sha256Canonical(receiptPayload(receipt)) !== receipt.receiptSha256) reasons.push('receipt_hash_mismatch');
  if (sha256Canonical(alignmentPayload(receipt)) !== receipt.alignment.alignmentSha256) {
    reasons.push('alignment_hash_mismatch');
  }
  if (
    receipt.alignment.audioSha256 !== receipt.lock.lockedAudioSha256 ||
    receipt.alignment.scriptSha256 !== receipt.scriptSha256
  ) reasons.push('internal_identity_mismatch');
  if (receipt.lock.lockedAudioSha256 !== current.lockedAudioSha256) reasons.push('locked_audio_hash_changed');
  if (receipt.scriptSha256 !== current.scriptSha256) reasons.push('script_hash_changed');
  if (
    current.sourceAudioSha256 !== undefined &&
    receipt.lock.sourceAudioSha256 !== current.sourceAudioSha256
  ) reasons.push('source_audio_hash_changed');
  return {
    valid: reasons.length === 0,
    reasons,
    invalidates: reasons.length ? ALL_DOWNSTREAM : []
  };
}

export interface NarrationReceiptFileVerifier {
  hashFile(filePath: string): Promise<string>;
  probeAudio(filePath: string): Promise<Readonly<{hasAudio: boolean; durationSeconds: number}>>;
}

/** Recomputes identities and duration from disk for resume/pre-mux gates. */
export async function inspectNarrationReceiptFiles(
  receipt: MotionNarrationReceipt,
  script: string,
  verifier: NarrationReceiptFileVerifier,
  durationToleranceMs = 34
): Promise<NarrationReceiptFreshness> {
  const [lockedAudioSha256, sourceAudioSha256, probe] = await Promise.all([
    verifier.hashFile(receipt.lock.lockedPath),
    verifier.hashFile(receipt.lock.sourcePath),
    verifier.probeAudio(receipt.lock.lockedPath)
  ]);
  const base = inspectNarrationReceipt(receipt, {
    lockedAudioSha256,
    sourceAudioSha256,
    scriptSha256: sha256Text(script.trim())
  });
  const reasons = [...base.reasons];
  if (
    !probe.hasAudio ||
    !Number.isFinite(probe.durationSeconds) ||
    Math.abs(probe.durationSeconds - receipt.lock.durationSeconds) * 1000 > durationToleranceMs
  ) reasons.push('locked_audio_duration_changed');
  return {valid: reasons.length === 0, reasons, invalidates: reasons.length ? ALL_DOWNSTREAM : []};
}

export async function assertNarrationReceiptFilesCurrent(
  receipt: MotionNarrationReceipt,
  script: string,
  verifier: NarrationReceiptFileVerifier,
  durationToleranceMs = 34
): Promise<void> {
  const result = await inspectNarrationReceiptFiles(receipt, script, verifier, durationToleranceMs);
  if (!result.valid) fail('MOTION_AUDIO_RECEIPT_STALE', result.reasons.join(','));
}

export function assertNarrationReceiptCurrent(
  receipt: MotionNarrationReceipt,
  current: CurrentNarrationIdentity
): void {
  const result = inspectNarrationReceipt(receipt, current);
  if (!result.valid) fail('MOTION_AUDIO_RECEIPT_STALE', result.reasons.join(','));
}
