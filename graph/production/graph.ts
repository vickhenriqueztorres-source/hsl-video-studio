import { StateGraph, START, END, BaseCheckpointSaver } from '@langchain/langgraph';
import { ProductionState } from './state';
import { Context, timed } from './runtime';
import { realDependencies, Dependencies } from './deps';
import { REPO_ROOT } from '../checkpointer';
import { scenePlan } from './nodes/scene_plan';
import { fanOutFrames } from './nodes/fan_out_frames';
import { imageFrames } from './nodes/image_frames';
import { joinFrames } from './nodes/join_frames';
import { fanOutVideos } from './nodes/fan_out_videos';
import { fireflyVideos } from './nodes/firefly_videos';
import { joinVideos } from './nodes/join_videos';
import { narration } from './nodes/narration';
import { soundDesign } from './nodes/sound_design';
import { gatekeeper } from './nodes/gatekeeper';
import { gateRenderWait } from './nodes/gate_render_wait';
import { renderPrepare } from './nodes/render_prepare';
import { fanOutRender, routeRender } from './nodes/fan_out_render';
import { renderChunkNode, ChunkInput } from './nodes/render_chunk';
import { stitch } from './nodes/stitch';
import { preMuxGate } from './nodes/pre_mux_gate';
import { mux } from './nodes/mux';
import { packaging } from './nodes/packaging';
import { compliance } from './nodes/compliance';
import { gatePublishWait } from './nodes/gate_publish_wait';
import { finalize } from './nodes/finalize';

// LangGraph 1.4 rejects node names that collide with state channels. Public CLI
// aliases retain the specification's names; only these four IDs need a suffix.
export const NODE_ALIASES: Record<string, string> = { narration: 'narration_stage', gatekeeper: 'gatekeeper_stage', packaging: 'packaging_stage', compliance: 'compliance_stage' };
export const NODE_ORDER = ['scene_plan', 'fan_out_frames', 'image_frames', 'join_frames', 'fan_out_videos', 'firefly_videos', 'join_videos', 'narration_stage', 'sound_design', 'gatekeeper_stage', 'gate_render_wait', 'render_prepare', 'fan_out_render', 'render_chunk', 'stitch', 'pre_mux_gate', 'mux', 'packaging_stage', 'compliance_stage', 'gate_publish_wait', 'finalize'] as const;
export type NodeName = typeof NODE_ORDER[number];
export interface ProductionGraphOptions { interruptAfter?: NodeName[] }
export function createProductionGraph(checkpointer?: BaseCheckpointSaver, overrides: Partial<Dependencies> = {}, root = REPO_ROOT, options: ProductionGraphOptions = {}) {
  const c: Context = { root, deps: { ...realDependencies(root), ...overrides } };
  const retryPolicy = { maxAttempts: 2, initialInterval: 100, jitter: false, retryOn: (e: Error) => e.name !== 'AbortError' };
  return new StateGraph(ProductionState)
    .addNode('scene_plan', timed(c, 'scene_plan', scenePlan(c)))
    .addNode('fan_out_frames', timed(c, 'fan_out_frames', fanOutFrames(c)))
    .addNode('image_frames', timed(c, 'image_frames', imageFrames(c)), { retryPolicy })
    .addNode('join_frames', timed(c, 'join_frames', joinFrames(c)))
    .addNode('fan_out_videos', timed(c, 'fan_out_videos', fanOutVideos(c)))
    .addNode('firefly_videos', timed(c, 'firefly_videos', fireflyVideos(c)), { retryPolicy })
    .addNode('join_videos', timed(c, 'join_videos', joinVideos(c)))
    .addNode('narration_stage', timed(c, 'narration', narration(c)))
    .addNode('sound_design', timed(c, 'sound_design', soundDesign(c)))
    .addNode('gatekeeper_stage', timed(c, 'gatekeeper', gatekeeper(c)))
    .addNode('gate_render_wait', gateRenderWait)
    .addNode('render_prepare', timed(c, 'render_prepare', renderPrepare(c)))
    .addNode('fan_out_render', timed(c, 'fan_out_render', fanOutRender))
    .addNode('render_chunk', timed(c, 'render_chunk', (s, config) => renderChunkNode(c)(s as ChunkInput, config)), { retryPolicy })
    .addNode('stitch', timed(c, 'stitch', stitch(c)))
    .addNode('pre_mux_gate', timed(c, 'pre_mux_gate', preMuxGate(c)))
    .addNode('mux', timed(c, 'mux', mux(c)))
    .addNode('packaging_stage', timed(c, 'packaging', packaging(c)))
    .addNode('compliance_stage', timed(c, 'compliance', compliance(c)))
    .addNode('gate_publish_wait', gatePublishWait)
    .addNode('finalize', timed(c, 'finalize', finalize(c)))
    .addEdge(START, 'scene_plan').addEdge('scene_plan', 'fan_out_frames')
    .addEdge('fan_out_frames', 'image_frames').addEdge('image_frames', 'join_frames')
    .addEdge('join_frames', 'fan_out_videos').addEdge('fan_out_videos', 'firefly_videos').addEdge('firefly_videos', 'join_videos')
    .addEdge('join_videos', 'narration_stage').addEdge('narration_stage', 'sound_design').addEdge('sound_design', 'gatekeeper_stage')
    .addConditionalEdges('gatekeeper_stage', s => s.gatekeeper?.passed ? 'gate_render_wait' : 'finalize', ['gate_render_wait', 'finalize'])
    .addConditionalEdges('gate_render_wait', s => s.productionStatus === 'ABORTED' ? 'finalize' : 'render_prepare', ['finalize', 'render_prepare'])
    .addEdge('render_prepare', 'fan_out_render')
    .addConditionalEdges('fan_out_render', routeRender(c), ['render_chunk', 'stitch'])
    .addEdge('render_chunk', 'fan_out_render').addEdge('stitch', 'pre_mux_gate').addEdge('pre_mux_gate', 'mux')
    .addEdge('mux', 'packaging_stage').addEdge('packaging_stage', 'compliance_stage')
    .addConditionalEdges('compliance_stage', s => s.compliance?.passed ? 'gate_publish_wait' : 'finalize', ['gate_publish_wait', 'finalize'])
    .addEdge('gate_publish_wait', 'finalize').addEdge('finalize', END)
    .compile({ ...(checkpointer ? { checkpointer } : {}), interruptAfter: options.interruptAfter });
}
export type ProductionGraph = ReturnType<typeof createProductionGraph>;
