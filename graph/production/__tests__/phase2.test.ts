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

const base=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-phase2-'));
const imageFixture=path.join(base,'valid-1920x1080.png');

function prompts(plan:any){return{beats:plan.beats.map((b:any)=>({beatId:b.beatId,imagePrompt:`Photorealistic cinematic industrial documentary scene for ${b.beatId}, no text or logos`,videoPrompt:`Slow controlled documentary camera motion through the physical system for ${b.beatId}`,cameraMotion:b.cameraMovement,durationSeconds:b.durationSeconds,firstFrameFrom:'image'}))};}

function setup(name:string,opts:{missingTake?:number;lowReview?:boolean;imageLow?:boolean;codexSkipped?:boolean;sessionInvalid?:boolean;unresolved?:boolean;busy?:boolean}={}){
  const root=path.join(base,name);fs.mkdirSync(root,{recursive:true});const f=fixtures(root,name);
  let ideCalls=0,runCalls=0,probeCalls=0,visualReviewCalls=0,imageReviewCalls=0;
  const plan=f.deps.plan!({} as any),selected={...plan,beats:plan.beats.slice(0,2)};
  for(const b of selected.beats){const output=path.join(root,'runs',name,'images',b.beatId,`${b.beatId}.png`);fs.mkdirSync(path.dirname(output),{recursive:true});fs.copyFileSync(imageFixture,output);}
  const deps:any={...f.deps,
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
        visualReviewCalls++;const score=opts.lowReview&&visualReviewCalls===1?40:95;
        return{prepared:{} as any,headlessResult:{provider:'codex',ok:true,outputPath:'mock',durationMs:1,output:{score,issues:score>75?[]:[{beatId:selected.beats[0].beatId,message:'more concrete'}]}}};
      }
      return{prepared:{} as any,headlessResult:{provider:task.provider,ok:true,outputPath:'mock',durationMs:1,output:prompts(selected)}};
    },
    runFireflyTake:async(_e:any,runtime:string,guidePath:string)=>{if(opts.busy)throw new Error('FIREFLY_PROFILE_IN_USE:D:\\HSL-FIREFLY-PROFILE');runCalls++;const g=JSON.parse(fs.readFileSync(guidePath,'utf8'));if(runCalls!==opts.missingTake)media(path.join(runtime,'saida',g.items[0].name+'.mp4'),false,5);return{feed:{exitCode:0},run:{exitCode:0}};},
    detailedProbe:async(file:string)=>{const text=fs.readFileSync(file,'utf8'),p=JSON.parse(text.slice(0,text.indexOf('}')+1));return{duration:p.durationSeconds,width:p.width,height:p.height,codec:p.codecName,fps:24};},
    extractLastFrame:async(_v:string,out:string)=>{fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(imageFixture,out);},
    concatTakes:async(_takes:string[],out:string)=>{media(out,false,10);return{reencoded:[]};},
    renderSfx:async(_r:string,_p:string,out:string)=>{media(out,false,12);return{resolved:[{id:'one',description:'impact',offsetSeconds:0,targetDb:-15,sourcePath:'kenney'}],unresolved:opts.unresolved?[{id:'x',description:'drone',offsetSeconds:0,targetDb:-28,reason:'unresolved'}]:[]};},
    renderChunk:async(r:string,e:string)=>{media(path.join(r,'out','test',`.visual-${e}-2beats.mp4`));return{exitCode:0,stdout:'',stderr:'',timedOut:false,durationMs:1};},
    muxFinalWithSfx:async(_v:string,_m:string,_n:string,_s:string,out:string)=>media(out),
  };
  const saver=createCheckpointer(root),graph=createProductionGraph(saver,deps,root,{interruptAfter:['mux']});
  return{root,saver,graph,deps,get runCalls(){return runCalls},get ideCalls(){return ideCalls}};
}
async function runNew(x:ReturnType<typeof setup>,name:string,max=3){return executeProduction(x.graph,x.root,name,initialState({episodeId:name,graph:{mediaMode:'real',beats:2,maxGenerations:max,testRender:true}}));}

async function main(){
  requireSuccess(await spawnTool('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=navy:s=1920x1080','-frames:v','1',imageFixture],{cwd:base}),'TEST_IMAGE');
  assert.equal(takeCount(4.9),1);assert.equal(takeCount(7),2);assert.equal(takeCount(12),3);
  const pt=planTakes([{beatId:'B',imagePrompt:'i',videoPrompt:'v',cameraMotion:'x',durationSeconds:7,firstFrameFrom:'image'}],new Map([['B','first.png']]),base);
  assert.equal(pt[1].firstFrameSource,'previous-take');assert.equal(pt[1].dependsOnTake,'B-take-1');
  console.log('PASS 8: Kling-only take rule and explicit continuity dependency');

  const happy=setup('REAL_HAPPY',{unresolved:true});try{const s=await runNew(happy,'REAL_HAPPY');assert.deepEqual(s.next,['packaging_stage']);assert.equal(s.values.videoTakes.length,3);assert.equal(s.values.generationCount,3);assert.equal(s.values.sfxUnresolved.length,1);assert.ok(s.values.finalVideo?.outPath.includes(path.join('out','test')));console.log('PASS 1,6: real two-beat flow through mux and visible unresolved SFX');}finally{happy.saver.db.close();}

  const queueCase=setup('IMAGE_QUEUE');for(const b of ['SCENE_001','SCENE_002'])fs.rmSync(path.join(queueCase.root,'runs','IMAGE_QUEUE','images',b),{recursive:true,force:true});
  try{
    let s=await runNew(queueCase,'IMAGE_QUEUE');const first=s.tasks.flatMap(t=>t.interrupts);assert.equal(first.length,1);assert.equal((first[0].value as any).kind,'IMAGE_QUEUE');
    const queuePath=(first[0].value as any).queuePath,queue=JSON.parse(fs.readFileSync(queuePath,'utf8')) as ImageQueue;assert.equal(queue.items.length,2);assert.ok(queue.items.every(x=>x.status==='pending'));
    fs.mkdirSync(path.dirname(queue.items[0].outputPath),{recursive:true});fs.copyFileSync(imageFixture,queue.items[0].outputPath);fs.mkdirSync(path.dirname(queue.items[1].outputPath),{recursive:true});fs.writeFileSync(queue.items[1].outputPath,'invalid');
    s=await executeProduction(queueCase.graph,queueCase.root,'IMAGE_QUEUE',new Command({resume:{resumed:true}}));assert.equal((s.tasks[0].interrupts[0].value as any).kind,'IMAGE_QUEUE');assert.match(JSON.parse(fs.readFileSync(queuePath,'utf8')).items[1].lastError,/PNG/);
    console.log('PASS 11,12: one episode queue interrupt and invalid PNG requeues with lastError');
  }finally{queueCase.saver.db.close();}

  const fixDir=path.join(base,'fix'),jpg=path.join(fixDir,'BEAT.jpg'),png=path.join(fixDir,'BEAT.png'),queuePath=path.join(fixDir,'QUEUE.json');fs.mkdirSync(fixDir,{recursive:true});
  requireSuccess(await spawnTool('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=red:s=1600x900','-frames:v','1',jpg],{cwd:base}),'TEST_JPG');
  fs.writeFileSync(queuePath,JSON.stringify({episodeId:'FIX',threadId:'FIX@v2',spec:{aspect:'16:9',minWidth:1920,format:'png',noText:true},items:[{beatId:'BEAT',promptPath:'prompt',outputPath:png,status:'pending',attempts:0}],resumeCommand:'resume'},null,2));
  const fixed=await validateQueue(queuePath,true);assert.equal(fixed.queue.items[0].status,'done');assert.equal(fixed.results[0].width,1920);assert.equal(fixed.results[0].height,1080);
  console.log('PASS 13: --fix converts 1600x900 JPG to valid 1920x1080 PNG');

  const imageLow=setup('IMAGE_REVIEW_LOW',{imageLow:true});try{let s=await runNew(imageLow,'IMAGE_REVIEW_LOW');assert.equal((s.tasks[0].interrupts[0].value as any).kind,'IMAGE_QUEUE');await validateQueue(s.values.imageQueuePath!);s=await executeProduction(imageLow.graph,imageLow.root,'IMAGE_REVIEW_LOW',new Command({resume:{resumed:true}}));assert.deepEqual(s.next,['packaging_stage']);assert.equal(s.values.imageReview?.round,2);console.log('PASS 14: low image review requeues; second review passes');}finally{imageLow.saver.db.close();}

  const skipped=setup('IMAGE_REVIEW_SKIPPED',{codexSkipped:true});try{let s=await runNew(skipped,'IMAGE_REVIEW_SKIPPED');assert.equal((s.tasks[0].interrupts[0].value as any).kind,'IMAGE_HUMAN_REVIEW');assert.equal(skipped.runCalls,0);s=await executeProduction(skipped.graph,skipped.root,'IMAGE_REVIEW_SKIPPED',new Command({resume:{decision:'proceed'}}));assert.deepEqual(s.next,['packaging_stage']);console.log('PASS 15: skipped Codex requires human approval before Firefly');}finally{skipped.saver.db.close();}

  const recovery=setup('RECOVERY',{missingTake:2});try{let s=await runNew(recovery,'RECOVERY');assert.equal((s.tasks[0].interrupts[0].value as any).kind,'FIREFLY_RECOVERY');const t=s.values.videoTakes.find((x:any)=>x.status==='dispatched')!;media(t.outputPath,false,5);s=await executeProduction(recovery.graph,recovery.root,'RECOVERY',new Command({resume:{resumed:true}}));assert.deepEqual(s.next,['packaging_stage']);console.log('PASS 2: FIREFLY_RECOVERY interrupt and resume');}finally{recovery.saver.db.close();}
  const review=setup('REVIEW',{lowReview:true});try{const s=await runNew(review,'REVIEW');assert.equal(s.values.promptIteration,2);console.log('PASS 4: prompt review loops once then passes');}finally{review.saver.db.close();}
  const limit=setup('LIMIT');try{await assert.rejects(runNew(limit,'LIMIT',0),/MAX_GENERATIONS_EXCEEDED/);console.log('PASS 5: maxGenerations blocks before dispatch');}finally{limit.saver.db.close();}
  const busy=setup('PROFILE_BUSY',{busy:true});try{await assert.rejects(runNew(busy,'PROFILE_BUSY'),/FIREFLY_PROFILE_IN_USE/);console.log('PASS 9: profile in use fails clearly before generation');}finally{busy.saver.db.close();}
  const login=setup('LOGIN',{sessionInvalid:true});try{let s=await runNew(login,'LOGIN');assert.equal((s.tasks[0].interrupts[0].value as any).kind,'FIREFLY_LOGIN');s=await executeProduction(login.graph,login.root,'LOGIN',new Command({resume:{resumed:true}}));assert.deepEqual(s.next,['packaging_stage']);console.log('PASS 10: invalid session login interrupt and revalidation');}finally{login.saver.db.close();}
  console.log('Evidence '+base);
}
main().catch(e=>{console.error(e);process.exitCode=1});
