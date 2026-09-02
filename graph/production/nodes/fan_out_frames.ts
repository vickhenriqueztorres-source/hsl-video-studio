import { Context, NodeFn, beginStage } from '../runtime';
export const fanOutFrames = (c: Context): NodeFn => s => ({ __status: beginStage(c, s, 'STAGE_02_IMAGE_FRAMES') ? 'skipped' : 'ok' });
