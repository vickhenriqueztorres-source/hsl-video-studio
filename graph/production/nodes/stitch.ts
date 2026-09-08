import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, validMediaDuration, endStage } from '../runtime';
import { chunkPath, frameRangeDurationSeconds, renderDurationSeconds, renderFrameRanges } from '../lib/remotion';
import { writeConcatList } from '../lib/ffmpeg';
import { createRenderIdentity, cachedVisualOrFinal, cachedRender, chunkIdentity, invalidateReceipt, writeReceipt, assertRenderSucceeded } from '../lib/renderIdentity';
export const stitch = (c: Context): NodeFn => async s => {
  const p = paths(c, s);
  const expectedSeconds = renderDurationSeconds(s);
  const identity = createRenderIdentity(c, s);
  const skipped = cachedVisualOrFinal(c, s, identity);
  if (!skipped) {
    const ranges = renderFrameRanges(s);
    const chunks = ranges.map((_, i) => chunkPath(c.root, s.episodeId, i));
    const chunksValid = () => chunks.every((f, i) => cachedRender(c, f, frameRangeDurationSeconds(ranges[i]), 'chunk', chunkIdentity(identity, i, ranges[i])));
    if (!chunksValid()) throw new Error('FFMPEG_CONCAT_MISSING_OR_STALE_CHUNKS');
    const list = path.join(c.root, 'out', 'concat_' + s.episodeId.toLowerCase() + '.txt');
    writeConcatList(list, chunks);
    invalidateReceipt(p.visual);
    if(s.options.graph.testRender && chunks.length===1) { fs.mkdirSync(path.dirname(p.visual),{recursive:true}); fs.copyFileSync(chunks[0],p.visual); } else assertRenderSucceeded(await c.deps.concatChunks(list, p.visual));
    if (!validMediaDuration(c, p.visual, expectedSeconds) || fs.statSync(p.visual).size < 100000) throw new Error(`REMOTION_RENDER_GATE_FATAL: duração visual diferente de ${expectedSeconds}s.`);
    if (createRenderIdentity(c, s).hash !== identity.hash || !chunksValid()) throw new Error('RENDER_INPUT_CHANGED_DURING_STITCH');
    writeReceipt(p.visual, 'visual', identity.hash);
    for (const chunk of chunks) invalidateReceipt(chunk);
    for (const file of [...chunks, list]) if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  endStage(c, s, 'STAGE_07_REMOTION_RENDER', undefined, { videoVisualPath: p.visual });
  return { visualTrackPath: p.visual, __status: skipped ? 'skipped' : 'ok' };
};
