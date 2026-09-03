import path from 'node:path';
import type { State } from '../state';
import type { StorageCandidate,StorageTier } from './model';
import { assertWithin } from '../lib/assets';

const slash=(v:string)=>v.replace(/\\/g,'/');
export function relativeStoragePath(root:string,file:string){return slash(path.relative(root,assertWithin(root,file)));}

export function classifyStatePath(root:string,state:State,file:string,hint?:StorageTier):StorageCandidate{
  const absolute=assertWithin(root,file),rel=relativeStoragePath(root,absolute),ep=state.episodeId;
  if(rel.startsWith('assets/audio-library/'))return{path:absolute,tier:'library',category:'library'};
  if(rel==='build'||rel.startsWith('build/')||/^out\/(temp_|.*\/temp_|concat_)/i.test(rel)||rel.startsWith(`public/runs/${ep}/`))return{path:absolute,tier:'transient',category:'transient'};
  const saves=new Set([state.scenePlanPath,state.visualPromptsPath,state.imageQueuePath,state.soundDesign?.audioPlanPath,state.sfxPlanPath,state.sfxQaPath,
    path.join(root,'runs',ep,'storage-index.json'),path.join(root,'runs',ep,'checkpoints','langgraph-checkpoints.sqlite')].filter(Boolean).map(x=>path.resolve(x!)));
  if(saves.has(absolute))return{path:absolute,tier:'save',category:'saves'};
  const deliverables=new Set([state.finalVideo?.outPath,state.finalVideo?.deliveryPath,state.finalVideo?.runPath,
    path.join(root,'runs',ep,'run-manifest.json'),path.join(root,'runs',ep,'graph','compliance.json'),
    path.join(root,'runs',ep,'publication-package.json'),path.join(root,'runs',ep,'YOUTUBE_PUBLICATION_PACKAGE.md')].filter(Boolean).map(x=>path.resolve(x!)));
  if(deliverables.has(absolute)||rel.startsWith(`deliveries/${ep}/`)||rel.startsWith(`runs/${ep}/thumbnails/`))return{path:absolute,tier:'deliverable',category:'deliverables'};
  if(hint)return{path:absolute,tier:hint,category:hint==='intermediate'?categoryFor(rel):hint};
  return{path:absolute,tier:'intermediate',category:categoryFor(rel)};
}
function categoryFor(rel:string){if(rel.includes('/images/')||rel.includes('/frames/'))return'images';if(rel.includes('/firefly/')||rel.includes('/videos/'))return'video';if(rel.includes('/audio/'))return'audio';if(/temp_p\d+/i.test(rel))return'chunks';return'intermediate';}

export function classifyHeuristic(root:string,file:string):StorageCandidate{
  const absolute=assertWithin(root,file),rel=relativeStoragePath(root,absolute);
  if(rel.startsWith('assets/audio-library/'))return{path:absolute,tier:'library',category:'library'};
  if(rel.startsWith('build/')||/^out\/(temp_|concat_)/i.test(rel)||rel.startsWith('public/runs/'))return{path:absolute,tier:'transient',category:'transient'};
  if(/(^|\/)scene-plan\.json$|(^|\/)visual-prompts\.json$|(^|\/)audio-plan(?:-\d+beats)?\.json$|(^|\/)QUEUE\.json$|(^|\/)storage-index\.json$/i.test(rel))return{path:absolute,tier:'save',category:'saves'};
  if(rel.startsWith('deliveries/')||/(^|\/)run-manifest\.json$|(^|\/)compliance\.json$|(^|\/)publication-package\.json$|(^|\/)YOUTUBE_PUBLICATION_PACKAGE\.md$|(^|\/)thumbnails\//i.test(rel))return{path:absolute,tier:'deliverable',category:'deliverables'};
  return{path:absolute,tier:'intermediate',category:categoryFor(rel)};
}

export function remoteSubpath(entry:{tier:StorageTier;path:string},episodeId:string,category='files',root?:string){
  const rel=slash(root?relativeStoragePath(root,entry.path):entry.path).replace(/^\.\//,'');
  const parts=rel.split('/').filter(Boolean);let source='files',tail=parts;
  if(parts[0]==='runs'&&parts[1]===episodeId){source='runs';tail=parts.slice(2);}
  else if(parts[0]==='deliveries'&&parts[1]===episodeId){source='deliveries';tail=parts.slice(2);}
  else if(parts[0]==='public'&&parts[1]==='runs'&&parts[2]===episodeId){source='public-runs';tail=parts.slice(3);}
  else if(['out','build'].includes(parts[0])){source=parts[0];tail=parts.slice(1);}
  const suffix=[source,...tail].join('/');
  return entry.tier==='deliverable'?`01_DELIVERIES/${episodeId}/${suffix}`:`03_EPISODE_SAVES/${episodeId}/${category}/${suffix}`;
}
