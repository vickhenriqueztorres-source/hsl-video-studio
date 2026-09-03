import fs from 'node:fs'; import path from 'node:path'; import {interrupt} from '@langchain/langgraph';
import {Context,NodeFn,paths,readJson,writeJson} from '../runtime'; import type {VisualPrompt,PromptReview} from '../state';
const promptFile=(c:Context,s:any)=>path.join(paths(c,s).run,'visual-prompts.json');
export const visualPromptsPrepare=(c:Context):NodeFn=>async s=>{
 if(s.options.graph.mediaMode==='legacy') return {__status:'skipped'}; const target=promptFile(c,s); const cached=readJson<{beats:VisualPrompt[]}>(target);
 if(cached?.beats?.length && !(s.promptReview && s.promptReview.score<s.options.graph.promptReviewThreshold && s.promptIteration<2)) return {visualPrompts:cached.beats,visualPromptsPath:target,__status:'skipped'};
 const result=await c.deps.ide({threadId:s.episodeId,node:'visual-prompts',attempt:(s.promptIteration||0)+1,provider:'antigravity',ioMode:'stdout',maxAttempts:2,
 promptTemplate:'graph/prompts/visual-prompts.md',schemaPath:'graph/prompts/visual-prompts.schema.json',vars:{scenePlan:JSON.stringify(s.scenePlan),reviewIssues:JSON.stringify(s.promptReview?.issues??[])}},{repoRoot:c.root});
 if(result.headlessResult?.ok) { const value=result.headlessResult.output as {beats:VisualPrompt[]}; writeJson(target,value); return {visualPrompts:value.beats,visualPromptsPath:target,promptIteration:(s.promptIteration||0)+1}; }
 return {visualPromptsPath:target,promptIteration:(s.promptIteration||0)+1};
};
export const visualPromptsWait=(c:Context):NodeFn=>s=>{
 if(s.options.graph.mediaMode==='legacy') return {__status:'skipped'}; const target=promptFile(c,s); const value=readJson<{beats:VisualPrompt[]}>(target);
 if(!value?.beats?.length) { interrupt({kind:'VISUAL_PROMPTS_MANUAL',expectedPath:target}); return {}; }
 const expected=new Map(s.scenePlan!.beats.map(b=>[b.beatId,b.durationSeconds]));
 for(const b of value.beats) if(expected.get(b.beatId)!==b.durationSeconds||b.firstFrameFrom!=='image') throw new Error(`VISUAL_PROMPT_SCHEMA_MISMATCH:${b.beatId}`);
 return {visualPrompts:value.beats,visualPromptsPath:target};
};
export const visualPromptsReviewPrepare=(c:Context):NodeFn=>async s=>{
 if(s.options.graph.mediaMode==='legacy') return {__status:'skipped'}; const result=await c.deps.ide({threadId:s.episodeId,node:'visual-prompts-review',attempt:s.promptIteration||1,provider:'codex',ioMode:'file',readOnly:true,maxAttempts:2,
 promptTemplate:'graph/prompts/visual-prompts-review.md',schemaPath:'graph/prompts/visual-prompts-review.schema.json',vars:{visualPrompts:JSON.stringify(s.visualPrompts)}},{repoRoot:c.root});
 const review=result.headlessResult?.ok ? result.headlessResult.output as Omit<PromptReview,'iteration'> : {score:100,issues:[],skipped:true};
 return {promptReview:{...review,iteration:s.promptIteration||1}};
};
export const visualPromptsReviewWait=(_c:Context):NodeFn=>s=>{
 if(s.options.graph.mediaMode==='legacy') return {__status:'skipped'}; if(!s.promptReview) { interrupt({kind:'VISUAL_PROMPTS_REVIEW',threshold:s.options.graph.promptReviewThreshold}); return {}; }
 return {};
};
export const routePromptReview=(s:any)=>s.options.graph.mediaMode==='legacy'?'fan_out_frames':(s.promptReview.score>=s.options.graph.promptReviewThreshold||s.promptIteration>=2?'image_generate_prepare':'visual_prompts_prepare');
