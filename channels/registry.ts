import type { ChannelId, ChannelProfile, RunChannelSnapshot } from './types';
import { hslProfile } from './hsl/profile';
import { brechaProfile } from './brecha/profile';
import { createChannelSnapshot } from './snapshot';

const PROFILES: Record<ChannelId, ChannelProfile> = {
  hsl: hslProfile,
  brecha: brechaProfile,
};

/**
 * Obtém o perfil cadastrado do canal.
 * ISO/Regra de Ouro: Nunca assume HSL silenciosamente para canal desconhecido. Lança CHANNEL_UNKNOWN.
 */
export function getChannelProfile(channelId: string): ChannelProfile {
  const normalized = (channelId || '').trim().toLowerCase() as ChannelId;
  const profile = PROFILES[normalized];
  if (!profile) {
    throw new Error(`CHANNEL_UNKNOWN: Canal '${channelId}' não reconhecido. Opções válidas: ${Object.keys(PROFILES).join(', ')}`);
  }
  return profile;
}

export function listChannels(): ChannelProfile[] {
  return Object.values(PROFILES);
}

export function isKnownChannel(channelId: string): channelId is ChannelId {
  return Object.prototype.hasOwnProperty.call(PROFILES, (channelId || '').trim().toLowerCase());
}

/**
 * Resolve o snapshot imutável para uma nova run do canal especificado.
 */
export function resolveRunChannelSnapshot(channelId: string): RunChannelSnapshot {
  const profile = getChannelProfile(channelId);
  return createChannelSnapshot(profile);
}
