import fs from 'node:fs';
import path from 'node:path';
import type {Context} from '../runtime';
import {copyFile,paths,readJson} from '../runtime';
import type {AssetResult,ImageQueue,State} from '../state';
import {assertWithin} from './assets';
import {validateImage} from './imageQueue';

/**
 * Rebuilds the frame state from physically validated, approved queue assets.
 * This is used after checkpoint rewinds that preserve media on disk but may
 * invalidate the derived `frames` channel.
 */
export function resolveValidatedFrames(c:Context,s:State,beatIds:readonly string[]):AssetResult[]{
  const queue=s.imageQueuePath?readJson<ImageQueue>(s.imageQueuePath):undefined;
  if(queue&&queue.generator!=='codex-imagegen')throw new Error(`IMAGE_GENERATOR_NOT_ALLOWED:${queue.generator||'missing'}`);
  const queued=new Map((queue?.items??[]).filter(item=>item.status==='done').map(item=>[item.beatId,item]));
  const stateFrames=new Map((s.frames??[]).filter(frame=>frame.status!=='failed').map(frame=>[frame.beatId,frame]));
  const restored:AssetResult[]=[];
  for(const beatId of beatIds){
    const current=stateFrames.get(beatId),item=queued.get(beatId);
    const canonical=path.join(paths(c,s).run,'frames',`${beatId}.png`);
    const candidates=[current?.path,item?.outputPath,...(current||item?[canonical]:[])].filter((value):value is string=>!!value);
    const source=[...new Set(candidates)].map(candidate=>path.resolve(c.root,candidate)).find(candidate=>{
      try{return validateImage(assertWithin(c.root,candidate)).ok;}catch{return false;}
    });
    if(!source)throw new Error(`APPROVED_FRAME_MISSING:${beatId}`);
    copyFile(source,canonical);
    copyFile(source,path.join(c.root,'public','runs',s.episodeId,'frames',`${beatId}.png`));
    const validation=validateImage(source);
    restored.push({beatId,path:source,status:'ok',attempts:current?.attempts??item?.attempts??0,sha256:validation.sha256});
  }
  return restored;
}
