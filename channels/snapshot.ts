import { createHash } from 'node:crypto';
import type { ChannelProfile, RunChannelSnapshot } from './types';

/**
 * Serialização canônica determinística com chaves ordenadas para cálculo imutável de hash SHA-256.
 */
export function canonicalJsonString(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJsonString).join(',') + ']';
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const pairs = keys
    .filter(k => (value as Record<string, unknown>)[k] !== undefined)
    .map(k => `${JSON.stringify(k)}:${canonicalJsonString((value as Record<string, unknown>)[k])}`);
  return '{' + pairs.join(',') + '}';
}

export function hashCanonical(value: unknown): string {
  return createHash('sha256').update(canonicalJsonString(value), 'utf8').digest('hex');
}

/**
 * Cria snapshot congelado imutável do perfil de canal para uma execução específica.
 */
export function createChannelSnapshot(profile: ChannelProfile, resolvedAt = new Date().toISOString()): RunChannelSnapshot {
  const policyHashes = {
    editorial: hashCanonical(profile.editorial),
    visual: hashCanonical(profile.visual),
    narration: hashCanonical(profile.narration),
    motion: hashCanonical(profile.motion),
    packaging: hashCanonical(profile.packaging),
    compliance: hashCanonical(profile.compliance),
  };

  const profileHash = hashCanonical({
    id: profile.id,
    version: profile.version,
    locale: profile.locale,
    policyHashes,
    references: profile.references,
  });

  return {
    channelId: profile.id,
    profileVersion: profile.version,
    profileHash,
    resolvedAt,
    profile: Object.freeze(JSON.parse(JSON.stringify(profile))),
    policyHashes,
  };
}

/**
 * Valida se um snapshot de canal mantém sua integridade de hashes intacta.
 */
export function verifySnapshotIntegrity(snapshot: RunChannelSnapshot): boolean {
  if (!snapshot || !snapshot.profile || !snapshot.policyHashes) return false;
  const p = snapshot.profile;

  const expectedEditorial = hashCanonical(p.editorial);
  const expectedVisual = hashCanonical(p.visual);
  const expectedNarration = hashCanonical(p.narration);
  const expectedMotion = hashCanonical(p.motion);
  const expectedPackaging = hashCanonical(p.packaging);
  const expectedCompliance = hashCanonical(p.compliance);

  if (snapshot.policyHashes.editorial !== expectedEditorial) return false;
  if (snapshot.policyHashes.visual !== expectedVisual) return false;
  if (snapshot.policyHashes.narration !== expectedNarration) return false;
  if (snapshot.policyHashes.motion !== expectedMotion) return false;
  if (snapshot.policyHashes.packaging !== expectedPackaging) return false;
  if (snapshot.policyHashes.compliance !== expectedCompliance) return false;

  const expectedProfileHash = hashCanonical({
    id: p.id,
    version: p.version,
    locale: p.locale,
    policyHashes: snapshot.policyHashes,
    references: p.references,
  });

  return snapshot.profileHash === expectedProfileHash;
}
