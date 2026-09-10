import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getChannelProfile,
  listChannels,
  isKnownChannel,
  resolveRunChannelSnapshot,
  verifySnapshotIntegrity,
  assertChannelConsistency,
  isHistoricalHslRun,
  createHistoricalHslSnapshot
} from '../index';

test('channel registry: recognizes hsl and brecha, rejects unknown without silent fallback', () => {
  assert.equal(isKnownChannel('hsl'), true);
  assert.equal(isKnownChannel('brecha'), true);
  assert.equal(isKnownChannel('invalid_channel'), false);

  const hsl = getChannelProfile('hsl');
  assert.equal(hsl.id, 'hsl');
  assert.equal(hsl.locale, 'en-US');
  assert.equal(hsl.visual.palette.accent, '#FFE500');

  const brecha = getChannelProfile('brecha');
  assert.equal(brecha.id, 'brecha');
  assert.equal(brecha.locale, 'pt-BR');
  assert.equal(brecha.visual.palette.accent, '#FF5A47');
  assert.equal(brecha.editorial.requiredSignature, 'Momento da Brecha');

  assert.throws(
    () => getChannelProfile('desconhecido'),
    /CHANNEL_UNKNOWN: Canal 'desconhecido' não reconhecido/
  );
});

test('channel snapshot: canonical hashes are deterministic and verify integrity', () => {
  const s1 = resolveRunChannelSnapshot('brecha');
  const s2 = resolveRunChannelSnapshot('brecha');

  assert.equal(s1.channelId, 'brecha');
  assert.equal(s1.profileHash, s2.profileHash);
  assert.deepEqual(s1.policyHashes, s2.policyHashes);
  assert.equal(verifySnapshotIntegrity(s1), true);

  // Tampering detection
  const tampered = structuredClone(s1);
  (tampered.profile.editorial as any).targetDurationMinutes = [99, 99];
  assert.equal(verifySnapshotIntegrity(tampered), false);
});

test('channel consistency: rejects channel mismatch on resume', () => {
  const brechaSnap = resolveRunChannelSnapshot('brecha');
  assert.doesNotThrow(() => assertChannelConsistency('brecha', brechaSnap));
  assert.doesNotThrow(() => assertChannelConsistency(undefined, brechaSnap));

  assert.throws(
    () => assertChannelConsistency('hsl', brechaSnap),
    /CHANNEL_IDENTITY_MISMATCH/
  );
});

test('historical compatibility: detects HSL episodes correctly', () => {
  assert.equal(isHistoricalHslRun('HSL_EPISODE_001', '/dummy'), true);
  assert.equal(isHistoricalHslRun('BRECHA_EPISODE_001', '/dummy'), false);

  const hist = createHistoricalHslSnapshot();
  assert.equal(hist.channelId, 'hsl');
  assert.equal(verifySnapshotIntegrity(hist), true);
});
