import { Context, NodeFn, paths, readJson, writeJson, withStage } from '../runtime';
import { HslLongFormProjectPlan } from '../../../hsl/core/types';
export const scenePlan = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_01_SCENE_PLAN', async () => {
  const file = paths(c, s).plan;
  const cached = readJson<HslLongFormProjectPlan>(file);
  const plan = cached?.beats && cached.acts ? cached : c.deps.plan(s.topicInput);
  if (plan !== cached) writeJson(file, plan);
  return { update: { scenePlan: plan, scenePlanPath: file }, skipped: plan === cached, metrics: { totalBeats: plan.totalBeatsCount }, artifacts: { scenePlanPath: file } };
});
