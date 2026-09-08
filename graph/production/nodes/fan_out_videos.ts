import { Context, NodeFn, beginStage } from '../runtime';
export const fanOutVideos = (c: Context): NodeFn => s => ({ __status: beginStage(c, s, 'STAGE_03_FIREFLY_VIDEOS') ? 'skipped' : 'ok' });
