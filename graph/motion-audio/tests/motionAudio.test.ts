import assert from 'node:assert/strict';
import {
  MotionAudioDependencies,
  MotionAudioError,
  MotionCue,
  MotionNarrationReceipt,
  RealAlignmentProviderResult,
  LocalJsonForcedAligner,
  createConfiguredNodeMotionAudioDependencies,
  inspectNarrationReceipt,
  prepareMotionNarration,
  sha256Text,
  validateMotionCues
} from '..';

const SCRIPT = 'A água move a válvula.';
const SOURCE_HASH = sha256Text('source audio');
const LOCKED_HASH = sha256Text('locked audio');

function alignment(audioSha256 = LOCKED_HASH, script = SCRIPT): RealAlignmentProviderResult {
  return {
    evidence: 'forced_alignment',
    provider: 'local-test-aligner',
    model: 'fixture-v1',
    audioSha256,
    scriptSha256: sha256Text(script),
    words: [
      {text: 'A', startMs: 100, endMs: 250, confidence: 0.99},
      {text: 'água', startMs: 300, endMs: 620, confidence: 0.98},
      {text: 'move', startMs: 700, endMs: 980, confidence: 0.97},
      {text: 'a', startMs: 1050, endMs: 1150, confidence: 0.99},
      {text: 'válvula', startMs: 1200, endMs: 1800, confidence: 0.96}
    ]
  };
}

function dependencies(overrides: Partial<MotionAudioDependencies> = {}): MotionAudioDependencies {
  return {
    probeAudio: async file => ({hasAudio: true, durationSeconds: file === 'locked.wav' ? 2 : 2.4}),
    hashFile: async file => file === 'locked.wav' ? LOCKED_HASH : SOURCE_HASH,
    synchronizer: {
      synchronize: async ({outputPath}) => ({outputPath, method: 'atempo-before-lock'})
    },
    aligner: {
      align: async input => {
        assert.equal(input.audioPath, 'locked.wav');
        assert.equal(input.audioSha256, LOCKED_HASH);
        return alignment(input.audioSha256, input.script);
      }
    },
    nowIso: () => '2026-09-08T12:00:00.000Z',
    ...overrides
  };
}

async function createReceipt(overrides: Partial<MotionAudioDependencies> = {}): Promise<MotionNarrationReceipt> {
  return prepareMotionNarration({
    script: SCRIPT,
    sourceAudioPath: 'source.mp3',
    synchronizedAudioPath: 'locked.wav',
    targetDurationSeconds: 2,
    intervals: [{intervalId: 'beat-1', startMs: 0, endMs: 2000}],
    phrases: [{phraseId: 'mechanism', intervalId: 'beat-1', startWord: 1, endWord: 5}]
  }, dependencies(overrides));
}

async function expectCode(action: () => Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(action, (error: unknown) => error instanceof MotionAudioError && error.code === code);
}

async function main(): Promise<void> {
  const receipt = await createReceipt();
  assert.equal(receipt.lock.synchronized, true);
  assert.equal(receipt.lock.synchronizationMethod, 'atempo-before-lock');
  assert.equal(receipt.lock.durationSeconds, 2);
  assert.equal(receipt.lock.lockedAudioSha256, LOCKED_HASH);
  assert.equal(receipt.alignment.words[1].startMs, 300);
  assert.deepEqual(receipt.alignment.phrases[0], {
    phraseId: 'mechanism', intervalId: 'beat-1', startWord: 1, endWord: 5,
    text: 'água move a válvula', startMs: 300, endMs: 1800, confidence: 0.96
  });

  const cue: MotionCue = {
    cueId: 'open-valve', intervalId: 'beat-1', atMs: 300, durationMs: 900,
    anchor: {kind: 'phrase', phraseId: 'mechanism', edge: 'start'},
    audioSha256: LOCKED_HASH, alignmentSha256: receipt.alignment.alignmentSha256
  };
  const cueReceipt = validateMotionCues([cue], receipt, {
    lockedAudioSha256: LOCKED_HASH,
    scriptSha256: sha256Text(SCRIPT)
  });
  assert.equal(cueReceipt.cueCount, 1);
  assert.deepEqual(cueReceipt.cueIds, ['open-valve']);

  const stale = inspectNarrationReceipt(receipt, {
    lockedAudioSha256: sha256Text('changed narration'),
    scriptSha256: sha256Text(SCRIPT)
  });
  assert.equal(stale.valid, false);
  assert.deepEqual(stale.invalidates, ['alignment', 'cues', 'motion_renders']);
  assert.ok(stale.reasons.includes('locked_audio_hash_changed'));

  await expectCode(() => prepareMotionNarration({
    script: SCRIPT,
    sourceAudioPath: 'source.mp3',
    intervals: [{intervalId: 'beat-1', startMs: 0, endMs: 2400}],
    phrases: []
  }, dependencies({aligner: undefined})), 'MOTION_AUDIO_REAL_ALIGNMENT_REQUIRED');

  await expectCode(() => createReceipt({
    aligner: {align: async () => ({...alignment(), words: alignment().words.map((word, index) =>
      index === 2 ? {...word, text: 'para'} : word)})}
  }), 'MOTION_AUDIO_ALIGNMENT_WORD_MISMATCH');

  await expectCode(() => prepareMotionNarration({
    script: SCRIPT,
    sourceAudioPath: 'source.mp3',
    targetDurationSeconds: 2,
    intervals: [{intervalId: 'beat-1', startMs: 0, endMs: 2000}],
    phrases: []
  }, dependencies({synchronizer: undefined})), 'MOTION_AUDIO_SYNC_REQUIRED');

  await expectCode(() => prepareMotionNarration({
    script: SCRIPT,
    sourceAudioPath: 'source.mp3', synchronizedAudioPath: 'locked.wav', targetDurationSeconds: 2,
    intervals: [{intervalId: 'beat-1', startMs: 0, endMs: 1100}],
    phrases: [{phraseId: 'too-late', intervalId: 'beat-1', startWord: 1, endWord: 5}]
  }, dependencies()), 'MOTION_AUDIO_PHRASE_OUTSIDE_INTERVAL');

  assert.throws(() => validateMotionCues([{...cue, audioSha256: SOURCE_HASH}], receipt, {
    lockedAudioSha256: LOCKED_HASH,
    scriptSha256: sha256Text(SCRIPT)
  }), error => error instanceof MotionAudioError && error.code === 'MOTION_AUDIO_CUE_HASH_MISMATCH');

  assert.throws(() => validateMotionCues([{...cue, durationMs: 1900}], receipt, {
    lockedAudioSha256: LOCKED_HASH,
    scriptSha256: sha256Text(SCRIPT)
  }), error => error instanceof MotionAudioError && error.code === 'MOTION_AUDIO_CUE_OUTSIDE_INTERVAL');

  let alignerRequest = '';
  const local = new LocalJsonForcedAligner({
    command: 'local-aligner',
    args: ['--json'],
    runner: {run: async request => {
      assert.equal(request.command, 'local-aligner');
      assert.deepEqual(request.args, ['--json']);
      alignerRequest = request.stdin ?? '';
      return {exitCode: 0, stdout: JSON.stringify({
        provider: 'whisperx-local', model: 'large-v3', words: alignment().words
      }), stderr: ''};
    }}
  });
  const localResult = await local.align({
    audioPath: 'locked.wav', audioSha256: LOCKED_HASH,
    script: SCRIPT, scriptSha256: sha256Text(SCRIPT)
  });
  assert.equal(localResult.evidence, 'forced_alignment');
  assert.equal(localResult.audioSha256, LOCKED_HASH);
  assert.equal(JSON.parse(alignerRequest).script, SCRIPT);

  const unconfigured = createConfiguredNodeMotionAudioDependencies({}, {});
  assert.equal(unconfigured.aligner, undefined, 'production factory must fail closed without an aligner command');

  console.log('motion-audio: all tests passed');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
