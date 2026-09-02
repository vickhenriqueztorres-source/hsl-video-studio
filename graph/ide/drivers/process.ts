import fs from 'node:fs';
import path from 'node:path';
import { spawnTool, ToolResult } from '../../lib/proc';
export interface CliCommand { command: string; prefix: string[] }
export type ProcessResult = ToolResult;

export function findCli(name: string): CliCommand | undefined {
  const suffixes = process.platform === 'win32' ? ['.exe', '.cmd', '.ps1', ''] : [''];
  for (const entry of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!entry) continue;
    const directory = entry.replace(/^"|"$/g, '');
    for (const suffix of suffixes) {
      const candidate = path.join(directory, name + suffix);
      if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) continue;
      if (process.platform === 'win32' && /\.(cmd|ps1)$/i.test(candidate)) {
        const js = path.join(directory, 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
        if (name === 'codex' && fs.existsSync(js)) return { command: process.execPath, prefix: [js] };
        continue;
      }
      return { command: candidate, prefix: [] };
    }
  }
  return undefined;
}
export function runProcess(cli: CliCommand, args: string[], cwd: string, timeoutMs: number, logPath?: string): Promise<ProcessResult> {
  return spawnTool(cli.command, [...cli.prefix, ...args], { cwd, timeoutMs, logPath });
}
export function unavailableReason(result: ProcessResult): string | undefined {
  if (result.errorCode === 'ENOENT') return 'CLI indisponivel (ENOENT).';
  const text = result.stderr + '\n' + result.stdout;
  if (/Error loading config\.toml/i.test(text)) return 'Configuracao local incompativel com a versao do Codex; consulte run.log. Nenhuma configuracao global foi alterada.';
  if (/usage limit|quota exceeded|insufficient.quota|rate.limit|credits? exhausted|reached your.*limit/i.test(text)) return 'CLI sem cota disponivel; consulte run.log.';
  if (/not authenticated|unauthorized|authentication (failed|required)|not logged in|please (log|sign) in|login required|401 Unauthorized|missing.*api.key/i.test(text)) return 'CLI sem autenticacao disponivel; consulte run.log.';
  return undefined;
}
