import fs from 'node:fs';
import path from 'node:path';
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
function agentEnv(e: FireflyEnvironment): NodeJS.ProcessEnv { return { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONPATH: e.agentDir, FIREFLY_CHROME_PROFILE_DIR: e.profileDir }; }
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
  if (await profileInUse(e.profileDir)) throw new Error(`FIREFLY_PROFILE_IN_USE:${e.profileDir}:feche o Chrome desse perfil e execute resume`);
  fs.mkdirSync(path.join(runtime, 'data'), { recursive: true });
  const feed = requireSuccess(await spawnTool(e.python, [path.join(e.agentDir, 'main.py'), '--root', runtime, '--feed-guide', guidePath], { cwd: e.agentDir, env: agentEnv(e), timeoutMs: 60_000, logPath }), 'FIREFLY_FEED_GUIDE');
  const run = requireSuccess(await spawnTool(e.python, [path.join(e.agentDir, 'main.py'), '--root', runtime, '--concurrency', '1', '--run'], { cwd: e.agentDir, env: agentEnv(e), timeoutMs: 2_100_000, logPath }), 'FIREFLY_RUN');
  return { feed, run };
}
