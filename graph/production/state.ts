import { Annotation } from '@langchain/langgraph';
import type { MasterPipelineOptions } from '../../hsl/pipeline/masterOrchestrator';
import type { EpisodeTopicInput, HslLongFormProjectPlan } from '../../hsl/core/types';
import type { HslPublicationPackage } from '../../hsl/packaging/thumbnailSeoEngine';
import type { ComplianceReport } from '../../spec/hsl-compliance-checker';
export const STATE_VERSION = 1;
export interface GraphOptions { assetConcurrency: number; renderConcurrency: number; offline: boolean; gates: { render: boolean; publish: boolean } }
export type Options = MasterPipelineOptions & { graph: GraphOptions };
export interface AssetResult { beatId: string; path: string; status: 'ok' | 'failed' | 'skipped'; attempts: number; error?: string }
export interface ChunkResult { index: number; frameRange: [number, number]; outPath: string; status: 'ok' | 'failed' | 'skipped'; attempts: number; durationMs: number; error?: string }
export interface NodeError { node: string; message: string; stack?: string; at: string }
export interface Timing { node: string; startedAt: string; endedAt: string; ms: number; status?: 'ok' | 'skipped' | 'failed' }
const append = <T>() => Annotation<T[]>({ reducer: (a, b) => a.concat(b), default: () => [] });
const nullable = <T>() => Annotation<T | null>({ reducer: (_, b) => b, default: () => null });
export const ProductionState = Annotation.Root({
  stateVersion: Annotation<number>({ reducer: (_, b) => b, default: () => STATE_VERSION }),
  episodeId: Annotation<string>(), topicInput: Annotation<EpisodeTopicInput>(), options: Annotation<Options>(),
  scenePlan: nullable<HslLongFormProjectPlan>(), scenePlanPath: nullable<string>(),
  frames: append<AssetResult>(), videos: append<AssetResult>(), fireflyGuidePath: nullable<string>(),
  narration: nullable<{ path: string; publicCopyPath: string; durationSeconds: number }>(),
  soundDesign: nullable<{ audioPlanPath: string; audioTsxPath: string }>(),
  gatekeeper: nullable<{ passed: boolean; blockedReason?: string; verifiedBeats: number; autoRecovered: boolean; attempts: number }>(),
  assetServer: nullable<{ baseUrl: string }>(), renderProps: nullable<{ path: string }>(),
  renderChunks: append<ChunkResult>(), visualTrackPath: nullable<string>(),
  preMux: nullable<{ visualDuration: number; audioDuration: number; durationDiffSeconds: number; tempoFactor?: number; syncedAudioPath?: string; applied: boolean }>(),
  finalVideo: nullable<{ outPath: string; deliveryPath: string; runPath: string; durationSeconds: number }>(),
  packaging: nullable<HslPublicationPackage>(), compliance: nullable<ComplianceReport>(),
  productionStatus: Annotation<'RUNNING' | 'BLOCKED_PRE_RENDER' | 'ABORTED' | 'COMPLIANCE_FAILED' | 'COMPLETED'>({ reducer: (_, b) => b, default: () => 'RUNNING' }),
  gateDecisions: append<{ gate: 'render' | 'publish'; decision: 'proceed' | 'abort'; at: string }>(),
  errors: append<NodeError>(), timings: append<Timing>(),
});
export type State = typeof ProductionState.State;
export type Update = typeof ProductionState.Update;
export function threadId(episodeId: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(episodeId)) throw new Error('episodeId inválido');
  return `${episodeId}@v${STATE_VERSION}`;
}
export function initialState(options: MasterPipelineOptions & { graph?: Partial<Omit<GraphOptions, 'gates'>> & { gates?: Partial<GraphOptions['gates']> } } = {}): Update {
  const topicInput: EpisodeTopicInput = {
    episodeId: options.episodeId || 'HSL_EPISODE_001', topic: options.topic || 'THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING', targetMinutes: options.targetMinutes || 10,
    entity: options.entity || 'Airport Jet Fuel Logistics', mechanism: options.mechanism || 'Pipeline to Hydrant Manifold High-Pressure Injection',
    constraint: options.constraint || 'Hydrant Pressure Collapse at Node D (72 Units/min)', consequence: options.consequence || '56 Delayed Flights and $2.7M Cascading Economic Loss',
    thesis: options.thesis || 'The visible product is a flight; the hidden product is synchronized fuel logistics.',
  };
  threadId(topicInput.episodeId);
  const graph: GraphOptions = { assetConcurrency: 1, renderConcurrency: 1, offline: false, ...options.graph, gates: { render: false, publish: false, ...options.graph?.gates } };
  for (const value of [graph.assetConcurrency, graph.renderConcurrency]) if (!Number.isSafeInteger(value) || value < 1) throw new Error('Concurrency deve ser inteiro positivo');
  return { stateVersion: STATE_VERSION, episodeId: topicInput.episodeId, topicInput, options: { ...options, graph }, productionStatus: 'RUNNING' };
}
