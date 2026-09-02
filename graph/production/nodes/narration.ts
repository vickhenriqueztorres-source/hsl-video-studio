import fs from 'node:fs';
import { Context, NodeFn, paths, validMedia, copyFile, withStage, manifest } from '../runtime';
export const narration = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_04_NARRATION', async () => {
  const p = paths(c, s);
  const cache = fs.existsSync(p.narration) && fs.statSync(p.narration).size > 10000;
  if (s.options.graph.offline && !cache) throw new Error('narration cache ausente em modo offline');
  if (!cache || !validMedia(c, p.narration, 'audio')) {
    if (s.options.graph.offline) throw new Error('narration cache ausente em modo offline');
    await c.deps.narrate({ text: s.scenePlan!.beats.map(b => b.voiceoverScript).join(' '), outputPath: p.narration });
  }
  if (!validMedia(c, p.narration, 'audio')) throw new Error('NARRATION_INVALID_MEDIA');
  copyFile(p.narration, p.publicNarration);
  const info = c.deps.inspect(p.narration);
  // Stage 8 may have synchronized this file. Preserve stage 4's original metric.
  const original = manifest(c, s).getData().artifacts.narrationDurationSeconds ?? info.durationSeconds;
  return { update: { narration: { path: p.narration, publicCopyPath: p.publicNarration, durationSeconds: info.durationSeconds } },
    skipped: cache, metrics: { durationSeconds: original }, artifacts: { narrationAudioPath: p.narration, narrationDurationSeconds: original } };
});
