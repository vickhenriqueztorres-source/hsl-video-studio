import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { State } from '../state';
import { paths, readJson, validMediaDuration, type Context } from '../runtime';
import { renderFrameCount } from './remotion';
import { HSL_AUDIO_BITRATE, HSL_FPS, HSL_VIDEO_WIDTH, HSL_VIDEO_HEIGHT } from '../../../spec/hsl-spec';

const VERSION = 1;
export function identityHash(value: unknown): string {
  const canonical = (v: any): any => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => [k, canonical(v[k])])) : v;
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

// Process-local only: a restart always hashes content again. Nanosecond ctime
// catches same-size rewrites even when a producer restores the previous mtime.
const hashes = new Map<string, { stamp: string; hash: string }>();
function stamp(file: string): string {
  const s = fs.statSync(file, { bigint: true });
  if (!s.isFile()) throw new Error(`RENDER_INPUT_NOT_FILE: ${file}`);
  return [s.dev, s.ino, s.size, s.mtimeNs, s.ctimeNs, s.birthtimeNs].join(':');
}
export function fileContentHash(file: string): string {
  const resolved = fs.realpathSync(file), before = stamp(resolved);
  const cached = hashes.get(resolved);
  if (cached?.stamp === before) return cached.hash;
  const hash = createHash('sha256'), fd = fs.openSync(resolved, 'r'), buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    for (;;) {
      const n = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (!n) break;
      hash.update(buffer.subarray(0, n));
    }
  } finally { fs.closeSync(fd); }
  if (stamp(resolved) !== before) throw new Error(`RENDER_INPUT_CHANGED_DURING_HASH: ${file}`);
  const digest = hash.digest('hex');
  hashes.set(resolved, { stamp: before, hash: digest });
  return digest;
}

export function writeIdentityJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try { fs.writeFileSync(temp, JSON.stringify(value, null, 2)); fs.renameSync(temp, file); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}

export function scenePlanHash(plan: unknown): string {
  // Server ports and provenance metadata are transport, not scene content.
  const { assetBaseUrl, renderIdentity, renderMediaManifest, ...content } = (plan ?? {}) as Record<string, unknown>;
  // Voiceover is an audio input and is fingerprinted separately by
  // finalIdentity. Excluding it here lets a repaired narration plan reuse the
  // already verified visual render without invalidating its media manifest.
  if (Array.isArray(content.beats)) {
    content.beats = content.beats.map((beat: any) => {
      const { voiceoverScript, ...visualBeat } = beat ?? {};
      return visualBeat;
    });
  }
  return identityHash(content);
}
type Provider = 'firefly-kling' | 'local-ffmpeg' | 'none';
export interface RenderMediaBeat {
  beatId: string; visualMode: string; provider: Provider | 'unspecified';
  assetPath: string; path: string; hash: string;
  sourcePath: string; sourceHash: string;
  frameRange: [number, number];
}
export interface RenderIdentity {
  version: number; episodeId: string; planHash: string; mediaPlanHash: string | null;
  totalFrames: number; mediaHash: string; beats: RenderMediaBeat[]; hash: string;
}

function within(root: string, file: string): string {
  const relative = path.relative(path.resolve(root), path.resolve(file));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`RENDER_MEDIA_PATH_INVALID: ${file}`);
  return file;
}
function localFile(root: string, file: string): string {
  const resolved = within(root, path.resolve(root, file));
  within(fs.realpathSync(root), fs.realpathSync(resolved));
  return resolved;
}

export function createRenderIdentity(c: Context, s: State): RenderIdentity {
  const totalFrames = renderFrameCount(s), plan = s.scenePlan!;
  const mediaPlanHash = s.mediaPlan?.hash ?? (plan as typeof plan & { mediaPlanHash?: string }).mediaPlanHash ?? null;
  let from = 0;
  const beats = plan.beats.map((beat): RenderMediaBeat => {
    if (!Number.isSafeInteger(beat.durationFrames) || beat.durationFrames < 1) throw new Error(`RENDER_BEAT_DURATION_INVALID: ${beat.beatId}`);
    const frameRange: [number, number] = [from, from + beat.durationFrames - 1]; from += beat.durationFrames;
    const video = beat.visualMode === 'firefly_video';
    const assetPath = video ? beat.outputVideoPath : beat.outputFramePath;
    if (!assetPath || /^(?:[a-z]+:|\/\/)/i.test(assetPath)) throw new Error(`RENDER_MEDIA_LOCAL_PATH_REQUIRED: ${beat.beatId}`);
    // Mirror resolveMediaSrc + the local asset server, including URL decoding
    // and public-first precedence. Never hash a guessed run file alone.
    const urlPath = assetPath.replace(/\\/g, '/').replace(/^public\//, '').replace(/^\/+/, '');
    const clean = decodeURIComponent(new URL(urlPath, 'http://127.0.0.1/').pathname).replace(/^\/+/, '').replace(/^public\//, '');
    const candidates = [path.resolve(c.root, 'public', clean), path.resolve(c.root, clean)].map(f => within(c.root, f));
    const served = candidates.find(f => fs.existsSync(f) && fs.statSync(f).isFile());
    if (!served) throw new Error(`RENDER_MEDIA_MISSING: ${beat.beatId}: ${assetPath}`);
    const results = video ? s.videos : s.frames;
    const result = [...(results ?? [])].reverse().find(r => r.beatId === beat.beatId);
    if (result?.status === 'failed') throw new Error(`RENDER_MEDIA_STATE_FAILED: ${beat.beatId}`);
    const source = result?.path ?? (fs.existsSync(candidates[1]) ? candidates[1] : served);
    const resolved = localFile(c.root, served), sourcePath = localFile(c.root, source);
    const provider = (beat as typeof beat & { mediaProvider?: Provider }).mediaProvider ?? 'unspecified';
    if (!['firefly-kling', 'local-ffmpeg', 'none', 'unspecified'].includes(provider)) throw new Error(`RENDER_MEDIA_PROVIDER_INVALID: ${beat.beatId}`);
    return { beatId: beat.beatId, visualMode: beat.visualMode, provider, assetPath,
      path: resolved, hash: fileContentHash(resolved), sourcePath, sourceHash: fileContentHash(sourcePath), frameRange };
  });
  const content = { version: VERSION, episodeId: s.episodeId, planHash: scenePlanHash(plan), mediaPlanHash,
    totalFrames, mediaHash: identityHash(beats), beats };
  return { ...content, hash: identityHash({ ...content, fps: HSL_FPS, width: HSL_VIDEO_WIDTH, height: HSL_VIDEO_HEIGHT, testRender: s.options.graph.testRender }) };
}

export const renderManifestPath = (c: Context, s: State) => path.join(paths(c, s).audit, 'render-media-manifest.json');
export function persistRenderInputs(c: Context, s: State, identity: RenderIdentity, assetBaseUrl: string): void {
  writeIdentityJson(renderManifestPath(c, s), identity);
  writeIdentityJson(paths(c, s).props, { ...s.scenePlan, assetBaseUrl, renderIdentity: identity.hash, renderMediaManifest: identity });
}
export function assertRenderInputs(c: Context, s: State, expected: RenderIdentity): void {
  const current = createRenderIdentity(c, s);
  const manifest = readJson<RenderIdentity>(renderManifestPath(c, s));
  const props = readJson<Record<string, unknown>>(paths(c, s).props);
  if (current.hash !== expected.hash || identityHash(manifest ?? null) !== identityHash(current) ||
      !props || scenePlanHash(props) !== current.planHash || props.renderIdentity !== current.hash ||
      identityHash(props.renderMediaManifest ?? null) !== identityHash(current)) throw new Error('RENDER_MEDIA_MANIFEST_STALE');
  if (current.beats.some(b => b.hash !== b.sourceHash)) throw new Error('RENDER_MEDIA_STATE_MISMATCH: served media differs from state source');
}

export type ReceiptKind = 'chunk' | 'visual' | 'final' | 'compliance';
export const receiptPath = (file: string) => `${file}.render-receipt.json`;
interface Receipt { version: number; kind: ReceiptKind; inputHash: string; artifactHash: string; completedAt: string }
export function invalidateReceipt(file: string): void {
  if (fs.existsSync(receiptPath(file))) fs.unlinkSync(receiptPath(file));
}
export function assertRenderSucceeded(result: unknown): void {
  const outcome = result as { exitCode?: number; timedOut?: boolean } | undefined;
  if (outcome?.timedOut || (outcome?.exitCode !== undefined && outcome.exitCode !== 0)) throw new Error('RENDER_PROCESS_FAILED');
}
export function writeReceipt(file: string, kind: ReceiptKind, inputHash: string): void {
  writeIdentityJson(receiptPath(file), { version: VERSION, kind, inputHash, artifactHash: fileContentHash(file), completedAt: new Date().toISOString() } satisfies Receipt);
}
export function receiptMatches(file: string, kind: ReceiptKind, inputHash: string): boolean {
  try {
    const receipt = readJson<Receipt>(receiptPath(file));
    return receipt?.version === VERSION && receipt.kind === kind && receipt.inputHash === inputHash && receipt.artifactHash === fileContentHash(file);
  } catch { return false; }
}
export const chunkIdentity = (identity: RenderIdentity, index: number, frameRange: [number, number]) => identityHash({ render: identity.hash, index, frameRange });
export function cachedRender(c: Context, file: string, seconds: number, kind: ReceiptKind, inputHash: string): boolean {
  return receiptMatches(file, kind, inputHash) && validMediaDuration(c, file, seconds);
}

export function muxInputs(c: Context, s: State) {
  const first = path.join(c.root, 'assets/audio-library/music/cinematic/suspense/suspense_oppressive_gloom.mp3');
  const music = fs.existsSync(first) ? first : path.join(c.root, 'public/audio/music/cinematic/suspense/suspense_oppressive_gloom.mp3');
  const sfx = s.sfxTrackPath ? path.resolve(c.root, s.sfxTrackPath) : null;
  return { music, narration: paths(c, s).narration, sfx };
}
export function finalIdentity(c: Context, s: State, identity: RenderIdentity): string {
  const files = muxInputs(c, s);
  const fingerprint = (file: string | null) => file ? { path: file, hash: fs.existsSync(file) ? fileContentHash(file) : 'MISSING' } : null;
  return identityHash({ render: identity.hash, bitrate: HSL_AUDIO_BITRATE,
    music: fingerprint(files.music), narration: fingerprint(files.narration), sfx: fingerprint(files.sfx),
    rulesetVersion: '2.0.0' });
}
export function cachedVisualOrFinal(c: Context, s: State, identity: RenderIdentity): boolean {
  const p = paths(c, s), seconds = identity.totalFrames / HSL_FPS;
  if (!Number.isFinite(seconds) || seconds <= 0) return false;
  return cachedRender(c, p.final, seconds, 'final', finalIdentity(c, s, identity)) || cachedRender(c, p.visual, seconds, 'visual', identity.hash);
}
