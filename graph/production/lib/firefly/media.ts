import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnTool, requireSuccess } from '../../../lib/proc';

export interface DetailedProbe { duration: number; width?: number; height?: number; codec?: string; fps?: number }
export async function detailedProbe(file: string): Promise<DetailedProbe> {
  file = path.resolve(file);
  const r = requireSuccess(await spawnTool('ffprobe', ['-v','error','-show_entries','format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,duration','-of','json',file], { cwd: path.dirname(file), timeoutMs: 30_000, logPath: file + '.ffprobe.log' }), 'FIREFLY_FFPROBE');
  const d=JSON.parse(r.stdout), v=(d.streams??[]).find((x:any)=>x.codec_type==='video'); const parts=String(v?.r_frame_rate??'0/1').split('/').map(Number);
  const streamDuration = Number(v?.duration);
  return { duration:Number.isFinite(streamDuration) && streamDuration > 0 ? streamDuration : Number(d.format?.duration??0), width:v?.width, height:v?.height, codec:v?.codec_name, fps:parts[1] ? parts[0]/parts[1] : 0 };
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

/** Decode-count the video stream; audio/container duration cannot establish coverage. */
async function probeSceneVideo(file: string) {
  const result = requireSuccess(await spawnTool('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-count_frames',
    '-show_entries', 'stream=codec_name,width,height,pix_fmt,avg_frame_rate,duration,nb_read_frames,sample_aspect_ratio',
    '-of', 'json', file,
  ], { cwd: path.dirname(file), timeoutMs: 120_000 }), 'FIREFLY_SCENE_PROBE');
  const stream = JSON.parse(result.stdout).streams?.[0];
  const [numerator, denominator] = String(stream?.avg_frame_rate ?? '0/1').split('/').map(Number);
  const fps = denominator ? numerator / denominator : 0;
  const frames = Number(stream?.nb_read_frames);
  const streamDuration = Number(stream?.duration);
  const duration = Number.isFinite(streamDuration) && streamDuration > 0 ? streamDuration : frames / fps;
  if (!stream || !Number.isSafeInteger(frames) || frames < 1 || !Number.isFinite(duration) || duration <= 0) {
    throw new Error('FIREFLY_SCENE_INVALID_VIDEO: no decodable video duration/frame count');
  }
  return { ...stream, fps, frames, duration };
}

/** Trim and normalize only. Never loop, slow down, or append a held final frame. */
export async function fitSceneVideo(input: string, output: string, durationFrames: number): Promise<void> {
  if (!Number.isSafeInteger(durationFrames) || durationFrames < 1) {
    throw new Error('FIREFLY_SCENE_INVALID_FRAMES: expected a positive safe integer');
  }
  input = path.resolve(input);
  output = path.resolve(output);
  const samePath = process.platform === 'win32' ? input.toLowerCase() === output.toLowerCase() : input === output;
  if (samePath || (fs.existsSync(output) && fs.realpathSync(input) === fs.realpathSync(output))) {
    throw new Error('FIREFLY_SCENE_INPUT_OUTPUT_SAME');
  }
  const source = await probeSceneVideo(input);
  // One output frame is the maximum rounding tolerance. The encoded count below
  // must still match exactly; this tolerance never authorizes padding.
  if (source.duration * 30 + 1 + 1e-6 < durationFrames) {
    throw new Error(`FIREFLY_SCENE_TOO_SHORT: ${source.duration.toFixed(6)}s available; ${durationFrames}/30s required`);
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const temporary = path.join(path.dirname(output), `.firefly-fit-${randomUUID()}.mp4`);
  try {
    requireSuccess(await spawnTool('ffmpeg', [
      '-y', '-nostdin', '-hide_banner', '-loglevel', 'error', '-xerror', '-err_detect', 'explode',
      '-i', input, '-map', '0:v:0', '-an', '-sn', '-dn',
      '-vf', 'setpts=PTS-STARTPTS,fps=30,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1',
      '-frames:v', String(durationFrames), '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-fps_mode', 'passthrough', '-movflags', '+faststart', temporary,
    ], { cwd: path.dirname(output), timeoutMs: 300_000 }), 'FIREFLY_SCENE_ENCODE');
    const fitted = await probeSceneVideo(temporary);
    if (fitted.frames !== durationFrames) {
      throw new Error(`FIREFLY_SCENE_TOO_SHORT: decoded output has ${fitted.frames} frames; required ${durationFrames}; padding forbidden`);
    }
    // Frame count and cadence are authoritative. MP4 stream duration is stored
    // on a finite time base and can differ from frames/fps by a fraction of a
    // millisecond for counts such as 247; tolerate only container quantization.
    const durationError=Math.abs(fitted.duration-durationFrames/30);
    if (fitted.codec_name !== 'h264' || fitted.width !== 1920 || fitted.height !== 1080 ||
        fitted.pix_fmt !== 'yuv420p' || fitted.sample_aspect_ratio !== '1:1' || Math.abs(fitted.fps - 30) > 1e-6 ||
        durationError > 1/1000) {
      throw new Error('FIREFLY_SCENE_OUTPUT_INVALID: encoded media does not satisfy the scene contract');
    }
    // Preserve an existing deliverable if probing, encoding, or validation fails.
    const backup=output+`.replace-${randomUUID()}`;
    if(fs.existsSync(output))fs.renameSync(output,backup);
    try{fs.renameSync(temporary,output);fs.rmSync(backup,{force:true});}
    catch(error){if(fs.existsSync(backup))fs.renameSync(backup,output);throw error;}
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}
