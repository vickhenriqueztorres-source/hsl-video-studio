import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Command } from '@langchain/langgraph';
import { createCheckpointer } from '../../checkpointer';
import { spawnTool, requireSuccess } from '../../lib/proc';
import { createProductionGraph } from '../graph';
import { executeProduction } from '../runner';
import { initialState, type ImageQueue } from '../state';
import { fixtures, media } from './fixtures';
import { takeCount, planTakes } from '../lib/firefly/guide';
import { validateQueue } from '../lib/imageQueue';
import { normalizePlanDuration } from '../lib/plan';
import { renderFrameRanges, FRAME_RANGES } from '../lib/remotion';
import { reviewBatches, imageReviewPrepare } from '../nodes/image_review';
import { HslSceneDirectorAgent } from '../../../hsl/core/hslSceneDirectorAgent';

const base=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-phase2-'));
const imageFixture=path.join(base,'valid-1920x1080.png');
const regeneratedFixture=path.join(base,'regenerated-1920x1080.png');

const threeMinuteState = initialState({targetMinutes:3});
const threeMinutePlan = normalizePlanDuration(HslSceneDirectorAgent.planEpisodeFromScratch(threeMinuteState.topicInput!),3);
assert.equal(threeMinutePlan.totalFrames,5400);
assert.deepEqual(renderFrameRanges({options:threeMinuteState.options!,scenePlan:threeMinutePlan}),[[0,4499],[4500,5399]]);
assert.deepEqual(renderFrameRanges({options:initialState({graph:{mediaMode:'legacy'}}).options!,scenePlan:threeMinutePlan}),FRAME_RANGES);
assert.deepEqual(renderFrameRanges({options:initialState({graph:{testRender:true}}).options!,scenePlan:threeMinutePlan}),[[0,299]]);

function prompts(plan:any){return{beats:plan.beats.map((b:any)=>({beatId:b.beatId,imagePrompt:`Photorealistic cinematic industrial documentary scene for ${b.beatId}, no text or logos`,videoPrompt:`Slow controlled documentary camera motion through the physical system for ${b.beatId}`,cameraMotion:b.cameraMovement,durationSeconds:b.durationSeconds,firstFrameFrom:'image'}))};}

function setup(name:string,opts:{missingTake?:number;lowReview?:boolean;reviewUnavailable?:boolean;reviewAlwaysLow?:boolean;imageLow?:boolean;codexSkipped?:boolean;sessionInvalid?:boolean;unresolved?:boolean;busy?:boolean;authMissing?:boolean}={}){
  const root=path.join(base,name);fs.mkdirSync(root,{recursive:true});const f=fixtures(root,name);
  let ideCalls=0,runCalls=0,probeCalls=0,visualReviewCalls=0,imageReviewCalls=0,authChecks=0,imageRuns=0;
  const plan=f.deps.plan!({} as any),selected={...plan,beats:plan.beats.slice(0,2).map((b:any,i:number)=>i===1?{...b,durationSeconds:7,durationFrames:210}:b)};
  for(const b of selected.beats){const output=path.join(root,'runs',name,'images',b.beatId,`${b.beatId}.png`);fs.mkdirSync(path.dirname(output),{recursive:true});fs.copyFileSync(imageFixture,output);}
  const deps:any={...f.deps,
    plan:()=>selected,
    codexAccount:async()=>({authenticated:!opts.authMissing||++authChecks>1}),
    generateImages:async(queuePath:string)=>{imageRuns++;const q=JSON.parse(fs.readFileSync(queuePath,'utf8'));
      for(const item of q.items){if(name!=='IMAGE_QUEUE'){fs.mkdirSync(path.dirname(item.outputPath),{recursive:true});fs.copyFileSync(opts.imageLow&&imageRuns>1?regeneratedFixture:imageFixture,item.outputPath);}const v=require('../lib/imageQueue').validateImage(item.outputPath);item.status=v.ok?'done':'pending';item.lastError=v.ok?undefined:v.error;}
      fs.writeFileSync(queuePath,JSON.stringify(q));return q.items.some((x:any)=>x.status!=='done')?{kind:'IMAGE_GENERATION_RECOVERY',reason:'mock generation pending'}:null;},
    fireflyEnvironment:()=>({agentDir:root,profileDir:path.join(root,'profile'),python:'python'}),profileInUse:async()=>false,
    probeFireflySession:async()=>{probeCalls++;return opts.sessionInvalid?probeCalls>1:true;},openFireflyLogin:async()=>({exitCode:0,stdout:'',stderr:'',timedOut:false,durationMs:1}),
    ide:async(task:any)=>{
      ideCalls++;
      if(task.node==='image-review'){
        imageReviewCalls++;
        if(opts.codexSkipped)return{prepared:{} as any,headlessResult:{provider:'codex',ok:false,skipped:true,reason:'quota',outputPath:'mock',durationMs:1}};
        const score=opts.imageLow&&imageReviewCalls===1?40:95;
        return{prepared:{} as any,headlessResult:{provider:'codex',ok:true,outputPath:'mock',durationMs:1,output:{items:selected.beats.map((b:any)=>({beatId:b.beatId,score,fidelity:score>75?'faithful':'subject drift',hasText:false,issues:score>75?[]:['regenerate with exact subject']}))}}};
      }
      if(task.node==='visual-prompts-review'){
        if(opts.reviewUnavailable)return{prepared:{} as any,headlessResult:{provider:'codex',ok:false,reason:'review transport unavailable',outputPath:'mock',durationMs:1}};
        visualReviewCalls++;const score=opts.reviewAlwaysLow||(opts.lowReview&&visualReviewCalls===1)?40:95;
        return{prepared:{} as any,headlessResult:{provider:'codex',ok:true,outputPath:'mock',durationMs:1,output:{score,issues:score>75?[]:[{beatId:selected.beats[0].beatId,message:'more concrete'}]}}};
      }
      return{prepared:{} as any,headlessResult:{provider:task.provider,ok:true,outputPath:'mock',durationMs:1,output:prompts(selected)}};
    },
    runFireflyTake:async(_e:any,runtime:string,guidePath:string)=>{if(opts.busy)throw new Error('FIREFLY_PROFILE_IN_USE:D:\\HSL-FIREFLY-PROFILE');runCalls++;const g=JSON.parse(fs.readFileSync(guidePath,'utf8'));if(runCalls!==opts.missingTake)media(path.join(runtime,'saida',g.items[0].name+'.mp4'),false,5);return{feed:{exitCode:0},run:{exitCode:0}};},
    detailedProbe:async(file:string)=>{const text=fs.readFileSync(file,'utf8'),p=JSON.parse(text.slice(0,text.indexOf('}')+1));return{duration:p.durationSeconds,width:p.width,height:p.height,codec:p.codecName,fps:24};},
    extractLastFrame:async(_v:string,out:string)=>{fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(imageFixture,out);},
    concatTakes:async(_takes:string[],out:string)=>{media(out,false,10);return{reencoded:[]};},
    renderSfx:async(_r:string,_p:string,out:string)=>{media(out,false,12);return{resolved:[{id:'one',description:'impact',offsetSeconds:0,targetDb:-15,sourcePath:'kenney'}],unresolved:opts.unresolved?[{id:'x',description:'drone',offsetSeconds:0,targetDb:-28,reason:'unresolved'}]:[]};},
    renderChunk:async(r:string,e:string,index:number)=>{media(path.join(r,'out',`temp_p${index+1}_${e.toLowerCase()}.mp4`));return{exitCode:0,stdout:'',stderr:'',timedOut:false,durationMs:1};},
    muxFinalWithSfx:async(_v:string,_m:string,_n:string,_s:string,out:string)=>media(out),
  };
  const saver=createCheckpointer(root),graph=createProductionGraph(saver,deps,root,{interruptAfter:['mux']});
  return{root,saver,graph,deps,get runCalls(){return runCalls},get ideCalls(){return ideCalls},get imageRuns(){return imageRuns}};
}
async function runNew(x:ReturnType<typeof setup>,name:string,max=3){return executeProduction(x.graph,x.root,name,initialState({episodeId:name,graph:{mediaMode:'real',beats:2,maxGenerations:max,testRender:true}}));}

async function main(){
  requireSuccess(await spawnTool('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=navy:s=1920x1080','-frames:v','1',imageFixture],{cwd:base}),'TEST_IMAGE');
  requireSuccess(await spawnTool('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=blue:s=1920x1080','-frames:v','1',regeneratedFixture],{cwd:base}),'TEST_REGENERATED_IMAGE');
  const reviewInputs=Array.from({length:29},(_,i)=>({beatId:`SCENE_${i+1}`,prompt:'scene',imagePath:imageFixture,imageHash:'fixture',continuityRefs:i===28?['SCENE_1','SCENE_4']:undefined}));
  const batches=reviewBatches(reviewInputs);
  assert.deepEqual(batches.flatMap(b=>b.inputs.map(x=>x.beatId)),reviewInputs.map(x=>x.beatId));
  assert.ok(batches.every(b=>b.inputs.length+b.references.length<=8));
  const last=batches.find(b=>b.inputs.some(x=>x.beatId==='SCENE_29'))!;
  assert.ok(last.references.some(x=>x.beatId==='SCENE_1'));assert.ok(last.references.some(x=>x.beatId==='SCENE_4'));
  assert.throws(()=>reviewBatches([{...reviewInputs[0],continuityRefs:['MISSING']}]),/IMAGE_REVIEW_REFERENCE_MISSING/);
  console.log('PASS review batching: 29 scenes exactly once, bounded attachments, distant continuity references retained');
  const reviewRoot=path.join(base,'review-cache');fs.mkdirSync(reviewRoot,{recursive:true});
  const reviewPrompt=path.join(reviewRoot,'prompt.md'),reviewQueue=path.join(reviewRoot,'QUEUE.json');fs.writeFileSync(reviewPrompt,'industrial scene');
  fs.writeFileSync(reviewQueue,JSON.stringify({items:reviewInputs.slice(0,7).map(x=>({beatId:x.beatId,promptPath:reviewPrompt,outputPath:x.imagePath,status:'done'}))}));
  let batchCalls=0;
  const reviewNode=imageReviewPrepare({root:reviewRoot,deps:{ide:async(task:any)=>{
    batchCalls++;const targets=JSON.parse(task.vars.images.split('\nContinuity references')[0]);
    return{headlessResult:{ok:true,output:{items:targets.map((x:any)=>({beatId:x.beatId,score:90,fidelity:'faithful',hasText:false,issues:[]}))}}};
  }}} as any);
  const reviewState={...initialState({episodeId:'BATCH_CACHE'}),imageQueuePath:reviewQueue,imageReviewRounds:0} as any;
  const aggregate=await reviewNode(reviewState,{} as any);assert.equal((aggregate.imageReview as any)?.items.length,7);assert.equal(batchCalls,3);
  await reviewNode({...reviewState,imageReviewRounds:1},{} as any);assert.equal(batchCalls,3,'unchanged hashes reuse successful batch receipts across resume');
  console.log('PASS review batch aggregation and receipt reuse without repeated CLI requests');
  const canonical=HslSceneDirectorAgent.planEpisodeFromScratch((initialState({episodeId:'DURATION_CHECK'}) as any).topicInput),six=normalizePlanDuration(canonical,6);
  assert.equal(normalizePlanDuration(canonical,10),canonical);assert.equal(six.totalBeatsCount,58);assert.equal(six.totalFrames,10800);assert.equal(six.beats.reduce((n,b)=>n+b.durationFrames,0),10800);assert.equal(six.acts.length,8);assert.equal(six.beats.at(-1)?.beatId,'SCENE_058');
  console.log('PASS duration: 6-minute plan is normalized to 58 beats and exactly 10,800 frames');
  assert.equal(takeCount(4.9),1);assert.equal(takeCount(7),2);assert.equal(takeCount(12),3);
  const pt=planTakes([{beatId:'B',imagePrompt:'i',videoPrompt:'v',cameraMotion:'x',durationSeconds:7,firstFrameFrom:'image'}],new Map([['B','first.png']]),base);
  assert.equal(pt[1].firstFrameSource,'previous-take');assert.equal(pt[1].dependsOnTake,'B-take-1');
  console.log('PASS 8: Kling-only take rule and explicit continuity dependency');

  const happy=setup('REAL_HAPPY',{unresolved:true});try{media(path.join(happy.root,'out','real_happy.mp4'));const s=await runNew(happy,'REAL_HAPPY');assert.deepEqual(s.next,['packaging_stage']);assert.equal(s.values.videoTakes.length,2);assert.equal(s.values.generationCount,2);assert.equal(s.values.sfxUnresolved.length,1);assert.equal(s.values.renderChunks.length,1);assert.ok(s.values.finalVideo?.outPath.includes(path.join('out','test')));console.log('PASS 1,6: real two-beat flow renders and muxes even when a legacy full output exists');}finally{happy.saver.db.close();}

  const queueCase=setup('IMAGE_QUEUE');for(const b of ['SCENE_001','SCENE_002'])fs.rmSync(path.join(queueCase.root,'runs','IMAGE_QUEUE','images',b),{recursive:true,force:true});
  try{
    let s=await runNew(queueCase,'IMAGE_QUEUE');const first=s.tasks.flatMap(t=>t.interrupts);assert.equal(first.length,1);assert.equal((first[0].value as any).kind,'IMAGE_GENERATION_RECOVERY');
    const queuePath=(first[0].value as any).queuePath,queue=JSON.parse(fs.readFileSync(queuePath,'utf8')) as ImageQueue;assert.equal(queue.items.length,2);assert.ok(queue.items.every(x=>x.status==='pending'));
    fs.mkdirSync(path.dirname(queue.items[0].outputPath),{recursive:true});fs.copyFileSync(imageFixture,queue.items[0].outputPath);fs.mkdirSync(path.dirname(queue.items[1].outputPath),{recursive:true});fs.writeFileSync(queue.items[1].outputPath,'invalid');
    s=await executeProduction(queueCase.graph,queueCase.root,'IMAGE_QUEUE',new Command({resume:{resumed:true}}));assert.equal((s.tasks[0].interrupts[0].value as any).kind,'IMAGE_GENERATION_RECOVERY');assert.match(JSON.parse(fs.readFileSync(queuePath,'utf8')).items[1].lastError,/PNG/);
    console.log('PASS 11,12: one episode queue interrupt and invalid PNG requeues with lastError');
  }finally{queueCase.saver.db.close();}

  const fixDir=path.join(base,'fix'),jpg=path.join(fixDir,'BEAT.jpg'),png=path.join(fixDir,'BEAT.png'),queuePath=path.join(fixDir,'QUEUE.json');fs.mkdirSync(fixDir,{recursive:true});
  requireSuccess(await spawnTool('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=red:s=1600x900','-frames:v','1',jpg],{cwd:base}),'TEST_JPG');
  fs.writeFileSync(queuePath,JSON.stringify({episodeId:'FIX',threadId:'FIX@v2',generator:'codex-imagegen',spec:{aspect:'16:9',minWidth:1920,format:'png',noText:true},items:[{beatId:'BEAT',promptPath:'prompt',outputPath:png,status:'pending',attempts:0}],resumeCommand:'resume'},null,2));
  const fixed=await validateQueue(queuePath,true);assert.equal(fixed.queue.items[0].status,'done');assert.equal(fixed.results[0].width,1920);assert.equal(fixed.results[0].height,1080);
  assert.equal(fixed.queue.items[0].generatedBy,'codex-imagegen');
  console.log('PASS 13: --fix converts 1600x900 JPG to valid 1920x1080 PNG');

  const foreignQueue=path.join(fixDir,'FOREIGN.json');fs.writeFileSync(foreignQueue,JSON.stringify({...fixed.queue,generator:'other-provider'},null,2));
  await assert.rejects(validateQueue(foreignQueue),/IMAGE_GENERATOR_NOT_ALLOWED:other-provider/);
  console.log('PASS 16: non-Codex image generator is rejected');

  const imageLow=setup('IMAGE_REVIEW_LOW',{imageLow:true});try{const s=await runNew(imageLow,'IMAGE_REVIEW_LOW');assert.deepEqual(s.next,['packaging_stage']);assert.equal(s.values.imageReview?.round,2);assert.equal(imageLow.imageRuns,2);console.log('PASS 14: low review automatically regenerates via CLI and re-reviews without IDE interrupt');}finally{imageLow.saver.db.close();}
  const auth=setup('CODEX_AUTH',{authMissing:true});try{let s=await runNew(auth,'CODEX_AUTH');assert.equal((s.tasks[0].interrupts[0].value as any).kind,'CODEX_AUTH');assert.equal(auth.imageRuns,0);assert.equal(auth.ideCalls,0);s=await executeProduction(auth.graph,auth.root,'CODEX_AUTH',new Command({resume:{resumed:true}}));assert.deepEqual(s.next,['packaging_stage']);assert.equal(auth.imageRuns,1);console.log('PASS Codex account: interrupt without spawn in wait, login resume rechecks then generates');}finally{auth.saver.db.close();}

  const skipped=setup('IMAGE_REVIEW_SKIPPED',{codexSkipped:true});try{let s=await runNew(skipped,'IMAGE_REVIEW_SKIPPED');assert.equal((s.tasks[0].interrupts[0].value as any).kind,'IMAGE_HUMAN_REVIEW');assert.equal(skipped.runCalls,0);s=await executeProduction(skipped.graph,skipped.root,'IMAGE_REVIEW_SKIPPED',new Command({resume:{decision:'proceed'}}));assert.deepEqual(s.next,['packaging_stage']);console.log('PASS 15: skipped Codex requires human approval before Firefly');}finally{skipped.saver.db.close();}

  const recovery=setup('RECOVERY',{missingTake:2});try{let s=await runNew(recovery,'RECOVERY');assert.equal((s.tasks[0].interrupts[0].value as any).kind,'FIREFLY_RECOVERY');const t=s.values.videoTakes.find((x:any)=>x.status==='dispatched')!;media(t.outputPath,false,5);s=await executeProduction(recovery.graph,recovery.root,'RECOVERY',new Command({resume:{resumed:true}}));assert.deepEqual(s.next,['packaging_stage']);console.log('PASS 2: FIREFLY_RECOVERY interrupt and resume');}finally{recovery.saver.db.close();}
  const review=setup('REVIEW',{lowReview:true});try{const s=await runNew(review,'REVIEW');assert.equal(s.values.promptIteration,2);console.log('PASS 4: prompt review loops once then passes');}finally{review.saver.db.close();}
  for(const [name,opts,error] of [['REVIEW_UNAVAILABLE',{reviewUnavailable:true},/VISUAL_PROMPTS_REVIEW_UNAVAILABLE/],['REVIEW_FAILED',{reviewAlwaysLow:true},/VISUAL_PROMPTS_REVIEW_FAILED/]] as const){
    const x=setup(name,opts);try{await assert.rejects(runNew(x,name),error);assert.equal(x.imageRuns,0);assert.equal(x.runCalls,0);}finally{x.saver.db.close();}
  }
  console.log('PASS review failures: unavailable or twice rejected prompts never start images or Kling');
  const limit=setup('LIMIT');try{let s=await runNew(limit,'LIMIT',0);const gate=s.tasks.flatMap(t=>t.interrupts)[0]?.value as any;assert.equal(gate.kind,'KLING_BUDGET');assert.equal(gate.requiredGenerations,2);assert.equal(limit.runCalls,0);s=await executeProduction(limit.graph,limit.root,'LIMIT',new Command({resume:{decision:'proceed'},update:{options:{...s.values.options,graph:{...s.values.options.graph,maxGenerations:2}}}}));assert.deepEqual(s.next,['packaging_stage']);assert.equal(s.values.generationCount,2);console.log('PASS 5: exact Kling budget gate blocks, approves exact limit, then dispatches');}finally{limit.saver.db.close();}
  const busy=setup('PROFILE_BUSY',{busy:true});try{const s=await runNew(busy,'PROFILE_BUSY');const gate=s.tasks.flatMap(t=>t.interrupts)[0]?.value as any;assert.equal(gate.kind,'FIREFLY_RECOVERY');assert.match(gate.reason,/FIREFLY_PROFILE_IN_USE/);assert.equal(gate.retryPolicy,'manual-reconcile-no-auto-resubmit');console.log('PASS 9: profile in use opens safe recovery before generation');}finally{busy.saver.db.close();}
  const login=setup('LOGIN',{sessionInvalid:true});try{let s=await runNew(login,'LOGIN');assert.equal((s.tasks[0].interrupts[0].value as any).kind,'FIREFLY_LOGIN');s=await executeProduction(login.graph,login.root,'LOGIN',new Command({resume:{resumed:true}}));assert.deepEqual(s.next,['packaging_stage']);console.log('PASS 10: invalid session login interrupt and revalidation');}finally{login.saver.db.close();}
  console.log('Evidence '+base);
}
main().catch(e=>{console.error(e);process.exitCode=1});
