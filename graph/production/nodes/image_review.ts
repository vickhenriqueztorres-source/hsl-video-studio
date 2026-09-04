import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { interrupt } from '@langchain/langgraph';
import { Context, NodeFn, paths, readJson, writeJson } from '../runtime';
import type { ImageQueue, ImageReviewItem } from '../state';
import {emitLive} from '../telemetry';

interface ReviewInput {beatId:string;prompt:string;imagePath:string;imageHash:string;continuityRefs?:string[]}
export function reviewBatches(inputs:ReviewInput[]){
  const byId=new Map(inputs.map(x=>[x.beatId,x]));
  const batches:{inputs:ReviewInput[];references:ReviewInput[]}[]=[];
  const make=(targets:ReviewInput[])=>{
    const refs=new Set<string>();
    for(const input of targets){
      const explicit=(input.continuityRefs??[]).filter(id=>id!==input.beatId);
      for(const id of explicit.length?explicit:[inputs[inputs.indexOf(input)-1]?.beatId].filter(Boolean))refs.add(id);
    }
    for(const input of targets)refs.delete(input.beatId);
    const references=[...refs].map(id=>{const ref=byId.get(id);if(!ref)throw new Error(`IMAGE_REVIEW_REFERENCE_MISSING:${id}`);return ref;});
    return{inputs:targets,references};
  };
  const fits=(batch:ReturnType<typeof make>)=>{
    const attached=[...batch.references,...batch.inputs];
    return batch.inputs.length<=3&&attached.length<=8&&attached.reduce((n,x)=>n+fs.statSync(x.imagePath).size,0)<=24*1024*1024;
  };
  for(const input of inputs){
    const current=batches[batches.length-1],candidate=make([...(current?.inputs??[]),input]);
    if(current&&fits(candidate)){batches[batches.length-1]=candidate;continue;}
    const single=make([input]);if(!fits(single))throw new Error(`IMAGE_REVIEW_ATTACHMENT_TOO_LARGE:${input.beatId}`);
    batches.push(single);
  }
  return batches;
}

export const imageReviewPrepare=(c:Context):NodeFn=>async s=>{
  if(s.options.graph.mediaMode==='legacy')return{__status:'skipped'};
  const round=(s.imageReviewRounds??0)+1,queue=readJson<ImageQueue>(s.imageQueuePath!);if(!queue||queue.items.some(x=>x.status!=='done'))throw new Error('IMAGE_REVIEW_REQUIRES_VALID_QUEUE');
  const inputs=queue.items.map(item=>({beatId:item.beatId,prompt:fs.readFileSync(item.promptPath,'utf8'),imagePath:item.outputPath,imageHash:createHash('sha256').update(fs.readFileSync(item.outputPath)).digest('hex'),continuityRefs:s.visualPrompts?.find(p=>p.beatId===item.beatId)?.continuityRefs}));
  const batches=reviewBatches(inputs),items:ImageReviewItem[]=[];
  for(const [index,batch] of batches.entries()){
    emitLive(c.root,s.episodeId,{node:'image_review_prepare',kind:'progress',message:`Revisando lote ${index+1}/${batches.length}`,current:index,total:batches.length});
    const attachments=[...batch.references,...batch.inputs];
    const key=createHash('sha256').update(JSON.stringify({attachments,threshold:s.options.graph.imageReviewThreshold,template:fs.readFileSync(path.resolve(__dirname,'../../prompts/image-review.md'),'utf8')})).digest('hex');
    const receiptPath=path.join(paths(c,s).run,'images','review-batches',`${key}.json`);
    const saved=readJson<{key:string;items:ImageReviewItem[]}>(receiptPath);
    if(saved?.key===key&&saved.items.length===batch.inputs.length&&saved.items.every((x,i)=>x.beatId===batch.inputs[i].beatId&&x.imageHash===batch.inputs[i].imageHash)){
      items.push(...saved.items);continue;
    }
    if(process.env.HSL_GRAPH_PROGRESS==='1')console.log(`[revisão] lote ${index+1}/${batches.length}: ${batch.inputs.map(x=>x.beatId).join(', ')}`);
    const context=batch.references.length?`\nContinuity references (attached first, in this order; compare their visual identity but do NOT score them or include them in output.items): ${JSON.stringify(batch.references)}`:'';
    const run=await c.deps.ide({threadId:s.episodeId,node:batches.length===1?'image-review':`image-review-batch-${index+1}`,attempt:round*2-1,provider:'codex',ioMode:'stdout',readOnly:true,maxAttempts:2,imageFiles:attachments.map(x=>x.imagePath),
      promptTemplate:'graph/prompts/image-review.md',schemaPath:'graph/prompts/image-review.schema.json',vars:{images:JSON.stringify(batch.inputs)+context,threshold:String(s.options.graph.imageReviewThreshold??75)}},{repoRoot:c.root});
    if(!run.headlessResult?.ok){return{imageReview:{items:[],skipped:true,reason:`Lote ${index+1}/${batches.length}: `+(run.headlessResult?.reason??run.headlessResult?.validationErrors?.join('; ')??'Codex skipped'),round},imageReviewRounds:round};}
    const output=run.headlessResult.output as {items:Omit<ImageReviewItem,'imageHash'>[]};
    const expected=new Set(batch.inputs.map(x=>x.beatId));
    if(output.items.length!==expected.size||output.items.some(x=>!expected.delete(x.beatId))||expected.size){return{imageReview:{items:[],skipped:true,reason:`Resposta do lote ${index+1} não cobre exatamente todos os beats`,round},imageReviewRounds:round};}
    const batchItems=batch.inputs.map(input=>({...output.items.find(x=>x.beatId===input.beatId)!,imageHash:input.imageHash}));
    writeJson(receiptPath,{key,round,batch:index+1,items:batchItems});items.push(...batchItems);
  }
  const failed=items.filter(x=>x.score<(s.options.graph.imageReviewThreshold??75)||x.hasText);
  emitLive(c.root,s.episodeId,{node:'image_review_prepare',kind:'progress',message:`${items.length} imagens revisadas; ${failed.length} reprovadas`,current:batches.length,total:batches.length});
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
