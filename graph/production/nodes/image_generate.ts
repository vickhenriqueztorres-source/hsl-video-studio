import fs from 'node:fs';
import path from 'node:path';
import { interrupt } from '@langchain/langgraph';
import { Context, NodeFn, paths, writeJson, copyFile, readJson } from '../runtime';
import { threadId, type AssetResult, type ImageQueue } from '../state';
import { validateImage } from '../lib/imageQueue';

function specs(c:Context,s:any){return s.visualPrompts.map((p:any)=>{const dir=path.join(paths(c,s).run,'images',p.beatId);return{beatId:p.beatId,promptPath:path.join(dir,'prompt.md'),expectedPath:path.join(dir,`${p.beatId}.png`),prompt:p};});}
function queueFile(c:Context,s:any){return path.join(paths(c,s).run,'images','QUEUE.json');}

export const imageGeneratePrepare=(c:Context):NodeFn=>s=>{
  if(s.options.graph.mediaMode==='legacy')return{__status:'skipped'};
  const all=specs(c,s),queuePath=queueFile(c,s),previous=readJson<ImageQueue>(queuePath);
  for(const x of all){
    fs.mkdirSync(path.dirname(x.promptPath),{recursive:true});
    if(!fs.existsSync(x.promptPath))fs.writeFileSync(x.promptPath,`${x.prompt.imagePrompt}\n\nNegativo: ${x.prompt.negative||'texto, letras, logotipos, marcas, artefatos'}\nAspecto: 16:9\nResolução mínima: 1920x1080\nSem texto na imagem.\nSalvar exatamente em: ${x.expectedPath}\n`);
    writeJson(path.join(path.dirname(x.promptPath),'spec.json'),{width:1920,height:1080,aspect:'16:9',expectedPath:x.expectedPath});
  }
  const old=new Map(previous?.items.map(x=>[x.beatId,x])??[]);
  const queue:ImageQueue={episodeId:s.episodeId,threadId:threadId(s.episodeId),spec:{aspect:'16:9',minWidth:1920,format:'png',noText:true},
    items:all.map((x:any)=>{const p=old.get(x.beatId);return{beatId:x.beatId,promptPath:x.promptPath,outputPath:x.expectedPath,status:p?.status??'pending',attempts:p?.attempts??0,...(p?.lastError?{lastError:p.lastError}:{})};}),
    resumeCommand:`npm run hsl:master:graph:resume -- --episode ${s.episodeId}`};
  writeJson(queuePath,queue);
  return{imageSpecs:all.map((x:any)=>({beatId:x.beatId,promptPath:x.promptPath,expectedPath:x.expectedPath})),imageQueuePath:queuePath};
};

export const imageGenerateWait=(c:Context):NodeFn=>s=>{
  if(s.options.graph.mediaMode==='legacy')return{__status:'skipped'};
  const queuePath=s.imageQueuePath||queueFile(c,s);
  for(let round=1;round<=3;round++){
    const queue=readJson<ImageQueue>(queuePath);if(!queue)throw new Error(`IMAGE_QUEUE_MISSING:${queuePath}`);
    const frames:AssetResult[]=[],bad:{beatId:string;error:string}[]=[];
    for(const item of queue.items){const v=validateImage(item.outputPath);if(!v.ok){item.status='pending';item.lastError=v.error;bad.push({beatId:item.beatId,error:v.error!});continue;}item.status='done';item.lastError=undefined;frames.push({beatId:item.beatId,path:item.outputPath,status:'ok',attempts:item.attempts});}
    writeJson(queuePath,queue);
    if(!bad.length){for(const f of frames){copyFile(f.path,path.join(paths(c,s).run,'frames',`${f.beatId}.png`));copyFile(f.path,path.join(c.root,'public','runs',s.episodeId,'frames',`${f.beatId}.png`));}return{frames,imageValidationRounds:round-1};}
    if(round===3)throw new Error(`IMAGE_QUEUE_MAX_ROUNDS:${JSON.stringify(bad)}`);
    interrupt({kind:'IMAGE_QUEUE',queuePath,pendingCount:bad.length,skill:'hsl-image-worker',round});
  }
  throw new Error('IMAGE_QUEUE_UNREACHABLE');
};
