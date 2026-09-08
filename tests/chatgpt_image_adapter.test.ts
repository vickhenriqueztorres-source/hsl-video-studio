import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ChatGptStartFrameRuntime, formatCinematic35mmPrompt} from '../hsl/startframe/chatgptStartFrameRuntime';
import {assertPhotographicPrompt} from '../hsl/startframe/photographicPrompt';
import {HslImageFrameEngine} from '../hsl/core/hslImageFrameEngine';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-photo-contract-'));
const physical = formatCinematic35mmPrompt('Cinematic 35mm pop-documentary shot, macro view of liquid cooling pipes between GPU racks, monumental off-white typography overlays, Arri Alexa LF 8k');
assert.match(physical, /liquid cooling pipes between GPU racks/i);
assert.match(physical, /NO TEXT/);
assert.doesNotMatch(physical, /typography overlays/i);
assertPhotographicPrompt(physical);
assert.throws(() => formatCinematic35mmPrompt('monumental typography card: HIDDEN SYSTEMS RULE THE WORLD, Apple Keynote documentary aesthetic, Arri Alexa LF 8k'), /PHOTOGRAPHIC_SUBJECT_REQUIRED/);
assert.throws(() => assertPhotographicPrompt('Typography title card saying THERMAL CRISIS'), /PHOTOGRAPHIC_PROMPT_REQUIRED/);

const bot = path.join(root, 'empty-bot');
fs.mkdirSync(bot, {recursive: true});
const runtime = new ChatGptStartFrameRuntime(bot);
const result = runtime.run({episodeId: 'PHOTO_TEST', outputDirectory: path.join(root, 'run'), autoRunBot: false,
  shotPlanItems: [{shot_id: 'SHOT_001', parent_scene_id: 'SCENE_001', start_frame_prompt: 'macro view of liquid cooling pipes between GPU racks'}]});
assert.equal(result.status, 'CHATGPT_START_FRAMES_PARTIAL');
const manifest = JSON.parse(fs.readFileSync(result.manifestPath, 'utf8'));
assert.equal(manifest.status, 'GENERATION_FAILED');
assert.equal(manifest.total_generated, 0);
assert.equal(manifest.items.length, 0);
assert.ok(!fs.existsSync(path.join(root, 'run', 'start-frame-manifest.json')), 'generation must not fabricate an approval manifest');

const previousCwd = process.cwd();
try {
  process.chdir(root);
  assert.throws(() => HslImageFrameEngine.ensurePhotorealFramesWithChatGPT('PHOTO_TEST_MISSING', [{
    beatId: 'SCENE_001', visualMode: 'generated_image_35mm', cinematicPrompt: 'macro view of liquid cooling pipes between GPU racks'
  } as any]), /PHOTOREAL_FRAMES_REQUIRED/);
  assert.ok(!fs.existsSync(path.join(root, 'runs', 'PHOTO_TEST_MISSING', 'frames', 'SCENE_001.png')), 'no procedural frame may replace a missing photograph');
} finally { process.chdir(previousCwd); }

console.log('PASS photographic contract: typography rejected, missing photographs block and empty generation is not approved');
