import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { requireSuccess, spawnTool } from '../../lib/proc';
import { fitSceneVideo } from '../lib/firefly/media';
import { createTakeReviewer, type FireflyReviewRunner, type SemanticVerdict } from '../lib/firefly/qa';
import {hashFile} from '../lib/firefly/ledger';
import {repairReceiptPath,resolveFireflyArtifact} from '../lib/firefly/repair';
import {qaPromptForTake} from '../lib/firefly/guide';

// Every semantic transport is injected. This suite must never invoke Codex or a network service.
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'firefly-media-'));
const file = (name: string) => path.join(root, name);
const accepted: SemanticVerdict = { passed: true, promptMatch: true, continuity: true, hasArtifacts: false, issues: [] };
let semanticCalls = 0;
const ide: FireflyReviewRunner = async (task, context) => {
  semanticCalls++;
  assert.equal(context.repoRoot, root);
  assert.equal(task.provider, 'codex');
  assert.equal(task.ioMode, 'stdout');
  assert.equal(task.readOnly, true);
  assert.equal(task.maxAttempts, 1);
  assert.equal(task.timeoutMs, 60_000);
  assert.equal(task.imageFiles?.length, 7);
  assert.match(fs.readFileSync(task.promptTemplate, 'utf8'), /approved starting-frame reference/);
  assert.match(fs.readFileSync(task.promptTemplate, 'utf8'), /Camera direction, framing drift, motion amplitude/);
  assert.ok(task.imageFiles?.every(image => fs.statSync(image).size > 0));
  return { headlessResult: { provider: 'codex', ok: true, output: accepted, outputPath: '', durationMs: 0 } };
};
async function ffmpeg(args: string[]) {
  return requireSuccess(await spawnTool('ffmpeg', ['-y', '-nostdin', '-hide_banner', '-loglevel', 'error', ...args],
    { cwd: root, timeoutMs: 60_000 }), 'TEST_FFMPEG');
}
async function clip(name: string, source: string, filter?: string) {
  await ffmpeg(['-f', 'lavfi', '-i', source, ...(filter ? ['-vf', filter] : []),
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-pix_fmt', 'yuv420p', file(name)]);
}
async function main() {
  await clip('moving.mp4', 'testsrc2=size=320x180:rate=30:duration=2');
  await clip('static.mp4', 'testsrc2=size=320x180:rate=30:duration=2', "select='eq(n,0)',loop=loop=59:size=1:start=0,setpts=N/(30*TB)");
  await clip('black.mp4', 'color=c=black:size=320x180:rate=30:duration=2');
  await clip('noise.mp4', 'color=c=gray:size=320x180:rate=30:duration=2', 'noise=alls=3:allf=t');
  await clip('flash.mp4', 'nullsrc=size=320x180:rate=30:duration=2', "geq=lum='80+40*sin(N)':cb=128:cr=128");
  await clip('frozen-tail.mp4', 'testsrc2=size=320x180:rate=30:duration=0.5', 'tpad=stop_mode=clone:stop_duration=2');
  await clip('black-tail.mp4', 'testsrc2=size=320x180:rate=30:duration=1.5', 'tpad=stop_mode=add:stop_duration=0.5:color=black');
  await ffmpeg(['-i', file('moving.mp4'), '-frames:v', '1', file('reference.png')]);

  const review = createTakeReviewer({ ide });
  const good = await review(root, 'moving.mp4', 'reference.png', 'Moving test pattern with consistent geometry.');
  assert.equal(good.passed, true, JSON.stringify(good));
  assert.equal(good.deterministicPassed, true);
  assert.equal(good.semantic.status, 'passed');
  assert.ok(good.metrics!.movingFraction > 0.05);
  assert.equal(good.metrics!.blackFrames, 0);
  assert.equal(JSON.parse(fs.readFileSync(good.evidencePath, 'utf8')).passed, true);
  assert.ok(!fs.existsSync(path.join(path.dirname(good.evidencePath), 'temporal.gray')));
  console.log('PASS moving decoded video + structured semantic review');

  for (const [name, code] of [
    ['static.mp4', 'STATIONARY_VIDEO'], ['black.mp4', 'BLACK_VIDEO'],
    ['noise.mp4', 'STATIONARY_VIDEO'], ['flash.mp4', 'STATIONARY_VIDEO'],
    ['frozen-tail.mp4', 'FROZEN_SEGMENT'], ['black-tail.mp4', 'BLACK_VIDEO'],
  ]) {
    const before = semanticCalls;
    const rejected = await review(root, name, 'reference.png', 'Moving scene.');
    assert.equal(rejected.passed, false, name);
    assert.equal(rejected.deterministicPassed, false, name);
    assert.ok(rejected.issues.some(issue => issue.includes(code)), JSON.stringify(rejected));
    assert.equal(semanticCalls, before, 'deterministic rejection must not spend an IDE call');
    assert.equal(rejected.semantic.status, 'not_run');
  }
  console.log('PASS static, black, noise, exposure flicker, frozen segment and black tail rejected');

  const responses: { output?: unknown; reason?: string; ok: boolean; skipped?: boolean; exitCode?: number }[] = [
    { ok: false, reason: 'Codex unavailable (offline fixture)' },
    { ok: false, reason: 'Timeout do Codex.' },
    { ok: true, output: { passed: true } },
    { ok: true, output: accepted, skipped: true, reason: 'transport skipped' },
    { ok: true, output: accepted, exitCode: 1 },
  ];
  for (const response of responses) {
    const unavailable = createTakeReviewer({ ide: async () => ({ headlessResult: {
      provider: 'codex', outputPath: '', durationMs: 0, ...response,
    } }) });
    const result = await unavailable(root, 'moving.mp4', 'reference.png', 'Moving scene.');
    assert.equal(result.passed, false);
    assert.equal(result.deterministicPassed, true);
    assert.equal(result.semantic.status, 'unavailable');
    assert.match(result.blockers.join('; '), /SEMANTIC_UNAVAILABLE/);
  }
  const throwing = createTakeReviewer({ ide: async () => { throw new Error('transport failed'); } });
  assert.equal((await throwing(root, 'moving.mp4', 'reference.png', 'Moving scene.')).semantic.status, 'unavailable');
  const denied = createTakeReviewer({ ide: async () => ({ headlessResult: {
    provider: 'codex', ok: true, outputPath: '', durationMs: 0,
    output: { ...accepted, passed: true, continuity: false, issues: ['Subject identity drift'] },
  } }) });
  const denial = await denied(root, 'moving.mp4', 'reference.png', 'Moving scene.');
  assert.equal(denial.passed, false, 'inconsistent passed=true must not override negative fields');
  assert.equal(denial.semantic.status, 'failed');
  assert.match(denial.issues.join('; '), /Subject identity drift/);
  console.log('PASS unavailable, timeout, malformed, failed transport and semantic rejection fail closed');

  const before = semanticCalls;
  fs.writeFileSync(file('broken.mp4'), 'not a video');
  const broken = await review(root, 'broken.mp4', 'reference.png', 'Moving scene.');
  assert.equal(broken.passed, false);
  assert.ok(broken.blockers.length);
  const missing = await review(root, 'moving.mp4', 'missing.png', 'Moving scene.');
  assert.equal(missing.passed, false);
  assert.ok(missing.blockers.length);
  const noPrompt = await review(root, 'moving.mp4', 'reference.png', ' ');
  assert.equal(noPrompt.passed, false);
  assert.match(noPrompt.issues.join('; '), /PROMPT_MISSING/);
  assert.equal(semanticCalls, before);
  console.log('PASS corrupt input, missing reference and empty prompt block');

  await fitSceneVideo(file('moving.mp4'), file('fitted.mp4'), 37);
  const probe = requireSuccess(await spawnTool('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', file('fitted.mp4')],
    { cwd: root, timeoutMs: 30_000 }), 'TEST_PROBE');
  const stream = JSON.parse(probe.stdout).streams[0];
  assert.equal(stream.codec_name, 'h264');
  assert.equal(stream.width, 1920);
  assert.equal(stream.height, 1080);
  assert.equal(stream.pix_fmt, 'yuv420p');
  assert.equal(stream.avg_frame_rate, '30/1');
  assert.equal(Number(stream.nb_read_frames), 37);
  assert.ok(Math.abs(Number(stream.duration) - 37 / 30) < 1e-5);
  // The whole source duration must also fit without losing the final frame.
  await fitSceneVideo(file('moving.mp4'), file('full.mp4'), 60);
  const originalOutput = fs.readFileSync(file('fitted.mp4'));
  await assert.rejects(fitSceneVideo(file('moving.mp4'), file('fitted.mp4'), 63), /SCENE_TOO_SHORT/);
  assert.deepEqual(fs.readFileSync(file('fitted.mp4')), originalOutput, 'failed fit preserves existing output');
  await assert.rejects(fitSceneVideo(file('moving.mp4'), file('one-short.mp4'), 61), /SCENE_TOO_SHORT/);
  assert.ok(!fs.existsSync(file('one-short.mp4')), 'no implicit hold even within one-frame tolerance');
  for (const frames of [0, -1, 1.5, NaN, Infinity]) {
    await assert.rejects(fitSceneVideo(file('moving.mp4'), file('invalid.mp4'), frames), /INVALID_FRAMES/);
  }
  await assert.rejects(fitSceneVideo(file('moving.mp4'), file('moving.mp4'), 30), /INPUT_OUTPUT_SAME/);
  assert.ok(!fs.readdirSync(root).some(name => name.startsWith('.firefly-fit-')));
  console.log('PASS exact 1080p/30 H264 frame count, too-short rejection, output preservation and validation');

  await clip('portrait24.mp4', 'testsrc2=size=180x320:rate=24:duration=1');
  await fitSceneVideo(file('portrait24.mp4'), file('portrait-fitted.mp4'), 30);
  // A long audio track cannot disguise video that is too short for the scene.
  await ffmpeg(['-i', file('moving.mp4'), '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4',
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', file('long-audio.mp4')]);
  await assert.rejects(fitSceneVideo(file('long-audio.mp4'), file('long-audio-fit.mp4'), 90), /SCENE_TOO_SHORT/);
  console.log('PASS portrait 24fps normalization and video-stream duration coverage');

  const runtime=file('repair-runtime'),repairDir=path.join(runtime,'repair'),qaDir=path.join(repairDir,'qa','accepted');
  fs.mkdirSync(qaDir,{recursive:true});
  const source=file('moving.mp4'),repaired=path.join(repairDir,'take.mp4'),evidence=path.join(qaDir,'review.json');
  fs.copyFileSync(file('full.mp4'),repaired);
  fs.writeFileSync(evidence,JSON.stringify({passed:true,semantic:{status:'passed'},videoPath:repaired}));
  fs.writeFileSync(repairReceiptPath(runtime),JSON.stringify({schema:'hsl.firefly-qa-repair.v1',operationId:'op-1',
    sourcePath:source,sourceHash:hashFile(source),outputPath:repaired,outputHash:hashFile(repaired),
    transform:{kind:'trim-retime',cleanEndSeconds:1,targetSeconds:2,fps:30,codec:'h264'},
    qaEvidencePath:evidence,qaEvidenceHash:hashFile(evidence),createdAt:new Date().toISOString()}));
  assert.equal(resolveFireflyArtifact(runtime,'op-1',source,hashFile(source)).path,repaired);
  fs.appendFileSync(repaired,'tamper');
  assert.throws(()=>resolveFireflyArtifact(runtime,'op-1',source,hashFile(source)),/FIREFLY_REPAIR_OUTPUT_CHANGED/);
  console.log('PASS QA repair requires bound source, transform, output and accepted evidence hashes');
  const chained=qaPromptForTake({videoPrompt:'Close the door.',beatId:'B',durationSeconds:10,imagePrompt:''} as any,{dependsOnTake:'B-take-1'});
  assert.match(chained,/do not repeat or reverse a completed action/);
  assert.equal(qaPromptForTake({videoPrompt:'Close the door.'} as any,{}),'Close the door.');
  console.log('PASS chained-take QA preserves predecessor terminal state');
}

main().then(() => {
  // Only the exact directory created by mkdtemp above is removed.
  fs.rmSync(root, { recursive: true, force: true });
  console.log('Firefly media tests passed (offline).');
}).catch(error => {
  console.error(error);
  console.error(`Test evidence retained at ${root}`);
  process.exitCode = 1;
});
