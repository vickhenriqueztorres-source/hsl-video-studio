import {findCli} from './drivers/process';
import {spawnTool,spawnInteractiveTool,requireSuccess, ToolResult} from '../lib/proc';
import {listCodexProfiles,CodexProfile} from './codexProfiles';
export async function loginCodexAccount(root:string,env:NodeJS.ProcessEnv=process.env):Promise<number>{
  const cli=findCli('codex');if(!cli)throw new Error('Codex CLI não encontrado no PATH nem na instalação do Codex Desktop. Instale com "npm install -g @openai/codex".');
  console.log('No navegador, escolha a conta ChatGPT desejada. Use "Usar outra conta" se necessário.');
  return spawnInteractiveTool(cli.command,[...cli.prefix,'login'],{cwd:root,env});
}
export async function loginCodexProfile(root:string,profile:{home:string}){return loginCodexAccount(root,{...process.env,CODEX_HOME:profile.home});}
export async function switchCodexAccount(root:string,command=codexCommand,login=loginCodexAccount):Promise<number>{
  console.log('Trocando a conta ativa do Codex CLI neste perfil de usuário.');
  requireSuccess(await command(root,['logout'],{timeoutMs:30000}),'CODEX_LOGOUT');
  return login(root);
}
export async function codexCommand(root: string, args: string[], options: {
  stdin?: string; timeoutMs?: number; logPath?: string; interactive?: boolean; env?: NodeJS.ProcessEnv; abortOnOutput?:RegExp
} = {}): Promise<ToolResult> {
  const cli = findCli('codex');
  if (!cli) return {exitCode: 127, errorCode: 'ENOENT', stdout: '', stderr: 'Codex CLI não encontrado', timedOut: false, durationMs: 0};
  return spawnTool(cli.command, [...cli.prefix, ...args], {cwd: root, ...options,
    ...(options.interactive ? {onStdout: (s: string) => process.stdout.write(s), onStderr: (s: string) => process.stderr.write(s)} : {})});
}
export async function checkCodexAccount(root: string,env:NodeJS.ProcessEnv=process.env) {
  const r = await codexCommand(root, ['login', 'status'], {timeoutMs: 30_000,env});
  const text = r.stdout + r.stderr;
  const revoked = /token_revoked|refresh_token_invalidated|invalidated oauth token/i.test(text);
  const authenticated = r.exitCode === 0 && !revoked && /logged in using chatgpt/i.test(text);
  return {authenticated, ...(!authenticated ? {reason: r.errorCode === 'ENOENT' ? 'Codex CLI não instalado' : revoked ? 'Sessão Codex revogada; refaça o login com npm run hsl:codex:login' : 'Entre com sua conta ChatGPT usando npm run hsl:codex:login'} : {})};
}
export async function checkCodexAccounts(root:string){
  const profiles=listCodexProfiles(),checks=[] as {profile:CodexProfile;authenticated:boolean;reason?:string}[];
  for(const profile of profiles){const env={...process.env,CODEX_HOME:profile.home},result=await checkCodexAccount(root,env);checks.push({profile,authenticated:result.authenticated,...('reason'in result?{reason:result.reason}: {})});}
  const active=checks.find(x=>x.authenticated);
  return active?{authenticated:true,profileId:active.profile.id,profiles:checks.map(x=>({id:x.profile.id,name:x.profile.name,authenticated:x.authenticated}))}:{authenticated:false,reason:'Nenhuma conta Codex autenticada; use o login da conta principal ou cadastre uma conta reserva.',profiles:checks.map(x=>({id:x.profile.id,name:x.profile.name,authenticated:x.authenticated}))};
}
if (require.main === module) {
  const action = process.argv[2] ?? 'status';
  if (action === 'login' || action === 'switch') (action==='switch'?switchCodexAccount(process.cwd()):loginCodexAccount(process.cwd()))
    .then(code => {process.exitCode = code;}).catch(e=>{console.error(e.message);process.exitCode=1;});
  else if (action === 'status') checkCodexAccount(process.cwd()).then(result => {
    console.log(JSON.stringify({provider: 'codex', ...result, command: 'npm run hsl:codex:login'}, null, 2));
    process.exitCode = result.authenticated ? 0 : 2;
  });
  else throw new Error('Use login|switch|status');
}
