import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
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
    const content=`${x.prompt.imagePrompt}\n\nNegativo: ${x.prompt.negative||'texto, letras, logotipos, marcas, artefatos'}\nAspecto: 16:9\nResolução mínima: 1920x1080\nSem texto na imagem.\nSalvar exatamente em: ${x.expectedPath}\n`;
    if(!fs.existsSync(x.promptPath)||fs.readFileSync(x.promptPath,'utf8')!==content)fs.writeFileSync(x.promptPath,content);
    x.promptHash=createHash('sha256').update(content).digest('hex');
    writeJson(path.join(path.dirname(x.promptPath),'spec.json'),{width:1920,height:1080,aspect:'16:9',expectedPath:x.expectedPath});
  }
  const old=new Map(previous?.items.map(x=>[x.beatId,x])??[]);
  const queue:ImageQueue={episodeId:s.episodeId,threadId:threadId(s.episodeId),generator:'codex-imagegen',spec:{aspect:'16:9',minWidth:1920,format:'png',noText:true},
    items:all.map((x:any)=>{const p=old.get(x.beatId),same=p?.promptHash===x.promptHash;return{beatId:x.beatId,promptPath:x.promptPath,outputPath:x.expectedPath,promptHash:x.promptHash,status:same?(p?.status??'pending'):'pending',attempts:same?(p?.attempts??0):0,...(same&&p?.lastError?{lastError:p.lastError}:!same&&fs.existsSync(x.expectedPath)?{lastError:'prompt changed; regenerate'}:{}),...(same&&p?.generatedBy?{generatedBy:p.generatedBy}:{})};}),
    resumeCommand:`npm run hsl:master:graph:resume -- --episode ${s.episodeId}`};
  writeJson(queuePath,queue);
  return{imageSpecs:all.map((x:any)=>({beatId:x.beatId,promptPath:x.promptPath,expectedPath:x.expectedPath})),imageQueuePath:queuePath};
};

export const imageGenerateRun=(c:Context):NodeFn=>async s=>{
  if(s.options.graph.mediaMode==='legacy')return{__status:'skipped'};
  if(s.options.graph.offline)throw new Error('OFFLINE_CODEX_DISABLED');
  try {
    const issue=await c.deps.generateImages(s.imageQueuePath||queueFile(c,s));
    return{imageGenerationIssue:issue,imageGenerationRetry:false};
  } catch(error) {
    return{imageGenerationIssue:{kind:'IMAGE_GENERATION_RECOVERY' as const,reason:error instanceof Error?error.message:String(error)},imageGenerationRetry:false};
  }
};

export const imageGenerateWait=(c:Context):NodeFn=>s=>{
  if(s.options.graph.mediaMode==='legacy')return{__status:'skipped'};
  const queuePath=s.imageQueuePath||queueFile(c,s);
  const round=(s.imageValidationRounds??0)+1;
    const queue=readJson<ImageQueue>(queuePath);if(!queue)throw new Error(`IMAGE_QUEUE_MISSING:${queuePath}`);
    if(queue.generator!=='codex-imagegen')throw new Error(`IMAGE_GENERATOR_NOT_ALLOWED:${queue.generator||'missing'}`);
    const frames:AssetResult[]=[],bad:{beatId:string;error:string}[]=[];
    for(const item of queue.items){const v=validateImage(item.outputPath);if(!v.ok||item.status!=='done'){item.status='pending';item.lastError=item.lastError||v.error||'worker ainda não concluiu a imagem';bad.push({beatId:item.beatId,error:item.lastError});continue;}item.status='done';item.lastError=undefined;item.generatedBy='codex-imagegen';frames.push({beatId:item.beatId,path:item.outputPath,status:'ok',attempts:item.attempts});}
    writeJson(queuePath,queue);
    if(!bad.length){for(const f of frames){copyFile(f.path,path.join(paths(c,s).run,'frames',`${f.beatId}.png`));copyFile(f.path,path.join(c.root,'public','runs',s.episodeId,'frames',`${f.beatId}.png`));}return{frames,imageValidationRounds:round-1,imageGenerationRetry:false};}
    if(round===3)throw new Error(`IMAGE_QUEUE_MAX_ROUNDS:${JSON.stringify(bad)}`);
    interrupt({kind:s.imageGenerationIssue?.kind??'IMAGE_GENERATION_RECOVERY',queuePath,pendingCount:bad.length,
      reason:s.imageGenerationIssue?.reason??bad,command:s.imageGenerationIssue?.kind==='CODEX_AUTH'?'npm run hsl:codex:login':undefined,round});
    return{imageGenerationRetry:true,imageValidationRounds:round};
};
