import fs from 'node:fs';
import path from 'node:path';
import { spawnTool, requireSuccess } from '../../../lib/proc';

export interface DetailedProbe { duration: number; width?: number; height?: number; codec?: string; fps?: number }
export async function detailedProbe(file: string): Promise<DetailedProbe> {
  const r = requireSuccess(await spawnTool('ffprobe', ['-v','error','-show_entries','format=duration:stream=codec_type,codec_name,width,height,r_frame_rate','-of','json',file], { cwd: path.dirname(file), logPath: file + '.ffprobe.log' }), 'FIREFLY_FFPROBE');
  const d=JSON.parse(r.stdout), v=(d.streams??[]).find((x:any)=>x.codec_type==='video'); const parts=String(v?.r_frame_rate??'0/1').split('/').map(Number);
  return { duration:Number(d.format?.duration??0), width:v?.width, height:v?.height, codec:v?.codec_name, fps:parts[1] ? parts[0]/parts[1] : 0 };
}
export async function extractLastFrame(video: string, output: string): Promise<void> {
  fs.mkdirSync(path.dirname(output),{recursive:true});
  requireSuccess(await spawnTool('ffmpeg',['-y','-hide_banner','-loglevel','error','-sseof','-0.05','-i',video,'-frames:v','1',output],{cwd:path.dirname(video),logPath:output+'.log'}),'FIREFLY_LAST_FRAME');
}
export async function concatTakes(takes: string[], output: string): Promise<{ reencoded: string[] }> {
  fs.mkdirSync(path.dirname(output),{recursive:true}); const probes=await Promise.all(takes.map(detailedProbe)); const base=probes[0]; const normalized:string[]=[]; const reencoded:string[]=[];
  for(let i=0;i<takes.length;i++) { const p=probes[i]; if(p.codec===base.codec&&p.width===base.width&&p.height===base.height&&Math.abs((p.fps??0)-(base.fps??0))<0.01) normalized.push(takes[i]);
    else { const out=path.join(path.dirname(output),`.normalized-${i+1}.mp4`); requireSuccess(await spawnTool('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',takes[i],'-c:v','libx264','-pix_fmt','yuv420p','-r',String(base.fps||24),'-s',`${base.width}x${base.height}`,'-an',out],{cwd:path.dirname(output),logPath:output+'.concat.log'}),'FIREFLY_NORMALIZE'); normalized.push(out); reencoded.push(takes[i]); } }
  const list=output+'.concat.txt'; fs.writeFileSync(list,normalized.map(f=>`file '${path.resolve(f).replace(/'/g,"'\\''").replace(/\\/g,'/')}'`).join('\n')+'\n');
  requireSuccess(await spawnTool('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-c','copy',output],{cwd:path.dirname(output),logPath:output+'.concat.log'}),'FIREFLY_CONCAT');
  return {reencoded};
}
