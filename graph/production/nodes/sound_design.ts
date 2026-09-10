import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, readJson, withStage } from '../runtime';
import { soundDesignInput } from '../lib/soundDesignInput';
export const soundDesign = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_05_SOUND_DESIGN', async () => {
  const audioPlanPath = path.join(paths(c, s).run, s.options.graph.mediaMode==='real'&&s.options.graph.beats ? `audio-plan-${s.options.graph.beats}beats.json` : 'audio-plan.json');
  const runAudioTsx = path.join(paths(c, s).run, 'audio', 'AudioBed.tsx');
  const sharedAudioTsx = path.join(c.root, 'remotion', 'TestVideo1MinAudio.tsx');
  fs.mkdirSync(path.dirname(runAudioTsx), { recursive: true });
  const skipped = !!readJson(audioPlanPath) && fs.existsSync(runAudioTsx);
  if (!skipped) {
    c.deps.sound(soundDesignInput(s.episodeId, s.scenePlan!), runAudioTsx, audioPlanPath);
    try {
      fs.copyFileSync(runAudioTsx, sharedAudioTsx);
    } catch {}
  }
  return { update: { soundDesign: { audioPlanPath, audioTsxPath: runAudioTsx } }, skipped };
});
