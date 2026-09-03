import {findCli} from './drivers/process';
import {spawnTool, ToolResult} from '../lib/proc';
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
  if (action === 'login') codexCommand(process.cwd(), ['login'], {interactive: true, timeoutMs: 600_000})
    .then(r => {process.exitCode = r.exitCode ?? 1;});
  else if (action === 'status') checkCodexAccount(process.cwd()).then(result => {
    console.log(JSON.stringify({provider: 'codex', ...result, command: 'npm run hsl:codex:login'}, null, 2));
    process.exitCode = result.authenticated ? 0 : 2;
  });
  else throw new Error('Use login|status');
}
