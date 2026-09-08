import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, beginStage, paths, readJson } from '../runtime';
import { createRenderIdentity, cachedVisualOrFinal, assertRenderInputs, persistRenderInputs } from '../lib/renderIdentity';
import {assertMediaCoverage} from '../lib/mediaCoverage';
export const renderPrepare = (c: Context): NodeFn => async s => {
  assertMediaCoverage(c,s);
  beginStage(c, s, 'STAGE_07_REMOTION_RENDER');
  const p = paths(c, s), build = path.join(c.root, 'build');
  const identity = createRenderIdentity(c, s);
  if (cachedVisualOrFinal(c, s, identity)) return { renderProps: { path: p.props }, visualTrackPath: p.visual, __status: 'skipped' };
  const existing = readJson<{ assetBaseUrl?: string } & Record<string, unknown>>(p.props);
  const alive = await c.deps.responds(existing?.assetBaseUrl);
  let propsMatch = false;
  try { assertRenderInputs(c, s, identity); propsMatch = true; } catch { /* Rebuild stale inputs below. */ }
  if (fs.existsSync(path.join(build, 'index.html')) && existing && alive) {
    if (!propsMatch) {
      c.deps.syncCurrentRunAssets(c.root, s.episodeId);
      const current = createRenderIdentity(c, s);
      persistRenderInputs(c, s, current, existing.assetBaseUrl!);
      assertRenderInputs(c, s, current);
    }
    return { assetServer: { baseUrl: existing.assetBaseUrl! }, renderProps: { path: p.props }, __status: propsMatch ? 'skipped' : 'ok' };
  }
  // Valid bundle can be reused after process death; only the ephemeral URL changes.
  if (!fs.existsSync(path.join(build, 'index.html')) || !existing) {
    c.deps.cleanRemotionTemp(c.root, 0); c.deps.prunePublicRuns(c.root, s.episodeId);
    c.deps.syncCurrentRunAssets(c.root, s.episodeId);
    if (fs.existsSync(build)) c.deps.removeWithin(c.root, build);
    await c.deps.bundleRemotion(c.root);
  }
  const server = await c.deps.ensureRunning(c.root);
  c.deps.syncCurrentRunAssets(c.root, s.episodeId);
  const current = createRenderIdentity(c, s);
  persistRenderInputs(c, s, current, server.baseUrl);
  assertRenderInputs(c, s, current);
  return { assetServer: server, renderProps: { path: p.props } };
};
