import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { MotionFailure, MotionSceneInput, RenderRequest, RenderResult } from '../contracts';
import { atomicJson, fileHash, sha256, validateSource, within } from './source';

async function command(executable: string, args: string[], timeoutMs: number, onTimeout?: () => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE } });
    let output = ''; let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); onTimeout?.(); }, timeoutMs);
    const add = (chunk: Buffer) => { output = (output + chunk.toString()).slice(-100_000); };
    child.stdout.on('data', add); child.stderr.on('data', add);
    child.once('error', e => { clearTimeout(timer); reject(e); });
    child.once('close', code => { clearTimeout(timer); if (code === 0 && !timedOut) resolve(output); else reject(new Error(`${executable} ${timedOut ? 'timeout' : `exit ${code}`}: ${output}`)); });
  });
}
function imageReference(): string {
  const image = process.env.HSL_MOTION_WORKER_IMAGE;
  if (!image || !/^(?:[-a-zA-Z0-9_./:]+@)?sha256:[a-f0-9]{64}$/.test(image)) throw new MotionFailure('runtime_unavailable', 'HSL_MOTION_WORKER_IMAGE must identify a locally provisioned worker image pinned by sha256 image ID or repository digest. No unsafe host execution fallback is enabled.');
  return image;
}
export async function motionRuntimePreflight(input: MotionSceneInput): Promise<void> {
  try {
    await command('docker', ['image', 'inspect', imageReference()], 30_000);
    await command('docker', ['info', '--format', '{{.OSType}}'], 30_000).then(s => { if (s.trim() !== 'linux') throw new Error('Linux containers required'); });
    const lockHash = await command('docker', ['run', '--rm', '--pull=never', '--network=none', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=32', '--memory=256m', '--user=1000:1000', '--entrypoint=node', imageReference(), '-e', "console.log(require('node:crypto').createHash('sha256').update(require('node:fs').readFileSync('/opt/motion/package-lock.json')).digest('hex'))"], 30_000);
    if (lockHash.trim() !== fileHash(path.join(input.repoRoot, 'package-lock.json'))) throw new Error('Worker image dependency lock does not match the repository; rebuild the worker');
  }
  catch (e) { throw new MotionFailure('runtime_unavailable', String(e)); }
}
export async function renderMotion(request: RenderRequest): Promise<RenderResult> {
  validateSource(request.source);
  const worker = path.join(request.input.repoRoot, 'graph/motion/runtime/worker.cjs');
  const identity = sha256(JSON.stringify({ source: request.source, timing: request.input.timing, frames: request.frames, phase: request.phase, worker: fileHash(worker), image: imageReference() }));
  const directory = path.join(request.directory, `${request.phase}-${identity.slice(0, 16)}`);
  const inputDir = path.join(directory, 'input'); const sourceDir = path.join(inputDir, 'source'); const outputDir = path.join(directory, 'output');
  const receipt = path.join(directory, 'render-receipt.json');
  if (fs.existsSync(receipt)) {
    const saved = JSON.parse(fs.readFileSync(receipt, 'utf8')) as { identity: string; result: RenderResult; hashes: Record<string, string> };
    if (saved.identity === identity && Object.entries(saved.hashes).every(([file, hash]) => fs.existsSync(file) && fileHash(file) === hash)) return saved.result;
    throw new MotionFailure('review_required', 'Render receipt or output hash mismatch');
  }
  fs.mkdirSync(sourceDir, { recursive: true }); fs.mkdirSync(outputDir, { recursive: true });
  for (const file of request.source.files) { const destination = within(sourceDir, file.path); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, file.content); }
  const { fps, width, height, durationInFrames } = request.input.timing;
  const entrypoint = './' + request.source.entrypoint.replace(/\.(tsx|ts)$/, '');
  fs.writeFileSync(path.join(sourceDir, 'index.tsx'), `import React from 'react';\nimport {Composition,registerRoot} from 'remotion';\nimport Scene from ${JSON.stringify(entrypoint)};\nconst Root=()=> <Composition id="AuthoredMotion" component={Scene} durationInFrames={${durationInFrames}} fps={${fps}} width={${width}} height={${height}}/>;\nregisterRoot(Root);\n`);
  atomicJson(path.join(inputDir, 'request.json'), { phase: request.phase, frames: request.frames });
  const containerName = `hsl-motion-${crypto.randomUUID()}`;
  try {
    await command('docker', ['run', '--rm', '--pull=never', '--name', containerName, '--network=none', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=256', '--memory=4g', '--cpus=2', '--shm-size=512m', '--user=1000:1000', '--tmpfs', '/tmp:rw,nosuid,size=1g', '--tmpfs', '/work:rw,nosuid,size=1g', '--mount', `type=bind,source=${inputDir},target=/input,readonly`, '--mount', `type=bind,source=${outputDir},target=/output`, '--mount', `type=bind,source=${worker},target=/runtime-worker.cjs,readonly`, imageReference()], 900_000, () => { const killer = spawn('docker', ['rm', '-f', containerName], { windowsHide: true, stdio: 'ignore' }); killer.unref(); });
  } catch (e) { throw new Error(`Motion compile/render failed: ${String(e)}`); }
  const raw = JSON.parse(fs.readFileSync(path.join(outputDir, 'result.json'), 'utf8')) as RenderResult;
  const local = (file: string) => { if (path.basename(file) !== file) throw new Error('Unsafe worker result path'); return path.join(outputDir, file); };
  const result: RenderResult = { ...raw, videoPath: local(raw.videoPath), frames: raw.frames.map(f => ({ frame: f.frame, path: local(f.path) })) };
  const scale = request.phase === 'preview' ? 0.5 : 1;
  if (result.durationInFrames !== durationInFrames || result.fps !== fps || result.width !== width * scale || result.height !== height * scale) throw new Error('Rendered video fails exact physical timing/resolution contract');
  if (JSON.stringify(result.frames.map(f => f.frame)) !== JSON.stringify(request.frames)) throw new Error('Worker did not return all cue frames');
  const hashes = Object.fromEntries([result.videoPath, ...result.frames.map(f => f.path)].map(file => { if (fs.statSync(file).size < 100) throw new Error('Empty render asset'); return [file, fileHash(file)]; }));
  atomicJson(receipt, { identity, result, hashes });
  return result;
}
