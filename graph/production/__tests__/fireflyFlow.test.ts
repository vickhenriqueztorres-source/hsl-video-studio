import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { type TestContext } from 'node:test';
import { Command, END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { createCheckpointer } from '../../checkpointer';
import type { HslLongFormProjectPlan, HslSceneBeat } from '../../../hsl/core/types';
import type { Dependencies } from '../deps';
import { ProductionState, initialState, type State, type VideoTake } from '../state';
import { copyFile, readJson, writeJson, type Context, type NodeFn } from '../runtime';
import { executionStepBudget } from '../runner';
import { planMedia } from '../lib/mediaPlan';
import { assertMediaCoverage } from '../lib/mediaCoverage';
import { agentGuide } from '../lib/firefly/guide';
import { digest, hashFile, KlingLedger } from '../lib/firefly/ledger';
import type { FireflyAuthorization } from '../lib/firefly/process';
import {
  fireflyGuide, klingBudgetWait, fireflySessionPrepare, fireflySessionWait,
  fireflyDispatch, fireflyIntakeWait, fireflyRecoveryWait, fireflyFinalize,
  routeDispatch, routeTakes, routeKlingBudget, routeRecovery,
} from '../nodes/firefly_real';

// No realDependencies fallback: any unmocked dependency is an immediate error.
// Media bytes are JSON fixtures; physical decode/encode belongs to fireflyMedia.test.ts.
interface MockMedia { durationSeconds: number; width: number; height: number; codecName: string; hasVideo: boolean; hasAudio: boolean; content: string }
interface Receipt {
  schema: 'hsl.kling-dispatch.v2'; name: string; guideHash: string;
  phase: 'transport_complete' | 'enqueued' | 'running'; paidDispatchPossible: boolean;
  outputPath: string; outputHash?: string; inputFrameHash?: string;
  authorization?: FireflyAuthorization; updatedAt: string;
}
function media(file: string, durationSeconds = 5, content = path.basename(file)) {
  writeJson(file, { durationSeconds, width: 1920, height: 1080, codecName: 'h264', hasVideo: true, hasAudio: false, content });
}
function inspect(file: string): MockMedia {
  const value = readJson<MockMedia>(file);
  if (!value?.hasVideo) throw new Error(`MOCK_INVALID_MEDIA:${file}`);
  return value;
}
const toolSuccess = () => ({ exitCode: 0, stdout: '', stderr: '', timedOut: false, durationMs: 1 });

export function createFireflyFlowFixture(root: string, durations = [150]) {
  const episodeId = 'FIREFLY_FLOW';
  fs.mkdirSync(root, { recursive: true });
  const beats: HslSceneBeat[] = durations.map((durationFrames, i) => ({
    beatId: `B${String(i + 1).padStart(3, '0')}`, actNumber: 1, actTitle: 'Coolant route', stage: 'hook',
    durationFrames, durationSeconds: durationFrames / 30, visualMode: 'firefly_video',
    shotSize: 'MACRO', cameraMovement: 'SLOW_DOLLY_IN', narrativeRole: 'KINETIC_FLOW',
    motionIntent: 'physical', motionReason: 'Observe coolant flow in the manifold.',
    cinematicPrompt: 'Coolant circulating inside a transparent metal manifold.', voiceoverScript: 'Heat leaves with the coolant.',
  }));
  const totalFrames = durations.reduce((a, b) => a + b, 0);
  const source: HslLongFormProjectPlan = { episodeId, episodeTitle: 'Cooling', subtitle: 'Heat transport', thesis: 'Heat must leave.',
    totalFrames, totalDurationSeconds: totalFrames / 30, targetMinutes: totalFrames / 1800, totalBeatsCount: beats.length,
    acts: [{ actNumber: 1, title: 'Coolant route', durationSeconds: totalFrames / 30, beatsCount: beats.length }], beats };
  const projected = planMedia(source, 'firefly-hybrid');
  const frames = beats.map(beat => {
    const file = path.join(root, 'runs', episodeId, 'frames', `${beat.beatId}.png`);
    writeJson(file, { approvedImage: beat.beatId });
    return { beatId: beat.beatId, path: file, status: 'ok' as const, attempts: 1 };
  });
  const state = { ...initialState({ episodeId, graph: { mediaMode: 'real', mediaPolicy: 'firefly-hybrid', maxGenerations: 1000 } }),
    ...projected, frames, videos: [], videoTakes: [], generationCount: 0, gateDecisions: [], fireflyIssue: null,
    klingBudget: null, klingAuthorization: null, environment: null,
    visualPrompts: beats.map(beat => ({ beatId: beat.beatId, imagePrompt: beat.cinematicPrompt,
      videoPrompt: `Track the continuous coolant flow in ${beat.beatId}.`, cameraMotion: 'slow dolly',
      durationSeconds: beat.durationSeconds, firstFrameFrom: 'image' as const })),
  } as State;
  const calls = { transport: 0, qa: 0, probe: 0, login: 0, fit: 0, lastFrame: 0, concat: 0 };
  const controls = { sessionValid: true, environmentError: '', transportError: '', qaPassed: true,
    mutateReceipt: undefined as ((receipt: Receipt) => void) | undefined };
  const directory = path.join(root, 'runs', episodeId, 'firefly');
  function ledger<T>(fn: (l: KlingLedger) => T): T {
    const l = new KlingLedger(directory);
    try { return fn(l); } finally { l.close(); }
  }
  function runtime(take: VideoTake) { return path.join(directory, 'runtime', take.operationId!); }
  function receiptPath(take: VideoTake) { return path.join(runtime(take), 'dispatch-receipt.json'); }
  function completeTransport(work: string, guideFile: string, authorization: FireflyAuthorization) {
    const guide = readJson<ReturnType<typeof agentGuide>>(guideFile)!;
    const item = guide.items[0];
    const outputPath = path.join(work, 'saida', `${item.name}.mp4`);
    const inputFrameHash = hashFile(item.image);
    const imageName = `${item.name}${path.extname(item.image).toLowerCase() || '.png'}`;
    const stagedGuide = { ...guide, items: [{ ...item, image: imageName }] };
    copyFile(item.image, path.join(work, 'imagens', imageName));
    writeJson(path.join(work, 'agent-guide.json'), stagedGuide);
    media(outputPath, 5, `${authorization.operationId}:${inputFrameHash}`);
    const receipt: Receipt = { schema: 'hsl.kling-dispatch.v2', name: item.name,
      guideHash: digest({ guide: stagedGuide, inputFrameHash }), inputFrameHash,
      authorization: { ...authorization }, phase: 'transport_complete', paidDispatchPossible: true,
      outputPath, outputHash: hashFile(outputPath), updatedAt: new Date().toISOString() };
    controls.mutateReceipt?.(receipt);
    writeJson(path.join(work, 'dispatch-receipt.json'), receipt);
    return { feed: toolSuccess(), run: toolSuccess(), status: 'transport_complete' as const, outputPath };
  }
  const mocks: Partial<Dependencies> = {
    fireflyEnvironment: () => {
      if (controls.environmentError) throw new Error(controls.environmentError);
      return { agentDir: path.join(root, 'mock-agent'), profileDir: path.join(root, 'mock-profile'), python: 'NEVER_EXECUTE' };
    },
    probeFireflySession: async () => { calls.probe++; return controls.sessionValid; },
    openFireflyLogin: async () => { calls.login++; return toolSuccess(); },
    runFireflyTake: async (_env, work, guide, _log, auth) => {
      calls.transport++;
      assert.ok(auth, 'transport must receive explicit nested authorization');
      const op = ledger(l => l.operation(auth.operationId));
      assert.ok(op, 'durable reservation must exist before transport');
      assert.equal(op.authorizationId, auth.authorizationId);
      assert.equal(op.planHash, auth.planHash);
      assert.equal(op.recipeHash, auth.recipeHash);
      if (controls.transportError) throw new Error(controls.transportError);
      return completeTransport(work, guide, auth);
    },
    detailedProbe: async file => { const p = inspect(file); return { duration: p.durationSeconds, width: p.width, height: p.height, codec: p.codecName, fps: 30 }; },
    inspect: file => inspect(file),
    extractLastFrame: async (video, output) => { calls.lastFrame++; writeJson(output, { previousVideoHash: hashFile(video) }); },
    reviewFireflyTake: async (_root, video, image) => {
      calls.qa++; inspect(video); assert.ok(fs.existsSync(image));
      return { passed: controls.qaPassed, issues: controls.qaPassed ? [] : ['fixture: continuity drift'], blockers: [],
        deterministicPassed: true, semantic: { status: controls.qaPassed ? 'passed' : 'failed' },
        evidencePath: video + '.mock-review.json', sampledImagePaths: [], reviewedAt: new Date().toISOString() };
    },
    concatTakes: async (takes, output) => { calls.concat++; media(output, takes.reduce((sum, file) => sum + inspect(file).durationSeconds, 0), digest(takes.map(hashFile))); return { reencoded: [] }; },
    fitSceneVideo: async (input, output, frames) => {
      calls.fit++; assert.ok(inspect(input).durationSeconds >= frames / 30 - 1 / 30);
      media(output, frames / 30, hashFile(input));
    },
  };
  const deps = new Proxy(mocks, { get(target, name) {
    if (!(name in target)) throw new Error(`UNMOCKED_DEPENDENCY_FORBIDDEN:${String(name)}`);
    return Reflect.get(target, name);
  } }) as Dependencies;
  const c: Context = { root, deps };
  const apply = async (node: NodeFn, current: State) => {
    const { __status: _status, ...update } = await node(current, {});
    return { ...current, ...update } as State;
  };
  async function prepare() { return apply(klingBudgetWait(c), await apply(fireflyGuide(c), state)); }
  function reserve(s: State, take = s.videoTakes[0]) {
    return ledger(l => l.reserve(s.klingAuthorization!, { id: take.operationId!, planHash: s.mediaPlan!.hash,
      recipeHash: take.recipeHash!, inputHash: hashFile(take.firstFramePath), outputPath: take.outputPath }));
  }
  function seedComplete(s: State, take = s.videoTakes[0]) {
    reserve(s, take);
    const guideFile = path.join(runtime(take), 'guide.json');
    writeJson(guideFile, agentGuide(s.visualPrompts.find(p => p.beatId === take.beatId)!, take));
    return completeTransport(runtime(take), guideFile, { authorizationId: s.klingAuthorization!.id,
      planHash: s.mediaPlan!.hash, operationId: take.operationId!, recipeHash: take.recipeHash! });
  }
  return { root, state, c, calls, controls, ledger, runtime, receiptPath, apply, prepare, reserve, seedComplete };
}
type Fixture = ReturnType<typeof createFireflyFlowFixture>;
function fixture(t: TestContext, durations?: number[]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-firefly-flow-'));
  t.after(() => {
    // Confine cleanup to the exact temporary directory created above.
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('hsl-firefly-flow-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return createFireflyFlowFixture(root, durations);
}
function miniGraph(f: Fixture, opts: {
  saver?: MemorySaver | ReturnType<typeof createCheckpointer>;
  start?: 'firefly_guide' | 'firefly_dispatch'; dispatch?: NodeFn;
} = {}) {
  return new StateGraph(ProductionState)
    .addNode('firefly_guide', fireflyGuide(f.c)).addNode('kling_budget_wait', klingBudgetWait(f.c))
    .addNode('firefly_session_prepare', fireflySessionPrepare(f.c)).addNode('firefly_session_wait', fireflySessionWait)
    .addNode('firefly_dispatch', opts.dispatch ?? fireflyDispatch(f.c))
    .addNode('firefly_intake_wait', fireflyIntakeWait(f.c)).addNode('firefly_recovery_wait', fireflyRecoveryWait(f.c))
    .addNode('firefly_finalize', fireflyFinalize(f.c))
    .addNode('coverage', s => { assertMediaCoverage(f.c, s); return {}; })
    .addConditionalEdges(START, () => opts.start ?? 'firefly_guide', ['firefly_guide', 'firefly_dispatch']).addEdge('firefly_guide', 'kling_budget_wait')
    .addConditionalEdges('kling_budget_wait', s => routeKlingBudget(s) === 'finalize' ? END : 'firefly_session_prepare', [END, 'firefly_session_prepare'])
    .addEdge('firefly_session_prepare', 'firefly_session_wait')
    .addConditionalEdges('firefly_session_wait', s => s.environment?.sessionValid ? 'firefly_dispatch' : 'firefly_session_prepare', ['firefly_dispatch', 'firefly_session_prepare'])
    .addConditionalEdges('firefly_dispatch', routeDispatch, ['firefly_intake_wait', 'firefly_recovery_wait'])
    .addConditionalEdges('firefly_intake_wait', routeTakes, ['firefly_dispatch', 'firefly_finalize', 'firefly_recovery_wait'])
    .addConditionalEdges('firefly_recovery_wait', routeRecovery, ['firefly_recovery_wait', 'firefly_session_prepare', 'firefly_dispatch']).addEdge('firefly_finalize', 'coverage').addEdge('coverage', END)
    .compile({ checkpointer: opts.saver ?? new MemorySaver() });
}
const config = (f: Fixture) => ({ configurable: { thread_id: f.state.episodeId }, recursionLimit: executionStepBudget(f.state) });
function recovery(s: State, reason?: RegExp) {
  assert.equal(s.fireflyIssue?.kind, 'FIREFLY_RECOVERY', JSON.stringify(s.fireflyIssue));
  assert.equal(routeDispatch(s), 'firefly_recovery_wait');
  assert.equal(routeTakes(s), 'firefly_recovery_wait');
  assert.equal(routeRecovery(s), 'firefly_recovery_wait');
  if (reason) assert.match(s.fireflyIssue!.reason, reason);
}

test('recovery routing never returns an uncertain receipt to dispatch', t => {
  const f = fixture(t);
  const blocked = { ...f.state, fireflyIssue: { kind: 'FIREFLY_RECOVERY' as const, reason: 'receipt pending proof' } };
  assert.equal(routeRecovery(blocked), 'firefly_recovery_wait');
  assert.equal(routeRecovery({ ...blocked, fireflyIssue: null }), 'firefly_dispatch');
});

test('recovery routes an expired Adobe session to the existing login gate', t => {
  const f = fixture(t);
  const blocked = { ...f.state, fireflyIssue: { kind: 'FIREFLY_LOGIN', reason: 'recovery requires login' } };
  assert.equal(routeRecovery(blocked), 'firefly_session_prepare');
});

test('failed query defers only that take; independent takes pass QA and dependent takes wait', async t => {
  const f=fixture(t,[300,150]),s=await f.prepare(),first=s.videoTakes[0];
  f.seedComplete(s,first);
  const receipt=readJson<any>(f.receiptPath(first));
  fs.unlinkSync(receipt.outputPath);
  writeJson(f.receiptPath(first),{...receipt,phase:'uncertain'});
  writeJson(path.join(f.runtime(first),'screenshots','provider_result_identity.json'),{});
  f.ledger(l=>l.update(first.operationId!,{phase:'uncertain'}));
  f.c.deps.recoverFireflyResult=async()=>{throw new Error('FIREFLY_RECOVERY_PROVIDER_QUERY:HTTP_400');};
  const graph=miniGraph(f,{start:'firefly_dispatch'}),cfg=config(f);
  // First run meets the unresolved take's durable receipt and suspends.
  await graph.invoke(s,cfg);
  assert.deepEqual((await graph.getState(cfg)).next,['firefly_recovery_wait']);
  await graph.invoke(new Command({resume:{}}),cfg);
  const snapshot=await graph.getState(cfg),takes=snapshot.values.videoTakes;
  assert.equal(takes[0].status,'failed');
  assert.equal(takes[1].status,'pending','dependent last frame unavailable');
  assert.equal(takes[2].status,'ok','independent take completed and passed QA');
  assert.equal(f.calls.transport,1);
  assert.equal(f.calls.qa,1);
  assert.equal(f.ledger(l=>l.count()),2,'same exact authorization, no replacement');
  assert.deepEqual(snapshot.next,['firefly_recovery_wait']);
  assert.throws(()=>assertMediaCoverage(f.c,snapshot.values),'incomplete delivery remains blocked');
  await graph.invoke(new Command({resume:{}}),cfg);
  assert.equal(f.calls.transport,1,'repeated resume must not resend either take');
});

test('semantic QA rejection quarantines its paid take and advances only independent work', async t => {
  const f=fixture(t,[300,150]),s=await f.prepare();
  const first=await f.apply(fireflyDispatch(f.c),s);
  assert.equal(first.videoTakes[0].status,'dispatched');
  f.controls.qaPassed=false;
  const rejected=await f.apply(fireflyIntakeWait(f.c),first);
  assert.equal(rejected.videoTakes[0].status,'failed');
  assert.match(rejected.videoTakes[0].error!,/^FIREFLY_QA_REJECTED:/);
  assert.equal(rejected.videoTakes[1].status,'pending','dependent frame remains unavailable');
  assert.equal(routeTakes(rejected),'firefly_recovery_wait');
  assert.equal(routeRecovery(rejected),'firefly_dispatch','independent work may continue');
  f.controls.qaPassed=true;
  const next=await f.apply(fireflyDispatch(f.c),rejected);
  assert.equal(next.videoTakes[0].status,'failed','rejected provider output is never sent again');
  assert.equal(next.videoTakes[2].status,'dispatched','only the independent take is sent');
  assert.equal(f.calls.transport,2);
  const accepted=await f.apply(fireflyIntakeWait(f.c),next);
  assert.equal(accepted.videoTakes[2].status,'ok');
  assert.equal(f.calls.qa,2);
  assert.equal(f.ledger(l=>l.count()),2,'no replacement generation was created');
});

test('101 takes cross the old recursion ceiling, chain frames, validate coverage, and reuse without transport', async t => {
  const f = fixture(t, [...Array<number>(50).fill(300), 150]);
  const graph = miniGraph(f), cfg = config(f);
  assert.ok(cfg.recursionLimit > 2 * 101);
  await graph.invoke(f.state, cfg);
  const done = await graph.getState(cfg), s = done.values as State;
  assert.deepEqual(done.next, []);
  assert.equal(s.videoTakes.length, 101);
  assert.equal(s.videos.length, 51);
  assert.equal(s.generationCount, 101);
  assert.equal(f.calls.transport, 101);
  assert.equal(f.calls.qa, 101);
  assert.ok(s.videoTakes.every(take => take.status === 'ok'));
  assert.equal(f.ledger(l => l.count()), 101);
  for (const take of s.videoTakes) {
    const receipt = readJson<Receipt>(f.receiptPath(take))!;
    assert.equal(receipt.phase, 'transport_complete');
    assert.equal(receipt.inputFrameHash, hashFile(take.firstFramePath));
    assert.equal(receipt.outputHash, hashFile(take.outputPath));
    assert.equal(receipt.authorization!.operationId, take.operationId);
    if (take.takeIndex > 1) {
      const previous = s.videoTakes.find(p => p.beatId === take.beatId && p.takeIndex === take.takeIndex - 1)!;
      assert.equal(take.firstFramePath, previous.outputPath + '.last-frame.png');
      assert.equal(readJson<{ previousVideoHash: string }>(take.firstFramePath)!.previousVideoHash, hashFile(previous.outputPath));
    }
  }
  assert.doesNotThrow(() => assertMediaCoverage(f.c, s));
  // Replanning uses the real ledger and the same bytes; replay every take node.
  let replay = await f.apply(fireflyGuide(f.c), s);
  assert.equal(replay.klingBudget!.requiredGenerations, 0);
  assert.equal(replay.klingBudget!.reusableTakes, 101);
  while (replay.videoTakes.some(take => take.status === 'pending')) replay = await f.apply(fireflyDispatch(f.c), replay);
  assert.ok(replay.videoTakes.every(take => take.status === 'skipped'));
  assert.equal(f.calls.transport, 101);
  assert.equal(f.calls.qa, 101);
});

test('empty takes and missing/duplicate prompts cannot report successful Firefly coverage', async t => {
  const f = fixture(t);
  assert.throws(() => routeTakes(f.state), /REQUIRED_PROVIDER_EMPTY/);
  await assert.rejects(f.apply(fireflyDispatch(f.c), f.state), /TAKES_NOT_PREPARED/);
  await assert.rejects(f.apply(fireflyFinalize(f.c), f.state), /COVERAGE_INVALID/);
  assert.throws(() => assertMediaCoverage(f.c, f.state), /COVERAGE_MISSING/);
  for (const visualPrompts of [[], [...f.state.visualPrompts, ...f.state.visualPrompts]]) {
    await assert.rejects(f.apply(fireflyGuide(f.c), { ...f.state, visualPrompts }), /PROMPT_COVERAGE_MISMATCH/);
  }
  assert.equal(f.calls.transport, 0);
});

test('session gate repeatedly probes after resume, and never dispatches before login succeeds', async t => {
  const f = fixture(t), graph = miniGraph(f), cfg = config(f);
  f.controls.sessionValid = false;
  await graph.invoke(f.state, cfg);
  let snapshot = await graph.getState(cfg);
  assert.deepEqual(snapshot.next, ['firefly_session_wait']);
  assert.equal((snapshot.tasks[0].interrupts[0].value as { kind: string }).kind, 'FIREFLY_LOGIN');
  assert.equal(f.calls.transport, 0);
  await graph.invoke(new Command({ resume: { authenticated: true } }), cfg);
  snapshot = await graph.getState(cfg);
  assert.deepEqual(snapshot.next, ['firefly_session_wait'], 'human response is not proof of authentication');
  assert.equal(f.calls.probe, 2);
  assert.equal(f.calls.transport, 0);
  f.controls.sessionValid = true;
  await graph.invoke(new Command({ resume: { authenticated: true } }), cfg);
  assert.deepEqual((await graph.getState(cfg)).next, []);
  assert.equal(f.calls.probe, 3);
  assert.equal(f.calls.login, 2);
  assert.equal(f.calls.transport, 1);
});

test('environment failure waits for session repair; budget abort performs no transport', async t => {
  const f = fixture(t), graph = miniGraph(f), cfg = config(f);
  f.controls.environmentError = 'FIREFLY_ENV_PATH_MISSING:mock';
  await graph.invoke(f.state, cfg);
  assert.deepEqual((await graph.getState(cfg)).next, ['firefly_session_wait']);
  assert.equal(f.calls.transport, 0);
  f.controls.environmentError = '';
  await graph.invoke(new Command({ resume: {} }), cfg);
  assert.equal(f.calls.transport, 1);
  const denied = fixture(t), deniedGraph = miniGraph(denied);
  denied.state.options.graph.maxGenerations = 0;
  await deniedGraph.invoke(denied.state, config(denied));
  assert.deepEqual((await deniedGraph.getState(config(denied))).next, ['kling_budget_wait']);
  await deniedGraph.invoke(new Command({ resume: { decision: 'abort' } }), config(denied));
  assert.equal((await deniedGraph.getState(config(denied))).values.productionStatus, 'ABORTED');
  assert.equal(denied.calls.transport, 0);
  assert.equal(denied.ledger(l => l.count()), 0);
});

for (const cut of ['after-reserve', 'after-transport'] as const) {
  test(`parent death ${cut}: reopen checkpoint and reconcile without resubmission`, async t => {
    const f = fixture(t), prepared = await f.prepare(), cfg = config(f);
    let saver = createCheckpointer(f.root);
    const dispatch: NodeFn = async (s, nodeConfig) => {
      if (cut === 'after-reserve') f.reserve(s);
      else await fireflyDispatch(f.c)(s, nodeConfig);
      // Throw outside the production node: emulate loss of its returned update.
      throw new Error('SIMULATED_PARENT_DEATH_BEFORE_CHECKPOINT');
    };
    try {
      const interrupted = miniGraph(f, { saver, start: 'firefly_dispatch', dispatch });
      await assert.rejects(interrupted.invoke(prepared, cfg), /SIMULATED_PARENT_DEATH/);
      assert.equal((await interrupted.getState(cfg)).values.videoTakes[0].status, 'pending');
      saver.db.close();
      saver = createCheckpointer(f.root);
      const resumed = miniGraph(f, { saver, start: 'firefly_dispatch' });
      await resumed.invoke(null, cfg);
      const snapshot = await resumed.getState(cfg);
      if (cut === 'after-reserve') {
        assert.deepEqual(snapshot.next, ['firefly_recovery_wait']);
        recovery(snapshot.values, /DISPATCH_UNCERTAIN/);
        await resumed.invoke(new Command({ resume: {} }), cfg);
        assert.deepEqual((await resumed.getState(cfg)).next, ['firefly_recovery_wait']);
        assert.equal(f.calls.transport, 0);
        assert.equal(f.ledger(l => l.operation(prepared.videoTakes[0].operationId!))!.phase, 'reserved');
      } else {
        assert.deepEqual(snapshot.next, []);
        assert.equal(snapshot.values.videoTakes[0].status, 'ok');
        assert.equal(f.calls.transport, 1);
        assert.equal(f.calls.qa, 1);
        assert.doesNotThrow(() => assertMediaCoverage(f.c, snapshot.values));
      }
      assert.equal(f.ledger(l => l.count()), 1);
    } finally { if (saver.db.open) saver.db.close(); }
  });
}

for (const message of ['FIREFLY_PROFILE_IN_USE:fixture', 'FIREFLY_ENV_PATH_MISSING:fixture', 'unknown transport failure']) {
  test(`failure classification preserves reservation: ${message}`, async t => {
    const f = fixture(t), s = await f.prepare(), take = s.videoTakes[0];
    if (message.startsWith('FIREFLY_ENV_')) f.controls.environmentError = message;
    else f.controls.transportError = message;
    let failed = await f.apply(fireflyDispatch(f.c), s);
    recovery(failed);
    const known = !message.startsWith('unknown');
    assert.equal(f.ledger(l => l.operation(take.operationId!))!.phase, known ? 'unstarted' : 'uncertain');
    const attempts = f.calls.transport;
    f.controls.environmentError = ''; f.controls.transportError = '';
    failed = await f.apply(fireflyDispatch(f.c), { ...failed, fireflyIssue: null });
    if (known) {
      assert.equal(failed.videoTakes[0].operationId, take.operationId);
      assert.equal(failed.videoTakes[0].status, 'dispatched');
      assert.equal(f.calls.transport, attempts + 1);
    } else {
      recovery(failed, /DISPATCH_UNCERTAIN/);
      assert.equal(f.calls.transport, attempts);
    }
    assert.equal(f.ledger(l => l.count()), 1);
  });
}

test('known preadapter error with a running receipt stays uncertain, never unstarted', async t => {
  const f = fixture(t), s = await f.prepare();
  // Simulate receipt creation followed by an error with a misleading safe prefix.
  f.c.deps.runFireflyTake = async (_env, work) => {
    f.calls.transport++;
    writeJson(path.join(work, 'dispatch-receipt.json'), { phase: 'running' });
    throw new Error('FIREFLY_PROFILE_IN_USE:after receipt');
  };
  const failed = await f.apply(fireflyDispatch(f.c), s);
  recovery(failed);
  assert.equal(f.ledger(l => l.operation(s.videoTakes[0].operationId!))!.phase, 'uncertain');
  recovery(await f.apply(fireflyDispatch(f.c), failed));
  assert.equal(f.calls.transport, 1);
});

test('output and complete receipt arriving after reserve are intaken, then reusable, with no send', async t => {
  const f = fixture(t), s = await f.prepare();
  f.seedComplete(s);
  const dispatched = await f.apply(fireflyDispatch(f.c), s);
  assert.equal(dispatched.videoTakes[0].status, 'dispatched');
  const validated = await f.apply(fireflyIntakeWait(f.c), dispatched);
  assert.equal(validated.videoTakes[0].status, 'ok');
  const replay = await f.apply(fireflyDispatch(f.c), { ...validated, videoTakes: s.videoTakes });
  assert.equal(replay.videoTakes[0].status, 'skipped');
  assert.equal(f.calls.transport, 0);
  assert.equal(f.calls.qa, 1);
  assert.equal(f.ledger(l => l.count()), 1);
});

const badReceipts: [string, (receipt: Receipt) => void][] = [
  ['wrong operation', r => { r.authorization!.operationId = 'wrong'; }],
  ['wrong recipe', r => { r.authorization!.recipeHash = 'wrong'; }],
  ['wrong authorization', r => { r.authorization!.authorizationId = 'wrong'; }],
  ['wrong plan', r => { r.authorization!.planHash = 'wrong'; }],
  ['flat legacy authorization', r => { Object.assign(r, r.authorization); delete r.authorization; }],
  ['missing input hash', r => { delete r.inputFrameHash; }],
  ['wrong input hash', r => { r.inputFrameHash = '0'.repeat(64); }],
  ['missing output hash', r => { delete r.outputHash; }],
  ['wrong output hash', r => { r.outputHash = '0'.repeat(64); }],
  ['running phase', r => { r.phase = 'running'; }],
];
for (const [label, mutate] of badReceipts) for (const replay of [false, true]) {
  test(`${replay ? 'checkpoint reconciliation' : 'fresh transport'} rejects ${label}`, async t => {
    const f = fixture(t), s = await f.prepare();
    f.controls.mutateReceipt = mutate;
    if (replay) f.seedComplete(s);
    const result = await f.apply(fireflyDispatch(f.c), s);
    recovery(result);
    assert.notEqual(result.videoTakes[0].status, 'dispatched');
    assert.equal(f.calls.transport, replay ? 0 : 1);
    const retried = await f.apply(fireflyDispatch(f.c), result);
    recovery(retried);
    assert.equal(f.calls.transport, replay ? 0 : 1, 'bad provenance cannot cause automatic regeneration');
  });
}

test('changed image bytes invalidate operation scope; stale authorization cannot dispatch new recipe', async t => {
  const f = fixture(t), old = await f.prepare();
  f.reserve(old);
  fs.appendFileSync(old.frames[0].path, '\nchanged approved image');
  await assert.rejects(f.apply(fireflyDispatch(f.c), old), /RECIPE_CHANGED/);
  const replanned = await f.apply(fireflyGuide(f.c), old);
  assert.notEqual(replanned.klingBudget!.scopeHash, old.klingBudget!.scopeHash);
  assert.notEqual(replanned.videoTakes[0].operationId, old.videoTakes[0].operationId);
  await assert.rejects(f.apply(fireflyDispatch(f.c), replanned), /NOT_AUTHORIZED|SCOPE_MISMATCH/);
  assert.equal(f.calls.transport, 0);
});

test('changed plan invalidates old budget and authorization before a new paid reservation', async t => {
  const f = fixture(t), old = await f.prepare();
  const projected = planMedia({ ...old.scenePlan!, thesis: 'Changed editorial plan' }, 'firefly-hybrid');
  const changed = { ...old, ...projected };
  await assert.rejects(f.apply(fireflyDispatch(f.c), changed), /TAKES_NOT_PREPARED|PLAN_MISMATCH/);
  const replanned = await f.apply(fireflyGuide(f.c), changed);
  assert.notEqual(replanned.klingBudget!.scopeHash, old.klingBudget!.scopeHash);
  await assert.rejects(f.apply(fireflyDispatch(f.c), replanned), /NOT_AUTHORIZED|SCOPE_MISMATCH/);
  assert.equal(f.calls.transport, 0);
  assert.equal(f.ledger(l => l.count()), 0);
});

test('QA rejection remains in recovery across resumes; repaired QA reuses the same paid output', async t => {
  const f = fixture(t), graph = miniGraph(f), cfg = config(f);
  f.controls.qaPassed = false;
  await graph.invoke(f.state, cfg);
  let snapshot = await graph.getState(cfg);
  assert.deepEqual(snapshot.next, ['firefly_recovery_wait']);
  recovery(snapshot.values, /QA_REJECTED/);
  assert.equal(snapshot.values.videoTakes[0].status, 'dispatched');
  for (let i = 0; i < 2; i++) {
    await graph.invoke(new Command({ resume: {} }), cfg);
    snapshot = await graph.getState(cfg);
    assert.deepEqual(snapshot.next, ['firefly_recovery_wait']);
    assert.equal(f.calls.transport, 1);
    assert.equal(f.ledger(l => l.count()), 1);
  }
  f.controls.qaPassed = true;
  await graph.invoke(new Command({ resume: {} }), cfg);
  assert.deepEqual((await graph.getState(cfg)).next, []);
  assert.equal(f.calls.transport, 1);
});

test('final coverage rejects local counterfeit, fabricated receipts, changed take, and changed public copy', async t => {
  const f = fixture(t), graph = miniGraph(f), cfg = config(f);
  await graph.invoke(f.state, cfg);
  const s = (await graph.getState(cfg)).values;
  assert.doesNotThrow(() => assertMediaCoverage(f.c, s));
  const counterfeit = path.join(f.root, 'local-motion.mp4'); media(counterfeit);
  assert.throws(() => assertMediaCoverage(f.c, { ...s, videos: [{ ...s.videos[0], path: counterfeit, provider: 'local-ffmpeg' }] }), /COVERAGE_MISSING/);
  assert.throws(() => assertMediaCoverage(f.c, { ...s, videos: [{ ...s.videos[0], path: counterfeit }] }), /PROVENANCE_INVALID/);
  const forged = { provider: 'firefly-kling', planHash: s.mediaPlan!.hash, sha256: hashFile(counterfeit),
    durationFrames: 150, operations: ['invented-operation'] };
  writeJson(counterfeit + '.provenance.json', forged);
  assert.throws(() => assertMediaCoverage(f.c, { ...s, videos: [{ ...s.videos[0], path: counterfeit }] }), /TAKE_PROVENANCE_INVALID/);
  const take = s.videoTakes[0], original = fs.readFileSync(take.outputPath);
  media(take.outputPath, 5, 'local counterfeit replacing validated take');
  assert.throws(() => assertMediaCoverage(f.c, s), /TAKE_PROVENANCE_INVALID/);
  await assert.rejects(f.apply(fireflyFinalize(f.c), s), /COVERAGE_INVALID/);
  const replay = { ...s, videoTakes: [{ ...take, status: 'pending' as const }] };
  recovery(await f.apply(fireflyDispatch(f.c), replay), /VALIDATED_ASSET_CHANGED/);
  fs.writeFileSync(take.outputPath, original);
  const pub = path.join(f.root, 'public', 'runs', s.episodeId, 'videos', `${take.beatId}.mp4`);
  media(pub, 5, 'changed public copy');
  assert.throws(() => assertMediaCoverage(f.c, s), /PUBLIC_COPY_INVALID/);
  assert.equal(f.calls.transport, 1);
});
