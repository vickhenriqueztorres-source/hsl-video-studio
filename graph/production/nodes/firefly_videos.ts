import path from 'node:path';
import { Context, NodeFn, validMedia, readJson } from '../runtime';
import { AssetResult } from '../state';
export const fireflyVideos = (c: Context): NodeFn => async (s, config) => {
  const beats = s.scenePlan!.beats.filter(b => b.visualMode === 'firefly_video');
  const attempts = config.executionInfo?.nodeAttempt ?? 1;
  const guide = path.join(c.root, 'runs', s.episodeId, 'firefly-guide.json');
  const locations = beats.map(b => path.join(c.root, 'runs', s.episodeId, 'videos', b.beatId + '.mp4'));
  const valid = (i: number) => validMedia(c, locations[i]) && validMedia(c, path.join(c.root, 'public', 'runs', s.episodeId, 'videos', beats[i].beatId + '.mp4'));
  const before = beats.map((_, i) => valid(i));
  let error: string | undefined;
  if (!before.every(Boolean) || !readJson(guide)) {
    try { await c.deps.videos(s.episodeId, s.scenePlan!.beats); }
    catch (e) { if (attempts < 2) throw e; error = e instanceof Error ? e.message : String(e); }
  }
  const videos: AssetResult[] = beats.map((b, i) => ({ beatId: b.beatId, path: locations[i], status: valid(i) ? (before[i] ? 'skipped' : 'ok') : 'failed',
    attempts: before[i] ? 0 : attempts, ...(!valid(i) ? { error: error ?? 'Take inválido após engine' } : {}) }));
  return { videos, __status: videos.every(f => f.status === 'skipped') ? 'skipped' : videos.some(f => f.status === 'failed') ? 'failed' : 'ok', fireflyGuidePath: guide, errors: error ? [{ node: 'firefly_videos', message: error, at: new Date().toISOString() }] : [] };
};
