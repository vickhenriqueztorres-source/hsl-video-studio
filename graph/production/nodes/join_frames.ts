import { Context, NodeFn, endStage } from '../runtime';
import {resolveValidatedFrames} from '../lib/frameInventory';
export const joinFrames = (c: Context): NodeFn => s => {
  const recovered=s.options.graph.mediaMode==='real'&&s.scenePlan
    ? resolveValidatedFrames(c,s,s.scenePlan.beats.filter(beat=>beat.mediaProvider!=='remotion-authored').map(beat=>beat.beatId))
    : s.frames;
  const latest = new Map(recovered.map(f => [f.beatId, f]));
  const totalGenerated = [...latest.values()].filter(f => f.status !== 'failed').length;
  return {frames:recovered,__status: endStage(c, s, 'STAGE_02_IMAGE_FRAMES', { totalGenerated }, { framesCount: totalGenerated }) ? 'skipped' : 'ok' };
};
