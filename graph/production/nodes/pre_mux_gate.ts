import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, withStage, validMedia, copyFile, readJson, writeJson } from '../runtime';
import { State } from '../state';
import { HSL_DURATION_TOLERANCE_SECONDS } from '../../../spec/hsl-spec';
export const preMuxGate = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_08_PRE_MUX_GATE', async () => {
  const p = paths(c, s), receipt = path.join(p.audit, 'pre-mux.json');
  const cached = s.preMux ?? readJson<NonNullable<State['preMux']>>(receipt);
  if (cached && validMedia(c, p.narration, 'audio') && (validMedia(c, p.visual) || validMedia(c, p.final))) return { update: { preMux: cached }, skipped: true, metrics: { durationDiffSeconds: cached.durationDiffSeconds } };
  const visual = c.deps.inspect(validMedia(c, p.visual) ? p.visual : p.final), audio = c.deps.inspect(p.narration);
  let diff = Math.abs(visual.durationSeconds - audio.durationSeconds);
  const result: NonNullable<State['preMux']> = { visualDuration: visual.durationSeconds, audioDuration: audio.durationSeconds, durationDiffSeconds: diff, applied: false };
  if (diff > HSL_DURATION_TOLERANCE_SECONDS) {
    const factor = audio.durationSeconds / visual.durationSeconds;
    const dest = path.join(p.run, 'narration_synced.mp3');
    result.tempoFactor = factor; result.syncedAudioPath = dest;
    const tempo = await c.deps.atempo(p.narration, factor, dest);
    if (tempo.exitCode === 0 && fs.existsSync(dest)) {
      copyFile(dest, p.narration); copyFile(dest, p.publicNarration);
      diff = Math.abs(visual.durationSeconds - c.deps.inspect(p.narration).durationSeconds);
      result.applied = true; result.durationDiffSeconds = diff;
    }
  }
  writeJson(receipt, result);
  return { update: { preMux: result }, metrics: { durationDiffSeconds: diff } };
});
