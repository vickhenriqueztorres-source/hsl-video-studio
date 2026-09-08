import { Context, NodeFn, endStage } from '../runtime';
import {assertMediaCoverage} from '../lib/mediaCoverage';
export const joinVideos = (c: Context): NodeFn => s => {
  assertMediaCoverage(c,s);
  const latest = new Map(s.videos.map(f => [f.beatId, f]));
  const totalVideos = [...latest.values()].filter(f => f.status !== 'failed').length;
  return { __status: endStage(c, s, 'STAGE_03_FIREFLY_VIDEOS', { totalVideos }, { videosCount: totalVideos }) ? 'skipped' : 'ok' };
};
