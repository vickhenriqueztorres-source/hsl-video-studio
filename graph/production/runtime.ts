import fs from 'node:fs';
import path from 'node:path';
import { LangGraphRunnableConfig, isGraphInterrupt } from '@langchain/langgraph';
import { HslRunManifest, StageName, RunManifestData } from '../../hsl/core/hslRunManifest';
import { Dependencies } from './deps';
import { State, Update, Timing, NodeError } from './state';
export interface Context { root: string; deps: Dependencies }
export const paths = (c: Context, s: Pick<State, 'episodeId'> & Partial<Pick<State, 'options'>>) => {
  const run = path.join(c.root, 'runs', s.episodeId), e = s.episodeId.toLowerCase();
  const testRender = s.options?.graph.testRender === true;
  return { run, audit: path.join(run, 'graph'), manifest: path.join(run, 'run-manifest.json'),
    plan: path.join(run, 'scene-plan.json'), props: path.join(c.root, 'out', `${e}_render-props.json`),
    visual: testRender ? path.join(c.root,'out','test',`temp_visual_${e}-2beats.mp4`) : path.join(c.root, 'out', `temp_visual_${e}.mp4`),
    final: testRender ? path.join(c.root,'out','test',`${s.episodeId}-2beats.mp4`) : path.join(c.root, 'out', `${e}.mp4`),
    narration: path.join(run, 'audio', 'narration.mp3'), publicNarration: path.join(c.root, 'public', 'audio', 'narration.mp3') };
};
export function readJson<T>(file: string): T | undefined { try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); } catch { return undefined; } }
export function writeJson(file: string, data: unknown) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }
export function copyFile(src: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(src).size === fs.statSync(dest).size) {
    const a = fs.openSync(src, 'r'), b = fs.openSync(dest, 'r');
    const first = Buffer.alloc(64 * 1024), second = Buffer.alloc(64 * 1024);
    let equal = true;
    try {
      for (;;) {
        const n = fs.readSync(a, first, 0, first.length, null);
        if (!n) break;
        if (fs.readSync(b, second, 0, n, null) !== n || !first.subarray(0, n).equals(second.subarray(0, n))) { equal = false; break; }
      }
    } finally { fs.closeSync(a); fs.closeSync(b); }
    if (equal) return;
  }
  fs.copyFileSync(src, dest);
}
export function validMedia(c: Context, file: string, kind: 'audio' | 'video' | 'image' = 'video'): boolean {
  try {
    if (!fs.existsSync(file)) return false;
    const info = c.deps.inspect(file);
    // ffprobe has no duration for still PNGs: validate dimensions and PNG header.
    return kind === 'image' ? c.deps.isPng(file) && !!info.width && !!info.height : info.durationSeconds > 0 && (kind === 'audio' ? info.hasAudio : info.hasVideo);
  } catch { return false; }
}
export function manifest(c: Context, s: State) { return new HslRunManifest(s.episodeId, c.root); }
export function beginStage(c: Context, s: State, id: StageName) {
  const m = manifest(c, s); const done = m.getData().stages[id].status === 'DONE';
  if (!done) m.startStage(id); return done;
}
export function endStage(c: Context, s: State, id: StageName, metrics?: Record<string, unknown>, artifacts?: Partial<RunManifestData['artifacts']>) {
  const m = manifest(c, s);
  const done = m.getData().stages[id].status === 'DONE';
  if (!done) m.completeStage(id, metrics);
  if (artifacts && Object.entries(artifacts).some(([k, v]) => m.getData().artifacts[k as keyof RunManifestData['artifacts']] !== v)) m.setArtifacts(artifacts);
  return done;
}
export async function withStage(c: Context, s: State, id: StageName, fn: () => Promise<{ update: Update; metrics?: Record<string, unknown>; artifacts?: Partial<RunManifestData['artifacts']>; failed?: string; skipped?: boolean }>) {
  beginStage(c, s, id);
  try {
    const result = await fn();
    if (result.failed) manifest(c, s).failStage(id, result.failed);
    else endStage(c, s, id, result.metrics, result.artifacts);
    return { ...result.update, __status: result.failed ? 'failed' as const : result.skipped ? 'skipped' as const : 'ok' as const };
  } catch (e) { manifest(c, s).failStage(id, e instanceof Error ? e.message : String(e)); throw e; }
}
export type NodeUpdate = Update & { __status?: Timing['status'] };
export type NodeFn<S = State> = (s: S, config: LangGraphRunnableConfig) => Promise<NodeUpdate> | NodeUpdate;
export function audit(c: Context, episodeId: string, event: unknown) {
  const file = path.join(c.root, 'runs', episodeId, 'graph', 'node-events.jsonl');
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.appendFileSync(file, JSON.stringify(event) + '\n');
}
export function timed<S extends { episodeId: string }>(c: Context, node: string, fn: NodeFn<S>): NodeFn<S> {
  return async (s, config) => {
    const started = Date.now(), startedAt = new Date(started).toISOString();
    const attempt = config.executionInfo?.nodeAttempt ?? 1;
    audit(c, s.episodeId, { type: 'entry', node, index: (s as S & { index?: number }).index, attempt, at: startedAt });
    try {
      const { __status, ...update } = await fn(s, config);
      const timing: Timing = { node, startedAt, endedAt: new Date().toISOString(), ms: Date.now() - started, status: __status ?? 'ok' };
      audit(c, s.episodeId, { type: 'timing', ...timing });
      return { ...update, timings: [...(Array.isArray(update.timings) ? update.timings : []), timing] };
    } catch (e) {
      if (isGraphInterrupt(e)) throw e;
      const error: NodeError = { node, message: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined, at: new Date().toISOString() };
      const timing: Timing = { node, startedAt, endedAt: error.at, ms: Date.now() - started, status: 'failed' };
      // A throwing LangGraph node cannot commit its returned update. Durable
      // audit is written first; the runner reconciles errors after resume.
      audit(c, s.episodeId, { type: 'error', ...error }); audit(c, s.episodeId, { type: 'timing', ...timing });
      if (['render_prepare', 'render_chunk', 'stitch'].includes(node)) new HslRunManifest(s.episodeId, c.root).failStage('STAGE_07_REMOTION_RENDER', error.message);
      throw e;
    }
  };
}
