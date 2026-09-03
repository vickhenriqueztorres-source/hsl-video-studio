import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

export interface ToolOptions {
  cwd: string; timeoutMs?: number; env?: NodeJS.ProcessEnv; logPath?: string;
  stdin?: string; onStdout?: (text: string) => void; onStderr?: (text: string) => void;
}
export interface ToolResult {
  exitCode?: number; stdout: string; stderr: string; errorCode?: string;
  timedOut: boolean; durationMs: number;
}

export function resolveTool(cmd: string, env = process.env): { command: string; prefix: string[] } {
  if (path.isAbsolute(cmd) && !/\.(cmd|ps1)$/i.test(cmd)) return { command: cmd, prefix: [] };
  const name = cmd.replace(/\.(cmd|exe)$/i, '');
  const candidates = path.isAbsolute(cmd) ? [cmd] : (env.PATH ?? '').split(path.delimiter)
    .flatMap(dir => (process.platform === 'win32' ? ['.exe', '.cmd', ''] : [''])
      .map(suffix => path.join(dir.replace(/^"|"$/g, ''), name + suffix)));
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) continue;
    if (/\.cmd$/i.test(candidate)) {
      // .cmd cannot be spawned by CreateProcess with shell:false. Resolve the
      // installed npm shim to its JS entry point, keeping every argv literal.
      const base = path.basename(name);
      if (base !== 'npm' && base !== 'npx') throw new Error(`Unsupported shim: ${candidate}`);
      const script = path.join(path.dirname(candidate), 'node_modules', 'npm', 'bin', `${base}-cli.js`);
      if (!fs.existsSync(script)) throw new Error(`Missing npm entry point: ${script}`);
      return { command: process.execPath, prefix: [script] };
    }
    return { command: candidate, prefix: [] };
  }
  return { command: cmd, prefix: [] }; // spawn reports ENOENT, including in smoke tests
}

export async function spawnTool(cmd: string, argv: string[], opts: ToolOptions): Promise<ToolResult> {
  const cli = resolveTool(cmd, opts.env);
  const started = Date.now();
  const log = (s: string) => { if (opts.logPath) { fs.mkdirSync(path.dirname(opts.logPath), { recursive: true }); fs.appendFileSync(opts.logPath, s); } };
  log(`[command] ${JSON.stringify({ requested: cmd, executable: cli.command, argv: [...cli.prefix, ...argv], cwd: opts.cwd })}\n`);
  return new Promise(resolve => {
    const child = spawn(cli.command, [...cli.prefix, ...argv], { cwd: opts.cwd,
      env: opts.env ?? process.env, shell: false, windowsHide: true,
      detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', timedOut = false, settled = false;
    let errorCode: string | undefined;
    let forceTimer: NodeJS.Timeout | undefined;
    const kill = (force: boolean) => {
      if (!child.pid) return;
      if (process.platform === 'win32') {
        const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', ...(force ? ['/F'] : [])], { shell: false, windowsHide: true, stdio: 'ignore' });
        killer.on('error', () => child.kill(force ? 'SIGKILL' : 'SIGTERM'));
      } else { try { process.kill(-child.pid, force ? 'SIGKILL' : 'SIGTERM'); } catch {} }
    };
    const timer = setTimeout(() => { timedOut = true; kill(false); forceTimer = setTimeout(() => kill(true), 2000); }, opts.timeoutMs ?? 3_600_000);
    const finish = (code: number | null) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (!timedOut && forceTimer) clearTimeout(forceTimer);
      const durationMs = Date.now() - started;
      log(`[exit] code=${code ?? 'null'} durationMs=${durationMs} timedOut=${timedOut}\n`);
      resolve({ exitCode: code ?? undefined, stdout, stderr, errorCode, timedOut, durationMs });
    };
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', (s: string) => { stdout = (stdout + s).slice(-2_000_000); log('[stdout] ' + s); opts.onStdout?.(s); });
    child.stderr.on('data', (s: string) => { stderr = (stderr + s).slice(-128_000); log('[stderr] ' + s); opts.onStderr?.(s); });
    child.stdin.on('error', () => { /* CLI can exit before consuming stdin. */ });
    child.stdin.end(opts.stdin);
    child.on('error', (e: NodeJS.ErrnoException) => { errorCode = e.code; stderr += e.message; log(`[error] ${e.message}\n`); finish(null); });
    child.on('close', finish);
  });
}

export function requireSuccess(result: ToolResult, label: string): ToolResult {
  if (result.exitCode !== 0 || result.timedOut || result.errorCode) throw new Error(`${label}: ${result.stderr || result.errorCode || 'timeout'}`);
  return result;
}

// For synchronous engines isolated inside a worker process. Keep the same
// executable resolution, literal argv and hidden Windows process behavior.
export function spawnToolSync(cmd: string, argv: readonly string[], opts: ToolOptions): ToolResult {
  const cli = resolveTool(cmd, opts.env), started = Date.now();
  const result = spawnSync(cli.command, [...cli.prefix, ...argv], {
    cwd: opts.cwd, env: opts.env ?? process.env, shell: false, windowsHide: true,
    encoding: 'utf8', input: opts.stdin, timeout: opts.timeoutMs ?? 300_000, maxBuffer: 10 * 1024 * 1024,
  });
  const errorCode = (result.error as NodeJS.ErrnoException | undefined)?.code;
  const output: ToolResult = {exitCode: result.status ?? undefined, stdout: result.stdout ?? '',
    stderr: result.stderr || result.error?.message || '', errorCode,
    timedOut: errorCode === 'ETIMEDOUT', durationMs: Date.now() - started};
  if (opts.logPath) {
    fs.mkdirSync(path.dirname(opts.logPath), {recursive: true});
    fs.appendFileSync(opts.logPath, JSON.stringify({command: cli.command, argv: [...cli.prefix, ...argv], ...output}) + '\n');
  }
  return output;
}
