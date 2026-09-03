import { Send } from '@langchain/langgraph';
import { Context, NodeFn, validMedia, paths } from '../runtime';
import { State } from '../state';
import { FRAME_RANGES } from '../lib/remotion';
export const fanOutRender: NodeFn = () => ({ __status: 'skipped' });
export const routeRender = (c: Context) => (s: State): Send[] | 'stitch' => {
  if (validMedia(c, paths(c, s).final) || validMedia(c, paths(c, s).visual)) return 'stitch';
  const latest = new Map(s.renderChunks.map(x => [x.index, x]));
  const ranges: [number,number][]=s.options.graph.testRender?[[0,299]]:FRAME_RANGES;
  const pending = ranges.map((frameRange, index) => ({ frameRange, index }))
    .filter(x => !latest.has(x.index) || latest.get(x.index)!.status === 'failed');
  if (!pending.length) return 'stitch';
  return pending.slice(0, s.options.graph.renderConcurrency).map(x => new Send('render_chunk', { ...s, ...x }));
};
