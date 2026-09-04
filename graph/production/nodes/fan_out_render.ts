import { Send } from '@langchain/langgraph';
import { Context, NodeFn, validMedia, paths } from '../runtime';
import { State } from '../state';
import { renderFrameRanges } from '../lib/remotion';
export const fanOutRender: NodeFn = () => ({ __status: 'skipped' });
export const routeRender = (c: Context) => (s: State): Send[] | 'stitch' => {
  if (validMedia(c, paths(c, s).final) || validMedia(c, paths(c, s).visual)) return 'stitch';
  const latest = new Map(s.renderChunks.map(x => [x.index, x]));
  const ranges = renderFrameRanges(s);
  const pending = ranges.map((frameRange, index) => ({ frameRange, index }))
    .filter(x => {
      const previous = latest.get(x.index);
      return !previous || previous.status === 'failed' || previous.frameRange[0] !== x.frameRange[0] ||
        previous.frameRange[1] !== x.frameRange[1] || !validMedia(c, previous.outPath);
    });
  if (!pending.length) return 'stitch';
  return pending.slice(0, s.options.graph.renderConcurrency).map(x => new Send('render_chunk', { ...s, ...x }));
};
