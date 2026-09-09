import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, withStage, validMedia, validMediaDuration, copyFile, readJson, writeJson } from '../runtime';
import { State } from '../state';
import { HSL_DURATION_TOLERANCE_SECONDS } from '../../../spec/hsl-spec';
import { renderDurationSeconds } from '../lib/remotion';
import { fileContentHash } from '../lib/renderIdentity';
export const preMuxGate = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_08_PRE_MUX_GATE', async () => {
  const p = paths(c, s), receipt = path.join(p.audit, 'pre-mux.json');
  const expectedSeconds = renderDurationSeconds(s);
  const visualPath = validMediaDuration(c, p.visual, expectedSeconds) ? p.visual : p.final;
  const cached = s.preMux ?? readJson<NonNullable<State['preMux']>>(receipt);
  const currentVisual = validMediaDuration(c, visualPath, expectedSeconds) ? c.deps.inspect(visualPath) : undefined;
  const currentAudio = validMedia(c, p.narration, 'audio') ? c.deps.inspect(p.narration) : undefined;
  const sfxPath = s.sfxTrackPath ? path.resolve(c.root, s.sfxTrackPath) : path.join(p.run, 'audio', 'sfx-track.wav');
  if (!fs.existsSync(sfxPath)) throw new Error('PRE_MUX_SFX_MISSING: sfxTrackPath obrigatório para o master');
  const currentSfx = validMedia(c, sfxPath, 'audio') ? c.deps.inspect(sfxPath) : undefined;
  if (!currentSfx || currentSfx.durationSeconds <= 0) throw new Error('PRE_MUX_SFX_INVALID: faixa de efeitos sonoros ilegível ou vazia');
  if (s.options.graph.motionMode!=='authored' && cached && currentVisual && currentAudio && Math.abs(cached.visualDuration - currentVisual.durationSeconds) <= 0.2 && Math.abs(cached.audioDuration - currentAudio.durationSeconds) <= 0.2) return {
    update: { preMux: cached, ...(!s.sfxTrackPath ? { sfxTrackPath: sfxPath } : {}) },
    skipped: true,
    metrics: { durationDiffSeconds: cached.durationDiffSeconds, tempoFactor: cached.tempoFactor, synchronized: cached.applied }
  };
  if (!currentVisual || !currentAudio) throw new Error(`PRE_MUX_MEDIA_INVALID: visual deve ter ${expectedSeconds}s e narração deve ser legível`);
  const visual = currentVisual, audio = currentAudio;
  let diff = Math.abs(visual.durationSeconds - audio.durationSeconds);
  const result: NonNullable<State['preMux']> = { visualDuration: visual.durationSeconds, audioDuration: audio.durationSeconds, durationDiffSeconds: diff, applied: false };
  if(s.options.graph.motionMode==='authored'){
    if(!s.narrationLock||fileContentHash(p.narration)!==s.narrationLock.audioSha256)throw new Error('PRE_MUX_MOTION_AUDIO_LOCK_INVALID');
    if(diff>HSL_DURATION_TOLERANCE_SECONDS)throw new Error(`PRE_MUX_MOTION_AUDIO_LOCK_DESYNC:${diff.toFixed(3)}s`);
    writeJson(receipt,result);
    return{update:{preMux:result},metrics:{durationDiffSeconds:diff,synchronized:false,motionAudioLocked:true}};
  }
  if (diff > HSL_DURATION_TOLERANCE_SECONDS && !s.options.graph.testRender) {
    const factor = audio.durationSeconds / visual.durationSeconds;
    // A fixed absolute difference is unsafe here: a 300 s episode can have
    // a 30–40 s difference while still needing only a bounded tempo change.
    // Gate by the perceptual correction factor, never by silence padding.
    if (factor < 0.85 || factor > 1.18) {
      throw new Error(`PRE_MUX_NARRATION_DESYNC_FATAL: Dessincronia excessiva entre áudio (${audio.durationSeconds.toFixed(1)}s) e visual (${visual.durationSeconds.toFixed(1)}s, fator ${factor.toFixed(2)}). Proibido mascarar com apad de silêncio.`);
    }
    const dest = path.join(p.run, 'audio', 'narration-synced.wav');
    result.tempoFactor = factor; result.syncedAudioPath = dest;
    const tempo = await c.deps.atempo(p.narration, factor, dest);
    if (tempo.exitCode === 0 && fs.existsSync(dest)) {
      copyFile(dest, p.narration); copyFile(dest, p.publicNarration);
      const qa = c.deps.validateNarration(p.narration);
      writeJson(p.narrationQa, qa);
      diff = Math.abs(visual.durationSeconds - c.deps.inspect(p.narration).durationSeconds);
      if (diff > HSL_DURATION_TOLERANCE_SECONDS) throw new Error(`PRE_MUX_NARRATION_SYNC_FAILED: delta residual ${diff.toFixed(3)}s`);
      const narrationReceipt = readJson<Record<string, unknown>>(p.narrationReceipt);
      if (narrationReceipt) writeJson(p.narrationReceipt, {
        ...narrationReceipt,
        masterSha256: fileContentHash(p.narration),
        synchronizedFromSha256: narrationReceipt.masterSha256,
        synchronizationFactor: factor,
        synchronizedDurationSeconds: c.deps.inspect(p.narration).durationSeconds,
        synchronizedAt: new Date().toISOString()
      });
      result.applied = true; result.durationDiffSeconds = diff;
    }
  }
  writeJson(receipt, result);
  return {
    update: { preMux: result },
    metrics: { durationDiffSeconds: diff, tempoFactor: result.tempoFactor, synchronized: result.applied }
  };
});
