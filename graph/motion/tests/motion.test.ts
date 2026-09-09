import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { executeMotionScene } from '../graph';
import { MotionDependencies, MotionSceneInput, SourcePackage } from '../contracts';
import { fileHash, validateSource } from '../runtime/source';

const root = path.resolve(__dirname, '../../..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-motion-tests-'));
const audio = path.join(temporary, 'locked.wav'); const alignment = path.join(temporary, 'alignment.json');
fs.writeFileSync(audio, 'test fixture: no real render or model is claimed'); fs.writeFileSync(alignment, '{}');
const source: SourcePackage = { entrypoint: 'Scene.tsx', files: [{ path: 'Scene.tsx', content: `import React from 'react'; import {AbsoluteFill, useCurrentFrame} from 'remotion'; export default function Scene(){ const frame = useCurrentFrame(); return <AbsoluteFill style={{background:'#102030'}}><svg><circle cx={frame + 20} cy={50} r={10}/></svg></AbsoluteFill>; }` }] };
function input(label: string): MotionSceneInput {
  return { repoRoot: root, outputDir: path.join(temporary, label), episodeId: 'test-episode', beatId: label, script: 'The valve closes and reduces the flow of water.', visualObjective: 'Explain restriction reducing flow', causalRelations: ['The valve narrows and fewer particles cross'], factualConstraints: ['Qualitative illustration; no measured quantities'], claimRefs: [], identity: { background: '#102030' }, timing: { fps: 30, width: 1920, height: 1080, durationInFrames: 90, startFrame: 0 }, audio: { path: audio, sha256: fileHash(audio) }, alignment: { path: alignment, sha256: fileHash(alignment), cues: [{ text: 'The valve closes', startFrame: 0, endFrame: 40, confidence: 0.95 }] }, maxRevisions: 2 };
}
function fixture(options: { failRenders?: number; rejectVisual?: boolean } = {}) {
  const calls: string[] = []; let failures = options.failRenders ?? 0; let rejected = false;
  const deps: MotionDependencies = {
    preflight: async () => {},
    agent: async request => {
      calls.push(request.role);
      let output: unknown;
      switch (request.role) {
        case 'director': output = { visualObjective: 'Restriction', causalExplanation: 'Narrow opening reduces crossing', factualGuardrails: ['Qualitative'], scriptQuotes: ['The valve closes'] }; break;
        case 'code_analyst': output = { compatibility: 'React Remotion', codeReferences: ['remotion/motion-runtime/sdk.tsx'], implementationConstraints: ['Frame driven'] }; break;
        case 'designer': output = { technique: '2d', geometry: 'Valve disk and conduit', camera: 'Fixed', lighting: 'Flat', initialState: 'Open', finalState: 'Closed', observableTransformation: 'Fewer particles', exactTexts: [], cues: [{ frame: 30, scriptQuote: 'The valve closes', action: 'Narrow valve' }] }; break;
        case 'author': output = source; break;
        default:
          if (request.role === 'visual_reviewer') assert.ok(request.images.length >= 5, 'Reviewer receives ordered rendered samples');
          if (request.role === 'visual_reviewer' && options.rejectVisual && !rejected) { rejected = true; output = { approved: false, reasoning: 'Flow should decrease', issues: [{ frame: 30, scriptQuote: 'The valve closes', message: 'Reduce particle crossing after closure', kind: 'implementation' }] }; }
          else output = { approved: true, reasoning: 'Fixture approval for orchestration test only', issues: [] };
      }
      return { output, provider: 'test-double', model: 'fixture' };
    },
    render: async request => {
      calls.push(request.phase);
      if (failures-- > 0) throw new Error('Fixture TypeScript diagnostic: missing property');
      const output = path.join(request.directory, request.phase); fs.mkdirSync(output, { recursive: true });
      const videoPath = path.join(output, 'fixture.mp4'); fs.writeFileSync(videoPath, `not-a-real-video-${request.phase}`);
      const frames = request.frames.map(frame => { const file = path.join(output, `${frame}.png`); fs.writeFileSync(file, `fixture-${frame}`); return { frame, path: file }; });
      const t = request.input.timing; const scale = request.phase === 'preview' ? 0.5 : 1;
      return { videoPath, frames, durationInFrames: t.durationInFrames, fps: t.fps, width: t.width * scale, height: t.height * scale, renderer: 'test-double', isolation: 'none-test-double' };
    },
  };
  return { deps, calls };
}
async function main() {
  validateSource(source);
  for (const content of ["import fs from 'node:fs'; export default () => null", "export default () => fetch('https://x.test')", "export default () => Math.random()", "export default () => ({}).constructor", "export default () => ['constructor'][0]", "import '../../secret'; export default () => null", "export default () => import('three')"]) {
    assert.throws(() => validateSource({ entrypoint: 'Scene.tsx', files: [{ path: 'Scene.tsx', content }] }));
  }
  assert.throws(() => validateSource({ entrypoint: '../escape.tsx', files: [{ path: '../escape.tsx', content: '' }] }));
  const basic = fixture(); const basicInput = input('approved');
  const approved = await executeMotionScene(basicInput, basic.deps); assert.equal(approved.status, 'approved');
  assert.equal(basic.calls.filter(c => c === 'author').length, 1);
  assert.equal(basic.calls.filter(c => c === 'visual_reviewer').length, 2, 'Preview and final independently reviewed');
  const previous = basic.calls.length; assert.equal((await executeMotionScene(basicInput, basic.deps)).status, 'approved'); assert.equal(basic.calls.length, previous, 'Resume does not repeat accepted work');
  if (approved.status !== 'approved') throw new Error('Unreachable');
  fs.appendFileSync(approved.artifact.videoPath, 'tampered');
  assert.equal((await executeMotionScene(basicInput, basic.deps)).status, 'review_required', 'Altered output fails closed');
  const compileRetry = fixture({ failRenders: 1 }); assert.equal((await executeMotionScene(input('compile-retry'), compileRetry.deps)).status, 'approved'); assert.equal(compileRetry.calls.filter(c => c === 'author').length, 2);
  const visualRetry = fixture({ rejectVisual: true }); assert.equal((await executeMotionScene(input('visual-retry'), visualRetry.deps)).status, 'approved'); assert.equal(visualRetry.calls.filter(c => c === 'author').length, 2);
  const bounded = fixture({ failRenders: 99 }); const failed = await executeMotionScene(input('bounded'), bounded.deps); assert.equal(failed.status, 'review_required'); assert.equal(bounded.calls.filter(c => c === 'author').length, 3);
  const changedAudio = input('invalid-audio'); changedAudio.audio.sha256 = 'a'.repeat(64); const blocked = fixture(); assert.equal((await executeMotionScene(changedAudio, blocked.deps)).status, 'review_required'); assert.equal(blocked.calls.length, 0);
  const unavailable = await executeMotionScene(input('runtime-unavailable'), { ...fixture().deps, preflight: async () => { const { MotionFailure } = await import('../contracts'); throw new MotionFailure('runtime_unavailable', 'test: worker absent'); } }); assert.equal(unavailable.status, 'runtime_unavailable');
  console.log('motion.test: AST policy, authored subgraph, retries, preview/final review, resume, tamper and locked-audio checks passed (mock model/renderer).');
}
main().finally(() => {
  assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(temporary).startsWith('hsl-motion-tests-'));
  fs.rmSync(temporary, { recursive: true, force: true });
}).catch(error => { console.error(error); process.exitCode = 1; });
