import path from 'node:path';
import fs from 'node:fs';
import {Context, NodeFn, paths} from '../runtime';
export const sfxRender = (c: Context): NodeFn => async s => {
  if (!s.soundDesign?.audioPlanPath || !fs.existsSync(s.soundDesign.audioPlanPath)) throw new Error('SFX_AUDIO_PLAN_REQUIRED');
  const out = path.join(paths(c, s).run, 'audio', 'sfx-track.wav');
  if (s.sfxTrackPath && fs.existsSync(out) && fs.statSync(out).size > 0 && s.sfxQaPath && fs.existsSync(s.sfxQaPath)) {
    return { __status: 'skipped' as const };
  }
  const r = await c.deps.renderSfx(c.root, s.soundDesign.audioPlanPath, out, s.scenePlan!.totalDurationSeconds,
    {episodeId: s.episodeId, scenePlan: s.scenePlan!});
  if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error('SFX_TRACK_MISSING');
  return {sfxTrackPath: out, sfxPlanPath: r.planPath ?? null, sfxQaPath: r.qaPath ?? null,
    sfxResolved: r.resolved, sfxUnresolved: r.unresolved, ...(r.cached ? {__status: 'skipped' as const} : {})};
};
