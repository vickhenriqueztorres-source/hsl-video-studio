import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from '../checkpointer';
import { spawnTool, ToolResult } from '../lib/proc';
import { ensureRunning, closeAssetServer } from './lib/assetServer';
import { syncCurrentRunAssets } from './lib/assets';
import { readJson, writeJson } from './runtime';

type Trial = { name: string; argv: string[]; result: ToolResult; outputPath?: string };
const episodeId = 'HSL_EPISODE_011';
const graphDir = path.join(REPO_ROOT, 'runs', episodeId, 'graph', 'render-diagnostic');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

async function run(name: string, argv: string[], timeoutMs = 180_000): Promise<ToolResult> {
  return spawnTool(npx, argv, { cwd: REPO_ROOT, timeoutMs, logPath: path.join(graphDir, `${name}.log`) });
}

function browserExecutable() {
  const base = path.join(REPO_ROOT, 'node_modules', '.remotion');
  const pending = [base];
  while (pending.length) {
    const folder = pending.pop()!;
    if (!fs.existsSync(folder)) continue;
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) pending.push(full);
      else if (/chrome-headless-shell\.exe$/i.test(entry.name)) return full;
    }
  }
  throw new Error(`Chrome Headless Shell não encontrado em ${base}`);
}

function renderArgv(propsPath: string, outputPath: string, extra: string[] = []) {
  const relativeProps = path.relative(REPO_ROOT, propsPath).replace(/\\/g, '/');
  const relativeOutput = path.relative(REPO_ROOT, outputPath).replace(/\\/g, '/');
  const base = [
    'remotion', 'render', 'build', 'HslLongFormComposition', relativeOutput,
    `--props=${relativeProps}`, '--frames=0-29', '--public-dir=build/public', '--muted',
    '--concurrency=2', '--gl=angle', '--image-format=jpeg', '--jpeg-quality=80',
    '--timeout=3600000',
  ];
  for (const flag of extra) {
    const key = flag.split('=')[0];
    const existing = base.findIndex(value => value.startsWith(key + '='));
    if (existing >= 0) base.splice(existing, 1);
    base.push(flag);
  }
  return base;
}

async function main() {
  fs.mkdirSync(graphDir, { recursive: true });
  const version = await run('01-version', ['remotion', '--version'], 60_000);
  const ensure = await run('02-browser-ensure', ['remotion', 'browser', 'ensure'], 600_000);
  const executablePath = browserExecutable();
  const executableVersion = await spawnTool(executablePath, ['--version'], {
    cwd: REPO_ROOT, timeoutMs: 60_000, logPath: path.join(graphDir, '03-executable-version.log'),
  });
  if (process.argv.includes('--setup-only')) {
    const receipt = { at: new Date().toISOString(), root: REPO_ROOT, version, ensure, executablePath,
      executableExists: fs.existsSync(executablePath), executableVersion, trials: [] as Trial[] };
    writeJson(path.join(graphDir, 'setup-receipt.json'), receipt);
    console.log(JSON.stringify(receipt, null, 2));
    const versionReported = /@remotion\/cli\s+\d+\.\d+\.\d+/.test(version.stdout);
    return versionReported && ensure.exitCode === 0 && executableVersion.exitCode === 0 ? 0 : 1;
  }
  const planPath = path.join(REPO_ROOT, 'runs', episodeId, 'scene-plan.json');
  const plan = readJson<Record<string, unknown>>(planPath);
  if (!plan) throw new Error(`Scene plan ausente ou inválido: ${planPath}`);
  if (!fs.existsSync(path.join(REPO_ROOT, 'build', 'index.html'))) throw new Error('Bundle build/index.html ausente');
  const server = await ensureRunning(REPO_ROOT);
  syncCurrentRunAssets(REPO_ROOT, episodeId);
  const propsPath = path.join(graphDir, 'render-props.json');
  writeJson(propsPath, { ...plan, assetBaseUrl: server.baseUrl });

  const requested = process.argv.includes('--variations') ? ['default', 'timeout-120000', 'gl-angle', 'gl-swangle', 'system-chrome', 'system-edge'] : ['default'];
  const variants: Record<string, string[]> = {
    default: [],
    'timeout-120000': ['--timeout=120000'],
    'gl-angle': ['--gl=angle'],
    'gl-swangle': ['--gl=swangle'],
    'system-chrome': ['--browser-executable=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],
    'system-edge': ['--browser-executable=C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'],
  };
  const trials: Trial[] = [];
  for (const name of requested) {
    const outputPath = path.join(graphDir, `${name}.mp4`);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    const argv = renderArgv(propsPath, outputPath, variants[name]);
    const result = await run(`render-${name}`, argv, 600_000);
    trials.push({ name, argv, result, outputPath });
    if (name === 'default' && result.exitCode === 0) break;
  }
  const receipt = { at: new Date().toISOString(), root: REPO_ROOT, version, ensure, executablePath,
    executableExists: fs.existsSync(executablePath), executableVersion, trials };
  writeJson(path.join(graphDir, 'receipt.json'), receipt);
  console.log(JSON.stringify(receipt, null, 2));
  return trials[0]?.result.exitCode === 0 ? 0 : 1;
}

main().then(async code => { await closeAssetServer(); process.exitCode = code; })
  .catch(async error => { await closeAssetServer(); console.error(error); process.exitCode = 1; });
