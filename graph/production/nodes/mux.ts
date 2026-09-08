import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, withStage, validMediaDuration, copyFile } from '../runtime';
import { HSL_AUDIO_BITRATE } from '../../../spec/hsl-spec';
import { renderDurationSeconds } from '../lib/remotion';
import { createRenderIdentity, finalIdentity, muxInputs, cachedRender, invalidateReceipt, writeReceipt, fileContentHash, assertRenderSucceeded } from '../lib/renderIdentity';
export const mux = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_09_FFMPEG_MUX', async () => {
  const p = paths(c, s); const target=p.final;
  const expectedSeconds = renderDurationSeconds(s);
  const identity = createRenderIdentity(c, s), inputHash = finalIdentity(c, s, identity);
  const skipped = cachedRender(c, target, expectedSeconds, 'final', inputHash);
  if (!skipped) {
    if (!cachedRender(c, p.visual, expectedSeconds, 'visual', identity.hash)) throw new Error('FFMPEG_MUX_STALE_VISUAL: resume from render_prepare');
    const visualHash = fileContentHash(p.visual);
    const { music, sfx } = muxInputs(c, s);
    if (!music || !fs.existsSync(music)) throw new Error(`FFMPEG_MUX_FATAL: trilha de música ausente no caminho ${music}`);
    if (!sfx || !fs.existsSync(sfx)) throw new Error('FFMPEG_MUX_FATAL: sfxTrackPath ausente ou inválido no contrato obrigatório de áudio master');
    invalidateReceipt(target);
    assertRenderSucceeded(await c.deps.muxFinalWithSfx(p.visual, music, p.narration, sfx, target, HSL_AUDIO_BITRATE));
    if (!validMediaDuration(c, target, expectedSeconds)) throw new Error(`FFMPEG_MUX_FATAL: duração final diferente de ${expectedSeconds}s`);
    if (createRenderIdentity(c, s).hash !== identity.hash || finalIdentity(c, s, identity) !== inputHash || fileContentHash(p.visual) !== visualHash) throw new Error('RENDER_INPUT_CHANGED_DURING_MUX');
    writeReceipt(target, 'final', inputHash);
  }
  const info = c.deps.inspect(target), filename = s.episodeId.toLowerCase() + '.mp4';
  const deliveryPath = path.join(c.root, 'deliveries', s.episodeId, 'video', filename);
  const runPath = path.join(p.run, 'video', filename);
  copyFile(target, deliveryPath); copyFile(target, runPath);
  if (fs.existsSync(p.visual)) fs.unlinkSync(p.visual);
  invalidateReceipt(p.visual);
  return { update: { finalVideo: { outPath: target, deliveryPath, runPath, durationSeconds: info.durationSeconds } },
    skipped, metrics: { finalDuration: info.durationSeconds }, artifacts: { masterVideoPath: target, masterVideoDurationSeconds: info.durationSeconds } };
});
