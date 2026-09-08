import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {StateGraph, START, END, MemorySaver} from '@langchain/langgraph';
import {ProductionState, initialState} from '../production/state';
import {sfxRender} from '../production/nodes/sfx_render';
import {realDependencies} from '../production/deps';
import {HslSceneDirectorAgent} from '../../hsl/core/hslSceneDirectorAgent';
import {runSoundWorker, soundTools} from './worker';
import {digest} from './import';
import {selectAudio} from '../production/storage/selectors';

async function main() {
  const repo = process.cwd(), root = path.join(repo, 'runs/.audio-tests', String(Date.now()));
  const bank = path.join(root, 'assets/audio-library');
  fs.mkdirSync(bank, {recursive: true});
  const index = JSON.parse(fs.readFileSync(path.join(repo, 'assets/audio-library/library-index.json'), 'utf8'));
  for (const item of index.items.filter((i: any) => ['sfx', 'source', 'portable-example-plan'].includes(i.role))) {
    const from = path.join(repo, item.path), to = path.join(root, item.path);
    fs.mkdirSync(path.dirname(to), {recursive: true}); fs.copyFileSync(from, to);
  }
  fs.writeFileSync(path.join(bank, 'library-index.json'), JSON.stringify(index));
  const initial = initialState({episodeId: 'SFX_INTEGRATION', graph: {mediaMode: 'real'}});
  const basePlan = HslSceneDirectorAgent.planEpisodeFromScratch(initial.topicInput!);
  const beats = basePlan.beats.slice(0, 2).map((beat, i) => ({...beat, actNumber: i + 1, durationSeconds: 5,
    durationFrames: 150, narrativeRole: 'CORE_THESIS' as const, voiceoverScript: '', promptSubject: 'pipe flow'}));
  const scenePlan = {...basePlan, beats, totalDurationSeconds: 10, totalFrames: 300, totalBeatsCount: 2};
  const audioPlanPath = path.join(root, 'audio-plan.json');
  fs.writeFileSync(audioPlanPath, JSON.stringify({fps: 30, scenes: [
    {sceneId: beats[0].beatId.toLowerCase(), layers: [{layerId: 'a', type: 'foley', category: 'flow', startFrame: 30, volumeDb: -10}]},
    {sceneId: beats[1].beatId.toLowerCase(), layers: [{layerId: 'b', type: 'impact', category: 'alert', startFrame: 210, volumeDb: -14},
      {layerId: 'c', type: 'ambience', category: 'industrial', startFrame: 150, volumeDb: -18}]}]}));
  const graph = new StateGraph(ProductionState).addNode('sfx_render', sfxRender({root, deps: realDependencies(root)}))
    .addEdge(START, 'sfx_render').addEdge('sfx_render', END).compile({checkpointer: new MemorySaver()});
  const config = {configurable: {thread_id: 'audio-integration'}};
  const state = await graph.invoke({...initial, scenePlan, soundDesign: {audioPlanPath, audioTsxPath: ''}}, config);
  assert.equal(state.sfxResolved.length, 3); assert.equal(state.sfxUnresolved.length, 1);
  assert.deepEqual(state.sfxResolved.map(i => i.offsetSeconds), [1, 5.04, 7]);
  const qa = JSON.parse(fs.readFileSync(state.sfxQaPath!, 'utf8'));
  assert.equal(qa.status, 'SFX_QA_PASS'); assert.equal(qa.duration_seconds, 10);
  console.log('PASS graph real: local library, scene projection, absolute cue times, stereo48k QA');
  const before = fs.statSync(state.sfxTrackPath!).mtimeMs;
  const resumed = await graph.invoke({}, config);
  assert.equal(fs.statSync(state.sfxTrackPath!).mtimeMs, before);
  assert.equal(resumed.sfxResolved.length, 3);
  console.log('PASS idempotence: verified cache preserves WAV and restores resolved cues');
  const validHash = await digest(state.sfxTrackPath!);
  fs.appendFileSync(state.sfxTrackPath!, 'corrupt');
  await graph.invoke({}, config);
  assert.equal(await digest(state.sfxTrackPath!), validHash);
  console.log('PASS corrupt output is regenerated, not silently cached');
  const asset = path.join(root, index.items.find((i: any) => i.role === 'sfx').path);
  const content = fs.readFileSync(asset); fs.appendFileSync(asset, 'corrupt');
  await assert.rejects(() => graph.invoke({}, config), /SFX_LIBRARY_HASH_MISMATCH/);
  fs.writeFileSync(asset, content);
  console.log('PASS corrupt library blocks graph before mux');
  const plan = JSON.parse(fs.readFileSync(state.sfxPlanPath!, 'utf8'));
  plan.cues = Array.from({length: 4}, (_, i) => ({...plan.cues[0], cue_id: `TEST_${i}`, time_seconds: 1 + i * .1}));
  const dense = path.join(root, 'dense.json'); fs.writeFileSync(dense, JSON.stringify(plan));
  await assert.rejects(() => runSoundWorker({root, out: path.join(root, 'dense.wav'), planPath: dense}), /SFX_DENSITY_EXCEEDED/);
  console.log('PASS density guard');
  assert.ok(selectAudio(root, state).some(i => i.path === state.sfxPlanPath && i.tier === 'save'));
  assert.ok(selectAudio(root, state).some(i => i.path === state.sfxQaPath && i.tier === 'save'));
  console.log('PASS archive includes SFX plan and QA as non-prunable saves');
  const example = await runSoundWorker({root, out: path.join(root, 'milk-replay/soundfx-bed.wav'),
    planPath: path.join(bank, 'examples/leite/soundfx-plan.local.json')});
  assert.equal(example.qa.cue_count, 18); assert.equal(example.qa.duration_seconds, 360);
  const original = path.join(repo, 'assets/audio-library/examples/leite/postproduction/soundfx/soundfx-bed.wav');
  const replay = path.join(root, 'milk-replay/soundfx-bed.wav');
  // Container metadata can differ between FFmpeg versions; compare decoded PCM.
  const pcm = (file: string, dest: string) => soundTools(root, path.dirname(dest)).ffmpeg(
    ['-y', '-v', 'error', '-i', file, '-f', 's16le', '-c:a', 'pcm_s16le', dest], 'PCM');
  const a = path.join(root, 'original.pcm'), b = path.join(root, 'replay.pcm');
  pcm(original, a); pcm(replay, b);
  assert.equal(await digest(a), await digest(b));
  console.log('PASS milk replay: 18 cues / 360 s / decoded PCM identical to original');
  fs.writeFileSync(path.join(repo, 'docs/graph/AUDIO-VALIDATION.json'), JSON.stringify({root,
    qa, milk: example.qa, milkPcmSha256: await digest(a), tests: 7, status: 'PASS'}, null, 2));
}
main().catch(e => {console.error(e); process.exitCode = 1;});
