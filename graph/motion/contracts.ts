export interface MotionCue { text: string; startFrame: number; endFrame: number; confidence: number }
export interface MotionSceneInput {
  repoRoot: string; outputDir: string; episodeId: string; beatId: string; sourceBeatId?: string;
  script: string; previousScript?: string; nextScript?: string; claimRefs: string[];
  visualObjective: string; causalRelations: string[]; factualConstraints: string[];
  identity: Record<string, unknown>;
  timing: { fps: number; width: number; height: number; durationInFrames: number; startFrame: number };
  audio: { path: string; sha256: string };
  alignment: { path: string; sha256: string; cues: MotionCue[] };
  maxRevisions?: number; provider?: 'codex' | 'antigravity'; require3d?: boolean;
}
export type MotionRole = 'director' | 'code_analyst' | 'designer' | 'author' | 'technical_reviewer' | 'visual_reviewer';
export interface MotionAgentRequest { role: MotionRole; context: unknown; images: string[]; revision: number; input: MotionSceneInput; directory: string }
export interface MotionAgentResponse { output: unknown; provider: string; model: string | null; receiptPath?: string }
export interface SourcePackage { files: { path: string; content: string }[]; entrypoint: string }
export interface MotionReview { approved: boolean; reasoning: string; issues: { frame: number; scriptQuote: string; message: string; kind: 'concept' | 'implementation' }[] }
export interface RenderRequest { input: MotionSceneInput; source: SourcePackage; directory: string; frames: number[]; phase: 'preview' | 'final' }
export interface RenderResult { videoPath: string; frames: { frame: number; path: string }[]; durationInFrames: number; fps: number; width: number; height: number; renderer: string; isolation: string }
export interface MotionDependencies {
  agent(request: MotionAgentRequest): Promise<MotionAgentResponse>;
  render(request: RenderRequest): Promise<RenderResult>;
  preflight(input: MotionSceneInput): Promise<void>;
}
export interface MotionArtifact {
  engine: 'remotion-authored'; beatId: string; videoPath: string; sha256: string; inputHash: string;
  receiptPath: string; sourceManifestPath: string; previewPath: string; sourceDirectory: string;
  durationInFrames: number; fps: number; width: number; height: number;
  rendered: true; verified: true; approved: true;
}
export type MotionSceneResult = { status: 'approved'; artifact: MotionArtifact } | {
  status: 'review_required' | 'provider_unavailable' | 'runtime_unavailable'; beatId: string; reason: string; receiptPath: string;
};
export class MotionFailure extends Error {
  constructor(public readonly status: 'review_required' | 'provider_unavailable' | 'runtime_unavailable', message: string) { super(message); this.name = 'MotionFailure'; }
}
