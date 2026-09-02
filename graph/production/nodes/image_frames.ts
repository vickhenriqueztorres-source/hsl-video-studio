import path from 'node:path';
import { Context, NodeFn, validMedia } from '../runtime';
import { AssetResult } from '../state';
export const imageFrames = (c: Context): NodeFn => async (s, config) => {
  const beats = s.scenePlan!.beats, attempts = config.executionInfo?.nodeAttempt ?? 1;
  const locations = beats.map(b => path.join(c.root, 'runs', s.episodeId, 'frames', b.beatId + '.png'));
  const before = locations.map((f, i) => validMedia(c, f, 'image') && validMedia(c, path.join(c.root, 'public', 'runs', s.episodeId, 'frames', beats[i].beatId + '.png'), 'image'));
  let error: string | undefined;
  if (!before.every(Boolean)) {
    try { await c.deps.frames(s.episodeId, beats); }
    catch (e) { if (attempts < 2) throw e; error = e instanceof Error ? e.message : String(e); }
  }
  const frames: AssetResult[] = beats.map((b, i) => {
    const good = validMedia(c, locations[i], 'image') && validMedia(c, path.join(c.root, 'public', 'runs', s.episodeId, 'frames', b.beatId + '.png'), 'image');
    return { beatId: b.beatId, path: locations[i], status: good ? (before[i] ? 'skipped' : 'ok') : 'failed', attempts: before[i] ? 0 : attempts, ...(!good ? { error: error ?? 'Frame inválido após engine' } : {}) };
  });
  return { frames, __status: frames.every(f => f.status === 'skipped') ? 'skipped' : frames.some(f => f.status === 'failed') ? 'failed' : 'ok', errors: error ? [{ node: 'image_frames', message: error, at: new Date().toISOString() }] : [] };
};
