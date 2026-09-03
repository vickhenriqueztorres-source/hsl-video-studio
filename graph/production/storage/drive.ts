import fs from 'node:fs';import path from 'node:path';
import { spawnTool,ToolResult } from '../../lib/proc';
import type { DriveResult } from './model';

type PythonCandidate={cmd:string;prefix:string[]};
function pythonCandidates(env=process.env):PythonCandidate[]{
  if(env.HSL_PYTHON)return[{cmd:env.HSL_PYTHON,prefix:[]}];
  return process.platform==='win32'?[{cmd:'py',prefix:['-3']},{cmd:'python3',prefix:[]},{cmd:'python',prefix:[]}]:[{cmd:'python3',prefix:[]},{cmd:'python',prefix:[]}];
}
export async function runDriveAction(root:string,action:string,args:string[]=[],env=process.env):Promise<ToolResult>{
  const script=path.join(root,'scripts','driveSync.py'),logPath=path.join(root,'runs','.storage','drive.log');
  const childEnv={...env,PYTHONUNBUFFERED:'1'};
  let last:ToolResult|undefined;
  for(const candidate of pythonCandidates(env)){
    const result=await spawnTool(candidate.cmd,[...candidate.prefix,script,'--action',action,...args],{
      cwd:root,
      env:childEnv,
      logPath,
      onStdout:action==='auth'?(chunk)=>process.stdout.write(chunk):undefined,
      onStderr:['upload-verified','verify'].includes(action)?(chunk)=>process.stderr.write(chunk):undefined,
    });
    if(!result.errorCode)return result;last=result;
  }
  return last!;
}
export const driveCheckAuth=(root:string)=>runDriveAction(root,'check-auth');
export const driveAuth=(root:string)=>runDriveAction(root,'auth');
async function resultAction(root:string,action:'upload-verified'|'verify',manifestPath:string,resultPath:string):Promise<DriveResult>{
  const result=await runDriveAction(root,action,['--manifest',manifestPath,'--result',resultPath]);
  if(result.exitCode!==0||result.timedOut||result.errorCode)throw new Error(`DRIVE_${action.toUpperCase().replace('-','_')}_GENERAL:${result.stderr||result.stdout||result.errorCode||'timeout'}`);
  if(!fs.existsSync(resultPath))throw new Error(`DRIVE_RESULT_MISSING:${resultPath}`);
  return JSON.parse(fs.readFileSync(resultPath,'utf8').replace(/^\uFEFF/,'')) as DriveResult;
}
export const driveUploadVerified=(root:string,manifest:string,result:string)=>resultAction(root,'upload-verified',manifest,result);
export const driveVerify=(root:string,manifest:string,result:string)=>resultAction(root,'verify',manifest,result);
