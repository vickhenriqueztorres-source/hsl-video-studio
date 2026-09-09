import path from 'node:path';
import { assertMediaPlan, planMedia, resolveMediaPolicy, validateMediaPlan } from '../lib/mediaPlan';
import { audit, Context, NodeFn, paths, writeJson } from '../runtime';

/** Runs after scene_plan has normalized or sliced the authoritative state plan. */
export const mediaPlanPrepare = (c: Context): NodeFn => s => {
  if (!s.scenePlan) throw new Error('MEDIA_PLAN_SCENE_PLAN_MISSING');
  const authored=new Set(s.motionPlan?.scenes.map(scene=>scene.beatId)??[]);
  if(s.options.graph.motionMode==='authored'&&!authored.size)throw new Error('AUTHORED_MOTION_PLAN_MISSING');
  const { scenePlan, mediaPlan } = planMedia(s.scenePlan, resolveMediaPolicy(s),authored);
  validateMediaPlan(scenePlan, mediaPlan);
  const run = paths(c, s).run;
  const effectivePath = path.join(run, 'media-scene-plan.json');
  writeJson(effectivePath, scenePlan);
  writeJson(path.join(run, 'media-plan.json'), mediaPlan);
  // Canary/test projections must never replace a canonical full episode plan.
  const full = !s.options.graph.beats && !s.options.graph.testRender;
  const scenePlanPath = full ? s.scenePlanPath ?? paths(c, s).plan : effectivePath;
  if (full && scenePlanPath !== effectivePath) writeJson(scenePlanPath, scenePlan);
  audit(c, s.episodeId, { type: 'media-plan', hash: mediaPlan.hash, policy: mediaPlan.policy,
    providers: { 'firefly-kling': mediaPlan.fireflyBeatIds, 'local-ffmpeg': mediaPlan.localMotionBeatIds, 'remotion-authored':mediaPlan.authoredBeatIds??[], none: mediaPlan.stillBeatIds },
    totalFrames: mediaPlan.totalFrames, totalTakes: mediaPlan.totalTakes, scenePlanPath,
  });
  return { scenePlan, scenePlanPath, mediaPlan };
};

export const mediaPlanValidate = (_c: Context): NodeFn => s => {
  assertMediaPlan(s);
  return {};
};
