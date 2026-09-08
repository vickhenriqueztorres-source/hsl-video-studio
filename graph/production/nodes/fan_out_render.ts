import { Send } from '@langchain/langgraph';
import { Context, NodeFn } from '../runtime';
import { State } from '../state';
import { chunkPath, frameRangeDurationSeconds, renderFrameRanges } from '../lib/remotion';
import { createRenderIdentity, cachedVisualOrFinal, cachedRender, chunkIdentity } from '../lib/renderIdentity';
export const fanOutRender: NodeFn = () => ({ __status: 'skipped' });
export const routeRender = (c: Context) => (s: State): Send[] | 'stitch' => {
  const identity = createRenderIdentity(c, s);
  if (cachedVisualOrFinal(c, s, identity)) return 'stitch';
  const latest = new Map(s.renderChunks.map(x => [x.index, x]));
  const ranges = renderFrameRanges(s);
  const pending = ranges.map((frameRange, index) => ({ frameRange, index }))
    .filter(x => {
      const previous = latest.get(x.index);
      return !previous || previous.status === 'failed' || previous.frameRange[0] !== x.frameRange[0] ||
        previous.frameRange[1] !== x.frameRange[1] || previous.outPath !== chunkPath(c.root, s.episodeId, x.index) ||
        !cachedRender(c, previous.outPath, frameRangeDurationSeconds(x.frameRange), 'chunk', chunkIdentity(identity, x.index, x.frameRange));
    });
  if (!pending.length) return 'stitch';
  return pending.slice(0, s.options.graph.renderConcurrency).map(x => new Send('render_chunk', { ...s, ...x }));
};
