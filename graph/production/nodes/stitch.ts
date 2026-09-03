import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, validMedia, endStage } from '../runtime';
import { chunkPath, FRAME_RANGES } from '../lib/remotion';
import { writeConcatList } from '../lib/ffmpeg';
export const stitch = (c: Context): NodeFn => async s => {
  const p = paths(c, s);
  const skipped = validMedia(c, p.final) || validMedia(c, p.visual);
  if (!skipped) {
    const latest=new Map(s.renderChunks.map(x=>[x.index,x]));
    const chunks = s.options.graph.testRender ? [...latest.values()].sort((a,b)=>a.index-b.index).map(x=>x.outPath) : FRAME_RANGES.map((_, i) => chunkPath(c.root, s.episodeId, i));
    if (chunks.some(f => !validMedia(c, f))) throw new Error('FFMPEG_CONCAT_MISSING_CHUNKS');
    const list = path.join(c.root, 'out', 'concat_' + s.episodeId.toLowerCase() + '.txt');
    writeConcatList(list, chunks);
    if(s.options.graph.testRender && chunks.length===1) { fs.mkdirSync(path.dirname(p.visual),{recursive:true}); fs.copyFileSync(chunks[0],p.visual); } else await c.deps.concatChunks(list, p.visual);
    if (!validMedia(c, p.visual) || fs.statSync(p.visual).size < 100000) throw new Error('REMOTION_RENDER_GATE_FATAL: Falha ao renderizar trilha visual.');
    for (const file of [...chunks, list]) if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  endStage(c, s, 'STAGE_07_REMOTION_RENDER', undefined, { videoVisualPath: p.visual });
  return { visualTrackPath: p.visual, __status: skipped ? 'skipped' : 'ok' };
};
