import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export interface CliCommand { command: string; prefix: string[] }
export interface ProcessResult {
  exitCode?: number;
  stdout: string;
  stderr: string;
  errorCode?: string;
  timedOut: boolean;
  durationMs: number;
}

// Never interpolate a prompt into cmd.exe/PowerShell. For npm's Windows shim,
// launch its installed JS entry point with Node and an ordinary argv array.
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

export async function runProcess(
  cli: CliCommand, args: string[], cwd: string, timeoutMs: number, logPath?: string,
): Promise<ProcessResult> {
  const started = Date.now();
  let stdout = '';
  let stderr = '';
  let timedOut = false;
  let errorCode: string | undefined;
  const log = (value: string) => { if (logPath) fs.appendFileSync(logPath, value); };
  log(`\n[process] ${path.basename(cli.command)} started ${new Date().toISOString()}\n`);
  log(`[command] ${JSON.stringify({ executable: cli.command, argv: [...cli.prefix, ...args], cwd })}\n`);
  return new Promise((resolve) => {
    const child = spawn(cli.command, [...cli.prefix, ...args], {
      cwd, shell: false, windowsHide: true, detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let settled = false;
    let forceTimer: NodeJS.Timeout | undefined;
    const stopTree = (force: boolean) => {
      if (!child.pid) return;
      if (process.platform === 'win32') {
        const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', ...(force ? ['/F'] : [])],
          { windowsHide: true, shell: false, stdio: 'ignore' });
        killer.on('error', () => { try { child.kill(force ? 'SIGKILL' : 'SIGTERM'); } catch { /* exited */ } });
      } else {
        try { process.kill(-child.pid, force ? 'SIGKILL' : 'SIGTERM'); } catch { /* exited */ }
      }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      log(`\n[timeout] ${timeoutMs}ms; terminating process tree\n`);
      stopTree(false);
      forceTimer = setTimeout(() => stopTree(true), 2000);
    }, timeoutMs);
    const finish = (code: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Also stop descendants if the root exited after the first signal.
      if (!timedOut && forceTimer) clearTimeout(forceTimer);
      const durationMs = Date.now() - started;
      log(`\n[exit] code=${code ?? 'null'} durationMs=${durationMs} timedOut=${timedOut}\n`);
      resolve({ exitCode: code ?? undefined, stdout, stderr, errorCode, timedOut, durationMs });
    };
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (text: string) => {
      stdout = (stdout + text).slice(-2_000_000); log('[stdout] ' + text);
    });
    child.stderr.on('data', (text: string) => {
      stderr = (stderr + text).slice(-128_000); log('[stderr] ' + text);
    });
    child.on('error', (error: NodeJS.ErrnoException) => {
      errorCode = error.code; stderr += error.message; log(`\n[error] ${error.message}\n`); finish(null);
    });
    child.on('close', finish);
  });
}

export function unavailableReason(result: ProcessResult): string | undefined {
  if (result.errorCode === 'ENOENT') return 'CLI indisponivel (ENOENT).';
  const text = result.stderr + '\n' + result.stdout;
  if (/Error loading config\.toml/i.test(text)) {
    return 'Configuracao local incompativel com a versao do Codex; consulte run.log. Nenhuma configuracao global foi alterada.';
  }
  if (/usage limit|quota exceeded|insufficient.quota|rate.limit|credits? exhausted|reached your.*limit/i.test(text)) {
    return 'CLI sem cota disponivel; consulte run.log.';
  }
  if (/not authenticated|unauthorized|authentication (failed|required)|not logged in|please (log|sign) in|login required|401 Unauthorized|missing.*api.key/i.test(text)) {
    return 'CLI sem autenticacao disponivel; consulte run.log.';
  }
  return undefined;
}
