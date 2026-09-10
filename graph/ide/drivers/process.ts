import fs from 'node:fs';
import path from 'node:path';
import { spawnTool, ToolResult } from '../../lib/proc';
export interface CliCommand { command: string; prefix: string[] }
export type ProcessResult = ToolResult;

function executableAt(candidate:string,name:string):CliCommand|undefined {
  try {
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) return;
  } catch { return; }
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(candidate)) {
    const directory=path.dirname(candidate);
    const js = path.join(directory, 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
    if (name === 'codex' && fs.existsSync(js)) return { command: process.execPath, prefix: [js] };
  }
  return {command:candidate,prefix:[]};
}

function desktopCodex(env:NodeJS.ProcessEnv):CliCommand|undefined {
  if(process.platform!=='win32'||!env.LOCALAPPDATA)return;
  const root=path.join(env.LOCALAPPDATA,'OpenAI','Codex','bin');
  let versions:fs.Dirent[];
  try { versions=fs.readdirSync(root,{withFileTypes:true}); } catch { return; }
  const candidates=versions.filter(x=>x.isDirectory()).map(x=>path.join(root,x.name,'codex.exe'))
    .filter(x=>executableAt(x,'codex')).sort((a,b)=>{
      try{return fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs;}catch{return 0;}
    });
  return candidates.length?{command:candidates[0],prefix:[]}:undefined;
}

function installedAntigravity(name:string,env:NodeJS.ProcessEnv):CliCommand|undefined {
  if(process.platform!=='win32')return;
  const local=env.LOCALAPPDATA??process.env.LOCALAPPDATA;
  const user=env.USERPROFILE??process.env.USERPROFILE;
  const candidates:string[]=[];
  if(local){
    candidates.push(path.join(local,'agy','bin',name==='agy'?'agy.exe':'antigravity.exe'));
    candidates.push(path.join(local,'Antigravity','bin',name==='agy'?'agy.exe':'antigravity.exe'));
    candidates.push(path.join(local,'agy','bin','agy.exe'));
  }
  if(user){
    candidates.push(path.join(user,'AntigravityProfiles','work','AppData','Local','agy','bin','agy.exe'));
    candidates.push(path.join(user,'AntigravityProfiles','work','.gemini','antigravity','bin','agy.exe'));
    candidates.push(path.join(user,'.gemini','antigravity','bin','agy.exe'));
    candidates.push(path.join(user,'AppData','Local','agy','bin','agy.exe'));
  }
  for(const candidate of candidates){const found=executableAt(candidate,name);if(found)return found;}
  return undefined;
}

export function findCli(name: string, env:NodeJS.ProcessEnv=process.env): CliCommand | undefined {
  const suffixes = process.platform === 'win32' ? ['.exe', '.cmd', '.ps1', ''] : [''];
  const rawPath = env.PATH ?? env.Path ?? process.env.PATH ?? process.env.Path ?? '';
  const entries = rawPath.split(path.delimiter).filter(Boolean);
  if (process.platform === 'win32') {
    const appData = env.APPDATA ?? process.env.APPDATA;
    const localAppData = env.LOCALAPPDATA ?? process.env.LOCALAPPDATA;
    const userProfile = env.USERPROFILE ?? process.env.USERPROFILE;
    if (appData) entries.push(path.join(appData, 'npm'));
    if (localAppData) entries.push(path.join(localAppData, 'npm'));
    if (userProfile) entries.push(path.join(userProfile, 'AppData', 'Roaming', 'npm'));
  }
  for (const entry of entries) {
    const directory = entry.replace(/^"|"$/g, '');
    for (const suffix of suffixes) {
      const candidate = path.join(directory, name + suffix);
      const found=executableAt(candidate,name);if(found)return found;
    }
  }
  // Codex Desktop ships its own signed CLI outside the user's normal PATH.
  // Matrix sessions opened in a standalone terminal still need to discover it.
  if(name==='codex')return desktopCodex(env);
  // The Windows installer can update the user PATH after this terminal was
  // opened. Discover the official per-user installation in that case too.
  if(name==='agy'||name==='antigravity')return installedAntigravity(name,env);
  return undefined;
}
export function runProcess(cli: CliCommand, args: string[], cwd: string, timeoutMs: number, logPath?: string, stdin?:string, env?:NodeJS.ProcessEnv, abortOnOutput?:RegExp): Promise<ProcessResult> {
  return spawnTool(cli.command, [...cli.prefix, ...args], { cwd, timeoutMs, logPath, stdin, env, abortOnOutput });
}
export function unavailableReason(result: ProcessResult): string | undefined {
  if (result.errorCode === 'ENOENT') return 'CLI indisponivel (ENOENT).';
  const text = result.stderr + '\n' + result.stdout;
  if (/Error loading config\.toml/i.test(text)) return 'Configuracao local incompativel com a versao do Codex; consulte run.log. Nenhuma configuracao global foi alterada.';
  if (/usage limit|quota exceeded|insufficient.quota|rate.limit|credits? exhausted|reached your.*limit/i.test(text)) return 'CLI sem cota disponivel; consulte run.log.';
  if (/not authenticated|unauthorized|authentication (failed|required)|not logged in|please (log|sign) in|login required|401 Unauthorized|token_revoked|refresh_token_invalidated|missing.*api.key/i.test(text)) return 'CLI sem autenticacao disponivel; consulte run.log.';
  return undefined;
}
