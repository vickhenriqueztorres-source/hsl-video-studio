import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnTool, requireSuccess, ToolResult } from '../../../lib/proc';

export interface FireflyEnvironment { agentDir: string; profileDir: string; python: string }
export function fireflyEnvironment(env = process.env): FireflyEnvironment {
  const agentDir = env.HSL_FIREFLY_AGENT_DIR;
  if (!agentDir) throw new Error('FIREFLY_ENV_MISSING:HSL_FIREFLY_AGENT_DIR');
  const profileDir = env.HSL_FIREFLY_CHROME_PROFILE;
  if (!profileDir) throw new Error('FIREFLY_ENV_MISSING:HSL_FIREFLY_CHROME_PROFILE');
  const python = env.HSL_FIREFLY_PYTHON || path.join(agentDir, '.venv', ...(process.platform === 'win32' ? ['Scripts', 'python.exe'] : ['bin', 'python']));
  for (const required of [agentDir, profileDir, python, path.join(agentDir, 'main.py')]) if (!fs.existsSync(required)) throw new Error(`FIREFLY_ENV_PATH_MISSING:${required}`);
  return { agentDir: path.resolve(agentDir), profileDir: path.resolve(profileDir), python };
}
// One provider attempt per reserved operation. Capacity failures require reconciliation.
function agentEnv(e: FireflyEnvironment): NodeJS.ProcessEnv { return { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONPATH: e.agentDir, FIREFLY_CHROME_PROFILE_DIR: e.profileDir, FIREFLY_PROVIDER_CAPACITY_MAX_ATTEMPTS: '1', FIREFLY_STRICT_RESERVATION_MODE: '1' }; }

export async function assertAgentProtocol(e:FireflyEnvironment,logPath:string):Promise<void> {
  // --help exits before opening a browser or creating an external job.
  const result=await spawnTool(e.python,[path.join(e.agentDir,'main.py'),'--help'],{cwd:e.agentDir,env:agentEnv(e),timeoutMs:30_000,logPath});
  if(result.exitCode!==0||result.timedOut||result.errorCode)throw new Error('FIREFLY_ENV_AGENT_PROTOCOL_UNAVAILABLE: unable to inspect agent CLI');
  const missing=['--feed-guide','--run','--probe-session','--requeue-unstarted-infra-job','--recover-result-ready-job'].filter(flag=>!result.stdout.includes(flag));
  if(missing.length)throw new Error(`FIREFLY_ENV_AGENT_PROTOCOL_UNSUPPORTED: missing ${missing.join(', ')}; upgrade/audit the external agent before dispatch`);
}

export interface FireflyAuthorization { authorizationId: string; planHash: string; operationId: string; recipeHash: string }
const authorizationKeys = ['authorizationId', 'planHash', 'operationId', 'recipeHash'] as const;
function validAuthorization(value: unknown): value is FireflyAuthorization {
  return !!value && typeof value === 'object' && authorizationKeys.every(key => {
    const field = (value as FireflyAuthorization)[key];
    return typeof field === 'string' && field.trim().length > 0;
  });
}
function authorizationSnapshot(value: FireflyAuthorization): FireflyAuthorization {
  return { authorizationId: value.authorizationId, planHash: value.planHash, operationId: value.operationId, recipeHash: value.recipeHash };
}
interface DispatchReceipt {
  schema: 'hsl.kling-dispatch.v1' | 'hsl.kling-dispatch.v2';
  name: string; guideHash: string; inputFrameHash?: string; authorization?: FireflyAuthorization;
  phase: 'prepared' | 'enqueued' | 'running' | 'succeeded' | 'uncertain' | 'transport_complete';
  paidDispatchPossible: boolean; outputPath: string; outputHash?: string; updatedAt: string; error?: string;
}
const sha256 = (bytes: crypto.BinaryLike) => crypto.createHash('sha256').update(bytes).digest('hex');
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file, 'utf8'));
function readReceipt(file: string): DispatchReceipt | undefined {
  let value: DispatchReceipt;
  try { value = readJson(file); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw new Error(`KLING_RECEIPT_INVALID:${file}:reconcile before retry`);
  }
  if (!value || !['hsl.kling-dispatch.v1', 'hsl.kling-dispatch.v2'].includes(value.schema)
    || !['prepared', 'enqueued', 'running', 'succeeded', 'uncertain', 'transport_complete'].includes(value.phase)
    || typeof value.name !== 'string' || typeof value.guideHash !== 'string' || typeof value.outputPath !== 'string'
    || typeof value.paidDispatchPossible !== 'boolean'
    || (value.authorization !== undefined && !validAuthorization(value.authorization))
    || (value.schema === 'hsl.kling-dispatch.v2' && !/^[a-f0-9]{64}$/.test(value.inputFrameHash ?? ''))) {
    throw new Error(`KLING_RECEIPT_INVALID:${file}:reconcile before retry`);
  }
  return value;
}
function writeReceipt(file: string, value: DispatchReceipt) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomUUID()}.tmp`;
  const fd = fs.openSync(tmp, 'wx');
  try { fs.writeFileSync(fd, JSON.stringify(value, null, 2) + '\n'); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(tmp, file);
  // Persist the rename as well as its contents where directory fsync is supported.
  if (process.platform !== 'win32') {
    const dir = fs.openSync(path.dirname(file), 'r');
    try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
  }
}
function updateReceipt(file: string, base: Omit<DispatchReceipt, 'phase' | 'updatedAt'>, phase: DispatchReceipt['phase'], extra: Partial<DispatchReceipt> = {}) {
  writeReceipt(file, { ...base, ...extra, phase, updatedAt: new Date().toISOString() });
}

// Read once: both the hash and the staged file describe these exact bytes.
// Staging is deferred until receipt checks pass, preserving legacy evidence.
function stageGuide(runtime: string, guidePath: string, authorization?:FireflyAuthorization) {
  const guide = readJson(guidePath), item = guide?.items?.[0];
  if (!item || guide.items.length !== 1) throw new Error('KLING_GUIDE_REQUIRES_EXACTLY_ONE_ITEM');
  if (item.model !== 'Kling 2.5 Turbo' || item.duration_seconds !== 5 || item.resolution !== '1080p' || item.aspect_ratio !== '16:9' || item.generate_audio !== false) throw new Error('KLING_GUIDE_PROFILE_INVALID');
  if (typeof item.name !== 'string' || !/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(item.name)) throw new Error('KLING_GUIDE_NAME_INVALID');
  const source = path.resolve(String(item.image));
  if (!fs.existsSync(source)) throw new Error(`KLING_FIRST_FRAME_MISSING:${source}`);
  const bytes = fs.readFileSync(source), inputFrameHash = sha256(bytes);
  const imageName = `${item.name}${path.extname(source).toLowerCase() || '.png'}`;
  const imagePath = path.join(runtime, 'imagens', imageName);
  const agentGuide = { ...guide, ...(authorization?{authorization,input_frame_hash:inputFrameHash}:{}), items: [{ ...item, image: imageName }] };
  const serialized = JSON.stringify(agentGuide), stagedPath = path.join(runtime, 'agent-guide.json');
  return {
    path: stagedPath, imagePath, name: item.name as string, inputFrameHash, legacyHash: sha256(serialized),
    hash: sha256(JSON.stringify({ guide: agentGuide, inputFrameHash })),
    write() {
      fs.mkdirSync(path.dirname(imagePath), { recursive: true });
      fs.writeFileSync(imagePath, bytes);
      fs.writeFileSync(stagedPath, JSON.stringify(agentGuide, null, 2) + '\n');
    },
  };
}

export async function profileInUse(profileDir: string): Promise<boolean> {
  // Also detect orphaned Chrome singleton artifacts (including dangling links).
  for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
    try { fs.lstatSync(path.join(profileDir, name)); return true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  if (process.platform !== 'win32') {
    const result = requireSuccess(await spawnTool('ps', ['-ax', '-o', 'command='], { cwd: process.cwd(), timeoutMs: 30_000 }), 'FIREFLY_PROFILE_PROCESS_CHECK');
    return result.stdout.split('\n').some(line => /chrome|chromium/i.test(line) && line.includes(profileDir));
  }
  const escaped = profileDir.replace(/'/g, "''");
  const script = `$ErrorActionPreference='Stop'; $p='${escaped}'; [Console]::Out.Write((Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { -not $_.CommandLine -or $_.CommandLine.IndexOf($p,[StringComparison]::OrdinalIgnoreCase) -ge 0 } | Select-Object -First 1) -ne $null)`;
  const result = requireSuccess(await spawnTool('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { cwd: process.cwd(), timeoutMs: 30_000 }), 'FIREFLY_PROFILE_PROCESS_CHECK');
  if (!/^(true|false)$/i.test(result.stdout.trim())) throw new Error('FIREFLY_PROFILE_PROCESS_CHECK:unknown result');
  return result.stdout.trim().toLowerCase() === 'true';
}

async function withProfileLock<T>(e: FireflyEnvironment, action: (assertOwnership: () => void) => Promise<T>, loginHandoffLog?: string): Promise<T> {
  // Canonical profile path makes aliases/junctions share the same atomic lock.
  const profileDir = fs.realpathSync(e.profileDir), lockPath = path.join(profileDir, '.hsl-firefly-dispatch.lock');
  const token = crypto.randomUUID();
  let fd: number;
  try { fd = fs.openSync(lockPath, 'wx'); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    // Never steal a dead parent's lock: its Python/Chrome children may still
    // dispatch. Recovery must establish that ALL external workers are stopped.
    throw new Error(`FIREFLY_PROFILE_LOCKED:${lockPath}:reconcile owner and external workers before removing lock`);
  }
  const assertOwnership = () => {
    let owner: { token?: string } | undefined;
    try { owner = readJson(lockPath); } catch { /* Missing/corrupt means lost ownership. */ }
    if (owner?.token !== token) throw new Error(`FIREFLY_PROFILE_LOCK_LOST:${lockPath}:reconcile before retry`);
  };
  try {
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, token, profileDir, acquiredAt: new Date().toISOString() }));
    fs.fsyncSync(fd);
    // Only the recorded login browser can be handed over. Unknown Chrome and
    // surviving workers remain blocked; neither their processes nor locks are removed.
    if (loginHandoffLog && fs.existsSync(path.join(profileDir, '.hsl-firefly-login.json'))) {
      if (process.platform !== 'win32') throw new Error('FIREFLY_LOGIN_HANDOFF_PLATFORM_UNSUPPORTED');
      const script = path.resolve(__dirname, '..', '..', 'closeFireflyLogin.ps1');
      requireSuccess(await spawnTool('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-ProfileDir', profileDir],
        { cwd: e.agentDir, timeoutMs: 25_000, logPath: loginHandoffLog }), 'FIREFLY_LOGIN_HANDOFF');
      assertOwnership();
    }
    if (await profileInUse(profileDir) || (profileDir !== e.profileDir && await profileInUse(e.profileDir))) {
      throw new Error(`FIREFLY_PROFILE_IN_USE:${e.profileDir}:feche o Chrome desse perfil e execute resume`);
    }
    assertOwnership();
    return await action(assertOwnership);
  } finally {
    fs.closeSync(fd);
    // Do not remove a replacement lock after loss of ownership.
    let owner: { token?: string } | undefined;
    try { owner = readJson(lockPath); } catch { /* Malformed lock requires reconciliation. */ }
    if (owner?.token === token) fs.unlinkSync(lockPath);
  }
}

export async function probeSession(e: FireflyEnvironment, runtime: string, logPath: string): Promise<boolean> {
  await assertAgentProtocol(e,logPath);
  return withProfileLock(e, async assertOwnership => {
    fs.mkdirSync(path.join(runtime, 'data'), { recursive: true });
    const result = await spawnTool(e.python, [path.join(e.agentDir, 'main.py'), '--root', runtime, '--probe-session'], { cwd: e.agentDir, env: agentEnv(e), timeoutMs: 180_000, logPath });
    assertOwnership();
    if (result.timedOut || result.errorCode || ![0, 3].includes(result.exitCode ?? -1)) {
      throw new Error(`FIREFLY_SESSION_PROBE_FAILED:exit=${result.exitCode ?? result.errorCode ?? 'unknown'};timeout=${result.timedOut};log=${logPath}`);
    }
    return result.exitCode === 0;
  }, logPath);
}
export async function openLoginChrome(e: FireflyEnvironment, logPath: string): Promise<ToolResult> {
  return withProfileLock(e, async assertOwnership => {
    const candidates = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'];
    const chrome = candidates.find(fs.existsSync); if (!chrome) throw new Error('FIREFLY_LOGIN_CHROME_NOT_FOUND');
    const script = path.resolve(__dirname, '..', '..', 'openFireflyLogin.ps1');
    const result = requireSuccess(await spawnTool('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script,
      '-ChromePath', chrome, '-ProfileDir', e.profileDir, '-Url', 'https://firefly.adobe.com/generate/video'],
      { cwd: e.agentDir, timeoutMs: 30_000, logPath }), 'FIREFLY_LOGIN_CHROME_OPEN');
    assertOwnership();
    return result;
  });
}

export interface FireflyTransportResult {
  feed: ToolResult; run: ToolResult; status: 'transport_complete'; outputPath: string;
}
function assertIdentity(previous: DispatchReceipt, staged: ReturnType<typeof stageGuide>, outputPath: string) {
  if (previous.guideHash !== staged.hash || previous.inputFrameHash !== staged.inputFrameHash) throw new Error('KLING_RECEIPT_GUIDE_HASH_MISMATCH');
  if (previous.name !== staged.name || path.resolve(previous.outputPath) !== path.resolve(outputPath)) throw new Error('KLING_RECEIPT_IDENTITY_MISMATCH');
}
function outputHash(file: string): string | undefined {
  try { const stat = fs.statSync(file); return stat.isFile() && stat.size > 0 ? sha256(fs.readFileSync(file)) : undefined; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error; }
}
export async function runAgentTake(e: FireflyEnvironment, runtime: string, guidePath: string, logPath: string, authorization?: FireflyAuthorization): Promise<FireflyTransportResult> {
  // The parent validates scope/budget durably; the adapter binds that identity.
  // A malformed supplied identity is an error even with the canary env enabled.
  if (authorization !== undefined && !validAuthorization(authorization)) throw new Error('KLING_AUTHORIZATION_INVALID');
  const approved = authorization === undefined ? undefined : authorizationSnapshot(authorization);
  if (!approved && process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH !== 'true') throw new Error('KLING_PAID_DISPATCH_NOT_AUTHORIZED:set HSL_ALLOW_PAID_FIREFLY_DISPATCH=true');
  await assertAgentProtocol(e,logPath);
  return withProfileLock(e, async assertOwnership => {
    const staged = stageGuide(runtime, guidePath,approved), receiptPath = path.join(runtime, 'dispatch-receipt.json');
    const outputPath = path.resolve(runtime, 'saida', `${staged.name}.mp4`), previous = readReceipt(receiptPath);
    const base = { schema: 'hsl.kling-dispatch.v2' as const, name: staged.name, guideHash: staged.hash, inputFrameHash: staged.inputFrameHash, authorization: approved, paidDispatchPossible: false, outputPath };
    const reused: ToolResult = { exitCode: 0, stdout: 'transport receipt reused; media QA required', stderr: '', timedOut: false, durationMs: 0 };
    if (previous) {
      if (previous.schema !== 'hsl.kling-dispatch.v2') throw new Error(`KLING_LEGACY_RECEIPT_REQUIRES_RECONCILIATION:${receiptPath}`);
      if (!!previous.authorization !== !!approved || authorizationKeys.some(key => previous.authorization?.[key] !== approved?.[key])) throw new Error('KLING_RECEIPT_AUTHORIZATION_MISMATCH');
      assertIdentity(previous, staged, outputPath);
      if (previous.phase === 'transport_complete') {
        if (previous.outputHash && outputHash(outputPath) === previous.outputHash) return { feed: reused, run: reused, status: 'transport_complete', outputPath };
        updateReceipt(receiptPath, previous, 'uncertain', { error: 'transport output missing or changed; parent reconciliation required' });
        throw new Error(`KLING_DISPATCH_UNCERTAIN:${receiptPath}:transport output missing or changed`);
      }
      if (previous.phase !== 'enqueued') {
        if (previous.phase !== 'uncertain') updateReceipt(receiptPath, previous, 'uncertain', { error: 'interrupted or legacy success phase; reconcile before retry' });
        throw new Error(`KLING_DISPATCH_UNCERTAIN:${receiptPath}:reconcile before retry`);
      }
    }
    // A pre-existing file cannot establish either transport or paid provenance.
    if (fs.existsSync(outputPath)) throw new Error(`KLING_OUTPUT_EXISTS_REQUIRES_RECONCILIATION:${outputPath}`);
    staged.write();
    fs.mkdirSync(path.join(runtime, 'data'), { recursive: true });
    let feed = reused, paidDispatchPossible = previous?.paidDispatchPossible ?? false;
    try {
      if (!previous) {
        updateReceipt(receiptPath, base, 'uncertain', { error: 'feed in flight; reconcile after interruption' });
        feed = await spawnTool(e.python, [path.join(e.agentDir, 'main.py'), '--root', runtime, '--feed-guide', staged.path], { cwd: e.agentDir, env: agentEnv(e), timeoutMs: 60_000, logPath });
        requireSuccess(feed, 'FIREFLY_FEED_GUIDE');
        assertOwnership();
        paidDispatchPossible = true;
        updateReceipt(receiptPath, { ...base, paidDispatchPossible }, 'enqueued');
      }
      paidDispatchPossible = true;
      updateReceipt(receiptPath, { ...base, paidDispatchPossible }, 'uncertain', { error: 'worker in flight; reconcile after interruption' });
      const run = await spawnTool(e.python, [path.join(e.agentDir, 'main.py'), '--root', runtime, '--concurrency', '1', '--run'], { cwd: e.agentDir, env: agentEnv(e), timeoutMs: 2_100_000, logPath });
      assertOwnership();
      // Current external protocol: 0=worker success, 10=queue drained after
      // success. Exit 2 remains accepted for audited legacy agents.
      if (run.timedOut || run.errorCode || ![0, 2, 10].includes(run.exitCode ?? -1)) requireSuccess(run, 'FIREFLY_RUN');
      const hash = outputHash(outputPath);
      if (!hash) throw new Error(`KLING_OUTPUT_MISSING:${outputPath}`);
      updateReceipt(receiptPath, { ...base, paidDispatchPossible }, 'transport_complete', { outputHash: hash });
      // No ffprobe/content approval here: the parent must validate this output.
      return { feed, run, status: 'transport_complete', outputPath };
    } catch (error) {
      updateReceipt(receiptPath, { ...base, paidDispatchPossible }, 'uncertain', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  });
}

/** Promote a false-negative transport only when the external durable manifest
 * proves that this exact job completed and its output bytes match the manifest. */
export async function reconcileCompletedAgentTake(e: FireflyEnvironment, runtime: string, guidePath: string, logPath: string, jobId = 1): Promise<ToolResult> {
  if (!Number.isSafeInteger(jobId) || jobId < 1) throw new Error('KLING_COMPLETED_RECONCILE_JOB_ID_INVALID');
  return withProfileLock(e, async assertOwnership => {
    const receiptPath = path.join(runtime, 'dispatch-receipt.json'), previous = readReceipt(receiptPath);
    if (!previous || previous.schema !== 'hsl.kling-dispatch.v2' || previous.phase !== 'uncertain') {
      throw new Error(`KLING_COMPLETED_RECONCILE_REQUIRES_UNCERTAIN_V2_RECEIPT:${receiptPath}`);
    }
    const staged = stageGuide(runtime, guidePath, previous.authorization);
    const outputPath = path.resolve(runtime, 'saida', `${staged.name}.mp4`);
    assertIdentity(previous, staged, outputPath);
    const localHash = outputHash(outputPath);
    if (!localHash) throw new Error(`KLING_COMPLETED_RECONCILE_OUTPUT_MISSING:${outputPath}`);
    const manifestPath = path.join(runtime, 'agent-manifest.json');
    const result = await spawnTool(e.python, [path.join(e.agentDir, 'main.py'), '--root', runtime, '--export-manifest', manifestPath],
      { cwd:e.agentDir, env:agentEnv(e), timeoutMs:30_000, logPath });
    requireSuccess(result, 'FIREFLY_EXPORT_MANIFEST'); assertOwnership();
    const manifest = readJson(manifestPath), job = manifest?.jobs?.find((item:any) => item?.id === jobId);
    if (manifest?.artifactType !== 'FIREFLY_JOB_MANIFEST' || !job || job.status !== 'done'
      || job.name !== staged.name || path.resolve(String(job.output_path ?? '')) !== outputPath
      || job.sha256 !== localHash || String(job.media_validation_status).toUpperCase() !== 'PASS') {
      throw new Error(`KLING_COMPLETED_RECONCILE_EVIDENCE_INVALID:${manifestPath}`);
    }
    updateReceipt(receiptPath, { ...previous, guideHash:staged.hash, inputFrameHash:staged.inputFrameHash,
      paidDispatchPossible:true, outputPath }, 'transport_complete', { outputHash:localHash, error:undefined });
    return result;
  });
}

export async function reconcileUnstartedAgentTake(e: FireflyEnvironment, runtime: string, guidePath: string, logPath: string, jobId = 1): Promise<ToolResult> {
  if (!Number.isSafeInteger(jobId) || jobId < 1) throw new Error('KLING_RECONCILE_JOB_ID_INVALID');
  return withProfileLock(e, async assertOwnership => {
    const receiptPath = path.join(runtime, 'dispatch-receipt.json'), previous = readReceipt(receiptPath);
    const staged = stageGuide(runtime, guidePath,previous?.authorization);
    const outputPath = path.resolve(runtime, 'saida', `${staged.name}.mp4`);
    if (!previous || previous.phase !== 'uncertain') throw new Error(`KLING_RECONCILE_REQUIRES_UNCERTAIN_RECEIPT:${receiptPath}`);
    if (previous.schema === 'hsl.kling-dispatch.v1') {
      if (previous.guideHash !== staged.legacyHash || previous.name !== staged.name || path.resolve(previous.outputPath) !== outputPath) throw new Error('KLING_RECONCILE_RECEIPT_IDENTITY_MISMATCH');
      // A legacy receipt did not bind image bytes. Require its untouched staged
      // evidence AND the external only-unstarted guard before upgrading it.
      if (!fs.existsSync(staged.imagePath) || sha256(fs.readFileSync(staged.imagePath)) !== staged.inputFrameHash
        || !fs.existsSync(staged.path) || sha256(JSON.stringify(readJson(staged.path))) !== staged.legacyHash) throw new Error('KLING_LEGACY_RECEIPT_INPUT_UNVERIFIABLE');
      const backup = `${receiptPath}.legacy-v1.json`, original = fs.readFileSync(receiptPath);
      if (!fs.existsSync(backup)) fs.writeFileSync(backup, original, { flag: 'wx' });
      else if (!fs.readFileSync(backup).equals(original)) throw new Error('KLING_LEGACY_RECEIPT_BACKUP_MISMATCH');
    } else assertIdentity(previous, staged, outputPath);
    if (fs.existsSync(outputPath)) throw new Error(`KLING_RECONCILE_OUTPUT_EXISTS:${outputPath}`);
    const result = await spawnTool(e.python, [path.join(e.agentDir, 'main.py'), '--root', runtime, '--requeue-unstarted-infra-job', String(jobId)], { cwd: e.agentDir, env: agentEnv(e), timeoutMs: 60_000, logPath });
    requireSuccess(result, 'FIREFLY_REQUEUE_UNSTARTED_INFRA');
    assertOwnership();
    updateReceipt(receiptPath, { ...previous, schema: 'hsl.kling-dispatch.v2', guideHash: staged.hash, inputFrameHash: staged.inputFrameHash, paidDispatchPossible: true, outputPath }, 'enqueued', { error: undefined });
    return result;
  });
}

export async function recoverResultReadyAgentTake(e: FireflyEnvironment, runtime: string, guidePath: string, logPath: string, jobId = 1): Promise<ToolResult> {
  if (!Number.isSafeInteger(jobId) || jobId < 1) throw new Error('KLING_RESULT_RECOVERY_JOB_ID_INVALID');
  return withProfileLock(e, async assertOwnership => {
    const receiptPath = path.join(runtime, 'dispatch-receipt.json'), previous = readReceipt(receiptPath);
    if (!previous || previous.schema !== 'hsl.kling-dispatch.v2' || previous.phase !== 'uncertain') throw new Error(`KLING_RESULT_RECOVERY_REQUIRES_UNCERTAIN_V2_RECEIPT:${receiptPath}`);
    const staged = stageGuide(runtime, guidePath, previous.authorization);
    const outputPath = path.resolve(runtime, 'saida', `${staged.name}.mp4`);
    assertIdentity(previous, staged, outputPath);
    if (fs.existsSync(outputPath)) throw new Error(`KLING_RESULT_RECOVERY_OUTPUT_EXISTS:${outputPath}`);
    const identityPath = path.join(runtime, 'screenshots', 'provider_result_identity.json');
    const evidence = readJson(identityPath), identity = evidence?.provider_result_identity;
    const networkPath = path.join(runtime, 'screenshots', 'provider', 'network', `job_${jobId}_network.jsonl`);
    let networkResultIdentity = false;
    if (fs.existsSync(networkPath)) {
      const network = fs.readFileSync(networkPath, 'utf8');
      const urns = [...network.matchAll(/(?:firefly-generations|rendition\/id)\/((?:urn:aaid:sc:[A-Za-z]{2}:)[0-9a-f-]{36})/gi)]
        .map(match => match[1].toLowerCase());
      networkResultIdentity = new Set(urns).size === 1;
    }
    if (!identity || evidence.mission_control_job_id !== jobId || evidence.source_shot_id !== staged.name
      || evidence.start_frame_sha256 !== `sha256_${staged.inputFrameHash}`
      || (identity.current_canvas_state !== 'result_ready' && !identity.provider_result_urn)
      || (identity.provider_result_recovery_capability !== 'DURABLE_IDENTITY_AVAILABLE' && !networkResultIdentity)) {
      throw new Error(`KLING_RESULT_RECOVERY_IDENTITY_INVALID:${identityPath}`);
    }
    const result = await spawnTool(e.python, [path.join(e.agentDir, 'main.py'), '--root', runtime, '--recover-result-ready-job', String(jobId)], { cwd:e.agentDir, env:agentEnv(e), timeoutMs:600_000, logPath });
    requireSuccess(result, 'FIREFLY_RECOVER_RESULT_READY');
    assertOwnership();
    const recoveredHash = outputHash(outputPath);
    if (!recoveredHash) throw new Error(`KLING_RESULT_RECOVERY_OUTPUT_MISSING:${outputPath}`);
    updateReceipt(receiptPath, { ...previous, guideHash: staged.hash, inputFrameHash: staged.inputFrameHash, paidDispatchPossible: true, outputPath }, 'transport_complete', { outputHash: recoveredHash, error: undefined });
    return result;
  });
}
