import fs from 'node:fs';
import path from 'node:path';
import { Overwrite, START } from '@langchain/langgraph';
import { ProductionGraph, NODE_ORDER, NODE_ALIASES, NodeName } from './graph';
import { State, Update, threadId, NodeError,GraphOptions } from './state';
import { readJson, writeJson } from './runtime';
import { HslRunManifest, StageName } from '../../hsl/core/hslRunManifest';
import {assertMediaPlan} from './lib/mediaPlan';
export function configFor(episodeId: string) { return { configurable: { thread_id: threadId(episodeId) }, recursionLimit: 512 }; }
export function executionStepBudget(state:Partial<State>):number {
  const frames=state.scenePlan?.totalFrames??Math.ceil((state.topicInput?.targetMinutes??12)*60*30);
  const beats=state.scenePlan?.beats.length??Math.max(128,state.options?.graph.beats??0);
  if(!Number.isFinite(frames)||frames<1||frames>30*60*120||beats>5000)throw new Error('EXECUTION_PLAN_LIMIT_INVALID');
  // At most ceil(total/150)+beats paid takes, two state steps per take,
  // plus preparation/QA, bounded review loops and two steps per render chunk.
  return 128+6*(Math.ceil(frames/150)+beats)+4*Math.ceil(frames/4500);
}
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
  const saved=await graph.getState(config);
  const starting=(input&&typeof input==='object'&&'episodeId' in input)?input as Partial<State>:saved.values;
  config.recursionLimit=Math.max(512, executionStepBudget(starting));
  if(saved.next.length&&!saved.values.mediaPlan&&saved.next.some(n=>!['scene_plan','media_plan_prepare'].includes(n)))throw new Error('MEDIA_CHECKPOINT_MIGRATION_REQUIRED: run --from media_plan_prepare');
  const folder = path.join(root, 'runs', episodeId, 'graph'); fs.mkdirSync(folder, { recursive: true });
  const executionFile=path.join(folder,'execution.json');
  writeJson(executionFile,{pid:process.pid,startedAt:new Date().toISOString(),active:true});
  try {
    for await (const raw of await graph.stream(input, { ...config, streamMode: 'debug', signal })) {
      const event = raw as { type: string; step: number; timestamp: string; payload: { id?: string; name?: string; input?: { index?: number }; error?: unknown } };
      if (event.type === 'task') {
        fs.appendFileSync(path.join(folder, 'history.jsonl'), JSON.stringify({ at: event.timestamp, step: event.step,
          id: event.payload.id, node: event.payload.name, index: event.payload.input?.index }) + '\n');
      }
    }
  } finally {
    writeJson(executionFile,{pid:process.pid,active:false,endedAt:new Date().toISOString()});
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
  media_plan_prepare:['mediaPlan','klingBudget'],kling_budget_wait:['klingAuthorization'],firefly_recovery_wait:['fireflyIssue'],
  codex_auth_prepare:['codexAuth'],image_generate_run:['imageGenerationIssue','imageGenerationRetry'],
  env_check:['environment'],visual_prompts_prepare:['visualPrompts','visualPromptsPath'],visual_prompts_review_prepare:['promptReview'],image_generate_prepare:['imageSpecs','imageQueuePath'],image_generate_wait:['frames','imageValidationRounds'],
  image_review_prepare:['imageReview','imageReviewRounds'],image_review_wait:['imageHumanApproved'],
  firefly_guide:['videoTakes','fireflyGuidePath'],firefly_dispatch:['videoTakes','generationCount'],firefly_intake_wait:['videoTakes'],firefly_finalize:['videos'],sfx_render:['sfxTrackPath','sfxPlanPath','sfxQaPath','sfxResolved','sfxUnresolved'],
  scene_plan: ['scenePlan', 'scenePlanPath'], image_frames: ['frames'], firefly_videos: ['videos', 'fireflyGuidePath'],
  narration_stage: ['narration'], sound_design: ['soundDesign'], gatekeeper_stage: ['gatekeeper'],
  render_prepare: ['assetServer', 'renderProps'], render_chunk: ['renderChunks'], stitch: ['visualTrackPath'],
  pre_mux_gate: ['preMux'], mux: ['finalVideo'], packaging_stage: ['packaging'], compliance_stage: ['compliance'],
  archive_scene_plan:['storageIndex'],archive_images:['storageIndex'],archive_firefly:['storageIndex'],archive_audio:['storageIndex'],archive_compliance:['storageIndex'],prune_verified:['storageIndex'],
};
export async function rewind(graph: ProductionGraph, root: string, episodeId: string, requested: string,graphOptions?:Partial<GraphOptions>) {
  const node = (NODE_ALIASES[requested] ?? requested) as NodeName;
  const index = NODE_ORDER.indexOf(node);
  if (index < 0) throw new Error(`Nó desconhecido: ${requested}`);
  const snapshot = await graph.getState(configFor(episodeId));
  if (!snapshot.values.episodeId) throw new Error('--from requer thread existente');
  if(['firefly_dispatch','firefly_intake_wait','firefly_finalize'].includes(node))throw new Error('PAID_REWIND_USE_FIREFLY_GUIDE: replaneja e reconcilia sem apagar recibos');
  const first = node === 'fan_out_frames' ? NODE_ORDER.indexOf('image_frames') : node === 'fan_out_videos' ? NODE_ORDER.indexOf('firefly_videos') : index;
  const patch: Record<string, unknown> = { productionStatus: 'RUNNING', errors: new Overwrite([]), timings: new Overwrite([]) };
  if(index>NODE_ORDER.indexOf('media_plan_validate'))assertMediaPlan({...snapshot.values,...(graphOptions?{options:{...snapshot.values.options,graph:{...snapshot.values.options.graph,...graphOptions}}}:{})});
  if(graphOptions)patch.options={...snapshot.values.options,graph:{...snapshot.values.options.graph,...graphOptions}};
  const arrays=new Set(['frames','videos','renderChunks','storageIndex','videoTakes','visualPrompts','imageSpecs','sfxResolved','sfxUnresolved']);
  const numbers=new Set(['generationCount','imageValidationRounds','imageReviewRounds']);
  for (const n of NODE_ORDER.slice(first)) for (const field of outputFields[n] ?? []) patch[field] = ['frames','videos','renderChunks','storageIndex'].includes(field)?new Overwrite([]):arrays.has(field)?[]:numbers.has(field)?0:null;
  if (index <= NODE_ORDER.indexOf('visual_prompts_prepare')) {
    patch.promptIteration = 0;
    patch.promptReviewHumanApproved = false;
  }
  if(index<=NODE_ORDER.indexOf('firefly_guide')){patch.klingBudget=null;patch.klingAuthorization=null;patch.fireflyIssue=null;}
  // fan_out_render must also invalidate renderChunks, so routing reschedules work.
  if (index <= NODE_ORDER.indexOf('render_chunk')) patch.renderChunks = new Overwrite([]);
  const m = new HslRunManifest(episodeId, root);
  const stageNodes: NodeName[] = ['scene_plan', 'fan_out_frames', 'fan_out_videos', 'narration_stage', 'sound_design', 'gatekeeper_stage', 'render_prepare', 'pre_mux_gate', 'mux', 'packaging_stage', 'compliance_stage'];
  const data = m.getData();
  for (const [i, id] of (Object.keys(data.stages) as StageName[]).filter(id=>id!=='STAGE_12_CLOUD_ARCHIVE').entries()) {
    const next = i === stageNodes.length - 1 ? NODE_ORDER.length : NODE_ORDER.indexOf(stageNodes[i + 1]);
    if (index < next) data.stages[id] = { name: id, status: 'PENDING' };
  }
  data.overallStatus = 'RUNNING'; m.setArtifacts({});
  // Artifact validation remains active: --from resets checkpoints, not media.
  // Explicit branch entry points; list adjacency is not a DAG predecessor.
  const branchPredecessors:Partial<Record<NodeName,string>>={
    media_plan_prepare:'scene_plan',
    visual_prompts_prepare:'archive_scene_plan',
    fan_out_frames:'archive_scene_plan',
    firefly_guide:'join_frames',
    fan_out_videos:'join_frames',
    firefly_dispatch:'firefly_session_wait',
    firefly_intake_wait:'firefly_dispatch',
    firefly_finalize:'firefly_intake_wait',
    join_frames:'image_frames',
    join_videos:'firefly_videos',
    gatekeeper_stage:'archive_audio',
    render_prepare:'gate_render_wait',
    render_chunk:'render_prepare',
    stitch:'fan_out_render',
    pre_mux_gate:'stitch',
    mux:'pre_mux_gate',
    packaging_stage:'mux',
    compliance_stage:'packaging_stage',
  };
  const predecessor = index === 0 ? START : branchPredecessors[node]??NODE_ORDER[index - 1];
  await graph.updateState(configFor(episodeId), patch as Update, predecessor);

  const safeUnlink = (f: string) => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} };
  const e = episodeId.toLowerCase();
  if (index < NODE_ORDER.indexOf('mux')) {
    safeUnlink(path.join(root, 'out', `${e}.mp4`));
    safeUnlink(path.join(root, 'out', `${e}.mp4.receipt.json`));
    safeUnlink(path.join(root, 'out', 'test', `${episodeId}-2beats.mp4`));
    safeUnlink(path.join(root, 'out', 'test', `${episodeId}-2beats.mp4.receipt.json`));
    safeUnlink(path.join(root, 'delivery', `${episodeId}.mp4`));
    safeUnlink(path.join(root, 'runs', episodeId, 'graph', 'final-render-receipt.json'));
    safeUnlink(path.join(root, 'runs', episodeId, 'final-receipt.json'));
  }
  if (index < NODE_ORDER.indexOf('pre_mux_gate')) {
    safeUnlink(path.join(root, 'runs', episodeId, 'graph', 'pre-mux.json'));
  }
  if (index < NODE_ORDER.indexOf('stitch')) {
    safeUnlink(path.join(root, 'out', `temp_visual_${e}.mp4`));
    safeUnlink(path.join(root, 'out', `temp_visual_${e}.mp4.receipt.json`));
    safeUnlink(path.join(root, 'out', 'test', `temp_visual_${e}-2beats.mp4`));
    safeUnlink(path.join(root, 'out', 'test', `temp_visual_${e}-2beats.mp4.receipt.json`));
    safeUnlink(path.join(root, 'runs', episodeId, 'graph', 'visual-render-receipt.json'));
  }
  if (index < NODE_ORDER.indexOf('render_prepare')) {
    safeUnlink(path.join(root, 'out', `${e}_render-props.json`));
    const outDir = path.join(root, 'out');
    if (fs.existsSync(outDir)) {
      for (const f of fs.readdirSync(outDir)) {
        if (f.startsWith('temp_p') && (f.includes(e) || f.includes(episodeId))) {
          safeUnlink(path.join(outDir, f));
        }
      }
    }
  }
  if (index < NODE_ORDER.indexOf('sound_design')) {
    safeUnlink(path.join(root, 'runs', episodeId, 'audio', 'sfx-track.wav'));
    safeUnlink(path.join(root, 'runs', episodeId, 'audio', 'sfx-qa.json'));
  }
  if (index < NODE_ORDER.indexOf('compliance_stage')) {
    safeUnlink(path.join(root, 'runs', episodeId, 'graph', 'compliance.json'));
  }
}
