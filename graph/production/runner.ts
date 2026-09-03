import fs from 'node:fs';
import path from 'node:path';
import { Overwrite, START } from '@langchain/langgraph';
import { ProductionGraph, NODE_ORDER, NODE_ALIASES, NodeName } from './graph';
import { State, Update, threadId, NodeError } from './state';
import { readJson, writeJson } from './runtime';
import { HslRunManifest, StageName } from '../../hsl/core/hslRunManifest';
export function configFor(episodeId: string) { return { configurable: { thread_id: threadId(episodeId) }, recursionLimit: 128 }; }
export function readHistory(root: string, episodeId: string) {
  const file = path.join(root, 'runs', episodeId, 'graph', 'history.jsonl');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];
}
export function readErrors(root: string, episodeId: string): NodeError[] {
  const file = path.join(root, 'runs', episodeId, 'graph', 'node-events.jsonl');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean)
    .map(line => JSON.parse(line)).filter(e => e.type === 'error').map(({ type, ...e }) => e) : [];
}
export async function executeProduction(graph: ProductionGraph, root: string, episodeId: string, input: Parameters<ProductionGraph['stream']>[0], signal?: AbortSignal) {
  const config = configFor(episodeId);
  const folder = path.join(root, 'runs', episodeId, 'graph'); fs.mkdirSync(folder, { recursive: true });
  try {
    for await (const raw of await graph.stream(input, { ...config, streamMode: 'debug', signal })) {
      const event = raw as { type: string; step: number; timestamp: string; payload: { id?: string; name?: string; input?: { index?: number }; error?: unknown } };
      if (event.type === 'task') {
        fs.appendFileSync(path.join(folder, 'history.jsonl'), JSON.stringify({ at: event.timestamp, step: event.step,
          id: event.payload.id, node: event.payload.name, index: event.payload.input?.index }) + '\n');
      }
    }
  } finally {
    const snapshots = [];
    for await (const snapshot of graph.getStateHistory(config)) snapshots.push({ checkpointId: snapshot.config.configurable?.checkpoint_id,
      step: snapshot.metadata?.step, next: snapshot.next, tasks: snapshot.tasks.map(t => ({ id: t.id, name: t.name, error: t.error, interrupts: t.interrupts })) });
    writeJson(path.join(folder, 'checkpoint-history.json'), snapshots);
  }
  return graph.getState(config);
}
export function counts(items: { status: string; beatId?: string; index?: number }[]) {
  const latest = new Map(items.map(x => [x.beatId ?? x.index, x]));
  return Object.fromEntries(['ok', 'skipped', 'failed'].map(status => [status, [...latest.values()].filter(x => x.status === status).length]));
}
const outputFields: Partial<Record<NodeName, (keyof State)[]>> = {
  env_check:['environment'],visual_prompts_prepare:['visualPrompts','visualPromptsPath'],visual_prompts_review_prepare:['promptReview'],image_generate_prepare:['imageSpecs'],image_generate_wait:['frames'],
  firefly_guide:['videoTakes','fireflyGuidePath'],firefly_dispatch:['videoTakes','generationCount'],firefly_intake_wait:['videoTakes'],firefly_finalize:['videos'],sfx_render:['sfxTrackPath','sfxResolved','sfxUnresolved'],
  scene_plan: ['scenePlan', 'scenePlanPath'], image_frames: ['frames'], firefly_videos: ['videos', 'fireflyGuidePath'],
  narration_stage: ['narration'], sound_design: ['soundDesign'], gatekeeper_stage: ['gatekeeper'],
  render_prepare: ['assetServer', 'renderProps'], render_chunk: ['renderChunks'], stitch: ['visualTrackPath'],
  pre_mux_gate: ['preMux'], mux: ['finalVideo'], packaging_stage: ['packaging'], compliance_stage: ['compliance'],
};
export async function rewind(graph: ProductionGraph, root: string, episodeId: string, requested: string) {
  const node = (NODE_ALIASES[requested] ?? requested) as NodeName;
  const index = NODE_ORDER.indexOf(node);
  if (index < 0) throw new Error(`Nó desconhecido: ${requested}`);
  const snapshot = await graph.getState(configFor(episodeId));
  if (!snapshot.values.episodeId) throw new Error('--from requer thread existente');
  const first = node === 'fan_out_frames' ? NODE_ORDER.indexOf('image_frames') : node === 'fan_out_videos' ? NODE_ORDER.indexOf('firefly_videos') : index;
  const patch: Record<string, unknown> = { productionStatus: 'RUNNING', errors: new Overwrite([]), timings: new Overwrite([]), gateDecisions: new Overwrite([]) };
  for (const n of NODE_ORDER.slice(first)) for (const field of outputFields[n] ?? []) patch[field] = ['frames', 'videos', 'renderChunks'].includes(field) ? new Overwrite([]) : null;
  // fan_out_render must also invalidate renderChunks, so routing reschedules work.
  if (index <= NODE_ORDER.indexOf('render_chunk')) patch.renderChunks = new Overwrite([]);
  const m = new HslRunManifest(episodeId, root);
  const stageNodes: NodeName[] = ['scene_plan', 'fan_out_frames', 'fan_out_videos', 'narration_stage', 'sound_design', 'gatekeeper_stage', 'render_prepare', 'pre_mux_gate', 'mux', 'packaging_stage', 'compliance_stage'];
  const data = m.getData();
  for (const [i, id] of (Object.keys(data.stages) as StageName[]).entries()) {
    const next = i === stageNodes.length - 1 ? NODE_ORDER.length : NODE_ORDER.indexOf(stageNodes[i + 1]);
    if (index < next) data.stages[id] = { name: id, status: 'PENDING' };
  }
  data.overallStatus = 'RUNNING'; m.setArtifacts({});
  // Artifact validation remains active: --from resets checkpoints, not media.
  const predecessor = index === 0 ? START : node === 'render_chunk' ? 'render_prepare' : NODE_ORDER[index - 1];
  await graph.updateState(configFor(episodeId), patch as Update, predecessor);
  const receipt = path.join(root, 'runs', episodeId, 'graph', 'pre-mux.json');
  if (index <= NODE_ORDER.indexOf('pre_mux_gate') && fs.existsSync(receipt)) fs.unlinkSync(receipt);
  const complianceReceipt = path.join(root, 'runs', episodeId, 'graph', 'compliance.json');
  if (index <= NODE_ORDER.indexOf('compliance_stage') && fs.existsSync(complianceReceipt)) fs.unlinkSync(complianceReceipt);
}
