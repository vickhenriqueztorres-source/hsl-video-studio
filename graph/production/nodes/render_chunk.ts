import { Context, NodeFn, paths, validMediaDuration, readJson } from '../runtime';
import { State } from '../state';
import { chunkPath, frameRangeDurationSeconds } from '../lib/remotion';
import { createRenderIdentity, chunkIdentity, cachedRender, invalidateReceipt, writeReceipt, assertRenderInputs, persistRenderInputs, assertRenderSucceeded } from '../lib/renderIdentity';
export type ChunkInput = State & { index: number; frameRange: [number, number] };
export const renderChunkNode = (c: Context): NodeFn<ChunkInput> => async (s, config) => {
  const started = Date.now(), outPath = chunkPath(c.root, s.episodeId, s.index);
  const attempts = config.executionInfo?.nodeAttempt ?? 1;
  const previous = [...s.renderChunks].reverse().find(chunk => chunk.index === s.index);
  const matchingRange = !previous || (previous.frameRange[0] === s.frameRange[0] && previous.frameRange[1] === s.frameRange[1]);
  const expectedSeconds = frameRangeDurationSeconds(s.frameRange);
  let identity = createRenderIdentity(c, s);
  const skip = matchingRange && cachedRender(c, outPath, expectedSeconds, 'chunk', chunkIdentity(identity, s.index, s.frameRange));
  if (!skip) {
    const p = paths(c, s);
    // A resume can enter this node directly without entering render_prepare.
    const props = readJson<{ assetBaseUrl?: string } & Record<string, unknown>>(p.props);
    const alive = await c.deps.responds(props?.assetBaseUrl);
    let inputsMatch = false;
    try { assertRenderInputs(c, s, identity); inputsMatch = true; } catch { /* Direct resume refreshes stale props. */ }
    if (!inputsMatch) c.deps.syncCurrentRunAssets(c.root, s.episodeId);
    identity = createRenderIdentity(c, s);
    if (!inputsMatch || !alive) {
      const server = alive ? { baseUrl: props!.assetBaseUrl! } : await c.deps.ensureRunning(c.root);
      persistRenderInputs(c, s, identity, server.baseUrl);
    }
    // Global TEMP cleanup is in render_prepare; never delete another live chunk.
    assertRenderInputs(c, s, identity);
    invalidateReceipt(outPath);
    assertRenderSucceeded(await c.deps.renderChunk(c.root, s.episodeId, s.index, s.frameRange, p.props));
    if (!validMediaDuration(c, outPath, expectedSeconds)) throw new Error(`REMOTION_CHUNK_INVALID: ${outPath}; expected=${expectedSeconds}s`);
    assertRenderInputs(c, s, identity);
    writeReceipt(outPath, 'chunk', chunkIdentity(identity, s.index, s.frameRange));
  }
  return { __status: skip ? 'skipped' : 'ok', renderChunks: [{ index: s.index, frameRange: s.frameRange, outPath, status: skip ? 'skipped' : 'ok', attempts: skip ? 0 : attempts, durationMs: Date.now() - started }] };
};
