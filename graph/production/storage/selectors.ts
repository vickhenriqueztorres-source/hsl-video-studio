import fs from 'node:fs';import path from 'node:path';import type { ImageQueue,State } from '../state';
import type { StorageCandidate } from './model';import { classifyStatePath } from './tiers';
const files=(dir:string):string[]=>!fs.existsSync(dir)?[]:fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const existing=(items:(string|null|undefined)[])=>items.filter((x):x is string=>!!x&&fs.existsSync(x));
export const selectScenePlan=(root:string,s:State)=>existing([s.scenePlanPath]).map(x=>classifyStatePath(root,s,x,'save'));
export const selectImages=(root:string,s:State)=>{
  let queue:ImageQueue|undefined;
  try{if(s.imageQueuePath)queue=JSON.parse(fs.readFileSync(s.imageQueuePath,'utf8').replace(/^\uFEFF/,''));}catch{}
  const candidates=[...(s.frames??[]).map(x=>x.path),...(queue?.items??[]).filter(x=>x.status==='done').map(x=>x.outputPath)];
  return existing([...new Set(candidates)]).map(x=>classifyStatePath(root,s,x,'intermediate'));
};
export const selectFirefly=(root:string,s:State)=>[
  ...existing([...(s.videoTakes??[]).map(x=>x.outputPath),...(s.videos??[]).map(x=>x.path)]).map(x=>classifyStatePath(root,s,x,'intermediate')),
  ...existing(files(path.join(root,'runs',s.episodeId,'firefly')).filter(x=>x.endsWith('.json')||x.split(path.sep).includes('qa'))).map(x=>classifyStatePath(root,s,x,'save')),
  ...existing((s.videos??[]).map(x=>x.path+'.provenance.json')).map(x=>classifyStatePath(root,s,x,'save')),
];
export const selectMotion=(root:string,s:State)=>existing([...new Set([
  ...(s.motionArtifacts??[]).flatMap(x=>[x.videoPath,x.previewPath,x.receiptPath,x.sourceManifestPath]),
  path.join(root,'runs',s.episodeId,'motion','plan.json'),path.join(root,'runs',s.episodeId,'motion','alignment.json'),path.join(root,'runs',s.episodeId,'motion','narration-lock.json'),
  ...files(path.join(root,'runs',s.episodeId,'motion')).filter(x=>/\.(tsx?|json|png)$/i.test(x)),
])]).map(x=>classifyStatePath(root,s,x,/\.mp4$/i.test(x)?'intermediate':'save'));
export const selectAudio=(root:string,s:State)=>[
  ...existing([s.narration?.path,s.sfxTrackPath]).map(x=>classifyStatePath(root,s,x,'intermediate')),
  ...existing([s.soundDesign?.audioPlanPath,s.sfxPlanPath,s.sfxQaPath]).map(x=>classifyStatePath(root,s,x,'save'))];
export const selectCompliance=(root:string,s:State):StorageCandidate[]=>{
  const run=path.join(root,'runs',s.episodeId),delivery=path.join(root,'deliveries',s.episodeId);
  const deliver=existing([s.finalVideo?.outPath,s.finalVideo?.deliveryPath,s.finalVideo?.runPath,path.join(run,'run-manifest.json'),path.join(run,'graph','compliance.json'),...files(path.join(run,'thumbnails')),...files(path.join(run,'publication')), ...files(delivery)]);
  // storage-index.json is mirrored after the other results are persisted. It
  // cannot contain its own MD5 without changing that MD5 on every write.
  const saves=existing([s.scenePlanPath,s.visualPromptsPath,s.imageQueuePath,s.soundDesign?.audioPlanPath,s.sfxPlanPath,s.sfxQaPath,path.join(run,'checkpoints','langgraph-checkpoints.sqlite'),path.join(run,'media-plan.json'),path.join(run,'media-scene-plan.json'),path.join(run,'firefly','ledger-export.json'),path.join(run,'firefly','authorization.json')]);
  return[...deliver.map(x=>classifyStatePath(root,s,x,'deliverable')),...saves.map(x=>classifyStatePath(root,s,x,'save'))];
};
