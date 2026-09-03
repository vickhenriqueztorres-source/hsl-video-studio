import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { inspectMediaWithFfprobe, isValidPngFile } from '../../../hsl/core/hslPathResolver';
import { requireSuccess, spawnTool } from '../../lib/proc';
import type { ImageQueue, ImageQueueItem } from '../state';

export interface ImageValidation { ok:boolean; error?:string; width?:number; height?:number; sha256?:string }

export function validateImage(file:string):ImageValidation {
  try {
    if(!fs.existsSync(file)) return {ok:false,error:'arquivo ausente'};
    if(!isValidPngFile(file)) return {ok:false,error:'formato não é PNG'};
    const info=inspectMediaWithFfprobe(file);
    if(!info.width||!info.height) return {ok:false,error:'dimensões ausentes'};
    if(info.width<1920) return {ok:false,error:`largura ${info.width} < 1920`};
    const deviation=Math.abs(info.width/info.height-16/9)/(16/9);
    if(deviation>0.01) return {ok:false,error:`aspecto ${info.width}x${info.height} fora da tolerância 16:9 ±1%`};
    return {ok:true,width:info.width,height:info.height,sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
  } catch(error) { return {ok:false,error:error instanceof Error?error.message:String(error)}; }
}

function sourceCandidate(item:ImageQueueItem):string|undefined {
  if(fs.existsSync(item.outputPath)) return item.outputPath;
  const stem=item.outputPath.replace(/\.png$/i,'');
  return ['.jpg','.jpeg','.webp'].map(ext=>stem+ext).find(fs.existsSync);
}

export async function fixImage(item:ImageQueueItem):Promise<void> {
  const source=sourceCandidate(item); if(!source) throw new Error('imagem de origem ausente para --fix');
  fs.mkdirSync(path.dirname(item.outputPath),{recursive:true});
  const temporary=item.outputPath+'.fixed.png';
  requireSuccess(await spawnTool('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',source,'-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080','-frames:v','1',temporary],{cwd:path.dirname(item.outputPath),logPath:item.outputPath+'.validate.log'}),'IMAGE_FIX');
  if(fs.existsSync(item.outputPath))fs.unlinkSync(item.outputPath);
  fs.renameSync(temporary,item.outputPath);
  if(source!==item.outputPath&&fs.existsSync(source)) fs.unlinkSync(source);
}

export async function validateQueue(queuePath:string,fix=false):Promise<{queue:ImageQueue;results:(ImageQueueItem&ImageValidation)[]}> {
  const queue=JSON.parse(fs.readFileSync(queuePath,'utf8').replace(/^\uFEFF/,'')) as ImageQueue;
  if(queue.generator!=='codex-imagegen') throw new Error(`IMAGE_GENERATOR_NOT_ALLOWED:${queue.generator||'missing'}`);
  const results=[] as (ImageQueueItem&ImageValidation)[];
  for(const item of queue.items) {
    if(fix&&!validateImage(item.outputPath).ok&&sourceCandidate(item)) {
      try { await fixImage(item); } catch(error) { item.lastError=error instanceof Error?error.message:String(error); }
    }
    const result=validateImage(item.outputPath); item.attempts+=item.status==='done'&&result.ok?0:1;
    item.status=result.ok?'done':'rejected'; item.lastError=result.ok?undefined:result.error;
    item.generatedBy=result.ok?'codex-imagegen':undefined;
    results.push({...item,...result});
  }
  fs.writeFileSync(queuePath,JSON.stringify(queue,null,2)+'\n','utf8'); return {queue,results};
}
