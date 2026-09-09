import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import type {AuthoredMotionPlan,AuthoredMotionSceneBrief} from '../state';
import {Context,NodeFn,paths,readJson,writeJson} from '../runtime';

const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export const motionPlan=(c:Context):NodeFn=>async s=>{
  if(s.options.graph.motionMode!=='authored')return{motionPlan:null,__status:'skipped'};
  if(s.options.graph.offline)throw new Error('AUTHORED_MOTION_REQUIRES_CODE_AGENT');
  if(!s.scenePlan?.beats.length)throw new Error('AUTHORED_MOTION_SCENE_PLAN_MISSING');
  const promptPath=path.join(c.root,'graph','prompts','motion-director.md');
  const inputHash=digest({schema:'hsl.authored-motion-plan/v1',plan:s.scenePlan,brief:s.topicInput,
    prompt:fs.readFileSync(promptPath,'utf8'),maxScenes:s.options.graph.motionMaxScenes,require3d:s.options.graph.motionRequire3d});
  const file=path.join(paths(c,s).run,'motion','plan.json');
  const cached=readJson<AuthoredMotionPlan>(file);
  if(cached?.inputHash===inputHash){validate(cached.scenes,s.scenePlan.beats.map(beat=>beat.beatId),s.options.graph.motionMaxScenes,s.options.graph.motionRequire3d);return{motionPlan:cached,__status:'skipped'};}
  const result=await c.deps.ide({threadId:s.episodeId,node:`motion-director-${inputHash.slice(0,12)}`,attempt:1,
    provider:'codex',ioMode:'stdout',readOnly:true,maxAttempts:2,promptTemplate:'graph/prompts/motion-director.md',
    schemaPath:'graph/prompts/motion-director.schema.json',vars:{episodeBrief:JSON.stringify(s.topicInput),scenePlan:JSON.stringify(s.scenePlan),
      maxScenes:String(s.options.graph.motionMaxScenes),require3dGlobal:String(s.options.graph.motionRequire3d)}},{repoRoot:c.root});
  if(!result.headlessResult?.ok)throw new Error(`AUTHORED_MOTION_DIRECTOR_UNAVAILABLE:${result.headlessResult?.reason??result.headlessResult?.validationErrors?.join('; ')??'unknown'}`);
  const scenes=(result.headlessResult.output as {scenes:AuthoredMotionSceneBrief[]}).scenes;
  validate(scenes,s.scenePlan.beats.map(beat=>beat.beatId),s.options.graph.motionMaxScenes,s.options.graph.motionRequire3d);
  const plan:AuthoredMotionPlan={schema:'hsl.authored-motion-plan/v1',inputHash,scenes};writeJson(file,plan);return{motionPlan:plan};
};

function validate(scenes:AuthoredMotionSceneBrief[],beatIds:string[],max:number,require3d:boolean){
  if(!Array.isArray(scenes)||!scenes.length||scenes.length>max)throw new Error('AUTHORED_MOTION_SELECTION_COUNT_INVALID');
  const allowed=new Set(beatIds),seen=new Set<string>();
  for(const scene of scenes){
    if(!allowed.has(scene.beatId)||seen.has(scene.beatId))throw new Error(`AUTHORED_MOTION_BEAT_INVALID:${scene.beatId}`);seen.add(scene.beatId);
    if(!scene.visualObjective?.trim()||!scene.causalRelations?.length||!Array.isArray(scene.factualConstraints))throw new Error(`AUTHORED_MOTION_BRIEF_INVALID:${scene.beatId}`);
  }
  if(require3d&&!scenes.some(scene=>scene.require3d))throw new Error('AUTHORED_MOTION_3D_SCENE_REQUIRED');
}
