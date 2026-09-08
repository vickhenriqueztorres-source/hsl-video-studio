import path from 'node:path';
import fs from 'node:fs';
import { Context, NodeFn, validMedia } from '../runtime';
import { AssetResult } from '../state';
export const imageFrames = (c: Context): NodeFn => async (s, config) => {
  const beats = s.scenePlan!.beats, attempts = config.executionInfo?.nodeAttempt ?? 1;
  const locations = beats.map(b => path.join(c.root, 'runs', s.episodeId, 'frames', b.beatId + '.png'));
  const run = path.join(c.root, 'runs', s.episodeId);
  const svgDirs = fs.existsSync(run) ? fs.readdirSync(run).filter(name => /^temp-.*svg-frames$/.test(name)) : [];
  const usable = (file: string, i: number) => {
    if (!validMedia(c, file, 'image')) return false;
    const b = beats[i];
    if (b.visualMode !== 'generated_image_35mm' || !svgDirs.some(dir => fs.existsSync(path.join(run, dir, b.beatId + '.svg')))) return true;
    const source = path.join(run, 'start-frames', b.beatId + '.png');
    // Historical SVG fallbacks are not a photographic cache. A recovered frame
    // must match its photographic source even if the old SVG remains on disk.
    return validMedia(c, source, 'image') && fs.readFileSync(file).equals(fs.readFileSync(source));
  };
  const goodFrame = (i: number) => usable(locations[i], i) && usable(path.join(c.root, 'public', 'runs', s.episodeId, 'frames', beats[i].beatId + '.png'), i);
  const before = locations.map((_, i) => goodFrame(i));
  let error: string | undefined;
  if (!before.every(Boolean)) {
    try { await c.deps.frames(s.episodeId, beats); }
    catch (e) { if (attempts < 2 || /PHOTOREAL_FRAMES_REQUIRED|PHOTOGRAPHIC_/.test(String(e))) throw e; error = e instanceof Error ? e.message : String(e); }
  }
  const frames: AssetResult[] = beats.map((b, i) => {
    const good = goodFrame(i);
    return { beatId: b.beatId, path: locations[i], status: good ? (before[i] ? 'skipped' : 'ok') : 'failed', attempts: before[i] ? 0 : attempts, ...(!good ? { error: error ?? 'Frame inválido após engine' } : {}) };
  });
  return { frames, __status: frames.every(f => f.status === 'skipped') ? 'skipped' : frames.some(f => f.status === 'failed') ? 'failed' : 'ok', errors: error ? [{ node: 'image_frames', message: error, at: new Date().toISOString() }] : [] };
};
