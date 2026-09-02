import { Context, NodeFn, endStage } from '../runtime';
export const joinFrames = (c: Context): NodeFn => s => {
  const latest = new Map(s.frames.map(f => [f.beatId, f]));
  const totalGenerated = [...latest.values()].filter(f => f.status !== 'failed').length;
  return { __status: endStage(c, s, 'STAGE_02_IMAGE_FRAMES', { totalGenerated }, { framesCount: totalGenerated }) ? 'skipped' : 'ok' };
};
