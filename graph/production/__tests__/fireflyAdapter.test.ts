import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import * as proc from '../../lib/proc';
import { openLoginChrome, probeSession, reconcileCompletedAgentTake, reconcileUnstartedAgentTake, runAgentTake, type FireflyAuthorization, type FireflyEnvironment } from '../lib/firefly/process';

// No real agent or browser: agent commands execute Node fixtures and process
// discovery is simulated. Keep real spawnTool for actual subprocess/lock tests.
const realSpawn = proc.spawnTool;
let chromeInUse = false, badProcessCheck = false;
let handoffFailure = false, handoffs = 0;
(proc as any).spawnTool = async (command: string, args: string[], options: proc.ToolOptions) => {
  if (args.some(arg => arg.endsWith('closeFireflyLogin.ps1'))) {
    assert.equal(fs.existsSync(lockPath), true, 'handoff holds the dispatch lock');
    handoffs++;
    if (handoffFailure) return {exitCode:1,stdout:'',stderr:'FIREFLY_LOGIN_OWNER_CHANGED',timedOut:false,durationMs:0};
    chromeInUse=false; fs.unlinkSync(path.join(profile,'.hsl-firefly-login.json'));
    return {exitCode:0,stdout:'FIREFLY_LOGIN_CLOSED',stderr:'',timedOut:false,durationMs:0};
  }
  if (command === 'powershell.exe' || command === 'ps') return {
    exitCode: 0, stdout: badProcessCheck ? 'unknown' : command === 'powershell.exe' ? String(chromeInUse) : chromeInUse ? `chrome --user-data-dir=${env.profileDir}` : '',
    stderr: '', timedOut: false, durationMs: 0,
  };
  if (args.includes('--run') && fs.existsSync(path.join(options.cwd, 'throw-spawn'))) throw new Error('fixture spawn rejected');
  if (args.includes('--run')) assert.equal(options.env?.FIREFLY_PROVIDER_CAPACITY_MAX_ATTEMPTS, '1', 'one provider attempt per reservation');
  if (args.includes('--run') && fs.existsSync(path.join(options.cwd, 'timeout-spawn'))) {
    const runtime = args[args.indexOf('--root') + 1];
    fs.mkdirSync(path.join(runtime, 'saida'), { recursive: true }); fs.writeFileSync(path.join(runtime, 'saida', 'TAKE.mp4'), 'partial');
    return { exitCode: 0, stdout: '', stderr: '', timedOut: true, durationMs: 0 };
  }
  // Explicitly detach the crash fixture's worker from parent pipes so the test
  // exercises an orphan worker on Windows as well as POSIX.
  if (childMode && args.includes('--run')) return new Promise<proc.ToolResult>((resolve, reject) => {
    const worker = spawn(command, args, { cwd: options.cwd, env: options.env, detached: true, windowsHide: true, stdio: 'ignore' });
    worker.once('error', reject);
    worker.once('exit', code => resolve({ exitCode: code ?? undefined, stdout: '', stderr: '', timedOut: false, durationMs: 0 }));
  });
  const result = await realSpawn(command, args, options);
  if (args.includes('--feed-guide') && fs.existsSync(path.join(options.cwd, 'replace-lock'))) fs.writeFileSync(lockPath, JSON.stringify({ token: 'replacement' }));
  return result;
};
const childMode = process.argv[2] === '--fixture-child';
const root = childMode ? process.argv[3] : fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-firefly-adapter-'));
const agent = path.join(root, 'agent'), profile = path.join(root, 'profile');
const env: FireflyEnvironment = { agentDir: agent, profileDir: profile, python: process.execPath };
const auth: FireflyAuthorization = { authorizationId: 'approval-1', planHash: 'plan-1', operationId: 'operation-1', recipeHash: 'recipe-1' };
const lockPath = path.join(profile, '.hsl-firefly-dispatch.lock');
const receiptPath = (runtime: string) => path.join(runtime, 'dispatch-receipt.json');
const receipt = (runtime: string) => JSON.parse(fs.readFileSync(receiptPath(runtime), 'utf8'));
const saveReceipt = (runtime: string, value: unknown) => fs.writeFileSync(receiptPath(runtime), JSON.stringify(value));
const calls = (runtime: string) => fs.existsSync(path.join(runtime, 'calls.log')) ? fs.readFileSync(path.join(runtime, 'calls.log'), 'utf8') : '';
const output = (runtime: string) => path.join(runtime, 'saida', 'TAKE.mp4');
function setup(name: string) {
  const runtime = path.join(root, name), image = path.join(runtime, 'frame.png'), guidePath = path.join(runtime, 'guide.json');
  fs.mkdirSync(runtime, { recursive: true }); fs.writeFileSync(image, 'frame bytes');
  fs.writeFileSync(guidePath, JSON.stringify({ items: [{ name: 'TAKE', image, prompt: 'slow cinematic motion', model: 'Kling 2.5 Turbo', resolution: '1080p', aspect_ratio: '16:9', duration_seconds: 5, generate_audio: false }] }));
  return { runtime, image, guidePath, run: (authorization?: FireflyAuthorization) => runAgentTake(env, runtime, guidePath, path.join(runtime, 'run.log'), authorization), reconcile: () => reconcileUnstartedAgentTake(env, runtime, guidePath, path.join(runtime, 'reconcile.log')), reconcileCompleted: () => reconcileCompletedAgentTake(env, runtime, guidePath, path.join(runtime, 'completed.log')) };
}
async function waitFor(file: string) {
  const deadline = Date.now() + 20_000;
  while (!fs.existsSync(file)) {
    if (Date.now() > deadline) throw new Error(`Fixture timed out waiting for ${file}`);
    await new Promise(resolve => setTimeout(resolve, 25));
  }
}
async function main() {
  fs.mkdirSync(agent, { recursive: true }); fs.mkdirSync(profile, { recursive: true });
  fs.writeFileSync(path.join(agent, 'main.py'), String.raw`
const fs=require('fs'),path=require('path'),crypto=require('crypto'),args=process.argv.slice(2),root=args[args.indexOf('--root')+1];
if(args.includes('--help')){console.log(fs.existsSync(path.join(__dirname,'old-protocol'))?'--feed-guide --run':'--feed-guide --run --probe-session --requeue-unstarted-infra-job --recover-result-ready-job');process.exit(0);}
const has=name=>fs.existsSync(path.join(root,name));
fs.mkdirSync(root,{recursive:true});
const action=args.includes('--feed-guide')?'feed':args.includes('--requeue-unstarted-infra-job')?'reconcile':args.includes('--probe-session')?'probe':args.includes('--export-manifest')?'export':'run';
fs.appendFileSync(path.join(root,'calls.log'),action+'\n');
if(action==='feed'){
  const g=JSON.parse(fs.readFileSync(args[args.indexOf('--feed-guide')+1],'utf8'));
  if(path.isAbsolute(g.items[0].image))process.exit(9);
  fs.writeFileSync(path.join(root,'name.txt'),g.items[0].name);process.exit(has('fail-feed')?7:0);
}
if(action==='reconcile')process.exit(has('fail-reconcile')?8:0);
if(action==='probe')process.exit(has('probe-failed')?1:has('logged-out')?3:0);
if(action==='export'){
  const name=fs.readFileSync(path.join(root,'name.txt'),'utf8'),output=path.join(root,'saida',name+'.mp4'),hash=crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex');
  fs.writeFileSync(args[args.indexOf('--export-manifest')+1],JSON.stringify({artifactType:'FIREFLY_JOB_MANIFEST',jobs:[{id:1,name,status:has('manifest-done')?'done':'failed',output_path:output,sha256:hash,media_validation_status:'PASS'}]}));process.exit(0);
}
fs.writeFileSync(path.join(root,'worker-started'),String(process.pid));
function finish(){
  if(!has('no-output')&&(!has('fail-run')||has('partial-output'))){
    const name=fs.readFileSync(path.join(root,'name.txt'),'utf8');fs.mkdirSync(path.join(root,'saida'),{recursive:true});
    fs.writeFileSync(path.join(root,'saida',name+'.mp4'),has('empty-output')?'':'mock-video (deliberately invalid media)');
  }
  fs.writeFileSync(path.join(root,'worker-finished'),'1');process.exit(has('fail-run')?7:has('exit-ten')?10:has('exit-zero')?0:2);
}
const deadline=Date.now()+15000;
function tick(){if(!has('hold-run')||has('release-run')||Date.now()>deadline)finish();else setTimeout(tick,25);}
tick();
`);
  const previousEnv = process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH;
  let count = 0;
  async function test(name: string, fn: () => Promise<void>) { await fn(); count++; console.log(`PASS ${name}`); }
  try {
    delete process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH;
    await test('incompatible external agent blocks before feed, browser, or paid job', async () => {
      const f=setup('old-protocol');fs.writeFileSync(path.join(agent,'old-protocol'),'1');
      try{await assert.rejects(f.run(auth),/AGENT_PROTOCOL_UNSUPPORTED/);assert.equal(calls(f.runtime),'');assert.equal(fs.existsSync(receiptPath(f.runtime)),false);}
      finally{fs.unlinkSync(path.join(agent,'old-protocol'));}
    });
    await test('explicit canary env or valid durable authorization required', async () => {
      const f = setup('unauthorized'); await assert.rejects(f.run(), /KLING_PAID_DISPATCH_NOT_AUTHORIZED/);
      for (const key of Object.keys(auth)) for (const value of ['', '   ', 7, null, undefined]) {
        await assert.rejects(f.run({ ...auth, [key]: value } as any), /KLING_AUTHORIZATION_INVALID/);
      }
      assert.equal(calls(f.runtime), ''); assert.equal(fs.existsSync(lockPath), false);
      await f.run(auth); assert.deepEqual(receipt(f.runtime).authorization, auth);
    });
    process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH = 'true';
    await test('current worker queue-drained exit 10 is successful transport', async () => {
      const f=setup('exit-ten');fs.writeFileSync(path.join(f.runtime,'exit-ten'),'1');
      const result=await f.run();assert.equal(result.run.exitCode,10);assert.equal(receipt(f.runtime).phase,'transport_complete');
    });
    await test('durable completed manifest promotes a prior false-negative without resend', async () => {
      const f=setup('completed-manifest');fs.writeFileSync(path.join(f.runtime,'fail-run'),'1');fs.writeFileSync(path.join(f.runtime,'partial-output'),'1');
      await assert.rejects(f.run(),/FIREFLY_RUN/);fs.writeFileSync(path.join(f.runtime,'manifest-done'),'1');
      await f.reconcileCompleted();assert.equal(receipt(f.runtime).phase,'transport_complete');assert.equal(calls(f.runtime),'feed\nrun\nexport\n');
      await f.run();assert.equal(calls(f.runtime),'feed\nrun\nexport\n');
    });
    await test('probe distinguishes login needed from agent infrastructure failure', async () => {
      const f=setup('probe-results'),log=path.join(f.runtime,'probe.log');
      assert.equal(await probeSession(env,f.runtime,log),true);
      fs.writeFileSync(path.join(f.runtime,'logged-out'),'1');
      assert.equal(await probeSession(env,f.runtime,log),false);
      fs.writeFileSync(path.join(f.runtime,'probe-failed'),'1');
      await assert.rejects(probeSession(env,f.runtime,log),/FIREFLY_SESSION_PROBE_FAILED/);
      assert.equal(fs.existsSync(lockPath),false); assert.equal(fs.existsSync(receiptPath(f.runtime)),false);
    });
    if(process.platform==='win32') await test('managed login handoff precedes probe; unknown owner cannot dispatch', async () => {
      const f=setup('login-handoff'),marker=path.join(profile,'.hsl-firefly-login.json');
      try {
        fs.writeFileSync(marker,'{}');chromeInUse=true;handoffFailure=true;
        await assert.rejects(probeSession(env,f.runtime,path.join(f.runtime,'probe.log')),/FIREFLY_LOGIN_OWNER_CHANGED/);
        assert.equal(calls(f.runtime),'');assert.equal(fs.existsSync(marker),true);
        handoffFailure=false;
        assert.equal(await probeSession(env,f.runtime,path.join(f.runtime,'probe.log')),true);
        assert.equal(handoffs,2);assert.equal(calls(f.runtime),'probe\n');
        assert.equal(fs.existsSync(marker),false);assert.equal(fs.existsSync(lockPath),false);
      } finally {chromeInUse=false;handoffFailure=false;if(fs.existsSync(marker))fs.unlinkSync(marker);}
    });
    await test('transport completion and replay do not claim media validation', async () => {
      const f = setup('ok'), result = await f.run();
      assert.equal(result.status, 'transport_complete'); assert.equal(result.run.exitCode, 2);
      assert.equal(result.outputPath, output(f.runtime)); assert.equal(receipt(f.runtime).phase, 'transport_complete');
      assert.equal(receipt(f.runtime).schema, 'hsl.kling-dispatch.v2'); assert.equal('validated' in receipt(f.runtime), false);
      await f.run(); assert.equal(calls(f.runtime), 'feed\nrun\n'); assert.equal(fs.existsSync(lockPath), false);
    });
    await test('every durable authorization field binds replay', async () => {
      const f = setup('auth-mismatch'); await f.run(auth); const original = fs.readFileSync(receiptPath(f.runtime), 'utf8');
      for (const key of Object.keys(auth)) await assert.rejects(f.run({ ...auth, [key]: 'changed' }), /KLING_RECEIPT_AUTHORIZATION_MISMATCH/);
      await assert.rejects(f.run(), /KLING_RECEIPT_AUTHORIZATION_MISMATCH/);
      assert.equal(fs.readFileSync(receiptPath(f.runtime), 'utf8'), original); assert.equal(calls(f.runtime), 'feed\nrun\n');
      const canary = setup('canary-mismatch'); await canary.run(); await assert.rejects(canary.run(auth), /KLING_RECEIPT_AUTHORIZATION_MISMATCH/);
    });
    await test('frame bytes and prompt bind identity without overwriting evidence', async () => {
      const f = setup('frame-change'); await f.run();
      fs.writeFileSync(f.image, 'replacement at same path'); await assert.rejects(f.run(), /KLING_RECEIPT_GUIDE_HASH_MISMATCH/);
      assert.equal(fs.readFileSync(path.join(f.runtime, 'imagens', 'TAKE.png'), 'utf8'), 'frame bytes');
      fs.writeFileSync(f.image, 'frame bytes'); const guide = JSON.parse(fs.readFileSync(f.guidePath, 'utf8'));
      guide.items[0].prompt = 'new prompt'; fs.writeFileSync(f.guidePath, JSON.stringify(guide));
      await assert.rejects(f.run(), /KLING_RECEIPT_GUIDE_HASH_MISMATCH/); assert.equal(calls(f.runtime), 'feed\nrun\n');
    });
    await test('changed or missing transport output stays uncertain', async () => {
      for (const change of ['replace', 'remove']) {
        const f = setup(`output-${change}`); await f.run();
        if (change === 'replace') fs.writeFileSync(output(f.runtime), 'other video'); else fs.unlinkSync(output(f.runtime));
        await assert.rejects(f.run(), /KLING_DISPATCH_UNCERTAIN/); assert.equal(receipt(f.runtime).phase, 'uncertain');
        await assert.rejects(f.run(), /KLING_DISPATCH_UNCERTAIN/); assert.equal(calls(f.runtime), 'feed\nrun\n');
      }
    });
    await test('worker failure including partial output never auto retries', async () => {
      for (const partial of [false, true]) {
        const f = setup(`failure-${partial}`); fs.writeFileSync(path.join(f.runtime, 'fail-run'), '1');
        if (partial) fs.writeFileSync(path.join(f.runtime, 'partial-output'), '1');
        await assert.rejects(f.run(auth), /FIREFLY_RUN/); await assert.rejects(f.run(auth), /KLING_DISPATCH_UNCERTAIN/);
        assert.equal(receipt(f.runtime).phase, 'uncertain'); assert.equal(receipt(f.runtime).paidDispatchPossible, true);
        assert.equal(calls(f.runtime), 'feed\nrun\n');
      }
    });
    await test('only-unstarted reconciliation preserves authorization without refeeding', async () => {
      const f = setup('reconcile'); fs.writeFileSync(path.join(f.runtime, 'fail-run'), '1'); await assert.rejects(f.run(auth), /FIREFLY_RUN/);
      fs.writeFileSync(path.join(f.runtime, 'fail-reconcile'), '1'); await assert.rejects(f.reconcile(), /FIREFLY_REQUEUE_UNSTARTED_INFRA/);
      assert.equal(receipt(f.runtime).phase, 'uncertain'); fs.unlinkSync(path.join(f.runtime, 'fail-reconcile'));
      await f.reconcile(); assert.equal(receipt(f.runtime).phase, 'enqueued'); assert.deepEqual(receipt(f.runtime).authorization, auth);
      fs.unlinkSync(path.join(f.runtime, 'fail-run')); delete process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH;
      await f.run(auth); assert.equal(calls(f.runtime), 'feed\nrun\nreconcile\nreconcile\nrun\n'); process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH = 'true';
    });
    await test('feed failure, thrown spawn and timeout with output stay uncertain', async () => {
      const feed = setup('feed-failure'); fs.writeFileSync(path.join(feed.runtime, 'fail-feed'), '1');
      await assert.rejects(feed.run(), /FIREFLY_FEED_GUIDE/); await assert.rejects(feed.run(), /KLING_DISPATCH_UNCERTAIN/); assert.equal(calls(feed.runtime), 'feed\n');
      for (const marker of ['throw-spawn', 'timeout-spawn']) {
        const f = setup(marker); fs.writeFileSync(path.join(agent, marker), '1');
        try { await assert.rejects(f.run(), /fixture spawn rejected|FIREFLY_RUN/); } finally { fs.unlinkSync(path.join(agent, marker)); }
        assert.equal(receipt(f.runtime).phase, 'uncertain'); await assert.rejects(f.run(), /KLING_DISPATCH_UNCERTAIN/);
      }
    });
    await test('drained queue requires nonempty transport output; exit zero also works', async () => {
      for (const marker of ['no-output', 'empty-output']) {
        const f = setup(marker); fs.writeFileSync(path.join(f.runtime, marker), '1');
        await assert.rejects(f.run(), /KLING_OUTPUT_MISSING/); assert.equal(receipt(f.runtime).phase, 'uncertain');
      }
      const f = setup('exit-zero'); fs.writeFileSync(path.join(f.runtime, 'exit-zero'), '1'); assert.equal((await f.run()).status, 'transport_complete');
    });
    await test('orphan output and corrupt receipts never dispatch', async () => {
      const orphan = setup('orphan'); fs.mkdirSync(path.dirname(output(orphan.runtime))); fs.writeFileSync(output(orphan.runtime), 'orphan');
      await assert.rejects(orphan.run(), /KLING_OUTPUT_EXISTS_REQUIRES_RECONCILIATION/); assert.equal(calls(orphan.runtime), '');
      for (const raw of ['{', 'null', '{}', JSON.stringify({ schema: 'hsl.kling-dispatch.v3' })]) {
        const f = setup(`corrupt-${raw.length}`); fs.writeFileSync(receiptPath(f.runtime), raw);
        await assert.rejects(f.run(), /KLING_RECEIPT_INVALID/); assert.equal(calls(f.runtime), ''); assert.equal(fs.readFileSync(receiptPath(f.runtime), 'utf8'), raw);
      }
    });
    await test('interrupted phases cannot be promoted by an existing output', async () => {
      for (const phase of ['prepared', 'running', 'uncertain', 'succeeded']) {
        const f = setup(`interrupted-${phase}`); await f.run(); saveReceipt(f.runtime, { ...receipt(f.runtime), phase });
        await assert.rejects(f.run(), /KLING_DISPATCH_UNCERTAIN/); assert.equal(receipt(f.runtime).phase, 'uncertain');
        await assert.rejects(f.reconcile(), /KLING_RECONCILE_OUTPUT_EXISTS/); assert.equal(calls(f.runtime), 'feed\nrun\n');
      }
    });
    await test('legacy migration requires staged evidence and only-unstarted success', async () => {
      const f = setup('legacy'); fs.writeFileSync(path.join(f.runtime, 'fail-run'), '1'); await assert.rejects(f.run(), /FIREFLY_RUN/);
      const legacy = { ...receipt(f.runtime), schema: 'hsl.kling-dispatch.v1', guideHash: crypto.createHash('sha256').update(JSON.stringify(JSON.parse(fs.readFileSync(path.join(f.runtime, 'agent-guide.json'), 'utf8')))).digest('hex') };
      delete legacy.inputFrameHash; saveReceipt(f.runtime, legacy); const original = fs.readFileSync(receiptPath(f.runtime), 'utf8');
      await assert.rejects(f.run(), /KLING_LEGACY_RECEIPT_REQUIRES_RECONCILIATION/);
      fs.writeFileSync(f.image, 'different bytes'); await assert.rejects(f.reconcile(), /KLING_LEGACY_RECEIPT_INPUT_UNVERIFIABLE/);
      assert.equal(fs.readFileSync(receiptPath(f.runtime), 'utf8'), original);
      fs.writeFileSync(f.image, 'frame bytes'); await f.reconcile(); assert.equal(receipt(f.runtime).schema, 'hsl.kling-dispatch.v2');
      assert.equal(fs.readFileSync(`${receiptPath(f.runtime)}.legacy-v1.json`, 'utf8'), original);
      fs.unlinkSync(path.join(f.runtime, 'fail-run')); await f.run(); assert.equal(calls(f.runtime), 'feed\nrun\nreconcile\nrun\n');
      const done = setup('legacy-complete'); await done.run(); saveReceipt(done.runtime, { ...receipt(done.runtime), schema: 'hsl.kling-dispatch.v1', phase: 'succeeded' });
      await assert.rejects(done.run(), /KLING_LEGACY_RECEIPT_REQUIRES_RECONCILIATION/); assert.equal(receipt(done.runtime).phase, 'succeeded');
    });
    await test('atomic profile lock excludes run/probe/reconcile through worker exit', async () => {
      const first = setup('parallel-first'), second = setup('parallel-second'); fs.writeFileSync(path.join(first.runtime, 'hold-run'), '1'); const running = first.run();
      try {
        await waitFor(path.join(first.runtime, 'worker-started')); assert.equal(receipt(first.runtime).phase, 'uncertain'); assert.equal(fs.existsSync(lockPath), true);
        await assert.rejects(second.run(), /FIREFLY_PROFILE_LOCKED/); await assert.rejects(first.reconcile(), /FIREFLY_PROFILE_LOCKED/);
        await assert.rejects(probeSession(env, second.runtime, path.join(second.runtime, 'probe.log')), /FIREFLY_PROFILE_LOCKED/); assert.equal(calls(second.runtime), '');
        await assert.rejects(openLoginChrome(env, path.join(second.runtime, 'login.log')), /FIREFLY_PROFILE_LOCKED/);
      } finally { fs.writeFileSync(path.join(first.runtime, 'release-run'), '1'); await running; }
      assert.equal(fs.existsSync(lockPath), false); await second.run();
    });
    await test('Chrome occupancy and unknown process checks fail closed', async () => {
      const f = setup('occupied'); chromeInUse = true;
      try { await assert.rejects(f.run(), /FIREFLY_PROFILE_IN_USE/); } finally { chromeInUse = false; }
      assert.equal(fs.existsSync(lockPath), false); fs.writeFileSync(path.join(profile, 'SingletonLock'), 'orphan Chrome');
      try { await assert.rejects(f.run(), /FIREFLY_PROFILE_IN_USE/); } finally { fs.unlinkSync(path.join(profile, 'SingletonLock')); }
      if (process.platform === 'win32') {
        badProcessCheck = true; try { await assert.rejects(f.run(), /FIREFLY_PROFILE_PROCESS_CHECK/); } finally { badProcessCheck = false; }
      }
      assert.equal(calls(f.runtime), '');
    });
    await test('lost lock after feed prevents worker dispatch and preserves replacement', async () => {
      const f = setup('lost-lock'); fs.writeFileSync(path.join(agent, 'replace-lock'), '1');
      try {
        await assert.rejects(f.run(), /FIREFLY_PROFILE_LOCK_LOST/); assert.equal(calls(f.runtime), 'feed\n');
        assert.equal(receipt(f.runtime).phase, 'uncertain'); assert.equal(JSON.parse(fs.readFileSync(lockPath, 'utf8')).token, 'replacement');
      } finally { fs.unlinkSync(path.join(agent, 'replace-lock')); if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath); }
    });
    await test('stale and malformed locks are never stolen, including live Chrome', async () => {
      const f = setup('stale-lock');
      for (const content of [JSON.stringify({ pid: 2147483647, token: 'dead-parent' }), '{']) {
        fs.writeFileSync(lockPath, content); chromeInUse = true;
        try { await assert.rejects(f.run(), /FIREFLY_PROFILE_LOCKED/); assert.equal(fs.readFileSync(lockPath, 'utf8'), content); }
        finally { chromeInUse = false; fs.unlinkSync(lockPath); }
      }
      assert.equal(calls(f.runtime), '');
    });
    await test('parent crash leaves uncertain receipt and blocks surviving worker', async () => {
      const f = setup('crash-parent'), other = setup('crash-other'); fs.writeFileSync(path.join(f.runtime, 'hold-run'), '1');
      const child = spawn(process.execPath, ['-r', require.resolve('ts-node/register'), __filename, '--fixture-child', root, f.runtime], { windowsHide: true, stdio: 'ignore', env: process.env });
      const ended = new Promise<void>((resolve, reject) => { child.once('exit', () => resolve()); child.once('error', reject); });
      try {
        await waitFor(path.join(f.runtime, 'worker-started')); await assert.rejects(other.run(), /FIREFLY_PROFILE_LOCKED/);
        child.kill('SIGKILL'); await ended; assert.equal(receipt(f.runtime).phase, 'uncertain');
        await assert.rejects(other.run(), /FIREFLY_PROFILE_LOCKED/);
        fs.writeFileSync(path.join(f.runtime, 'release-run'), '1'); await waitFor(path.join(f.runtime, 'worker-finished'));
        await assert.rejects(f.run(), /FIREFLY_PROFILE_LOCKED/); assert.equal(receipt(f.runtime).phase, 'uncertain');
        assert.equal(calls(f.runtime), 'feed\nrun\n'); assert.equal(calls(other.runtime), '');
      } finally {
        fs.writeFileSync(path.join(f.runtime, 'release-run'), '1'); child.kill('SIGKILL'); await ended;
        // This isolated fixture lock is removed only after the assertions; no production lock recovery.
        if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
      }
    });
    console.log(`FIREFLY_ADAPTER_TEST_OK (${count} fixture groups; no paid calls)`);
  } finally {
    (proc as any).spawnTool = realSpawn;
    if (previousEnv === undefined) delete process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH; else process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH = previousEnv;
  }
}
if (childMode) {
  const runtime = process.argv[4];
  runAgentTake(env, runtime, path.join(runtime, 'guide.json'), path.join(runtime, 'child.log')).catch(error => { console.error(error); process.exitCode = 1; });
} else main().catch(error => { console.error(error); process.exitCode = 1; });
