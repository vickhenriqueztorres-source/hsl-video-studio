import path from 'node:path';
import type { State } from '../state';
import { spawnTool, requireSuccess } from '../../lib/proc';
import { HSL_FPS } from '../../../spec/hsl-spec';
export const FRAME_RANGES: [number, number][] = [[0, 4499], [4500, 8999], [9000, 13499], [13500, 17999]];
export const RENDER_CHUNK_FRAMES = 4500;
export const TEST_RENDER_FRAMES = 300;

export function renderFrameCount(s: Pick<State, 'options' | 'scenePlan'>): number {
  const plan = s.scenePlan;
  const frames = plan?.totalFrames;
  const beatFrames = plan?.beats.reduce((total, beat) => total + beat.durationFrames, 0);
  if (!Number.isSafeInteger(frames) || !frames || frames < 1 || beatFrames !== frames) {
    throw new Error(`RENDER_DURATION_INVALID: totalFrames=${String(frames)} beatFrames=${String(beatFrames)}`);
  }
  return s.options.graph.testRender ? Math.min(TEST_RENDER_FRAMES, frames) : frames;
}

export function renderDurationSeconds(s: Pick<State, 'options' | 'scenePlan'>): number {
  return renderFrameCount(s) / HSL_FPS;
}

export function frameRangeDurationSeconds(range: [number, number]): number {
  return (range[1] - range[0] + 1) / HSL_FPS;
}

export function renderPropsMatchPlan(s: Pick<State, 'scenePlan'>, value: unknown): boolean {
  const props = value as { episodeId?: unknown; totalFrames?: unknown; beats?: { beatId?: unknown; durationFrames?: unknown }[] } | undefined;
  const plan = s.scenePlan;
  return Boolean(plan && props && props.episodeId === plan.episodeId && props.totalFrames === plan.totalFrames &&
    Array.isArray(props.beats) && props.beats.length === plan.beats.length &&
    props.beats.every((beat, index) => beat.beatId === plan.beats[index].beatId && beat.durationFrames === plan.beats[index].durationFrames));
}

export function renderFrameRanges(s: Pick<State, 'options' | 'scenePlan'>): [number, number][] {
  const frames = renderFrameCount(s);
  return Array.from({ length: Math.ceil(frames / RENDER_CHUNK_FRAMES) }, (_, index) => [
    index * RENDER_CHUNK_FRAMES,
    Math.min(frames - 1, (index + 1) * RENDER_CHUNK_FRAMES - 1),
  ]);
}
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
export function chunkPath(root: string, episodeId: string, index: number) { return path.join(root, 'out', `temp_p${index + 1}_${episodeId.toLowerCase()}.mp4`); }
export async function bundleRemotion(root: string) {
  return requireSuccess(await spawnTool(npx, ['remotion', 'bundle', 'remotion/index.ts', 'build', '--public-dir=public'], {
    cwd: root, logPath: path.join(root, 'out', 'graph-bundle.log'), onStdout: s => process.stdout.write(s),
  }), 'REMOTION_BUNDLE_FATAL');
}
export async function renderChunk(root: string, episodeId: string, index: number, range: [number, number], propsPath: string) {
  const out = path.relative(root, chunkPath(root, episodeId, index)).replace(/\\/g, '/');
  const props = path.relative(root, propsPath).replace(/\\/g, '/');
  return requireSuccess(await spawnTool(npx, ['remotion', 'render', 'build', 'HslLongFormComposition', out,
    `--props=${props}`, `--frames=${range[0]}-${range[1]}`, '--public-dir=build/public', '--muted',
    '--concurrency=2', '--gl=angle', '--image-format=jpeg', '--jpeg-quality=80', '--timeout=3600000'], {
    cwd: root, timeoutMs: 3_600_000, logPath: path.join(root, 'runs', episodeId, 'graph', `render-${index}.log`),
  }), `REMOTION_CHUNK_${index}_FATAL`);
}
