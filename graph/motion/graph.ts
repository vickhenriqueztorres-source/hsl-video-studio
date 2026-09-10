import fs from 'node:fs';
import path from 'node:path';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { MotionArtifact, MotionDependencies, MotionFailure, MotionReview, MotionRole, MotionSceneInput, MotionSceneResult, RenderResult, SourcePackage } from './contracts';
import { runMotionAgent, validateAgentOutput } from './runtime/agents';
import { atomicJson, collectCodeContext, fileHash, sha256, validateSource, within } from './runtime/source';
import { motionRuntimePreflight, renderMotion } from './runtime/render';

interface Work {
  input: MotionSceneInput; directory: string; inputHash: string; revision: number; conceptRevisions: number;
  code: ReturnType<typeof collectCodeContext>; director?: unknown; analyst?: unknown; design?: unknown; source?: SourcePackage;
  preview?: RenderResult; final?: RenderResult; frames: number[]; reviews: Record<string, MotionReview>;
  diagnostic?: string; needsConcept?: boolean; fatal?: MotionFailure['status']; result?: MotionSceneResult;
}
const MotionState = Annotation.Root({ work: Annotation<Work> });
type State = typeof MotionState.State;
const defaults: MotionDependencies = { agent: runMotionAgent, render: renderMotion, preflight: motionRuntimePreflight };

function validateInput(input: MotionSceneInput): void {
  if (!input.script?.trim() || input.script.trim().length < 20 || /\b(lorem ipsum|todo|placeholder)\b/i.test(input.script)) throw new Error('Motion requires a specific approved narration excerpt');
  if (!input.visualObjective?.trim() || !input.causalRelations?.length || input.causalRelations.some(s => !s.trim())) throw new Error('Missing explanatory objective or causal relation');
  const t = input.timing;
  if (![t.fps, t.width, t.height, t.durationInFrames].every(v => Number.isSafeInteger(v) && v > 0) || !Number.isSafeInteger(t.startFrame) || t.startFrame < 0 || t.width % 4 || t.height % 4 || t.durationInFrames > t.fps * 120) throw new Error('Invalid motion timing (integer fps, dimensions divisible by 4, maximum 120 seconds per scene)');
  if (!Number.isInteger(input.maxRevisions ?? 3) || (input.maxRevisions ?? 3) < 0 || (input.maxRevisions ?? 3) > 3) throw new Error('maxRevisions must be between 0 and 3');
  if (!/^[a-f0-9]{64}$/.test(input.audio.sha256) || fileHash(input.audio.path) !== input.audio.sha256 || fileHash(input.alignment.path) !== input.alignment.sha256) throw new Error('Locked audio/alignment hash mismatch');
  if (!input.alignment.cues.length || input.alignment.cues.some(c => !c.text.trim() || !input.script.includes(c.text) || !Number.isInteger(c.startFrame) || !Number.isInteger(c.endFrame) || c.startFrame < 0 || c.endFrame <= c.startFrame || c.endFrame > t.durationInFrames || !Number.isFinite(c.confidence) || c.confidence < 0.8 || c.confidence > 1)) throw new Error('Aligned cues must have literal script text, local frames and confidence >= 0.8');
  if (input.alignment.cues.some((cue, i, all) => i > 0 && cue.startFrame < all[i - 1].startFrame)) throw new Error('Alignment cues must be chronologically ordered');
}
function frameSamples(work: Work): number[] {
  const last = work.input.timing.durationInFrames - 1;
  const cues = (work.design as { cues: { frame: number }[] }).cues;
  const frames = new Set([0, last, Math.round(last / 4), Math.round(last / 2), Math.round(3 * last / 4)]);
  for (const cue of cues) for (const offset of [-1, 0, 1]) frames.add(Math.max(0, Math.min(last, cue.frame + offset)));
  for (const cue of work.input.alignment.cues) { frames.add(cue.startFrame); frames.add(Math.min(last, cue.endFrame)); }
  if (frames.size > 80) throw new Error('More than 80 cue samples: split scene into smaller beats');
  return [...frames].sort((a, b) => a - b);
}
function inspectReview(output: unknown, work: Work): MotionReview {
  const review = output as MotionReview;
  if (review.approved && review.issues.length) throw new Error('Review cannot approve unresolved issues');
  if (!review.approved && !review.issues.length) throw new Error('Rejection requires localized issues');
  if (review.issues.some(i => i.frame >= work.input.timing.durationInFrames || !work.input.script.includes(i.scriptQuote))) throw new Error('Review issue must cite an actual script quote and local frame');
  return review;
}
async function call(deps: MotionDependencies, work: Work, role: MotionRole, extra: unknown = {}, images: string[] = []): Promise<unknown> {
  const response = await deps.agent({ role, revision: work.revision, directory: work.directory, input: work.input, images, context: {
    input: work.input, repositoryCode: work.code, director: work.director, codeAnalysis: work.analyst, sceneDesign: work.design,
    source: work.source, previousReviews: work.reviews, correction: work.diagnostic, extra,
  } });
  validateAgentOutput(role, response.output);
  atomicJson(path.join(work.directory, `revision-${work.revision}`, `${role}-${sha256(JSON.stringify(extra)).slice(0, 8)}.json`), response);
  return response.output;
}

/** Per-invocation subgraph; disk receipts recover costly stages if a parent checkpoint replays this call. */
export function createMotionGraph(overrides: Partial<MotionDependencies> = {}) {
  const deps = { ...defaults, ...overrides };
  const guard = (operation: (work: Work) => Promise<Partial<Work>>) => async ({ work }: State): Promise<Partial<State>> => {
    try { return { work: { ...work, diagnostic: undefined, ...await operation(work) } }; }
    catch (error) { return { work: { ...work, diagnostic: error instanceof Error ? error.message : String(error), ...(error instanceof MotionFailure ? { fatal: error.status } : {}) } }; }
  };
  const next = (success: string) => ({ work }: State) => work.diagnostic ? work.fatal ? 'failed' : 'correct' : success;
  const graph = new StateGraph(MotionState)
    .addNode('director', guard(async work => ({ director: await call(deps, work, 'director') })))
    .addNode('code_analyst', guard(async work => ({ analyst: await call(deps, work, 'code_analyst') })))
    .addNode('designer', guard(async work => {
      const design = await call(deps, work, 'designer') as { technique: string; cues: { frame: number; scriptQuote: string }[] };
      if (work.input.require3d && design.technique !== '3d') throw new Error('Pilot requires real 3D geometry');
      if (design.cues.some(c => c.frame >= work.input.timing.durationInFrames || !work.input.script.includes(c.scriptQuote))) throw new Error('Design cues must cite narration and local scene frames');
      return { design, needsConcept: false, source: undefined, preview: undefined, final: undefined };
    }))
    .addNode('author', guard(async work => {
      const source = await call(deps, work, 'author') as SourcePackage; validateSource(source);
      const allSource = source.files.map(f => f.content).join('\n');
      if ((work.design as { technique: string }).technique === '3d' && (!/ThreeCanvas/.test(allSource) || !/<mesh[\s>]/.test(allSource))) throw new Error('3D design must implement actual ThreeCanvas mesh geometry');
      const sourceDir = path.join(work.directory, `revision-${work.revision}`, 'source');
      for (const file of source.files) { const destination = within(sourceDir, file.path); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, file.content); }
      atomicJson(path.join(work.directory, `revision-${work.revision}`, 'source-manifest.json'), { entrypoint: source.entrypoint, files: source.files.map(f => ({ path: f.path, sha256: sha256(f.content) })), inputHash: work.inputHash });
      return { source, frames: frameSamples(work), preview: undefined, final: undefined };
    }))
    .addNode('build_preview', guard(async work => ({ preview: await deps.render({ input: work.input, source: work.source!, directory: path.join(work.directory, `revision-${work.revision}`), frames: work.frames, phase: 'preview' }) })))
    .addNode('technical_review', guard(async work => {
      const review = inspectReview(await call(deps, work, 'technical_reviewer', { diagnostics: 'TypeScript strict check and preview render completed', preview: work.preview }), work);
      return { reviews: { ...work.reviews, technical: review }, ...(!review.approved ? { diagnostic: JSON.stringify(review.issues), needsConcept: review.issues.some(i => i.kind === 'concept') } : {}) };
    }))
    .addNode('visual_review', guard(async work => {
      const review = inspectReview(await call(deps, work, 'visual_reviewer', { phase: 'preview', orderedFrames: work.preview!.frames }, work.preview!.frames.map(f => f.path)), work);
      return { reviews: { ...work.reviews, preview: review }, ...(!review.approved ? { diagnostic: JSON.stringify(review.issues), needsConcept: review.issues.some(i => i.kind === 'concept') } : {}) };
    }))
    .addNode('final_render', guard(async work => ({ final: await deps.render({ input: work.input, source: work.source!, directory: path.join(work.directory, `revision-${work.revision}`), frames: work.frames, phase: 'final' }) })))
    .addNode('final_review', guard(async work => {
      const review = inspectReview(await call(deps, work, 'visual_reviewer', { phase: 'final', orderedFrames: work.final!.frames }, work.final!.frames.map(f => f.path)), work);
      return { reviews: { ...work.reviews, final: review }, ...(!review.approved ? { diagnostic: JSON.stringify(review.issues), needsConcept: review.issues.some(i => i.kind === 'concept') } : {}) };
    }))
    .addNode('correct', async ({ work }: State) => ({ work: { ...work, revision: work.revision + 1, conceptRevisions: work.conceptRevisions + (work.needsConcept ? 1 : 0) } }))
    .addNode('failed', async ({ work }: State) => {
      const result: MotionSceneResult = { status: work.fatal ?? 'review_required', beatId: work.input.beatId, reason: work.diagnostic ?? 'MOTION_REVIEW_REQUIRED: revision budget exhausted', receiptPath: path.join(work.directory, 'receipt.json') };
      atomicJson(result.receiptPath, { ...result, inputHash: work.inputHash, revision: work.revision, reviews: work.reviews, preview: work.preview }); return { work: { ...work, result } };
    })
    .addNode('publish', guard(async work => {
      validateInput(work.input); // Audio or alignment changed during generation invalidates publication.
      const final = work.final!; const timing = work.input.timing;
      if (final.durationInFrames !== timing.durationInFrames || final.fps !== timing.fps || final.width !== timing.width || final.height !== timing.height) throw new Error('Final physical contract mismatch');
      if (!work.reviews.technical?.approved || !work.reviews.preview?.approved || !work.reviews.final?.approved) throw new Error('Missing independent review approval');
      const artifact: MotionArtifact = { engine: 'remotion-authored', beatId: work.input.beatId, videoPath: final.videoPath, sha256: fileHash(final.videoPath), inputHash: work.inputHash, receiptPath: path.join(work.directory, 'receipt.json'), sourceManifestPath: path.join(work.directory, `revision-${work.revision}`, 'source-manifest.json'), sourceDirectory: path.join(work.directory, `revision-${work.revision}`, 'source'), previewPath: work.preview!.videoPath, durationInFrames: final.durationInFrames, fps: final.fps, width: final.width, height: final.height, rendered: true, verified: true, approved: true };
      const revisionDirectory = path.dirname(artifact.sourceManifestPath);
      const reviewReceipts = fs.readdirSync(revisionDirectory).filter(name => name.endsWith('.json')).map(name => path.join(revisionDirectory, name));
      const files = [path.join(work.directory, 'brief.json'), artifact.videoPath, artifact.previewPath, artifact.sourceManifestPath, ...reviewReceipts, ...work.source!.files.map(f => within(artifact.sourceDirectory, f.path)), ...final.frames.map(f => f.path), ...work.preview!.frames.map(f => f.path)];
      atomicJson(artifact.receiptPath, { status: 'approved', artifact, inputHash: work.inputHash, revision: work.revision, renderer: final.renderer, isolation: final.isolation, reviews: work.reviews, audio: work.input.audio, alignment: work.input.alignment, hashes: Object.fromEntries(files.map(file => [file, fileHash(file)])) });
      return { result: { status: 'approved', artifact } };
    }));
  graph.addEdge(START, 'director');
  const stages = ['director','code_analyst','designer','author','build_preview','technical_review','visual_review','final_render','final_review','publish'] as const;
  for (let i = 0; i < stages.length - 1; i++) graph.addConditionalEdges(stages[i], next(stages[i + 1]), [...stages, 'correct', 'failed']);
  graph.addConditionalEdges('publish', ({ work }) => work.result ? END : 'failed', [END, 'failed']);
  graph.addConditionalEdges('correct', ({ work }) => {
    if (work.revision > (work.input.maxRevisions ?? 3) || work.conceptRevisions > 1) return 'failed';
    if (!work.director) return 'director'; if (!work.analyst) return 'code_analyst';
    return !work.design || work.needsConcept ? 'designer' : 'author';
  }, ['failed','director','code_analyst','designer','author']);
  graph.addEdge('failed', END);
  return graph.compile();
}

export async function executeMotionScene(input: MotionSceneInput, overrides: Partial<MotionDependencies> = {}): Promise<MotionSceneResult> {
  let receiptPath = path.join(input.outputDir, 'motion-failure.json'); let lock: string | undefined;
  try {
    validateInput(input);
    const code = collectCodeContext(input.repoRoot);
    const implementation = ['graph/motion/graph.ts','graph/motion/runtime/agents.ts','graph/motion/runtime/source.ts','graph/motion/runtime/render.ts','graph/motion/runtime/worker.cjs','package-lock.json'].map(file => ({ file, hash: fileHash(path.join(input.repoRoot, file)) }));
    const inputHash = sha256(JSON.stringify({ version: 1, input, code, implementation, workerImage: process.env.HSL_MOTION_WORKER_IMAGE ?? null }));
    const directory = path.join(input.outputDir, `scene-${sha256(input.beatId).slice(0, 16)}`, inputHash);
    fs.mkdirSync(directory, { recursive: true }); receiptPath = path.join(directory, 'receipt.json');
    if (fs.existsSync(receiptPath)) {
      const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
      if (receipt.status === 'approved') {
        if (receipt.inputHash !== inputHash || !receipt.hashes || !Object.entries(receipt.hashes).every(([file, hash]) => fs.existsSync(file) && fileHash(file) === hash)) throw new Error('Previously approved artifact hash mismatch');
        return { status: 'approved', artifact: receipt.artifact };
      }
    }
    const lockPath = path.join(directory, '.lock');
    try { fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid }), { flag: 'wx' }); }
    catch { throw new MotionFailure('runtime_unavailable', 'Scene is locked by another invocation. Inspect and remove a stale .lock only after confirming its worker is stopped.'); }
    lock = lockPath;
    await (overrides.preflight ?? defaults.preflight)(input);
    atomicJson(path.join(directory, 'brief.json'), input);
    const graph = createMotionGraph(overrides);
    const output = await graph.invoke({ work: { input, directory, inputHash, revision: 0, conceptRevisions: 0, code, frames: [], reviews: {} } }, { recursionLimit: 80 });
    return output.work.result!;
  } catch (error) {
    const result: MotionSceneResult = { status: error instanceof MotionFailure ? error.status : 'review_required', beatId: input.beatId, reason: error instanceof Error ? error.message : String(error), receiptPath };
    // Never overwrite an approved receipt when an integrity check fails.
    if (!fs.existsSync(receiptPath)) atomicJson(receiptPath, result);
    return result;
  } finally { if (lock) fs.unlinkSync(lock); }
}
