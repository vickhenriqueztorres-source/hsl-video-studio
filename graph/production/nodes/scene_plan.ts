import { Context, NodeFn, paths, readJson, writeJson, withStage } from '../runtime';
import { HslLongFormProjectPlan } from '../../../hsl/core/types';
export const scenePlan = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_01_SCENE_PLAN', async () => {
  const file = paths(c, s).plan;
  const cached = readJson<HslLongFormProjectPlan>(file);
  const full = cached?.beats && cached.acts ? cached : c.deps.plan(s.topicInput);
  if (full !== cached) writeJson(file, full);
  const selected = s.options.graph.beats ? full.beats.slice(0, s.options.graph.beats) : full.beats;
  const seconds=selected.reduce((n,b)=>n+b.durationSeconds,0), frames=selected.reduce((n,b)=>n+b.durationFrames,0);
  const plan = selected.length===full.beats.length ? full : {...full,beats:selected,totalBeatsCount:selected.length,totalDurationSeconds:seconds,totalFrames:frames,
    acts:full.acts.map(a=>({...a,beatsCount:selected.filter(b=>b.actNumber===a.actNumber).length,durationSeconds:selected.filter(b=>b.actNumber===a.actNumber).reduce((n,b)=>n+b.durationSeconds,0)})).filter(a=>a.beatsCount)};
  return { update: { scenePlan: plan, scenePlanPath: file }, skipped: full === cached, metrics: { totalBeats: plan.totalBeatsCount }, artifacts: { scenePlanPath: file } };
});
