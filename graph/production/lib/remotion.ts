import path from 'node:path';
import type { State } from '../state';
import { spawnTool, requireSuccess } from '../../lib/proc';
export const FRAME_RANGES: [number, number][] = [[0, 4499], [4500, 8999], [9000, 13499], [13500, 17999]];
export function renderFrameRanges(s: Pick<State, 'options' | 'scenePlan'>): [number, number][] {
  if (s.options.graph.testRender) return [[0, 299]];
  if (s.options.graph.mediaMode === 'legacy') return FRAME_RANGES;
  const frames = s.scenePlan?.totalFrames;
  if (!Number.isSafeInteger(frames) || !frames || frames < 1) throw new Error('RENDER_DURATION_INVALID');
  return Array.from({ length: Math.ceil(frames / 4500) }, (_, index) => [index * 4500, Math.min(frames - 1, (index + 1) * 4500 - 1)]);
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
