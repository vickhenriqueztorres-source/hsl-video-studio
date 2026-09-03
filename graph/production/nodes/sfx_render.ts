import path from 'node:path';
import fs from 'node:fs';
import {Context, NodeFn, paths} from '../runtime';
export const sfxRender = (c: Context): NodeFn => async s => {
  if (s.options.graph.mediaMode === 'legacy') return {__status: 'skipped'};
  const out = path.join(paths(c, s).run, 'audio', 'sfx-track.wav');
  const r = await c.deps.renderSfx(c.root, s.soundDesign!.audioPlanPath, out, s.scenePlan!.totalDurationSeconds,
    {episodeId: s.episodeId, scenePlan: s.scenePlan!});
  if (!fs.existsSync(out)) throw new Error('SFX_TRACK_MISSING');
  return {sfxTrackPath: out, sfxPlanPath: r.planPath ?? null, sfxQaPath: r.qaPath ?? null,
    sfxResolved: r.resolved, sfxUnresolved: r.unresolved, ...(r.cached ? {__status: 'skipped' as const} : {})};
};
