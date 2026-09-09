import { Annotation } from '@langchain/langgraph';
import type { MasterPipelineOptions } from '../../hsl/pipeline/masterOrchestrator';
import type { EpisodeTopicInput, HslLongFormProjectPlan } from '../../hsl/core/types';
import type { HslPublicationPackage } from '../../hsl/packaging/thumbnailSeoEngine';
import type { ComplianceReport } from '../../spec/hsl-compliance-checker';
import type { StorageEntry } from './storage/model';
import type { ImageGenerationIssue } from './lib/codexImages';
import type { MediaPlan, MediaPolicy } from './lib/mediaPlan';
import type { KlingAuthorization, KlingBudget } from './lib/firefly/ledger';
export const STATE_VERSION = 2;
export type MediaMode = 'legacy' | 'real';
export interface GraphOptions {
  assetConcurrency: number; renderConcurrency: number; offline: boolean;
  gates: { render: boolean; publish: boolean };
  mediaMode: MediaMode; mediaPolicy?: MediaPolicy; beats?: number; testRender: boolean; maxGenerations: number;
  promptReviewThreshold: number; promptReviewMaxIterations: number; images: { provider: 'codex' };
  imageReviewThreshold: number;
  motionMode: 'legacy' | 'authored'; motionMaxScenes: number; motionRequire3d: boolean;
  video: { takeSeconds: 5; splitOver: 5.5 };
  storageMode:'off'|'drive'; prune:'dry-run'|'apply'; keepLocalDeliverables:number;
}
export type Options = MasterPipelineOptions & { graph: GraphOptions };
export interface AssetResult { beatId: string; path: string; status: 'ok' | 'failed' | 'skipped'; attempts: number; error?: string; provider?: 'firefly-kling'|'local-ffmpeg'|'remotion-authored'|'none'; sha256?: string; recipeHash?: string }
export interface AuthoredMotionSceneBrief { beatId:string; visualObjective:string; causalRelations:string[]; factualConstraints:string[]; require3d:boolean }
export interface AuthoredMotionPlan { schema:'hsl.authored-motion-plan/v1'; inputHash:string; scenes:AuthoredMotionSceneBrief[] }
export interface AuthoredMotionArtifact { beatId:string; videoPath:string; sha256:string; receiptPath:string; sourceManifestPath:string; sourceDirectory:string; previewPath:string; durationInFrames:number; fps:number; width:number; height:number; engine:'remotion-authored'; inputHash:string; approved:true; verified:true; rendered:true }
export interface VisualPrompt { beatId: string; imagePrompt: string; videoPrompt: string; cameraMotion: string; durationSeconds: number; firstFrameFrom: 'image' | 'none'; negative?: string; continuityRefs?: string[] }
export interface PromptReview { score: number; issues: { beatId: string; message: string }[]; iteration: number; skipped?: boolean }
export interface ImageQueueItem { beatId: string; promptPath: string; outputPath: string; promptHash?:string; status: 'pending'|'done'|'rejected'; attempts: number; lastError?: string; generatedBy?:'codex-imagegen'|'antigravity-imagegen' }
export interface ImageQueue { episodeId: string; threadId: string; generator:'codex-imagegen'; spec: { aspect:'16:9'; minWidth:1920; format:'png'; noText:true }; items:ImageQueueItem[]; resumeCommand:string }
export interface ImageReviewItem { beatId:string; score:number; fidelity:string; hasText:boolean; issues:string[]; imageHash:string }
export interface ImageReview { items:ImageReviewItem[]; skipped?:boolean; reason?:string; round:number }
export interface VideoTake {
  beatId: string; takeIndex: number; dependsOnTake?: string; requestedSeconds: 5;
  actualSeconds?: number; firstFrameSource: 'image' | 'previous-take'; firstFramePath: string;
  outputPath: string; status: 'pending' | 'dispatched' | 'ok' | 'skipped' | 'failed';
  generationCounted?: boolean; startedAt?: string; endedAt?: string; error?: string;
  operationId?: string; recipeHash?: string; provider?: 'firefly-kling';
  /** Monotonic paid replacement revision; zero/undefined is the original operation. */
  revision?: number; replacesOperationId?: string;
}
export interface SfxItem { id: string; description: string; sourcePath?: string; offsetSeconds: number; targetDb: number; reason?: string }
export interface ChunkResult { index: number; frameRange: [number, number]; outPath: string; status: 'ok' | 'failed' | 'skipped'; attempts: number; durationMs: number; error?: string }
export interface NodeError { node: string; message: string; stack?: string; at: string }
export interface Timing { node: string; startedAt: string; endedAt: string; ms: number; status?: 'ok' | 'skipped' | 'failed' }
const append = <T>() => Annotation<T[]>({ reducer: (a, b) => a.concat(b), default: () => [] });
const nullable = <T>() => Annotation<T | null>({ reducer: (_, b) => b, default: () => null });
const keyedAssets = () =>
  Annotation<AssetResult[]>({
    reducer: (curr, updates) => {
      const map = new Map(curr.map(a => [a.beatId, a]));
      for (const u of updates) map.set(u.beatId, u);
      return Array.from(map.values());
    },
    default: () => []
  });
const keyedChunks = () =>
  Annotation<ChunkResult[]>({
    reducer: (curr, updates) => {
      const map = new Map(curr.map(a => [a.index, a]));
      for (const u of updates) map.set(u.index, u);
      return Array.from(map.values()).sort((a, b) => a.index - b.index);
    },
    default: () => []
  });
const keyedMotionArtifacts = () => Annotation<AuthoredMotionArtifact[]>({
  reducer: (curr, updates) => {
    const map = new Map(curr.map(value => [value.beatId, value]));
    for (const update of updates) map.set(update.beatId, update);
    return [...map.values()];
  }, default: () => []
});
export const ProductionState = Annotation.Root({
  stateVersion: Annotation<number>({ reducer: (_, b) => b, default: () => STATE_VERSION }),
  episodeId: Annotation<string>(), topicInput: Annotation<EpisodeTopicInput>(), options: Annotation<Options>(),
  scenePlan: nullable<HslLongFormProjectPlan>(), scenePlanPath: nullable<string>(),
  motionPlan: nullable<AuthoredMotionPlan>(), motionArtifacts: keyedMotionArtifacts(),
  motionIssue: nullable<{beatId:string;status:'review_required'|'provider_unavailable'|'runtime_unavailable';reason:string;receiptPath:string}>(),
  narrationLock: nullable<{audioPath:string;audioSha256:string;durationSeconds:number;alignmentPath:string;alignmentSha256:string}>(),
  mediaPlan: nullable<MediaPlan>(), klingBudget: nullable<KlingBudget>(), klingAuthorization: nullable<KlingAuthorization>(),
  fireflyIssue: nullable<{kind: string; reason: string; take?:string; receiptPath?:string; retryPolicy?:string}>(),
  environment: nullable<{ agentDir: string; profileDir: string; sessionValid?: boolean }>(),
  visualPrompts: Annotation<VisualPrompt[]>({ reducer: (_, b) => b, default: () => [] }),
  visualPromptsPath: nullable<string>(), promptReview: nullable<PromptReview>(), promptIteration: Annotation<number>({ reducer: (_, b) => b, default: () => 0 }),
  promptReviewHumanApproved: Annotation<boolean>({ reducer: (_, b) => b, default: () => false }),
  imageSpecs: Annotation<{ beatId: string; promptPath: string; expectedPath: string }[]>({ reducer: (_, b) => b, default: () => [] }),
  imageQueuePath: nullable<string>(), imageValidationRounds: Annotation<number>({reducer:(_,b)=>b,default:()=>0}),
  codexAuth: nullable<{authenticated:boolean;reason?:string}>(), imageGenerationIssue: nullable<ImageGenerationIssue>(),
  imageGenerationRetry: Annotation<boolean>({reducer:(_,b)=>b,default:()=>false}),
  imageReview: nullable<ImageReview>(), imageReviewRounds: Annotation<number>({reducer:(_,b)=>b,default:()=>0}),
  imageHumanApproved: Annotation<boolean>({reducer:(_,b)=>b,default:()=>false}),
  frames: keyedAssets(), videos: keyedAssets(), fireflyGuidePath: nullable<string>(),
  videoTakes: Annotation<VideoTake[]>({ reducer: (_, b) => b, default: () => [] }),
  generationCount: Annotation<number>({ reducer: (_, b) => b, default: () => 0 }),
  narration: nullable<{ path: string; publicCopyPath: string; durationSeconds: number }>(),
  soundDesign: nullable<{ audioPlanPath: string; audioTsxPath: string }>(),
  sfxTrackPath: nullable<string>(), sfxPlanPath: nullable<string>(), sfxQaPath: nullable<string>(),
  sfxResolved: Annotation<SfxItem[]>({ reducer: (_, b) => b, default: () => [] }),
  sfxUnresolved: Annotation<SfxItem[]>({ reducer: (_, b) => b, default: () => [] }),
  gatekeeper: nullable<{ passed: boolean; blockedReason?: string; verifiedBeats: number; autoRecovered: boolean; attempts: number }>(),
  assetServer: nullable<{ baseUrl: string }>(), renderProps: nullable<{ path: string }>(),
  renderChunks: keyedChunks(), visualTrackPath: nullable<string>(),
  preMux: nullable<{ visualDuration: number; audioDuration: number; durationDiffSeconds: number; tempoFactor?: number; syncedAudioPath?: string; applied: boolean }>(),
  finalVideo: nullable<{ outPath: string; deliveryPath: string; runPath: string; durationSeconds: number }>(),
  packaging: nullable<HslPublicationPackage>(), compliance: nullable<ComplianceReport>(),
  productionStatus: Annotation<'RUNNING' | 'BLOCKED_PRE_RENDER' | 'ABORTED' | 'COMPLIANCE_FAILED' | 'COMPLETED'>({ reducer: (_, b) => b, default: () => 'RUNNING' }),
  gateDecisions: append<{ gate: 'render' | 'publish' | 'kling' | 'motion'; decision: 'proceed' | 'abort'; at: string }>(),
  errors: append<NodeError>(), timings: append<Timing>(),
  storageIndex: append<StorageEntry>(),
});
export type State = typeof ProductionState.State;
export type Update = typeof ProductionState.Update;
export function threadId(episodeId: string) {
  if (!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(episodeId)) throw new Error('episodeId inválido');
  return `${episodeId.replace(/\//g, '__')}@v${STATE_VERSION}`;
}
export function initialState(options: MasterPipelineOptions & { graph?: Partial<Omit<GraphOptions, 'gates'>> & { gates?: Partial<GraphOptions['gates']> } } = {}): Update {
  const topicInput: EpisodeTopicInput = {
    episodeId: options.episodeId || 'HSL_EPISODE_001', topic: options.topic || 'THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING', targetMinutes: options.targetMinutes || 10,
    entity: options.entity || 'Airport Jet Fuel Logistics', mechanism: options.mechanism || 'Pipeline to Hydrant Manifold High-Pressure Injection',
    constraint: options.constraint || 'Hydrant Pressure Collapse at Node D (72 Units/min)', consequence: options.consequence || '56 Delayed Flights and $2.7M Cascading Economic Loss',
    thesis: options.thesis || 'The visible product is a flight; the hidden product is synchronized fuel logistics.',
  };
  threadId(topicInput.episodeId);
  const graph = { assetConcurrency: 1, renderConcurrency: 1, offline: false, mediaMode: 'real', testRender: false,
    maxGenerations: 0, promptReviewThreshold: 75, promptReviewMaxIterations: 6, imageReviewThreshold:75, storageMode:'off',prune:'dry-run',keepLocalDeliverables:1,...options.graph,
    motionMode: options.graph?.motionMode ?? 'legacy', motionMaxScenes: options.graph?.motionMaxScenes ?? 3, motionRequire3d: options.graph?.motionRequire3d ?? true,
    gates: { render: false, publish: false, ...options.graph?.gates }, images: { provider: 'codex' },
    video: { takeSeconds: 5 as const, splitOver: 5.5 as const } } as GraphOptions;
  graph.mediaPolicy ??= graph.mediaMode === 'legacy' ? 'local-motion' : 'firefly-hybrid';
  if (!['stills','local-motion','firefly-hybrid'].includes(graph.mediaPolicy)) throw new Error('MEDIA_POLICY_INVALID');
  if (graph.mediaPolicy === 'firefly-hybrid' && graph.mediaMode === 'legacy') throw new Error('MEDIA_POLICY_LEGACY_CONFLICT');
  for (const value of [graph.assetConcurrency, graph.renderConcurrency]) if (!Number.isSafeInteger(value) || value < 1) throw new Error('Concurrency deve ser inteiro positivo');
  if (graph.beats !== undefined && (!Number.isSafeInteger(graph.beats) || graph.beats < 1)) throw new Error('beats deve ser inteiro positivo');
  if (!Number.isSafeInteger(graph.maxGenerations) || graph.maxGenerations < 0) throw new Error('maxGenerations deve ser inteiro não negativo');
  if (graph.promptReviewThreshold < 0 || graph.promptReviewThreshold > 100) throw new Error('promptReviewThreshold deve estar entre 0 e 100');
  if (!Number.isSafeInteger(graph.promptReviewMaxIterations) || graph.promptReviewMaxIterations < 1 || graph.promptReviewMaxIterations > 12) throw new Error('promptReviewMaxIterations deve ser inteiro entre 1 e 12');
  if (graph.imageReviewThreshold < 0 || graph.imageReviewThreshold > 100) throw new Error('imageReviewThreshold deve estar entre 0 e 100');
  if(!['legacy','authored'].includes(graph.motionMode))throw new Error('motionMode deve ser legacy|authored');
  if(graph.motionMode==='authored'&&graph.mediaMode!=='real')throw new Error('motionMode authored requer mediaMode real');
  if(!Number.isSafeInteger(graph.motionMaxScenes)||graph.motionMaxScenes<1||graph.motionMaxScenes>12)throw new Error('motionMaxScenes deve ser inteiro entre 1 e 12');
  if(!['off','drive'].includes(graph.storageMode))throw new Error('storageMode deve ser off|drive');
  if(!['dry-run','apply'].includes(graph.prune))throw new Error('prune deve ser dry-run|apply');
  if(!Number.isSafeInteger(graph.keepLocalDeliverables)||graph.keepLocalDeliverables<0)throw new Error('keepLocalDeliverables deve ser inteiro não negativo');
  return { stateVersion: STATE_VERSION, episodeId: topicInput.episodeId, topicInput, options: { ...options, graph }, productionStatus: 'RUNNING' };
}
