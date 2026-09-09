export type MotionAudioErrorCode =
  | 'MOTION_AUDIO_SCRIPT_EMPTY'
  | 'MOTION_AUDIO_INVALID_DURATION'
  | 'MOTION_AUDIO_STREAM_MISSING'
  | 'MOTION_AUDIO_SYNC_REQUIRED'
  | 'MOTION_AUDIO_SYNC_OUTPUT_INVALID'
  | 'MOTION_AUDIO_REAL_ALIGNMENT_REQUIRED'
  | 'MOTION_AUDIO_ALIGNMENT_HASH_MISMATCH'
  | 'MOTION_AUDIO_ALIGNMENT_WORD_MISMATCH'
  | 'MOTION_AUDIO_ALIGNMENT_TIMING_INVALID'
  | 'MOTION_AUDIO_ALIGNMENT_CONFIDENCE_LOW'
  | 'MOTION_AUDIO_INTERVAL_INVALID'
  | 'MOTION_AUDIO_PHRASE_INVALID'
  | 'MOTION_AUDIO_PHRASE_OUTSIDE_INTERVAL'
  | 'MOTION_AUDIO_CUE_INVALID'
  | 'MOTION_AUDIO_CUE_HASH_MISMATCH'
  | 'MOTION_AUDIO_CUE_OUTSIDE_INTERVAL'
  | 'MOTION_AUDIO_CUE_ALIGNMENT_MISMATCH'
  | 'MOTION_AUDIO_RECEIPT_STALE';

export class MotionAudioError extends Error {
  constructor(
    public readonly code: MotionAudioErrorCode,
    detail?: string
  ) {
    super(detail ? `${code}:${detail}` : code);
    this.name = 'MotionAudioError';
  }
}

export function fail(code: MotionAudioErrorCode, detail?: string): never {
  throw new MotionAudioError(code, detail);
}
