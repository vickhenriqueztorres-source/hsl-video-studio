import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, withStage, validMedia, copyFile } from '../runtime';
import { HSL_AUDIO_BITRATE } from '../../../spec/hsl-spec';
export const mux = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_09_FFMPEG_MUX', async () => {
  const p = paths(c, s); const target=p.final;
  const skipped = validMedia(c, target);
  if (!skipped) {
    const music = path.join(c.root, 'assets/audio-library/music/cinematic/suspense/suspense_oppressive_gloom.mp3');
    if (s.options.graph.mediaMode === 'real' && s.sfxTrackPath) await c.deps.muxFinalWithSfx(p.visual, music, p.narration, s.sfxTrackPath, target, HSL_AUDIO_BITRATE);
    else await c.deps.muxFinal(p.visual, music, p.narration, target, HSL_AUDIO_BITRATE);
    if (!validMedia(c, target)) throw new Error('FFMPEG_MUX_FATAL: saída inválida');
  }
  const info = c.deps.inspect(target), filename = s.episodeId.toLowerCase() + '.mp4';
  const deliveryPath = path.join(c.root, 'deliveries', s.episodeId, 'video', filename);
  const runPath = path.join(p.run, 'video', filename);
  copyFile(target, deliveryPath); copyFile(target, runPath);
  if (fs.existsSync(p.visual)) fs.unlinkSync(p.visual);
  return { update: { finalVideo: { outPath: target, deliveryPath, runPath, durationSeconds: info.durationSeconds } },
    skipped, metrics: { finalDuration: info.durationSeconds }, artifacts: { masterVideoPath: target, masterVideoDurationSeconds: info.durationSeconds } };
});
