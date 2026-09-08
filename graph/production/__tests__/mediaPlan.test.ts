import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { HslSceneDirectorAgent } from '../../../hsl/core/hslSceneDirectorAgent';
import type { EpisodeTopicInput, HslLongFormProjectPlan, HslSceneBeat, MediaPlan } from '../../../hsl/core/types';
import { getAiCoolingBeatData } from '../../../hsl/editorial/topicStoryboards';
import { assertMediaPlan, mediaTakeCount, planMedia, resolveMediaPolicy, validateMediaPlan } from '../lib/mediaPlan';
import { normalizePlanDuration } from '../lib/plan';
import { mediaPlanPrepare, mediaPlanValidate } from '../nodes/media_plan';
import { fireflyGuide } from '../nodes/firefly_real';
import { initialState, type State } from '../state';
import type { Context } from '../runtime';

const cooling: EpisodeTopicInput = {
  episodeId: 'HSL_EPISODE_003', topic: 'HOW 45,000 LITERS OF LIQUID KEEP AI CLUSTERS FROM MELTING',
  entity: 'AI supercomputer liquid cooling', mechanism: 'Direct-to-chip closed-loop coolant circulation',
  constraint: '105 degree silicon junction temperature', consequence: 'Thermal trip across the cluster',
  thesis: 'The hidden product of AI is continuous heat removal.', targetMinutes: 6,
};

function beat(beatId: string, overrides: Partial<HslSceneBeat> = {}): HslSceneBeat {
  return { beatId, actNumber: 1, actTitle: 'The coolant route', stage: 'hook', durationFrames: 163, durationSeconds: 163 / 30,
    visualMode: 'generated_image_35mm', shotSize: 'MACRO', cameraMovement: 'SLOW_DOLLY_IN', pacingType: 'MODULAR_NARRATIVE',
    narrativeRole: 'KINETIC_FLOW', cinematicPrompt: 'Coolant flowing through a transparent manifold.',
    voiceoverScript: 'Coolant carries the heat away.', ...overrides };
}
function timeline(beats: readonly HslSceneBeat[]): HslLongFormProjectPlan {
  const frames = beats.reduce((sum, b) => sum + b.durationFrames, 0);
  return { episodeId: 'MEDIA_TEST', episodeTitle: 'Cooling', subtitle: 'Hidden heat', thesis: 'Heat must leave.',
    totalDurationSeconds: frames / 30, totalFrames: frames, totalBeatsCount: beats.length, targetMinutes: frames / 1800,
    acts: [{ actNumber: 1, title: 'The coolant route', durationSeconds: frames / 30, beatsCount: beats.length }], beats };
}
function state(plan: HslLongFormProjectPlan, overrides: Partial<State['options']['graph']> = {}): State {
  return { ...initialState({ episodeId: plan.episodeId, graph: overrides }), scenePlan: plan, mediaPlan: null } as State;
}

test('policy resolves old checkpoints and explicit choices, with no Firefly/legacy conflict', () => {
  assert.equal(resolveMediaPolicy({ options: { graph: {} } }), 'firefly-hybrid');
  assert.equal(resolveMediaPolicy({ options: { graph: { mediaMode: 'legacy' } } }), 'local-motion');
  for (const mediaPolicy of ['stills', 'local-motion', 'firefly-hybrid'] as const) {
    assert.equal(resolveMediaPolicy({ options: { graph: { mediaMode: 'real', mediaPolicy } } }), mediaPolicy);
  }
  assert.throws(() => resolveMediaPolicy({ options: { graph: { mediaMode: 'legacy', mediaPolicy: 'firefly-hybrid' } } }), /MEDIA_POLICY_MODE_CONFLICT/);
  assert.throws(() => resolveMediaPolicy({ options: { graph: { mediaPolicy: 'invalid' as never } } }), /MEDIA_POLICY_INVALID/);
});

test('full frame coverage includes the former 5.5-second gap', () => {
  assert.deepEqual([1, 150, 151, 163, 165, 166, 300, 301].map(mediaTakeCount), [1, 1, 2, 2, 2, 2, 2, 3]);
  for (const frames of [0, -1, 1.5, Infinity, NaN]) assert.throws(() => mediaTakeCount(frames), /DURATION_INVALID/);
});

test('explicit cooling motion survives the director and normalization with original IDs', () => {
  assert.equal(getAiCoolingBeatData(1, 2, cooling).motionIntent, 'physical');
  assert.equal(getAiCoolingBeatData(1, 3, cooling).motionIntent, 'none');
  const source = HslSceneDirectorAgent.planEpisodeFromScratch(cooling);
  assert.ok(source.beats.some(b => b.motionIntent === 'physical' && b.motionReason && b.promptSubject));
  assert.throws(() => planMedia(source, 'firefly-hybrid'), /TIMELINE_MISMATCH/);
  const normalized = normalizePlanDuration(source, 6);
  assert.equal(normalized.totalFrames, 10800);
  assert.equal(normalized.beats.length, 58);
  assert.ok(normalized.beats.some(b => b.beatId !== b.sourceBeatId));
  for (const b of normalized.beats) {
    const original = source.beats.find(s => s.beatId === b.sourceBeatId)!;
    assert.ok(original);
    assert.equal(b.motionIntent, original.motionIntent);
    assert.equal(b.motionReason, original.motionReason);
  }
  const planned = planMedia(normalized, 'firefly-hybrid');
  validateMediaPlan(planned.scenePlan, planned.mediaPlan);
  assert.ok(planned.mediaPlan.totalTakes > 0);
  assert.equal(planned.scenePlan.totalFrames, 10800);
  assert.deepEqual(planned.scenePlan.beats.map(b => [b.beatId, b.durationFrames]), normalized.beats.map(b => [b.beatId, b.durationFrames]));
  const renormalized = normalizePlanDuration(normalized, 3);
  assert.ok(renormalized.beats.every(b => normalized.beats.some(n => n.sourceBeatId === b.sourceBeatId)));
});

test('normalization adds lineage even when duration already matches', () => {
  const source = timeline([beat('original')]);
  const normalized = normalizePlanDuration(source, source.targetMinutes);
  assert.equal(normalized.beats[0].sourceBeatId, 'original');
  assert.equal(normalizePlanDuration(normalized, normalized.targetMinutes), normalized);
});

test('hybrid selects motivated motion and excludes diagrams even with hero or kinetic roles', () => {
  const source = timeline([
    beat('flow'), beat('hero', { narrativeRole: 'CORE_THESIS', pacingType: 'HERO_EXPLORATION' }),
    beat('hook', { narrativeRole: 'MONUMENTAL_HOOK' }),
    beat('archetype', { infographicArchetype: 'CUTAWAY', motionIntent: 'physical', motionReason: 'A flow proposal.' }),
    beat('diagram', { cinematicPrompt: '3D fluid vector diagram of a coolant loop.', pacingType: 'HERO_EXPLORATION' }),
    beat('vector', { visualMode: 'vector_remotion' }), beat('motion-diagram', { visualMode: 'motion_image_diagram' }),
    beat('ordinary', { narrativeRole: 'TECHNICAL_ANATOMY' }),
    beat('locked', { narrativeRole: 'CORE_THESIS', pacingType: 'HERO_EXPLORATION', cameraMovement: 'LOCKED_TELEMETRY' }),
    beat('editorial-still', { motionIntent: 'none', motionReason: 'Keep the machining tolerances readable.' }),
  ]);
  const before = JSON.stringify(source);
  const result = planMedia(source, 'firefly-hybrid');
  assert.deepEqual(result.mediaPlan.fireflyBeatIds, ['flow', 'hero', 'hook']);
  assert.equal(result.mediaPlan.totalTakes, 6);
  assert.equal(result.mediaPlan.totalFrames, source.totalFrames);
  assert.equal(JSON.stringify(source), before);
  validateMediaPlan(result.scenePlan, result.mediaPlan);
  assert.deepEqual(planMedia(result.scenePlan, 'firefly-hybrid'), result);
});

test('explicit video survives hybrid; explicitly local footage keeps its true provider', () => {
  const result = planMedia(timeline([
    beat('authored', { visualMode: 'firefly_video', narrativeRole: 'TECHNICAL_ANATOMY' }),
    beat('local', { visualMode: 'firefly_video', mediaProvider: 'local-ffmpeg' }),
  ]), 'firefly-hybrid');
  assert.deepEqual(result.mediaPlan.fireflyBeatIds, ['authored']);
  assert.deepEqual(result.mediaPlan.localMotionBeatIds, ['local']);
  assert.ok(result.scenePlan.beats.every(b => b.visualMode === 'firefly_video'));
  validateMediaPlan(result.scenePlan, result.mediaPlan);
  assert.deepEqual(planMedia(result.scenePlan, 'firefly-hybrid'), result);
  assert.throws(() => planMedia(timeline([beat('broken', { visualMode: 'firefly_video', cinematicPrompt: '' })]), 'firefly-hybrid'), /VIDEO_MALFORMED/);
});

test('provider projection is idempotent for every policy after persistence and normalization', () => {
  const source = timeline([
    beat('authored', { visualMode: 'firefly_video', narrativeRole: 'TECHNICAL_ANATOMY' }),
    beat('physical'),
    beat('local', { visualMode: 'firefly_video', mediaProvider: 'local-ffmpeg' }),
    beat('diagram', { infographicArchetype: 'CUTAWAY' }),
  ]);
  for (const policy of ['stills', 'local-motion', 'firefly-hybrid'] as const) {
    const first = planMedia(source, policy);
    const restored = JSON.parse(JSON.stringify(first.scenePlan)) as HslLongFormProjectPlan;
    const normalized = normalizePlanDuration(restored, restored.targetMinutes);
    assert.deepEqual(planMedia(normalized, policy), first);
    validateMediaPlan(restored, JSON.parse(JSON.stringify(first.mediaPlan)));
    assert.equal(first.mediaPlan.totalFrames, source.totalFrames);
  }
});

test('hybrid guide excludes local motion and changes recipe/authorization scope when image bytes change at the same path', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-media-guide-test-'));
  const c = { root, deps: new Proxy({}, { get: () => { throw new Error('External dependency called by planning'); } }) } as Context;
  const source = timeline([
    beat('firefly'), beat('local', { visualMode: 'firefly_video', mediaProvider: 'local-ffmpeg' }),
    beat('diagram', { infographicArchetype: 'CUTAWAY' }),
  ]);
  const planned = planMedia(source, 'firefly-hybrid');
  const imagePath = path.join(root, 'approved-frame.png');
  fs.writeFileSync(imagePath, 'guide image fixture A');
  const s = { ...state(planned.scenePlan), ...planned,
    // join_frames supplies every scene before guide planning, including local media.
    frames: planned.scenePlan.beats.map(b => ({ beatId: b.beatId, path: imagePath, status: 'ok' as const, attempts: 1 })),
    visualPrompts: planned.scenePlan.beats.map(b => ({ beatId: b.beatId, imagePrompt: b.cinematicPrompt,
      videoPrompt: 'Observe the coolant circulating through the transparent manifold.', cameraMotion: b.cameraMovement,
      durationSeconds: b.durationSeconds, firstFrameFrom: 'image' as const })),
  } as State;
  assert.deepEqual(assertMediaPlan(s).localMotionBeatIds, ['local']);
  assert.deepEqual(assertMediaPlan(s).fireflyBeatIds, ['firefly']);
  const guide = fireflyGuide(c);
  const first = await guide(s, {}) as Partial<State>;
  assert.equal(first.klingBudget?.totalTakes, planned.mediaPlan.totalTakes);
  assert.equal(first.klingBudget?.totalTakes, 2);
  assert.equal(first.klingBudget?.requiredGenerations, 2);
  assert.equal(first.videoTakes?.length, 2);
  assert.ok(first.videoTakes?.every(t => t.beatId === 'firefly'));
  assert.equal(first.videoTakes![1].firstFramePath, first.videoTakes![0].outputPath + '.last-frame.png');
  const repeated = await guide(s, {}) as Partial<State>;
  assert.deepEqual(repeated.klingBudget, first.klingBudget);
  assert.deepEqual(repeated.videoTakes, first.videoTakes);
  const originalSize = fs.statSync(imagePath).size;
  fs.writeFileSync(imagePath, 'guide image fixture B');
  assert.equal(fs.statSync(imagePath).size, originalSize);
  const changed = await guide(s, {}) as Partial<State>;
  assert.notEqual(changed.klingBudget?.scopeHash, first.klingBudget?.scopeHash);
  assert.equal(changed.klingBudget?.planHash, first.klingBudget?.planHash);
  assert.equal(changed.klingBudget?.requiredGenerations, 2);
  for (let i = 0; i < 2; i++) {
    assert.notEqual(changed.videoTakes![i].recipeHash, first.videoTakes![i].recipeHash);
    assert.notEqual(changed.videoTakes![i].operationId, first.videoTakes![i].operationId);
  }
  assert.deepEqual(planMedia(s.scenePlan!, 'firefly-hybrid'), planned);
});

test('stills and local policies never require external takes; empty hybrid fails', () => {
  const source = timeline([beat('flow'), beat('diagram', { infographicArchetype: 'CUTAWAY' })]);
  for (const policy of ['stills', 'local-motion'] as const) {
    const result = planMedia(source, policy);
    assert.equal(result.mediaPlan.totalTakes, 0);
    assert.deepEqual(result.mediaPlan.fireflyBeatIds, []);
    assert.equal(result.scenePlan.beats[0].mediaProvider, policy === 'stills' ? 'none' : 'local-ffmpeg');
    assert.equal(result.scenePlan.beats[0].visualMode, policy === 'stills' ? 'generated_image_35mm' : 'firefly_video');
    validateMediaPlan(result.scenePlan, result.mediaPlan);
  }
  const noCandidates = timeline([beat('diagram', { infographicArchetype: 'CUTAWAY' })]);
  assert.throws(() => planMedia(noCandidates, 'firefly-hybrid'), /MEDIA_PLAN_REQUIRED_PROVIDER_EMPTY/);
  assert.equal(planMedia(noCandidates, 'local-motion').mediaPlan.totalTakes, 0);
});

test('invalid IDs, inconsistent durations, and malformed motion metadata fail before planning', () => {
  assert.throws(() => planMedia(timeline([beat('same'), beat('same')]), 'stills'), /BEAT_ID_INVALID/);
  assert.throws(() => planMedia(timeline([beat('')]), 'stills'), /BEAT_ID_INVALID/);
  assert.throws(() => planMedia(timeline([beat('bad', { sourceBeatId: '' })]), 'stills'), /SOURCE_ID_INVALID/);
  assert.throws(() => planMedia(timeline([beat('bad', { durationSeconds: 5 })]), 'stills'), /DURATION_INVALID/);
  assert.throws(() => planMedia({ ...timeline([beat('one')]), totalFrames: 18000 }, 'stills'), /TIMELINE_MISMATCH/);
  assert.throws(() => planMedia(timeline([beat('bad', { motionIntent: 'physical' })]), 'firefly-hybrid'), /MOTION_METADATA_INVALID/);
});

test('validation rejects missing/duplicate/foreign IDs, changed durations, policy, hashes, counts and providers', () => {
  const result = planMedia(timeline([beat('one'), beat('two')]), 'firefly-hybrid');
  const check = (mediaPlan: MediaPlan) => validateMediaPlan(result.scenePlan, mediaPlan);
  assert.throws(() => check({ ...result.mediaPlan, schema: 'bad' as never }), /SCHEMA_INVALID/);
  assert.throws(() => check({ ...result.mediaPlan, beats: result.mediaPlan.beats.slice(1) }), /BEAT_SET_MISMATCH/);
  for (const beatId of ['one', 'foreign']) assert.throws(() => check({ ...result.mediaPlan, beats: [result.mediaPlan.beats[0], { ...result.mediaPlan.beats[1], beatId }] }), /BEAT_SET_MISMATCH/);
  assert.throws(() => check({ ...result.mediaPlan, beats: [{ ...result.mediaPlan.beats[0], durationFrames: 150 }, result.mediaPlan.beats[1]] }), /DURATION_MISMATCH/);
  for (const change of [{ hash: '0'.repeat(64) }, { totalTakes: 0 }, { fireflyBeatIds: ['one'] }, { policy: 'local-motion' as const }, { scenePlanHash: 'stale' }]) {
    assert.throws(() => check({ ...result.mediaPlan, ...change }), /MEDIA_PLAN_/);
  }
  assert.throws(() => validateMediaPlan({ ...result.scenePlan, beats: result.scenePlan.beats.map(b => ({ ...b, mediaProvider: 'local-ffmpeg' })) }, result.mediaPlan), /MEDIA_PLAN_/);
  const changedPrompt = { ...result.scenePlan, beats: result.scenePlan.beats.map(b => ({ ...b, cinematicPrompt: b.cinematicPrompt + ' Different hardware.' })) };
  assert.throws(() => validateMediaPlan(changedPrompt, result.mediaPlan), /CONTRACT_MISMATCH/);
  assert.notEqual(planMedia(changedPrompt, 'firefly-hybrid').mediaPlan.hash, result.mediaPlan.hash);
  const s = { ...state(result.scenePlan), ...result };
  assert.equal(assertMediaPlan(s), result.mediaPlan);
  assert.throws(() => assertMediaPlan({ ...s, mediaPlan: null }), /MEDIA_PLAN_MISSING/);
  assert.throws(() => assertMediaPlan({ ...s, options: { ...s.options, graph: { ...s.options.graph, mediaPolicy: 'stills' } } }), /POLICY_MISMATCH/);
});

test('prepare persists full projection and canary/test plans separately without external dependencies', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-media-plan-'));
  const c = { root, deps: new Proxy({}, { get: () => { throw new Error('No external generation is allowed'); } }) } as Context;
  const source = timeline([beat('one'), beat('two')]);
  const run = path.join(root, 'runs', source.episodeId);
  const canonicalPath = path.join(run, 'scene-plan.json');
  fs.mkdirSync(run, { recursive: true });
  fs.writeFileSync(canonicalPath, JSON.stringify(source));
  const original = fs.readFileSync(canonicalPath, 'utf8');
  const prepare = mediaPlanPrepare(c);
  const canary = await prepare({ ...state(timeline(source.beats.slice(0, 1)), { beats: 1 }), scenePlanPath: canonicalPath }, {});
  assert.equal(fs.readFileSync(canonicalPath, 'utf8'), original);
  assert.equal(canary.scenePlanPath, path.join(run, 'media-scene-plan.json'));
  assert.equal((canary.mediaPlan as MediaPlan).totalBeats, 1);
  const testRun = await prepare({ ...state(source, { testRender: true }), scenePlanPath: canonicalPath }, {});
  assert.equal(fs.readFileSync(canonicalPath, 'utf8'), original);
  assert.equal(testRun.scenePlanPath, canary.scenePlanPath);
  const full = await prepare({ ...state(source), scenePlanPath: canonicalPath }, {});
  assert.equal(full.scenePlanPath, canonicalPath);
  assert.deepEqual(JSON.parse(fs.readFileSync(canonicalPath, 'utf8')), full.scenePlan);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(run, 'media-plan.json'), 'utf8')), full.mediaPlan);
  assert.deepEqual(await mediaPlanValidate(c)({ ...state(source), ...full } as State, {}), {});
  assert.match(fs.readFileSync(path.join(run, 'graph', 'node-events.jsonl'), 'utf8'), /firefly-kling/);
});

// The run is intentionally not rewritten. CI without local run artifacts still
// exercises the canonical cooling storyboard above; this is the actual EP003 dry-run.
const ep003Path = path.resolve(__dirname, '../../../runs/HSL_EPISODE_003/scene-plan.json');
test('actual cached EP003: exact provider set, 28 takes and 10,800 frames', { skip: !fs.existsSync(ep003Path) }, () => {
  const before = fs.readFileSync(ep003Path, 'utf8');
  const cached = JSON.parse(before) as HslLongFormProjectPlan;
  const result = planMedia(normalizePlanDuration(cached, 6), 'firefly-hybrid');
  const expectedIds = [1, 2, 4, 7, 10, 12, 15, 20, 25, 31, 32, 39, 52, 53].map(n => `SCENE_${String(n).padStart(3, '0')}`);
  assert.deepEqual(result.mediaPlan.fireflyBeatIds, expectedIds);
  assert.equal(result.scenePlan.beats.length, 58);
  assert.equal(result.scenePlan.totalFrames, 10800);
  assert.equal(result.scenePlan.beats.reduce((sum, b) => sum + b.durationFrames, 0), 10800);
  assert.equal(result.mediaPlan.totalTakes, 28);
  assert.equal(result.mediaPlan.fireflyFrames, 3500);
  assert.ok(result.mediaPlan.beats.filter(b => b.provider === 'firefly-kling').every(b => b.reason && b.takeCount === 2));
  assert.ok(result.scenePlan.beats.filter(b => b.infographicArchetype).every(b => b.mediaProvider === 'none'));
  validateMediaPlan(result.scenePlan, result.mediaPlan);
  assert.equal(fs.readFileSync(ep003Path, 'utf8'), before);
  console.log('EP003 dry-run ' + JSON.stringify({ totalFrames: result.mediaPlan.totalFrames, totalTakes: result.mediaPlan.totalTakes,
    fireflyFrames: result.mediaPlan.fireflyFrames, beats: result.mediaPlan.beats.filter(b => b.provider === 'firefly-kling') }));
});
