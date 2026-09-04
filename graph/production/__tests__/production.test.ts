import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fork } from 'node:child_process';
import { Command } from '@langchain/langgraph';
import { createCheckpointer, REPO_ROOT } from '../../checkpointer';
import { createProductionGraph, NODE_ORDER } from '../graph';
import { initialState, AssetResult, Timing } from '../state';
import { configFor, executeProduction, readHistory, rewind } from '../runner';
import { cleanRemotionTemp, prunePublicRuns } from '../lib/assets';
import { spawnTool, requireSuccess } from '../../lib/proc';
import { fixtures } from './fixtures';
import { writeJson } from '../runtime';
import { compareManifests } from '../parity';
const legacyState = (o: any) => initialState({ ...o, graph: { ...o.graph, mediaMode: 'legacy' } });

async function main() {
  assert.throws(()=>requireSuccess({exitCode:1,stdout:'',stderr:'',timedOut:false,durationMs:1},'CHILD'),/process exited with code 1/);
  assert.throws(()=>requireSuccess({stdout:'',stderr:'',timedOut:true,durationMs:1},'CHILD'),/timeout/);
  const base = path.join(REPO_ROOT, 'runs', 'phase1-tests-' + Date.now()); fs.mkdirSync(base, { recursive: true });
  const scenario = (name: string, opts = {}) => {
    const root = path.join(base, name); fs.mkdirSync(root, { recursive: true });
    const saver = createCheckpointer(root), mock = fixtures(root, name, opts);
    const graph = createProductionGraph(saver, mock.deps, root);
    return { root, saver, graph, ...mock, run: (input: Parameters<typeof graph.stream>[0]) => executeProduction(graph, root, name, input) };
  };
  const a = scenario('PASS');
  try {
    const mermaid = a.graph.getGraph().drawMermaid();
    for (const node of NODE_ORDER) assert.ok(mermaid.includes(node));
    const done = await a.run(legacyState({ episodeId: 'PASS' }));
    assert.equal(done.values.productionStatus, 'COMPLETED');
    assert.equal(done.values.gateDecisions.length, 0);
    assert.equal(done.values.renderChunks.length, 4);
    const manifestFile = path.join(a.root, 'runs', 'PASS', 'run-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    assert.ok(compareManifests(manifest, structuredClone(manifest)).every(r => r.status !== 'diferente'));
    const changed = structuredClone(manifest); changed.stages.STAGE_02_IMAGE_FRAMES.metrics.totalGenerated++;
    assert.ok(compareManifests(manifest, changed).some(r => r.item.endsWith('.totalGenerated') && r.status === 'diferente'));
    const before = { ...a.calls };
    const timingCount = done.values.timings.length;
    const again = await a.run(legacyState({ episodeId: 'PASS' }));
    assert.equal(again.values.productionStatus, 'COMPLETED');
    for (const key of Object.keys(before)) assert.equal(a.calls[key], before[key], 'idempotent ' + key);
    assert.ok(again.values.timings.slice(timingCount).every((t: Timing) => t.status === 'skipped'), 'all entered nodes skipped on cached run');
    const expectedFrames=done.values.scenePlan!.beats.length,expectedVideos=done.values.scenePlan!.beats.filter((b:any)=>b.visualMode==='firefly_video').length;
    assert.ok(again.values.frames.slice(-expectedFrames).every((f: AssetResult) => f.status === 'skipped'));
    assert.ok(expectedVideos===0||again.values.videos.slice(-expectedVideos).every((f: AssetResult) => f.status === 'skipped'));
    await rewind(a.graph, a.root, 'PASS', 'mux');
    const rewound = await a.run(null); assert.equal(rewound.values.productionStatus, 'COMPLETED');
    console.log('PASS 1, 3 (disabled), 5: compile/Mermaid, pass-through, artifact idempotency, --from mux');
  } finally { a.saver.db.close(); }

  for (const decision of ['proceed', 'abort'] as const) {
    const name = 'GATE_' + decision;
    const x = scenario(name);
    try {
      let s = await x.run(legacyState({ episodeId: name, graph: { gates: { render: true, publish: true } } }));
      assert.deepEqual(s.next, ['gate_render_wait']); assert.equal(x.calls.bundle, undefined);
      x.saver.db.close();
      const saver = createCheckpointer(x.root);
      try {
        const graph = createProductionGraph(saver, x.deps, x.root);
        s = await executeProduction(graph, x.root, name, new Command({ resume: { decision } }));
        if (decision === 'abort') assert.equal(s.values.productionStatus, 'ABORTED');
        else {
          assert.deepEqual(s.next, ['gate_publish_wait']);
          s = await executeProduction(graph, x.root, name, new Command({ resume: { decision: 'proceed' } }));
          assert.equal(s.values.productionStatus, 'COMPLETED');
        }
        const history = readHistory(x.root, name);
        assert.equal(history.filter(e => e.node === 'gate_render_wait').length, 2);
        assert.equal(history.filter(e => e.node === 'image_frames').length, 1);
      } finally { saver.db.close(); }
    } finally { if (x.saver.db.open) x.saver.db.close(); }
  }
  console.log('PASS 3: human gates, reopened SQLite, proceed/abort');

  const untilRoot = path.join(base, 'until'); fs.mkdirSync(untilRoot, { recursive: true });
  const untilMock = fixtures(untilRoot, 'UNTIL');
  let untilSaver = createCheckpointer(untilRoot);
  let untilGraph = createProductionGraph(untilSaver, untilMock.deps, untilRoot, { interruptAfter: ['gatekeeper_stage'] });
  let untilState = await executeProduction(untilGraph, untilRoot, 'UNTIL', legacyState({ episodeId: 'UNTIL' }));
  assert.deepEqual(untilState.next, ['gate_render_wait']);
  assert.equal(untilMock.calls.bundle, undefined);
  const callsAtCutoff = { ...untilMock.calls };
  untilSaver.db.close();
  untilSaver = createCheckpointer(untilRoot);
  untilGraph = createProductionGraph(untilSaver, untilMock.deps, untilRoot);
  untilState = await executeProduction(untilGraph, untilRoot, 'UNTIL', null);
  assert.equal(untilState.values.productionStatus, 'COMPLETED');
  assert.equal(untilMock.calls.frames, callsAtCutoff.frames);
  assert.equal(untilMock.calls.videos, callsAtCutoff.videos);
  untilSaver.db.close();
  console.log('PASS --until gatekeeper: checkpoint after node and resume at gate_render_wait');

  const pubAbort = scenario('PUBLISH_ABORT');
  try {
    await pubAbort.run(legacyState({ episodeId: 'PUBLISH_ABORT', graph: { gates: { publish: true } } }));
    const aborted = await pubAbort.run(new Command({ resume: { decision: 'abort' } }));
    assert.equal(aborted.values.productionStatus, 'ABORTED');
  } finally { pubAbort.saver.db.close(); }

  const b = scenario('BLOCKED', { failedBeat: true, blocked: true });
  try {
    const s = await b.run(legacyState({ episodeId: 'BLOCKED' }));
    assert.equal(b.calls.frames, 2); assert.equal(s.values.frames.filter((f: AssetResult) => f.status === 'failed').length, 1);
    assert.equal(s.values.productionStatus, 'BLOCKED_PRE_RENDER'); assert.equal(b.calls.bundle, undefined);
    assert.ok(s.values.errors.length > 0); console.log('PASS 4: retry exhausted, physical gate blocks');
  } finally { b.saver.db.close(); }

  assert.throws(() => prunePublicRuns(os.tmpdir(), 'BAD'), /PATH_CONFINEMENT/);
  assert.throws(() => cleanRemotionTemp(os.tmpdir(), 0), /PATH_CONFINEMENT/);
  console.log('PASS 6: destructive paths confined');
  const off = scenario('OFFLINE', { noCache: true });
  try {
    await assert.rejects(off.run(legacyState({ episodeId: 'OFFLINE', graph: { offline: true } })), /narration cache ausente em modo offline/);
    assert.equal(off.calls.narrate, undefined); console.log('PASS 7: offline refuses before adapter');
  } finally { off.saver.db.close(); }

  const killRoot = path.join(base, 'kill'); fs.mkdirSync(killRoot, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const child = fork(path.join(__dirname, 'killWorker.ts'), [killRoot, 'kill'], { execArgv: ['-r', 'ts-node/register/transpile-only'], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    let killing = false, stderr = '';
    child.stderr?.on('data', s => { stderr += s; });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('kill test timeout: ' + stderr)); }, 30000);
    child.on('message', (m: any) => {
      if (m.readyToKill && !killing) {
        killing = true;
        // Both mock tasks are now held forever. Give the debug stream time to
        // synchronously journal both task events before the hard process kill.
        setTimeout(() => child.kill('SIGKILL'), 150);
      }
    });
    child.on('exit', () => { clearTimeout(timer); killing ? resolve() : reject(new Error('worker exited before kill: ' + stderr)); });
    child.on('error', reject);
  });
  await new Promise<void>((resolve, reject) => {
    const child = fork(path.join(__dirname, 'killWorker.ts'), [killRoot, 'resume'], { execArgv: ['-r', 'ts-node/register/transpile-only'], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    let completed = false, stderr = '';
    child.stderr?.on('data', s => { stderr += s; });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('resume timeout')); }, 30000);
    child.on('message', (m: any) => { completed = m.status === 'COMPLETED'; });
    child.on('exit', code => { clearTimeout(timer); code === 0 && completed ? resolve() : reject(new Error('resume failed ' + stderr)); });
    child.on('error', reject);
  });
  const history = readHistory(killRoot, 'KILL_TEST');
  const counts = [0, 1, 2, 3].map(i => history.filter(e => e.node === 'render_chunk' && e.index === i).length);
  assert.deepEqual(counts, [1, 1, 2, 2]);
  writeJson(path.join(base, 'kill-history.json'), history);
  console.log('PASS 2: hard process kill, chunks entries ' + JSON.stringify(counts));

  const literal = path.join(base, 'argv space & quote.js');
  fs.writeFileSync(literal, 'console.log(JSON.stringify(process.argv.slice(2)))');
  const argv = ['space here', 'quote"here', 'semi;dollar$backtick`', 'áudio'];
  const output = await spawnTool(process.execPath, [literal, ...argv], { cwd: REPO_ROOT, logPath: path.join(base, 'proc.log') });
  assert.equal(output.exitCode, 0); assert.deepEqual(JSON.parse(output.stdout), argv);
  const npx = await spawnTool(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--version'], { cwd: REPO_ROOT });
  assert.equal(npx.exitCode, 0);
  writeJson(path.join(REPO_ROOT, 'runs', 'phase1-tests-last.json'), { base, counts, passed: [1, 2, 3, 4, 5, 6, 7] });
  console.log('PASS process literal argv and Windows npm shim. Evidence: ' + base);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
