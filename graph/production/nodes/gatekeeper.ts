import path from 'node:path';
import fs from 'node:fs';
import { Context, NodeFn, paths, readJson, withStage, writeJson, copyFile } from '../runtime';
import { GatekeeperResult } from '../../../hsl/core/hslValidationGatekeeper';
export const gatekeeper = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_06_PRE_RENDER_GATE', async () => {
  const saved = readJson<{ gatekeeperStatus: string; validBeats: number; autoRecovered: boolean; totalBeats: number }>(path.join(paths(c, s).run, 'HSL_EXECUTION_STATE.json'));
  const assetsGood = ![...s.frames, ...s.videos].some(a => a.status === 'failed');
  let result: GatekeeperResult | undefined = s.options.graph.mediaMode==='real' ? undefined : saved?.gatekeeperStatus === 'PASSED' && assetsGood ? {
    episodeId: s.episodeId, passed: true, autoRecovered: saved.autoRecovered, verifiedBeatsCount: saved.validBeats,
    totalBeatsCount: saved.totalBeats, statePath: path.join(c.root, 'HSL_EXECUTION_STATE.json'),
  } : await c.deps.gatekeeper(s.episodeId);
  if(s.options.graph.mediaMode==='real') {
    const shadow=`${s.episodeId}_GRAPH_GATE`,shadowRun=path.join(c.root,'runs',shadow);
    const beats=s.scenePlan!.beats.map(b=>({...b,outputFramePath:`runs/${shadow}/frames/${b.beatId}.png`,outputVideoPath:`runs/${shadow}/videos/${b.beatId}.mp4`}));
    writeJson(path.join(shadowRun,'scene-plan.json'),{...s.scenePlan,episodeId:shadow,beats});
    for(const f of s.frames) if(fs.existsSync(f.path))copyFile(f.path,path.join(shadowRun,'frames',`${f.beatId}.png`));
    for(const v of s.videos) if(fs.existsSync(v.path))copyFile(v.path,path.join(shadowRun,'videos',`${v.beatId}.mp4`));
    result=await c.deps.gatekeeper(shadow);
    result={...result,episodeId:s.episodeId,statePath:path.join(c.root,'HSL_EXECUTION_STATE.json')};
  }
  return { update: { gatekeeper: { passed: result!.passed, blockedReason: result!.blocked_reason, verifiedBeats: result!.verifiedBeatsCount, autoRecovered: result!.autoRecovered, attempts: (s.gatekeeper?.attempts ?? 0) + 1 },
    ...(!result!.passed ? { productionStatus: 'BLOCKED_PRE_RENDER' as const } : {}) },
    skipped: saved?.gatekeeperStatus === 'PASSED' && assetsGood && s.options.graph.mediaMode==='legacy',
    metrics: { verifiedBeats: result!.verifiedBeatsCount, autoRecovered: result!.autoRecovered },
    failed: result!.passed ? undefined : result!.blocked_reason || 'Falha de validação no gatekeeper.' };
});
