import fs from 'node:fs';import path from 'node:path';import type { State } from '../state';
import type { StorageCandidate } from './model';import { classifyStatePath } from './tiers';
const files=(dir:string):string[]=>!fs.existsSync(dir)?[]:fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const existing=(items:(string|null|undefined)[])=>items.filter((x):x is string=>!!x&&fs.existsSync(x));
export const selectScenePlan=(root:string,s:State)=>existing([s.scenePlanPath]).map(x=>classifyStatePath(root,s,x,'save'));
export const selectImages=(root:string,s:State)=>existing((s.frames??[]).map(x=>x.path)).map(x=>classifyStatePath(root,s,x,'intermediate'));
export const selectFirefly=(root:string,s:State)=>existing([...(s.videoTakes??[]).map(x=>x.outputPath),...(s.videos??[]).map(x=>x.path)]).map(x=>classifyStatePath(root,s,x,'intermediate'));
export const selectAudio=(root:string,s:State)=>[
  ...existing([s.narration?.path,s.sfxTrackPath]).map(x=>classifyStatePath(root,s,x,'intermediate')),
  ...existing([s.soundDesign?.audioPlanPath,s.sfxPlanPath,s.sfxQaPath]).map(x=>classifyStatePath(root,s,x,'save'))];
export const selectCompliance=(root:string,s:State):StorageCandidate[]=>{
  const run=path.join(root,'runs',s.episodeId),delivery=path.join(root,'deliveries',s.episodeId);
  const deliver=existing([s.finalVideo?.outPath,s.finalVideo?.deliveryPath,s.finalVideo?.runPath,path.join(run,'run-manifest.json'),path.join(run,'graph','compliance.json'),...files(path.join(run,'thumbnails')),...files(path.join(run,'publication')), ...files(delivery)]);
  // storage-index.json is mirrored after the other results are persisted. It
  // cannot contain its own MD5 without changing that MD5 on every write.
  const saves=existing([s.scenePlanPath,s.visualPromptsPath,s.imageQueuePath,s.soundDesign?.audioPlanPath,s.sfxPlanPath,s.sfxQaPath,path.join(run,'checkpoints','langgraph-checkpoints.sqlite')]);
  return[...deliver.map(x=>classifyStatePath(root,s,x,'deliverable')),...saves.map(x=>classifyStatePath(root,s,x,'save'))];
};
