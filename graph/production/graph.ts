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
import { envCheck } from './nodes/env_check';
import { visualPromptsPrepare, visualPromptsWait, visualPromptsReviewPrepare, visualPromptsReviewWait, routePromptReview } from './nodes/visual_prompts';
import { imageGeneratePrepare, imageGenerateWait } from './nodes/image_generate';
import { imageReviewPrepare, imageReviewWait, routeImageReview } from './nodes/image_review';
import { fireflySessionPrepare, fireflySessionWait, fireflyGuide, fireflyDispatch, fireflyIntakeWait, routeTakes, fireflyFinalize } from './nodes/firefly_real';
import { sfxRender } from './nodes/sfx_render';

// LangGraph 1.4 rejects node names that collide with state channels. Public CLI
// aliases retain the specification's names; only these four IDs need a suffix.
export const NODE_ALIASES: Record<string, string> = { narration: 'narration_stage', gatekeeper: 'gatekeeper_stage', packaging: 'packaging_stage', compliance: 'compliance_stage' };
export const NODE_ORDER = ['scene_plan','env_check','visual_prompts_prepare','visual_prompts_wait','visual_prompts_review_prepare','visual_prompts_review_wait','image_generate_prepare','image_generate_wait','image_review_prepare','image_review_wait','fan_out_frames','image_frames','join_frames','firefly_session_prepare','firefly_session_wait','firefly_guide','firefly_dispatch','firefly_intake_wait','firefly_finalize','fan_out_videos','firefly_videos','join_videos','narration_stage','sound_design','sfx_render','gatekeeper_stage','gate_render_wait','render_prepare','fan_out_render','render_chunk','stitch','pre_mux_gate','mux','packaging_stage','compliance_stage','gate_publish_wait','finalize'] as const;
export type NodeName = typeof NODE_ORDER[number];
export interface ProductionGraphOptions { interruptAfter?: NodeName[] }
export function createProductionGraph(checkpointer?: BaseCheckpointSaver, overrides: Partial<Dependencies> = {}, root = REPO_ROOT, options: ProductionGraphOptions = {}) {
  const c: Context = { root, deps: { ...realDependencies(root), ...overrides } };
  const retryPolicy = { maxAttempts: 2, initialInterval: 100, jitter: false, retryOn: (e: Error) => e.name !== 'AbortError' };
  return new StateGraph(ProductionState)
    .addNode('scene_plan', timed(c, 'scene_plan', scenePlan(c)))
    .addNode('env_check',timed(c,'env_check',envCheck(c)))
    .addNode('visual_prompts_prepare',timed(c,'visual_prompts_prepare',visualPromptsPrepare(c)))
    .addNode('visual_prompts_wait',timed(c,'visual_prompts_wait',visualPromptsWait(c)))
    .addNode('visual_prompts_review_prepare',timed(c,'visual_prompts_review_prepare',visualPromptsReviewPrepare(c)))
    .addNode('visual_prompts_review_wait',timed(c,'visual_prompts_review_wait',visualPromptsReviewWait(c)))
    .addNode('image_generate_prepare',timed(c,'image_generate_prepare',imageGeneratePrepare(c)))
    .addNode('image_generate_wait',timed(c,'image_generate_wait',imageGenerateWait(c)))
    .addNode('image_review_prepare',timed(c,'image_review_prepare',imageReviewPrepare(c)))
    .addNode('image_review_wait',timed(c,'image_review_wait',imageReviewWait))
    .addNode('fan_out_frames', timed(c, 'fan_out_frames', fanOutFrames(c)))
    .addNode('image_frames', timed(c, 'image_frames', imageFrames(c)), { retryPolicy })
    .addNode('join_frames', timed(c, 'join_frames', joinFrames(c)))
    .addNode('firefly_session_prepare',timed(c,'firefly_session_prepare',fireflySessionPrepare(c)))
    .addNode('firefly_session_wait',timed(c,'firefly_session_wait',fireflySessionWait))
    .addNode('firefly_guide',timed(c,'firefly_guide',fireflyGuide(c)))
    .addNode('firefly_dispatch',timed(c,'firefly_dispatch',fireflyDispatch(c)),{retryPolicy})
    .addNode('firefly_intake_wait',timed(c,'firefly_intake_wait',fireflyIntakeWait(c)))
    .addNode('firefly_finalize',timed(c,'firefly_finalize',fireflyFinalize(c)))
    .addNode('fan_out_videos', timed(c, 'fan_out_videos', fanOutVideos(c)))
    .addNode('firefly_videos', timed(c, 'firefly_videos', fireflyVideos(c)), { retryPolicy })
    .addNode('join_videos', timed(c, 'join_videos', joinVideos(c)))
    .addNode('narration_stage', timed(c, 'narration', narration(c)))
    .addNode('sound_design', timed(c, 'sound_design', soundDesign(c)))
    .addNode('sfx_render',timed(c,'sfx_render',sfxRender(c)))
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
    .addEdge(START, 'scene_plan').addConditionalEdges('scene_plan',s=>s.options.graph.mediaMode==='legacy'?'fan_out_frames':'env_check',['fan_out_frames','env_check'])
    .addEdge('env_check','visual_prompts_prepare').addEdge('visual_prompts_prepare','visual_prompts_wait').addEdge('visual_prompts_wait','visual_prompts_review_prepare').addEdge('visual_prompts_review_prepare','visual_prompts_review_wait')
    .addConditionalEdges('visual_prompts_review_wait',routePromptReview,['visual_prompts_prepare','image_generate_prepare'])
    .addEdge('image_generate_prepare','image_generate_wait').addEdge('image_generate_wait','image_review_prepare').addEdge('image_review_prepare','image_review_wait')
    .addConditionalEdges('image_review_wait',routeImageReview,['image_generate_wait','join_frames'])
    .addEdge('fan_out_frames', 'image_frames').addEdge('image_frames', 'join_frames')
    .addConditionalEdges('join_frames',s=>s.options.graph.mediaMode==='legacy'?'fan_out_videos':'firefly_session_prepare',['fan_out_videos','firefly_session_prepare'])
    .addEdge('firefly_session_prepare','firefly_session_wait').addConditionalEdges('firefly_session_wait',s=>s.environment?.sessionValid?'firefly_guide':'firefly_session_prepare',['firefly_guide','firefly_session_prepare'])
    .addEdge('firefly_guide','firefly_dispatch').addEdge('firefly_dispatch','firefly_intake_wait').addConditionalEdges('firefly_intake_wait',routeTakes,['firefly_dispatch','firefly_finalize']).addEdge('firefly_finalize','join_videos')
    .addEdge('fan_out_videos', 'firefly_videos').addEdge('firefly_videos', 'join_videos')
    .addEdge('join_videos', 'narration_stage').addEdge('narration_stage', 'sound_design').addConditionalEdges('sound_design',s=>s.options.graph.mediaMode==='real'?'sfx_render':'gatekeeper_stage',['sfx_render','gatekeeper_stage']).addEdge('sfx_render','gatekeeper_stage')
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
