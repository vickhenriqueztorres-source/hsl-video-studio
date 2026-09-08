import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { type TestContext } from 'node:test';
import { fixtures, media } from './fixtures';
import { realDependencies } from '../deps';
import { initialState, type State } from '../state';
import { paths, readJson, type Context } from '../runtime';
import { chunkPath } from '../lib/remotion';
import { assertRenderInputs, cachedRender, chunkIdentity, createRenderIdentity, fileContentHash,
  finalIdentity, identityHash, persistRenderInputs, receiptMatches, receiptPath, renderManifestPath,
  scenePlanHash, writeReceipt } from '../lib/renderIdentity';
import { renderPrepare } from '../nodes/render_prepare';
import { renderChunkNode } from '../nodes/render_chunk';
import { routeRender } from '../nodes/fan_out_render';
import { stitch } from '../nodes/stitch';
import { mux } from '../nodes/mux';
import { compliance } from '../nodes/compliance';
import { planMedia } from '../lib/mediaPlan';
import { finalize } from '../nodes/finalize';

function setup(t: TestContext) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-render-identity-'));
  t.after(() => {
    const relative = path.relative(os.tmpdir(), root);
    assert.ok(relative.startsWith('hsl-render-identity-') && !relative.includes(path.sep));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const mock = fixtures(root, 'IDENTITY');
  const original = mock.deps.plan!({} as any);
  const beats = original.beats.slice(0, 2).map(b => ({ ...b, durationFrames: 150, durationSeconds: 5 }));
  const plan = { ...original, beats, totalFrames: 300, totalDurationSeconds: 10, totalBeatsCount: 2 };
  const sfxPath = path.join(root, 'runs', 'IDENTITY', 'audio', 'sfx-track.wav');
  media(sfxPath, false, 10);
  const s = { ...initialState({ episodeId: 'IDENTITY', graph: { mediaMode: 'legacy', testRender: true } }),
    ...planMedia(plan, 'local-motion'), frames: [], videos: [], renderChunks: [], videoTakes: [], errors: [], timings: [], sfxTrackPath: sfxPath } as unknown as State;
  for (const beat of s.scenePlan!.beats) {
    const video = beat.visualMode === 'firefly_video';
    const relative = (video ? beat.outputVideoPath : beat.outputFramePath)!;
    for (const prefix of ['', 'public']) media(path.join(root, prefix, relative), !video, 5);
    (video ? s.videos : s.frames).push({ beatId: beat.beatId, path: path.join(root, relative), provider: beat.mediaProvider, status: 'ok', attempts: 1 });
  }
  const c: Context = { root, deps: { ...realDependencies(root), ...mock.deps } };
  const p = paths(c, s);
  const range: [number, number] = [0, 299];
  async function chunk() {
    const update = await renderChunkNode(c)({ ...s, index: 0, frameRange: range }, {});
    assert.ok(Array.isArray(update.renderChunks));
    s.renderChunks.push(...update.renderChunks);
    return update;
  }
  async function visual() { await renderPrepare(c)(s, {}); await chunk(); return stitch(c)(s, {}); }
  async function final() { await visual(); return mux(c)(s, {}); }
  return { root, c, s, p, range, chunk, visual, final, calls: mock.calls };
}

test('identity hashes the complete plan, provider, intervals and resolved media, independent of object order or port', t => {
  const x = setup(t), before = createRenderIdentity(x.c, x.s);
  assert.deepEqual(before.beats.map(b => b.frameRange), [[0, 149], [150, 299]]);
  assert.equal(before.beats[1].path, path.join(x.root, 'public', x.s.scenePlan!.beats[1].outputVideoPath!));
  assert.equal(scenePlanHash({ ...x.s.scenePlan, assetBaseUrl: 'http://127.0.0.1:1' }), scenePlanHash({ assetBaseUrl: 'http://127.0.0.1:2', ...x.s.scenePlan }));
  assert.equal(identityHash({ b: 2, a: 1 }), identityHash({ a: 1, b: 2 }));
  x.s.scenePlan = { ...x.s.scenePlan!, episodeTitle: 'Same timing, new scene content' };
  assert.notEqual(createRenderIdentity(x.c, x.s).hash, before.hash);
  const planned = createRenderIdentity(x.c, x.s);
  x.s.scenePlan = { ...x.s.scenePlan!, beats: x.s.scenePlan!.beats.map(b => ({ ...b, mediaProvider: 'local-ffmpeg' as const })) };
  const local = createRenderIdentity(x.c, x.s);
  assert.notEqual(local.hash, planned.hash);
  x.s.scenePlan = { ...x.s.scenePlan!, beats: x.s.scenePlan!.beats.map(b => ({ ...b, mediaProvider: 'firefly-kling' as const })) };
  assert.notEqual(createRenderIdentity(x.c, x.s).hash, local.hash);
  x.s.mediaPlan = { ...x.s.mediaPlan!, hash: 'provider-plan-revision-2' };
  assert.equal(createRenderIdentity(x.c, x.s).mediaPlanHash, 'provider-plan-revision-2');
});

test('same-size rewrites with restored mtime invalidate hashes and persisted manifests; state and served copies must agree', t => {
  const x = setup(t), identity = createRenderIdentity(x.c, x.s);
  persistRenderInputs(x.c, x.s, identity, 'http://127.0.0.1:29999');
  assertRenderInputs(x.c, x.s, identity);
  const file = identity.beats[1].path, previousStat = fs.statSync(file), bytes = fs.readFileSync(file);
  bytes[bytes.length - 1] = 10; // JSON remains parseable and mock duration unchanged.
  fs.writeFileSync(file, bytes); fs.utimesSync(file, previousStat.atime, previousStat.mtime);
  assert.notEqual(fileContentHash(file), identity.beats[1].hash);
  const changed = createRenderIdentity(x.c, x.s);
  assert.notEqual(changed.hash, identity.hash);
  assert.throws(() => assertRenderInputs(x.c, x.s, identity), /MANIFEST_STALE/);
  persistRenderInputs(x.c, x.s, changed, 'http://127.0.0.1:29999');
  assert.throws(() => assertRenderInputs(x.c, x.s, changed), /STATE_MISMATCH/);
  fs.copyFileSync(file, identity.beats[1].sourcePath);
  const current = createRenderIdentity(x.c, x.s);
  persistRenderInputs(x.c, x.s, current, 'http://127.0.0.1:29999');
  assertRenderInputs(x.c, x.s, current);
  const props = readJson<any>(x.p.props); props.beats[0].graphicHeadline = 'STALE';
  fs.writeFileSync(x.p.props, JSON.stringify(props));
  assert.throws(() => assertRenderInputs(x.c, x.s, current), /MANIFEST_STALE/);
});

test('unreceipted same-duration chunks are rendered; successful receipts survive direct resume and reject tampered outputs', async t => {
  const x = setup(t), out = chunkPath(x.root, x.s.episodeId, 0);
  media(out, false, 10);
  assert.equal((await x.chunk()).__status, 'ok');
  assert.equal((await x.chunk()).__status, 'skipped');
  assert.equal(x.calls.chunk0, 1);
  assert.equal(routeRender(x.c)(x.s), 'stitch');
  fs.appendFileSync(out, '\n');
  assert.ok(Array.isArray(routeRender(x.c)(x.s)));
  assert.equal((await x.chunk()).__status, 'ok');
  assert.equal(x.calls.chunk0, 2);
  assert.ok(fs.existsSync(renderManifestPath(x.c, x.s)));
});

test('same-duration plan and source changes invalidate every downstream cache and refresh props', async t => {
  const x = setup(t);
  await x.final();
  assert.equal((await renderPrepare(x.c)(x.s, {})).__status, 'skipped');
  assert.equal(routeRender(x.c)(x.s), 'stitch');
  assert.equal((await stitch(x.c)(x.s, {})).__status, 'skipped');
  assert.equal((await mux(x.c)(x.s, {})).__status, 'skipped');
  x.s.scenePlan = { ...x.s.scenePlan!, episodeTitle: 'Revision with identical duration' };
  Object.assign(x.s, planMedia(x.s.scenePlan, 'local-motion'));
  assert.ok(Array.isArray(routeRender(x.c)(x.s)));
  await assert.rejects(Promise.resolve(stitch(x.c)(x.s, {})), /STALE_CHUNKS/);
  await assert.rejects(Promise.resolve(mux(x.c)(x.s, {})), /STALE_VISUAL/);
  assert.equal((await renderPrepare(x.c)(x.s, {})).__status, 'ok');
  assert.equal(readJson<any>(x.p.props).episodeTitle, x.s.scenePlan.episodeTitle);
  await x.final();
  assert.equal(x.calls.chunk0, 2);
  const identity = createRenderIdentity(x.c, x.s), beat = identity.beats[1];
  fs.appendFileSync(beat.sourcePath, '\n');
  assert.ok(Array.isArray(routeRender(x.c)(x.s)));
  await assert.rejects(Promise.resolve(renderPrepare(x.c)(x.s, {})), /STATE_MISMATCH/);
  fs.copyFileSync(beat.sourcePath, beat.path);
  await x.final();
  assert.equal(x.calls.chunk0, 3);
});

test('stitch validates chunk ranges and receipts and only publishes a visual receipt on success', async t => {
  const x = setup(t), out = chunkPath(x.root, x.s.episodeId, 0);
  media(out, false, 10);
  await assert.rejects(Promise.resolve(stitch(x.c)(x.s, {})), /STALE_CHUNKS/);
  const identity = createRenderIdentity(x.c, x.s);
  writeReceipt(out, 'chunk', chunkIdentity(identity, 0, [1, 300]));
  await assert.rejects(Promise.resolve(stitch(x.c)(x.s, {})), /STALE_CHUNKS/);
  await x.chunk();
  await stitch(x.c)(x.s, {});
  assert.ok(cachedRender(x.c, x.p.visual, 10, 'visual', identity.hash));
  assert.ok(!fs.existsSync(out));
  assert.ok(!fs.existsSync(receiptPath(out)));
  assert.equal((await stitch(x.c)(x.s, {})).__status, 'skipped');
});

test('failed render and changed inputs during rendering cannot mint success receipts', async t => {
  const x = setup(t), out = chunkPath(x.root, x.s.episodeId, 0);
  await x.chunk();
  x.s.scenePlan = { ...x.s.scenePlan!, episodeTitle: 'Changed' };
  x.c.deps.renderChunk = async () => { media(out, false, 10); throw new Error('renderer died'); };
  await assert.rejects(x.chunk(), /renderer died/);
  assert.ok(!fs.existsSync(receiptPath(out)));
  x.c.deps.renderChunk = async () => {
    media(out, false, 10);
    return { exitCode: 1, stdout: '', stderr: 'failed after output', timedOut: false, durationMs: 1 };
  };
  await assert.rejects(x.chunk(), /RENDER_PROCESS_FAILED/);
  assert.ok(!fs.existsSync(receiptPath(out)));
  x.c.deps.renderChunk = async () => {
    media(out, false, 9);
    return { exitCode: 0, stdout: '', stderr: '', timedOut: false, durationMs: 1 };
  };
  await assert.rejects(x.chunk(), /CHUNK_INVALID/);
  assert.ok(!fs.existsSync(receiptPath(out)));
  x.c.deps.renderChunk = async () => {
    media(out, false, 10);
    fs.appendFileSync(createRenderIdentity(x.c, x.s).beats[1].path, '\n');
    return { exitCode: 0, stdout: '', stderr: '', timedOut: false, durationMs: 1 };
  };
  await assert.rejects(x.chunk(), /MANIFEST_STALE/);
  assert.ok(!fs.existsSync(receiptPath(out)));
});

test('failed concat leaves valid-looking output unreceipted and preserves the input chunks', async t => {
  const x = setup(t);
  x.s.options.graph.testRender = false;
  const p = paths(x.c, x.s);
  await x.chunk();
  x.c.deps.concatChunks = async () => {
    media(p.visual, false, 10);
    return { exitCode: 1, stdout: '', stderr: 'concat failed', timedOut: false, durationMs: 1 };
  };
  await assert.rejects(Promise.resolve(stitch(x.c)(x.s, {})), /RENDER_PROCESS_FAILED/);
  assert.ok(fs.existsSync(chunkPath(x.root, x.s.episodeId, 0)));
  assert.ok(!fs.existsSync(receiptPath(p.visual)));
});

test('provider-only changes reject same-duration chunk receipts and update the persisted media descriptor', async t => {
  const x = setup(t);
  x.s.scenePlan = { ...x.s.scenePlan!, beats: x.s.scenePlan!.beats.map(b => ({ ...b, mediaProvider: 'local-ffmpeg' as const })) };
  await x.chunk();
  x.s.scenePlan = { ...x.s.scenePlan!, beats: x.s.scenePlan!.beats.map(b => ({ ...b, mediaProvider: 'firefly-kling' as const })) };
  assert.ok(Array.isArray(routeRender(x.c)(x.s)));
  assert.equal((await x.chunk()).__status, 'ok');
  assert.equal(readJson<any>(renderManifestPath(x.c, x.s)).beats[1].provider, 'firefly-kling');
});

test('missing, failed and remote media are rejected locally before invoking the renderer', async t => {
  const x = setup(t);
  x.s.videos[0].status = 'failed';
  await assert.rejects(x.chunk(), /STATE_FAILED/);
  x.s.videos[0].status = 'ok';
  fs.unlinkSync(x.s.videos[0].path);
  await assert.rejects(x.chunk(), /ENOENT/);
  assert.equal(x.calls.chunk0, undefined);
  x.s.scenePlan = { ...x.s.scenePlan!, beats: x.s.scenePlan!.beats.map(b => ({ ...b, outputFramePath: 'https://example.invalid/media.png' })) };
  await assert.rejects(x.chunk(), /LOCAL_PATH_REQUIRED/);
});

test('mux rejects unreceipted masters, fingerprints audio changes and leaves no receipt on failure', async t => {
  const x = setup(t);
  await x.visual(); media(x.p.final, false, 10);
  assert.equal((await mux(x.c)(x.s, {})).__status, 'ok');
  assert.equal((await mux(x.c)(x.s, {})).__status, 'skipped');
  fs.appendFileSync(x.p.narration, '\n');
  assert.ok(Array.isArray(routeRender(x.c)(x.s)));
  await x.visual();
  x.c.deps.muxFinalWithSfx = async () => { media(x.p.final, false, 10); throw new Error('mux died'); };
  await assert.rejects(Promise.resolve(mux(x.c)(x.s, {})), /mux died/);
  assert.ok(!fs.existsSync(receiptPath(x.p.final)));
});

test('compliance cache binds the report to master content and media plan, never episode alone', async t => {
  const x = setup(t);
  await x.final();
  const file = path.join(x.p.audit, 'compliance.json');
  fs.writeFileSync(file, JSON.stringify(x.c.deps.compliance(x.s.episodeId)));
  await compliance(x.c)(x.s, {});
  assert.equal(x.calls.compliance, 2);
  assert.equal((await compliance(x.c)(x.s, {})).__status, 'skipped');
  fs.appendFileSync(x.p.final, '\n');
  await assert.rejects(Promise.resolve(compliance(x.c)(x.s, {})), /MASTER_PROVENANCE_INVALID/);
  // Simulate a newly successful encode with different master bytes.
  writeReceipt(x.p.final, 'final', finalIdentity(x.c, x.s, createRenderIdentity(x.c, x.s)));
  await compliance(x.c)(x.s, {});
  assert.equal(x.calls.compliance, 3);
  const previousMediaHash = x.s.mediaPlan!.hash;
  x.s.scenePlan = { ...x.s.scenePlan!, beats: x.s.scenePlan!.beats.map(b => ({ ...b, motionReason: 'Updated editorial reason for the same media' })) };
  Object.assign(x.s, planMedia(x.s.scenePlan, 'local-motion'));
  assert.notEqual(x.s.mediaPlan!.hash, previousMediaHash);
  await assert.rejects(Promise.resolve(compliance(x.c)(x.s, {})), /MASTER_PROVENANCE_INVALID/);
  await x.final(); await compliance(x.c)(x.s, {});
  assert.equal(x.calls.compliance, 4);
  assert.ok(receiptMatches(x.p.final, 'final', finalIdentity(x.c, x.s, createRenderIdentity(x.c, x.s))));
  fs.unlinkSync(receiptPath(file));
  x.c.deps.compliance = () => ({ ...readJson<any>(file), passed: false, failedRules: 1, passedRules: 0 });
  assert.equal((await compliance(x.c)(x.s, {})).__status, 'failed');
  assert.ok(!fs.existsSync(receiptPath(file)));
});

test('cached render and compliance cannot bypass missing media plan or required provider coverage', async t => {
  const x = setup(t);
  await x.final(); await compliance(x.c)(x.s, {});
  const mediaPlan = x.s.mediaPlan;
  x.s.mediaPlan = null;
  await assert.rejects(Promise.resolve(renderPrepare(x.c)(x.s, {})), /MEDIA_PLAN_MISSING/);
  await assert.rejects(Promise.resolve(compliance(x.c)(x.s, {})), /MEDIA_PLAN_MISSING/);
  x.s.mediaPlan = mediaPlan;
  const video = x.s.videos.pop()!;
  await assert.rejects(Promise.resolve(renderPrepare(x.c)(x.s, {})), /MEDIA_COVERAGE_MISSING/);
  await assert.rejects(Promise.resolve(compliance(x.c)(x.s, {})), /MEDIA_COVERAGE_MISSING/);
  x.s.videos.push({ ...video, provider: 'firefly-kling' });
  await assert.rejects(Promise.resolve(renderPrepare(x.c)(x.s, {})), /MEDIA_COVERAGE_MISSING/);
  await assert.rejects(Promise.resolve(compliance(x.c)(x.s, {})), /MEDIA_COVERAGE_MISSING/);
  assert.equal(x.calls.chunk0, 1); assert.equal(x.calls.compliance, 1);
});

test('finalize requires current master and compliance receipts even when state says passed', async t => {
  const x=setup(t);
  await x.final();
  x.s.compliance=x.c.deps.compliance(x.s.episodeId);
  await assert.rejects(Promise.resolve(finalize(x.c)(x.s,{})),/FINALIZE_COMPLIANCE_PROVENANCE_INVALID/);
  const checked=await compliance(x.c)(x.s,{});
  x.s.compliance=checked.compliance as State['compliance'];
  assert.equal((await finalize(x.c)(x.s,{})).productionStatus,'COMPLETED');
  fs.appendFileSync(x.p.final,'\n');
  await assert.rejects(Promise.resolve(finalize(x.c)(x.s,{})),/FINALIZE_MASTER_PROVENANCE_INVALID/);
});
