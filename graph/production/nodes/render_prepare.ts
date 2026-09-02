import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, beginStage, paths, readJson, writeJson, validMedia } from '../runtime';
export const renderPrepare = (c: Context): NodeFn => async s => {
  beginStage(c, s, 'STAGE_07_REMOTION_RENDER');
  const p = paths(c, s), build = path.join(c.root, 'build');
  if (validMedia(c, p.final) || validMedia(c, p.visual)) return { renderProps: { path: p.props }, visualTrackPath: p.visual, __status: 'skipped' };
  const existing = readJson<{ assetBaseUrl?: string }>(p.props);
  const alive = await c.deps.responds(existing?.assetBaseUrl);
  if (fs.existsSync(path.join(build, 'index.html')) && existing && alive) return { assetServer: { baseUrl: existing.assetBaseUrl! }, renderProps: { path: p.props }, __status: 'skipped' };
  // Valid bundle can be reused after process death; only the ephemeral URL changes.
  if (!fs.existsSync(path.join(build, 'index.html')) || !existing) {
    c.deps.cleanRemotionTemp(c.root, 0); c.deps.prunePublicRuns(c.root, s.episodeId);
    c.deps.syncCurrentRunAssets(c.root, s.episodeId);
    if (fs.existsSync(build)) c.deps.removeWithin(c.root, build);
    await c.deps.bundleRemotion(c.root);
  }
  const server = await c.deps.ensureRunning(c.root);
  c.deps.syncCurrentRunAssets(c.root, s.episodeId);
  writeJson(p.props, { ...s.scenePlan, assetBaseUrl: server.baseUrl });
  return { assetServer: server, renderProps: { path: p.props } };
};
