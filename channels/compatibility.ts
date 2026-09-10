import fs from 'node:fs';
import path from 'node:path';
import type { ChannelId, RunChannelSnapshot } from './types';
import { hslProfile } from './hsl/profile';
import { createChannelSnapshot, verifySnapshotIntegrity } from './snapshot';

/**
 * Verifica se um diretório de execução pertence a uma run histórica do canal HSL criada antes da introdução de multicanais.
 * Regra estrita: Não assume HSL para qualquer estado desconhecido; exige evidência física de HSL_EPISODE ou manifest HSL.
 */
export function isHistoricalHslRun(episodeIdOrState: string | { episodeId?: string }, runDir: string = ''): boolean {
  const episodeId = typeof episodeIdOrState === 'string' ? episodeIdOrState : (episodeIdOrState?.episodeId ?? '');
  if (episodeId.startsWith('HSL_EPISODE_') || episodeId.startsWith('HSL_')) return true;
  if (runDir) {
    const manifestPath = path.join(runDir, 'run-manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (data && (data.episodeId?.startsWith('HSL_') || data.stages?.STAGE_01_SCENE_PLAN)) {
          return true;
        }
      } catch {}
    }
  }
  return false;
}

/**
 * Cria snapshot HSL compatível para runs históricas que não tinham `run-channel.json`.
 */
export function createHistoricalHslSnapshot(_episodeId?: string): RunChannelSnapshot {
  return createChannelSnapshot(hslProfile, '2026-09-01T00:00:00.000Z');
}

/**
 * Valida consistência de identidade de canal na retomada ou execução.
 * Bloqueia estritamente qualquer tentativa de troca de canal em checkpoints em andamento.
 */
export function assertChannelConsistency(
  requestedChannelId: string | undefined,
  existingSnapshot: RunChannelSnapshot | null | undefined
): void {
  if (!existingSnapshot) return;
  if (!verifySnapshotIntegrity(existingSnapshot)) {
    throw new Error('CHANNEL_SNAPSHOT_INVALID: O snapshot de canal persistido nesta run falhou na verificação de integridade de hashes.');
  }
  if (requestedChannelId) {
    const norm = requestedChannelId.trim().toLowerCase() as ChannelId;
    if (norm !== existingSnapshot.channelId) {
      throw new Error(
        `CHANNEL_IDENTITY_MISMATCH: O checkpoint pertence ao canal '${existingSnapshot.channelId}', mas a invocação solicitou '${norm}'. ` +
        `Trocar o canal de um episódio iniciado é proibido. Inicie uma nova run.`
      );
    }
  }
}
