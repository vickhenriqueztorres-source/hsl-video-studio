import fs from 'node:fs';
import path from 'node:path';
import { requireSuccess, spawnTool } from '../lib/proc';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const AGENT_ROOT = process.env.HSL_FIREFLY_AGENT_DIR
  ?? 'C:\\Users\\brend\\OneDrive\\Desktop\\PROJETO 30K ATE 27\\02 - O OUTRO LADO\\AUTOMACAO - O OUTRO LADO\\agente firefly';
const PYTHON = path.join(AGENT_ROOT, '.venv', 'Scripts', 'python.exe');
const PROFILE = process.env.HSL_FIREFLY_PROFILE_DIR
  ?? 'D:\\HSL-FIREFLY-PROFILE';
const RUNTIME = path.join(REPO_ROOT, 'runs', 'phase2-discovery', 'kling25-canary', 'runtime');
const RECEIPT = path.join(REPO_ROOT, 'runs', 'phase2-discovery', 'kling25-canary', 'result.json');
const RETRY_RECEIPT = path.join(REPO_ROOT, 'runs', 'phase2-discovery', 'kling25-canary', 'retry-result.json');
const LOG = path.join(REPO_ROOT, 'runs', 'phase2-discovery', 'kling25-canary', 'kling25-canary.log');
const EPISODE_IMAGE = path.join(REPO_ROOT, 'runs', 'HSL_EPISODE_011', 'frames', 'SCENE_001.png');
const KNOWN_AGENT_IMAGE = path.join(AGENT_ROOT, 'imagens', 'OOL_001.png');

function assertInputs(): void {
  for (const file of [PYTHON, EPISODE_IMAGE]) {
    if (!fs.existsSync(file)) throw new Error(`KLING_CANARY_INPUT_MISSING: ${file}`);
  }
  if (!fs.existsSync(path.join(PROFILE, 'Default'))) {
    throw new Error(`KLING_CANARY_PROFILE_MISSING: ${PROFILE}`);
  }
}

function env(selectorTimeoutMs = '60000'): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PYTHONIOENCODING: 'utf-8',
    PYTHONPATH: AGENT_ROOT,
    FIREFLY_CHROME_PROFILE_DIR: PROFILE,
    FIREFLY_SELECTOR_TIMEOUT_MS: selectorTimeoutMs,
  };
}

async function initializeRuntime(): Promise<void> {
  fs.mkdirSync(path.join(RUNTIME, 'data'), { recursive: true });
  const result = await spawnTool(PYTHON, [
    path.join(AGENT_ROOT, 'main.py'), '--root', RUNTIME, '--status',
  ], { cwd: AGENT_ROOT, env: env(), timeoutMs: 60_000, logPath: LOG });
  requireSuccess(result, 'KLING_CANARY_RUNTIME_INIT');
}

async function probe(): Promise<void> {
  await initializeRuntime();
  const result = await spawnTool(PYTHON, [
    path.join(AGENT_ROOT, 'main.py'), '--root', RUNTIME, '--probe-session',
  ], { cwd: AGENT_ROOT, env: env(), timeoutMs: 180_000, logPath: LOG });
  requireSuccess(result, 'KLING_CANARY_SESSION_PROBE');
  process.stdout.write(result.stdout);
}

async function run(retry = false, knownImage = false, native = false, clean = false): Promise<void> {
  const receipt = clean
    ? path.join(path.dirname(RECEIPT), 'clean-profile-result.json')
    : native
    ? path.join(path.dirname(RECEIPT), 'native-result.json')
    : knownImage
      ? path.join(path.dirname(RECEIPT), 'known-image-result.json')
      : retry ? RETRY_RECEIPT : RECEIPT;
  if (fs.existsSync(receipt)) {
    throw new Error(`KLING_CANARY_ALREADY_ATTEMPTED: ${receipt}`);
  }
  await initializeRuntime();
  const image = knownImage ? KNOWN_AGENT_IMAGE : EPISODE_IMAGE;
  if (!fs.existsSync(image)) throw new Error(`KLING_CANARY_INPUT_MISSING: ${image}`);
  fs.mkdirSync(path.dirname(RECEIPT), { recursive: true });
  const entryArgs = native
    ? [path.join(REPO_ROOT, 'graph', 'discovery', 'nativeKlingCanary.py')]
    : ['-m', 'firefly_bot.model_canary'];
  const result = await spawnTool(PYTHON, [
    ...entryArgs,
    '--root', RUNTIME,
    '--model', 'Kling 2.5 Turbo',
    '--duration', '5',
    '--resolution', '1080p',
    '--image', image,
    '--job-id', clean ? '-92506' : native ? '-92504' : knownImage ? '-92503' : retry ? '-92502' : '-92501',
    '--name', clean ? 'HSL_PHASE2_KLING25_CLEAN_PROFILE' : native ? 'HSL_PHASE2_KLING25_NATIVE' : knownImage ? 'HSL_PHASE2_KLING25_KNOWN_IMAGE' : retry ? 'HSL_PHASE2_KLING25_CANARY_RETRY' : 'HSL_PHASE2_KLING25_CANARY',
    '--output', receipt,
  ], { cwd: AGENT_ROOT, env: env(retry ? '300000' : '60000'), timeoutMs: 2_100_000, logPath: LOG });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  requireSuccess(result, 'KLING_25_TURBO_CANARY');
}

const command = process.argv[2] ?? 'probe';
if (!['probe', 'run', 'retry', 'known-image', 'native', 'clean'].includes(command)) throw new Error('Uso: kling25Canary.ts probe|run|retry|known-image|native|clean');
(command === 'probe' ? probe() : run(command === 'retry', command === 'known-image', command === 'native', command === 'clean')).catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

