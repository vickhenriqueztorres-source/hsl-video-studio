import path from 'node:path';
import { Context, NodeFn, paths, readJson, withStage } from '../runtime';
import { GatekeeperResult } from '../../../hsl/core/hslValidationGatekeeper';
import { assertMediaCoverage } from '../lib/mediaCoverage';

export const gatekeeper = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_06_PRE_RENDER_GATE', async () => {
  assertMediaCoverage(c, s);
  const saved = readJson<{ gatekeeperStatus: string; validBeats: number; autoRecovered: boolean; totalBeats: number }>(path.join(paths(c, s).run, 'HSL_EXECUTION_STATE.json'));
  const assetsGood = ![...s.frames, ...s.videos].some(a => a.status === 'failed');
  const isLegacy = s.options.graph.mediaMode === 'legacy';
  const result: GatekeeperResult = (isLegacy && saved?.gatekeeperStatus === 'PASSED' && assetsGood)
    ? {
        episodeId: s.episodeId,
        passed: true,
        autoRecovered: saved.autoRecovered,
        verifiedBeatsCount: saved.validBeats,
        totalBeatsCount: saved.totalBeats,
        statePath: path.join(c.root, 'HSL_EXECUTION_STATE.json'),
      }
    : await c.deps.gatekeeper(s.episodeId, { disableAutoRecovery: !isLegacy });

  return {
    update: {
      gatekeeper: {
        passed: result.passed,
        blockedReason: result.blocked_reason,
        verifiedBeats: result.verifiedBeatsCount,
        autoRecovered: result.autoRecovered,
        attempts: (s.gatekeeper?.attempts ?? 0) + 1,
      },
      ...(!result.passed ? { productionStatus: 'BLOCKED_PRE_RENDER' as const } : {}),
    },
    skipped: isLegacy && saved?.gatekeeperStatus === 'PASSED' && assetsGood,
    metrics: { verifiedBeats: result.verifiedBeatsCount, autoRecovered: result.autoRecovered },
    failed: result.passed ? undefined : result.blocked_reason || 'Falha de validação no gatekeeper.',
  };
});
