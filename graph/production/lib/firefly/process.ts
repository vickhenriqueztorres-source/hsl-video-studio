import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnTool, requireSuccess, ToolResult } from '../../../lib/proc';

export interface FireflyEnvironment { agentDir: string; profileDir: string; python: string }
export function fireflyEnvironment(env = process.env): FireflyEnvironment {
  const agentDir = env.HSL_FIREFLY_AGENT_DIR;
  if (!agentDir) throw new Error('FIREFLY_ENV_MISSING:HSL_FIREFLY_AGENT_DIR');
  const profileDir = env.HSL_FIREFLY_CHROME_PROFILE || 'D:\\HSL-FIREFLY-PROFILE';
  const python = path.join(agentDir, '.venv', 'Scripts', 'python.exe');
  for (const required of [agentDir, profileDir, python, path.join(agentDir, 'main.py')]) if (!fs.existsSync(required)) throw new Error(`FIREFLY_ENV_PATH_MISSING:${required}`);
  return { agentDir: path.resolve(agentDir), profileDir: path.resolve(profileDir), python };
}
function agentEnv(e: FireflyEnvironment): NodeJS.ProcessEnv { return { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONPATH: e.agentDir, FIREFLY_CHROME_PROFILE_DIR: e.profileDir, FIREFLY_PROVIDER_CAPACITY_MAX_ATTEMPTS: '3' }; }
interface DispatchReceipt { schema:'hsl.kling-dispatch.v1'; name:string; guideHash:string; phase:'prepared'|'enqueued'|'running'|'succeeded'|'uncertain'; paidDispatchPossible:boolean; outputPath:string; updatedAt:string; error?:string }
const readJson=(file:string):any=>{try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return undefined;}};
function writeReceipt(file:string,value:DispatchReceipt){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');fs.renameSync(tmp,file);}
function updateReceipt(file:string,base:Omit<DispatchReceipt,'phase'|'updatedAt'>,phase:DispatchReceipt['phase'],extra:Partial<DispatchReceipt>={}){writeReceipt(file,{...base,...extra,phase,updatedAt:new Date().toISOString()});}
function stageGuide(runtime:string,guidePath:string){
  const guide=readJson(guidePath),item=guide?.items?.[0];
  if(!item||guide.items.length!==1)throw new Error('KLING_GUIDE_REQUIRES_EXACTLY_ONE_ITEM');
  if(item.model!=='Kling 2.5 Turbo'||item.duration_seconds!==5||item.resolution!=='1080p'||item.aspect_ratio!=='16:9'||item.generate_audio!==false)throw new Error('KLING_GUIDE_PROFILE_INVALID');
  const source=path.resolve(String(item.image));if(!fs.existsSync(source))throw new Error(`KLING_FIRST_FRAME_MISSING:${source}`);
  const images=path.join(runtime,'imagens');fs.mkdirSync(images,{recursive:true});const imageName=`${String(item.name).replace(/[^a-zA-Z0-9._-]/g,'_')}${path.extname(source).toLowerCase()||'.png'}`;const staged=path.join(images,imageName);fs.copyFileSync(source,staged);
  const agentGuide={...guide,items:[{...item,image:imageName}]};const stagedPath=path.join(runtime,'agent-guide.json');fs.writeFileSync(stagedPath,JSON.stringify(agentGuide,null,2)+'\n');
  return{path:stagedPath,name:String(item.name),hash:crypto.createHash('sha256').update(JSON.stringify(agentGuide)).digest('hex')};
}
export async function profileInUse(profileDir: string): Promise<boolean> {
  if (process.platform !== 'win32') return false;
  const escaped = profileDir.replace(/'/g, "''");
  const script = `$p='${escaped}'; [Console]::Out.Write((Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($p,[StringComparison]::OrdinalIgnoreCase) -ge 0 } | Select-Object -First 1) -ne $null)`;
  const result = requireSuccess(await spawnTool('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { cwd: process.cwd(), timeoutMs: 30_000 }), 'FIREFLY_PROFILE_PROCESS_CHECK');
  return result.stdout.trim().toLowerCase() === 'true';
}
export async function probeSession(e: FireflyEnvironment, runtime: string, logPath: string): Promise<boolean> {
  fs.mkdirSync(path.join(runtime, 'data'), { recursive: true });
  const result = await spawnTool(e.python, [path.join(e.agentDir, 'main.py'), '--root', runtime, '--probe-session'], { cwd: e.agentDir, env: agentEnv(e), timeoutMs: 180_000, logPath });
  return result.exitCode === 0 && !result.timedOut;
}
export async function openLoginChrome(e: FireflyEnvironment, logPath: string): Promise<ToolResult> {
  const candidates = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'];
  const chrome = candidates.find(fs.existsSync); if (!chrome) throw new Error('FIREFLY_LOGIN_CHROME_NOT_FOUND');
  const ps = `Start-Process -FilePath $args[0] -ArgumentList @($args[1],$args[2],$args[3],$args[4],$args[5])`;
  return requireSuccess(await spawnTool('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps, chrome,
    `--user-data-dir=${e.profileDir}`, '--new-window', '--no-first-run', '--no-default-browser-check', 'https://firefly.adobe.com/generate/video'],
    { cwd: e.agentDir, timeoutMs: 30_000, logPath }), 'FIREFLY_LOGIN_CHROME_OPEN');
}
export async function runAgentTake(e: FireflyEnvironment, runtime: string, guidePath: string, logPath: string): Promise<{ feed: ToolResult; run: ToolResult }> {
  if(process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH!=='true')throw new Error('KLING_PAID_DISPATCH_NOT_AUTHORIZED:set HSL_ALLOW_PAID_FIREFLY_DISPATCH=true');
  if (await profileInUse(e.profileDir)) throw new Error(`FIREFLY_PROFILE_IN_USE:${e.profileDir}:feche o Chrome desse perfil e execute resume`);
  fs.mkdirSync(path.join(runtime, 'data'), { recursive: true });
  const staged=stageGuide(runtime,guidePath),receiptPath=path.join(runtime,'dispatch-receipt.json'),outputPath=path.join(runtime,'saida',`${staged.name}.mp4`);
  const base={schema:'hsl.kling-dispatch.v1' as const,name:staged.name,guideHash:staged.hash,paidDispatchPossible:false,outputPath};let previous=readJson(receiptPath) as DispatchReceipt|undefined;
  if(previous&&previous.guideHash!==staged.hash)throw new Error('KLING_RECEIPT_GUIDE_HASH_MISMATCH');
  const reused:ToolResult={exitCode:0,stdout:'reused',stderr:'',timedOut:false,durationMs:0};
  // The external watchdog returns WORKER_NO_JOB (2) after completing the only
  // queued item. A physical output wins over that queue-control exit code.
  if(previous&&fs.existsSync(outputPath)){updateReceipt(receiptPath,{...base,paidDispatchPossible:previous.paidDispatchPossible},'succeeded');return{feed:reused,run:reused};}
  if(previous&&['prepared','running','uncertain','succeeded'].includes(previous.phase))throw new Error(`KLING_DISPATCH_UNCERTAIN:${receiptPath}:reconcile before retry`);
  let feed=reused;
  if(previous?.phase!=='enqueued'){
    updateReceipt(receiptPath,base,'prepared');
    feed=await spawnTool(e.python,[path.join(e.agentDir,'main.py'),'--root',runtime,'--feed-guide',staged.path],{cwd:e.agentDir,env:agentEnv(e),timeoutMs:60_000,logPath});
    if(feed.exitCode!==0||feed.timedOut||feed.errorCode){updateReceipt(receiptPath,base,'uncertain',{error:'feed failed; inspect SQLite before retry'});requireSuccess(feed,'FIREFLY_FEED_GUIDE');}
    updateReceipt(receiptPath,{...base,paidDispatchPossible:true},'enqueued');
  }
  updateReceipt(receiptPath,{...base,paidDispatchPossible:true},'running');
  const run=await spawnTool(e.python,[path.join(e.agentDir,'main.py'),'--root',runtime,'--concurrency','1','--run'],{cwd:e.agentDir,env:agentEnv(e),timeoutMs:2_100_000,logPath});
  if(!fs.existsSync(outputPath)){updateReceipt(receiptPath,{...base,paidDispatchPossible:true},'uncertain',{error:'worker ended without verified output'});if(run.exitCode!==0||run.timedOut||run.errorCode)requireSuccess(run,'FIREFLY_RUN');throw new Error(`KLING_OUTPUT_MISSING:${outputPath}`);}
  updateReceipt(receiptPath,{...base,paidDispatchPossible:true},'succeeded');
  return { feed, run };
}

export async function reconcileUnstartedAgentTake(e: FireflyEnvironment, runtime: string, guidePath: string, logPath: string, jobId=1): Promise<ToolResult> {
  const staged=stageGuide(runtime,guidePath),receiptPath=path.join(runtime,'dispatch-receipt.json'),outputPath=path.join(runtime,'saida',`${staged.name}.mp4`);
  const previous=readJson(receiptPath) as DispatchReceipt|undefined;
  if(!previous||previous.phase!=='uncertain')throw new Error(`KLING_RECONCILE_REQUIRES_UNCERTAIN_RECEIPT:${receiptPath}`);
  if(previous.guideHash!==staged.hash||previous.name!==staged.name)throw new Error('KLING_RECONCILE_RECEIPT_IDENTITY_MISMATCH');
  if(fs.existsSync(outputPath))throw new Error(`KLING_RECONCILE_OUTPUT_EXISTS:${outputPath}`);
  const result=await spawnTool(e.python,[path.join(e.agentDir,'main.py'),'--root',runtime,'--requeue-unstarted-infra-job',String(jobId)],{cwd:e.agentDir,env:agentEnv(e),timeoutMs:60_000,logPath});
  requireSuccess(result,'FIREFLY_REQUEUE_UNSTARTED_INFRA');
  updateReceipt(receiptPath,{schema:'hsl.kling-dispatch.v1',name:staged.name,guideHash:staged.hash,paidDispatchPossible:true,outputPath},'enqueued');
  return result;
}
