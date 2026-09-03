import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { interrupt } from '@langchain/langgraph';
import { Context, NodeFn, paths, readJson, writeJson } from '../runtime';
import type { ImageQueue, ImageReviewItem } from '../state';

export const imageReviewPrepare=(c:Context):NodeFn=>async s=>{
  if(s.options.graph.mediaMode==='legacy')return{__status:'skipped'};
  const round=(s.imageReviewRounds??0)+1,queue=readJson<ImageQueue>(s.imageQueuePath!);if(!queue||queue.items.some(x=>x.status!=='done'))throw new Error('IMAGE_REVIEW_REQUIRES_VALID_QUEUE');
  const inputs=queue.items.map(item=>({beatId:item.beatId,prompt:fs.readFileSync(item.promptPath,'utf8'),imagePath:item.outputPath,imageHash:createHash('sha256').update(fs.readFileSync(item.outputPath)).digest('hex')}));
  const run=await c.deps.ide({threadId:s.episodeId,node:'image-review',attempt:round,provider:'codex',ioMode:'stdout',readOnly:true,maxAttempts:2,imageFiles:inputs.map(x=>x.imagePath),
    promptTemplate:'graph/prompts/image-review.md',schemaPath:'graph/prompts/image-review.schema.json',vars:{images:JSON.stringify(inputs),threshold:String(s.options.graph.imageReviewThreshold??75)}},{repoRoot:c.root});
  if(!run.headlessResult?.ok){return{imageReview:{items:[],skipped:true,reason:run.headlessResult?.reason??run.headlessResult?.validationErrors?.join('; ')??'Codex skipped',round},imageReviewRounds:round};}
  const output=run.headlessResult.output as {items:Omit<ImageReviewItem,'imageHash'>[]};
  const expected=new Set(inputs.map(x=>x.beatId));
  if(output.items.length!==expected.size||output.items.some(x=>!expected.delete(x.beatId))||expected.size){return{imageReview:{items:[],skipped:true,reason:'Resposta do revisor não cobre exatamente todos os beats',round},imageReviewRounds:round};}
  const hashes=new Map(inputs.map(x=>[x.beatId,x.imageHash]));const items=output.items.map(x=>({...x,imageHash:hashes.get(x.beatId)!}));
  const failed=items.filter(x=>x.score<(s.options.graph.imageReviewThreshold??75)||x.hasText);
  if(failed.length&&round<2){for(const item of queue.items){const review=failed.find(x=>x.beatId===item.beatId);if(review){item.status='pending';item.lastError=`review ${review.score}: ${review.issues.join('; ')}`;}}writeJson(s.imageQueuePath!,queue);}
  const review={items,round};writeJson(path.join(paths(c,s).run,'images',`image-review-${round}.json`),review);return{imageReview:review,imageReviewRounds:round};
};

export const imageReviewWait:NodeFn=s=>{
  if(s.options.graph.mediaMode==='legacy')return{__status:'skipped'};const r=s.imageReview!,threshold=s.options.graph.imageReviewThreshold??75;const passed=r.items.length>0&&r.items.every(x=>x.score>=threshold&&!x.hasText);
  if(passed||s.imageHumanApproved)return{};
  if(!r.skipped&&r.round<2)return{};
  const answer=interrupt({kind:'IMAGE_HUMAN_REVIEW',queuePath:s.imageQueuePath,reason:r.reason??'Revisão Codex abaixo do threshold após duas rodadas',review:r}) as {decision?:string};
  if(answer?.decision!=='proceed')throw new Error('IMAGE_HUMAN_REVIEW_REJECTED');return{imageHumanApproved:true};
};
export const routeImageReview=(s:any)=>{const threshold=s.options.graph.imageReviewThreshold??75;const passed=s.imageReview?.items?.length&&s.imageReview.items.every((x:any)=>x.score>=threshold&&!x.hasText);return passed||s.imageHumanApproved?'archive_images':'image_generate_run';};
