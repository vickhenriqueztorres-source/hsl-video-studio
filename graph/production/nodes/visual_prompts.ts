import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {interrupt} from '@langchain/langgraph';
import {Context, NodeFn, paths, readJson, writeJson} from '../runtime';
import type {State, VisualPrompt, PromptReview} from '../state';
import {PHOTOGRAPHIC_CONTRACT_VERSION} from '../../../hsl/startframe/photographicPrompt';

const promptFile = (c: Context, s: State) => path.join(paths(c, s).run, 'visual-prompts.json');
export const photographicBeats=(s:State)=>s.scenePlan?.beats.filter(beat=>beat.mediaProvider!=='remotion-authored')??[];
const sourceHash = (s: State) => createHash('sha256').update(JSON.stringify({
  contract: PHOTOGRAPHIC_CONTRACT_VERSION, brief: s.topicInput, plan: s.scenePlan,
  template: fs.readFileSync(path.join(__dirname, '../../prompts/visual-prompts.md'), 'utf8'),
  repairTemplate: fs.readFileSync(path.join(__dirname, '../../prompts/visual-prompts-repair.md'), 'utf8'),
})).digest('hex');
function matchesPlan(beats: VisualPrompt[] | undefined, s: State): boolean {
  const required=photographicBeats(s);
  if (!beats || beats.length !== required.length) return false;
  const expected = new Map(required.map(b => [b.beatId, b.durationSeconds]));
  return beats.every(b => expected.get(b.beatId) === b.durationSeconds && expected.delete(b.beatId) && b.firstFrameFrom === 'image')&&expected.size===0;
}
function affectedBeatIds(s: State): string[] {
  const valid = new Set(s.scenePlan?.beats.map(b => b.beatId) ?? []);
  return [...new Set((s.promptReview?.issues ?? []).map(issue => issue.beatId).filter(id => valid.has(id)))];
}
function matchesRepair(beats: VisualPrompt[] | undefined, ids: string[], s: State): boolean {
  if (!beats?.length || beats.length !== ids.length) return false;
  const expected = new Map((s.scenePlan?.beats ?? []).filter(b => ids.includes(b.beatId)).map(b => [b.beatId, b.durationSeconds]));
  return beats.every(b => expected.get(b.beatId) === b.durationSeconds && expected.delete(b.beatId) && b.firstFrameFrom === 'image') && expected.size === 0;
}

export const visualPromptsPrepare = (c: Context): NodeFn => async s => {
  if (s.options.graph.mediaMode === 'legacy') return {__status: 'skipped'};
  const target = promptFile(c, s), signature = sourceHash(s);
  if(!photographicBeats(s).length){writeJson(target,{beats:[],sourceHash:signature});return{visualPrompts:[],visualPromptsPath:target,__status:'skipped'};}
  const cached = readJson<{beats: VisualPrompt[]; sourceHash?: string}>(target);
  if (cached?.sourceHash === signature && matchesPlan(cached.beats, s) &&
      !(s.promptReview && s.promptReview.score < s.options.graph.promptReviewThreshold &&
        !s.promptReviewHumanApproved && s.promptIteration < s.options.graph.promptReviewMaxIterations)) {
    return {visualPrompts: cached.beats, visualPromptsPath: target, __status: 'skipped'};
  }
  const iteration = (s.promptIteration || 0) + 1;
  // Retry only rejected beats so a correction cannot regress prompts already accepted.
  const repairIds = s.promptReview && s.promptReview.score < s.options.graph.promptReviewThreshold && s.visualPrompts.length
    ? affectedBeatIds(s) : [];
  // Provider-specific task folders prevent stale results across planners/briefs.
  for (const provider of ['antigravity', 'codex'] as const) {
    const repairHash = repairIds.length ? createHash('sha256').update(JSON.stringify({repairIds, issues:s.promptReview?.issues, prompts:s.visualPrompts})).digest('hex') : '';
    const selectedPlan = {...s.scenePlan,beats:photographicBeats(s).filter(b=>!repairIds.length||repairIds.includes(b.beatId))};
    const result = await c.deps.ide({threadId: s.episodeId,
      node: repairIds.length
        ? `visual-prompts-repair-${signature.slice(0, 8)}-${repairHash.slice(0, 8)}-${provider}`
        : `visual-prompts-${signature.slice(0, 12)}-${provider}`, attempt: iteration,
      provider, ioMode: 'stdout', maxAttempts: 2,
      promptTemplate: repairIds.length ? 'graph/prompts/visual-prompts-repair.md' : 'graph/prompts/visual-prompts.md',
      schemaPath: 'graph/prompts/visual-prompts.schema.json',
      vars: repairIds.length ? {
        affectedBeatIds: JSON.stringify(repairIds), affectedScenePlan: JSON.stringify(selectedPlan),
        currentPrompts: JSON.stringify(s.visualPrompts), episodeBrief: JSON.stringify(s.topicInput),
        reviewIssues: JSON.stringify(s.promptReview?.issues ?? []),
      } : {scenePlan: JSON.stringify(selectedPlan), episodeBrief: JSON.stringify(s.topicInput), reviewIssues: JSON.stringify(s.promptReview?.issues ?? [])},
    }, {repoRoot: c.root});
    if (result.headlessResult?.ok) {
      const value = result.headlessResult.output as {beats: VisualPrompt[]};
      if (repairIds.length) {
        if (!matchesRepair(value.beats, repairIds, s)) continue;
        const repaired = new Map(value.beats.map(beat => [beat.beatId, beat]));
        const merged = s.visualPrompts.map(beat => repaired.get(beat.beatId) ?? beat);
        if (!matchesPlan(merged, s)) continue;
        writeJson(target, {beats: merged, sourceHash: signature});
        return {visualPrompts: merged, visualPromptsPath: target, promptIteration: iteration};
      }
      if (!matchesPlan(value.beats, s)) continue;
      writeJson(target, {...value, sourceHash: signature});
      return {visualPrompts: value.beats, visualPromptsPath: target, promptIteration: iteration};
    }
  }
  return {visualPrompts: [], visualPromptsPath: target, promptIteration: iteration};
};
export const visualPromptsWait = (c: Context): NodeFn => s => {
  if (s.options.graph.mediaMode === 'legacy') return {__status: 'skipped'};
  if(!photographicBeats(s).length)return{__status:'skipped'};
  const target = promptFile(c, s), signature = sourceHash(s);
  const value = readJson<{beats: VisualPrompt[]; sourceHash?: string}>(target);
  if (value?.sourceHash !== signature || !matchesPlan(value.beats, s)) {
    interrupt({kind: 'VISUAL_PROMPTS_MANUAL', expectedPath: target, sourceHash: signature,
      reason: 'Prompts fotográficos completos indisponíveis. Forneça beats e sourceHash para este plano ou retome desde visual_prompts_prepare após corrigir o planner.'});
    return {};
  }
  return {visualPrompts: value.beats, visualPromptsPath: target};
};
export const visualPromptsReviewPrepare = (c: Context): NodeFn => async s => {
  if (s.options.graph.mediaMode === 'legacy') return {__status: 'skipped'};
  if(!photographicBeats(s).length)return{__status:'skipped'};
  const signature = createHash('sha256').update(JSON.stringify({source: sourceHash(s), prompts: s.visualPrompts,
    template: fs.readFileSync(path.join(__dirname, '../../prompts/visual-prompts-review.md'), 'utf8')})).digest('hex');
  let lastReason: string | undefined;
  for (const provider of ['antigravity', 'codex'] as const) {
    const result = await c.deps.ide({threadId: s.episodeId, node: `visual-prompts-review-${signature.slice(0, 12)}-${provider}`,
      attempt: s.promptIteration || 1, provider, ioMode: 'stdout', readOnly: true, maxAttempts: 2,
      promptTemplate: 'graph/prompts/visual-prompts-review.md', schemaPath: 'graph/prompts/visual-prompts-review.schema.json',
      vars: {visualPrompts: JSON.stringify(s.visualPrompts), episodeBrief: JSON.stringify(s.topicInput), scenePlan: JSON.stringify(s.scenePlan)},
    }, {repoRoot: c.root});
    if (result.headlessResult?.ok) {
      const review = result.headlessResult.output as Omit<PromptReview, 'iteration'>;
      return {promptReview: {...review, iteration: s.promptIteration || 1}};
    }
    lastReason = result.headlessResult?.reason;
  }
  return {promptReview: {
    score: 0,
    issues: [{beatId: 'GLOBAL', message: lastReason ?? 'Nenhum provedor IDE retornou uma revisão validada'}],
    iteration: s.promptIteration || 1,
    skipped: true,
  }};
};
export const visualPromptsReviewWait = (_c: Context): NodeFn => s => {
  if (s.options.graph.mediaMode === 'legacy') return {__status: 'skipped'};
  if (!s.promptReview) { interrupt({kind: 'VISUAL_PROMPTS_REVIEW', threshold: s.options.graph.promptReviewThreshold}); return {}; }
  const exhausted = s.promptIteration >= s.options.graph.promptReviewMaxIterations;
  if (s.promptReview.skipped || (s.promptReview.score < s.options.graph.promptReviewThreshold && exhausted)) {
    const answer = interrupt({
      kind: 'VISUAL_PROMPTS_HUMAN_REVIEW',
      expectedPath: s.visualPromptsPath,
      score: s.promptReview.score,
      threshold: s.options.graph.promptReviewThreshold,
      iterations: s.promptIteration,
      reason: s.promptReview.skipped
        ? 'Revisor automático indisponível; os prompts não foram liberados para geração.'
        : `Prompts permaneceram abaixo do threshold após ${s.promptIteration} revisões.`,
      review: s.promptReview,
    }) as {decision?: string};
    // An explicit retry extends the bounded review budget without approving a low score.
    if (answer?.decision === 'retry') return {promptReviewHumanApproved: false};
    if (answer?.decision !== 'proceed') throw new Error('VISUAL_PROMPTS_HUMAN_REVIEW_REJECTED');
    return {promptReviewHumanApproved: true};
  }
  return {};
};
export const routePromptReview = (s: State) => s.options.graph.mediaMode === 'legacy' ? 'fan_out_frames' : !photographicBeats(s).length?'archive_images':
  (s.promptReviewHumanApproved || s.promptReview!.score >= s.options.graph.promptReviewThreshold
    ? 'image_generate_prepare' : 'visual_prompts_prepare');
