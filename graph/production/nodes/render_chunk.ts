import { Context, NodeFn, paths, validMedia, readJson, writeJson } from '../runtime';
import { State } from '../state';
import { chunkPath } from '../lib/remotion';
export type ChunkInput = State & { index: number; frameRange: [number, number] };
export const renderChunkNode = (c: Context): NodeFn<ChunkInput> => async (s, config) => {
  const started = Date.now(), outPath = chunkPath(c.root, s.episodeId, s.index);
  const attempts = config.executionInfo?.nodeAttempt ?? 1;
  const previous = [...s.renderChunks].reverse().find(chunk => chunk.index === s.index);
  const matchingRange = !previous || (previous.frameRange[0] === s.frameRange[0] && previous.frameRange[1] === s.frameRange[1]);
  const skip = matchingRange && validMedia(c, outPath);
  if (!skip) {
    const p = paths(c, s);
    // A resume can enter this node directly without entering render_prepare.
    const props = readJson<{ assetBaseUrl?: string }>(p.props);
    if (!await c.deps.responds(props?.assetBaseUrl)) {
      const server = await c.deps.ensureRunning(c.root);
      writeJson(p.props, { ...s.scenePlan, assetBaseUrl: server.baseUrl });
    }
    // Global TEMP cleanup is in render_prepare; never delete another live chunk.
    c.deps.syncCurrentRunAssets(c.root, s.episodeId);
    await c.deps.renderChunk(c.root, s.episodeId, s.index, s.frameRange, p.props);
    if (!validMedia(c, outPath)) throw new Error('REMOTION_CHUNK_INVALID: ' + outPath);
  }
  return { __status: skip ? 'skipped' : 'ok', renderChunks: [{ index: s.index, frameRange: s.frameRange, outPath, status: skip ? 'skipped' : 'ok', attempts: skip ? 0 : attempts, durationMs: Date.now() - started }] };
};
