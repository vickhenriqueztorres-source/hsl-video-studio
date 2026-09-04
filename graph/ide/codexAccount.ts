import {findCli} from './drivers/process';
import {spawnTool,spawnInteractiveTool,requireSuccess, ToolResult} from '../lib/proc';
export async function loginCodexAccount(root:string):Promise<number>{
  const cli=findCli('codex');if(!cli)throw new Error('Codex CLI não encontrado');
  console.log('No navegador, escolha a conta ChatGPT desejada. Use "Usar outra conta" se necessário.');
  return spawnInteractiveTool(cli.command,[...cli.prefix,'login'],{cwd:root});
}
export async function switchCodexAccount(root:string,command=codexCommand,login=loginCodexAccount):Promise<number>{
  console.log('Trocando a conta ativa do Codex CLI neste perfil de usuário.');
  requireSuccess(await command(root,['logout'],{timeoutMs:30000}),'CODEX_LOGOUT');
  return login(root);
}
export async function codexCommand(root: string, args: string[], options: {
  stdin?: string; timeoutMs?: number; logPath?: string; interactive?: boolean
} = {}): Promise<ToolResult> {
  const cli = findCli('codex');
  if (!cli) return {exitCode: 127, errorCode: 'ENOENT', stdout: '', stderr: 'Codex CLI não encontrado', timedOut: false, durationMs: 0};
  return spawnTool(cli.command, [...cli.prefix, ...args], {cwd: root, ...options,
    ...(options.interactive ? {onStdout: (s: string) => process.stdout.write(s), onStderr: (s: string) => process.stderr.write(s)} : {})});
}
export async function checkCodexAccount(root: string) {
  const r = await codexCommand(root, ['login', 'status'], {timeoutMs: 30_000});
  const authenticated = r.exitCode === 0 && /logged in using chatgpt/i.test(r.stdout + r.stderr);
  return {authenticated, ...(!authenticated ? {reason: r.errorCode === 'ENOENT' ? 'Codex CLI não instalado' : 'Entre com sua conta ChatGPT usando npm run hsl:codex:login'} : {})};
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
