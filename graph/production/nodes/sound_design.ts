import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, readJson, withStage } from '../runtime';
import { soundDesignInput } from '../lib/soundDesignInput';
export const soundDesign = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_05_SOUND_DESIGN', async () => {
  const audioPlanPath = path.join(paths(c, s).run, s.options.graph.mediaMode==='real'&&s.options.graph.beats ? `audio-plan-${s.options.graph.beats}beats.json` : 'audio-plan.json');
  const audioTsxPath = path.join(c.root, 'remotion', 'TestVideo1MinAudio.tsx');
  const skipped = !!readJson(audioPlanPath) && fs.existsSync(audioTsxPath);
  if (!skipped) c.deps.sound(soundDesignInput(s.episodeId, s.scenePlan!), audioTsxPath, audioPlanPath);
  return { update: { soundDesign: { audioPlanPath, audioTsxPath } }, skipped };
});
