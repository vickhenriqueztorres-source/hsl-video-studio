import fs from 'node:fs';
import path from 'node:path';
import {interrupt} from '@langchain/langgraph';
import {executeMotionScene} from '../../motion';
import type {MotionSceneInput} from '../../motion';
import {
  createConfiguredNodeMotionAudioDependencies,
  inspectNarrationReceipt,
  prepareMotionNarration,
  sha256Canonical,
  sha256Text,
  tokenizeScript,
  type MotionNarrationReceipt,
  type PhraseRequest,
} from '../../motion-audio';
import type {AuthoredMotionArtifact, AuthoredMotionPlan, State} from '../state';
import type {HslLongFormProjectPlan} from '../../../hsl/core/types';
import {copyFile, type Context, type NodeFn, paths, readJson, writeJson} from '../runtime';
import {fileContentHash} from '../lib/renderIdentity';
import {assertMediaCoverage} from '../lib/mediaCoverage';
import {planMedia} from '../lib/mediaPlan';
import {narrationText} from './narration';
import {calibratePlanToNarration} from '../lib/plan';

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

function motionRoot(c:Context,s:State){return path.join(paths(c,s).run,'motion');}
function alignmentFile(c:Context,s:State){return path.join(motionRoot(c,s),'alignment.json');}
function lockReceiptFile(c:Context,s:State){return path.join(motionRoot(c,s),'narration-lock.json');}

function scripts(s:State, c?:Context):readonly string[]{
  const plan = c ? (readJson<HslLongFormProjectPlan>(paths(c,s).plan) ?? s.scenePlan) : s.scenePlan;
  if(!plan?.beats.length)throw new Error('AUTHORED_MOTION_SCENE_PLAN_MISSING');
  return plan.beats.map(beat=>beat.voiceoverScript.replace(/\s+/g,' ').trim());
}

function phraseRequests(parts:readonly string[]):PhraseRequest[]{
  let startWord=0;
  return parts.map((part,index)=>{
    const endWord=startWord+tokenizeScript(part).length;
    if(endWord<=startWord)throw new Error(`AUTHORED_MOTION_SCRIPT_EMPTY:${index}`);
    const phrase={phraseId:`beat-${index}`,intervalId:'episode',startWord,endWord};
    startWord=endWord;
    return phrase;
  });
}

function validCachedLock(c:Context,s:State,receipt:MotionNarrationReceipt|undefined,script:string):boolean{
  if(!receipt||receipt.schema!=='hsl.motion-narration.receipt.v1')return false;
  if(!fs.existsSync(receipt.lock.lockedPath)||!fs.existsSync(alignmentFile(c,s)))return false;
  if(!fs.existsSync(receipt.lock.sourcePath))return false;
  if(!s.narration?.path||fileContentHash(s.narration.path)!==receipt.lock.lockedAudioSha256)return false;
  const freshness=inspectNarrationReceipt(receipt,{lockedAudioSha256:fileContentHash(receipt.lock.lockedPath),sourceAudioSha256:fileContentHash(receipt.lock.sourcePath),scriptSha256:sha256Text(script)});
  const alignment=readJson<unknown>(alignmentFile(c,s));
  return freshness.valid&&sha256Canonical(alignment)===sha256Canonical(receipt.alignment);
}

/** Freezes and aligns narration before any model is allowed to author motion. */
export const narrationLock=(c:Context):NodeFn=>async s=>{
  if(s.options.graph.motionMode!=='authored')return{narrationLock:null,__status:'skipped'};
  let activePlan = readJson<HslLongFormProjectPlan>(paths(c,s).plan) ?? s.scenePlan;
  if(!s.narration||!activePlan)throw new Error('AUTHORED_MOTION_NARRATION_MISSING');
  const parts=scripts(s,c),script=narrationText(parts),root=motionRoot(c,s),receiptPath=lockReceiptFile(c,s);
  fs.mkdirSync(root,{recursive:true});
  const cached=readJson<MotionNarrationReceipt>(receiptPath);
  if(validCachedLock(c,s,cached,script)){
    return{narrationLock:{audioPath:cached!.lock.lockedPath,audioSha256:cached!.lock.lockedAudioSha256,durationSeconds:cached!.lock.durationSeconds,alignmentPath:alignmentFile(c,s),alignmentSha256:fileContentHash(alignmentFile(c,s))},__status:'skipped'};
  }
  const audioDuration = s.narration.durationSeconds;
  const currentPlanDuration = activePlan.totalFrames / FPS;

  // Option A (Pacing Master): Calibrate scene plan and beat allocations to actual natural narration duration
  if (Math.abs(audioDuration - currentPlanDuration) > 0.05) {
    activePlan = calibratePlanToNarration(activePlan, audioDuration);
    writeJson(paths(c, s).plan, activePlan);
  }

  const targetDurationSeconds = activePlan.totalFrames / FPS;
  const sourcePath=path.join(paths(c,s).run,'audio','narration-pre-motion.wav');
  const lockedPath=path.join(paths(c,s).run,'audio','narration-motion-locked.wav');
  copyFile(s.narration.path,sourcePath);
  if(fs.existsSync(lockedPath))fs.unlinkSync(lockedPath);
  const deps=createConfiguredNodeMotionAudioDependencies({cwd:c.root});
  const receipt=await prepareMotionNarration({
    script,sourceAudioPath:sourcePath,targetDurationSeconds,synchronizedAudioPath:lockedPath,
    intervals:[{intervalId:'episode',startMs:0,endMs:targetDurationSeconds*1000}],
    phrases:phraseRequests(parts),policy:{minimumWordConfidence:0.8},
  },deps);
  writeJson(alignmentFile(c,s),receipt.alignment);
  writeJson(receiptPath,receipt);
  if(receipt.lock.lockedPath!==s.narration.path){
    copyFile(receipt.lock.lockedPath,paths(c,s).narration);
    copyFile(receipt.lock.lockedPath,paths(c,s).publicNarration);
    const narrationReceipt=readJson<Record<string,unknown>>(paths(c,s).narrationReceipt);
    if(narrationReceipt)writeJson(paths(c,s).narrationReceipt,{...narrationReceipt,masterSha256:receipt.lock.lockedAudioSha256,motionLockedAt:new Date().toISOString(),motionLockReceipt:receiptPath});
  }
  return{
    scenePlan: activePlan,
    narration:{...s.narration,path:paths(c,s).narration,durationSeconds:receipt.lock.durationSeconds},
    narrationLock:{audioPath:paths(c,s).narration,audioSha256:fileContentHash(paths(c,s).narration),durationSeconds:receipt.lock.durationSeconds,alignmentPath:alignmentFile(c,s),alignmentSha256:fileContentHash(alignmentFile(c,s))}
  };
};

function sceneTiming(s:State,beatId:string){
  let startFrame=0;
  for(const beat of s.scenePlan!.beats){
    if(beat.beatId===beatId)return{beat,startFrame};
    startFrame+=beat.durationFrames;
  }
  throw new Error(`AUTHORED_MOTION_BEAT_MISSING:${beatId}`);
}

/** Authors one missing scene per graph step, preserving a checkpoint between scenes. */
export const motionDispatch=(c:Context):NodeFn=>async s=>{
  if(s.options.graph.motionMode!=='authored')return{motionIssue:null,__status:'skipped'};
  const activeMotionPlan = readJson<AuthoredMotionPlan>(path.join(paths(c,s).run,'motion','plan.json')) ?? s.motionPlan;
  if(!activeMotionPlan||!s.scenePlan||!s.narrationLock)throw new Error('AUTHORED_MOTION_INPUTS_MISSING');
  const done=new Set(s.motionArtifacts.map(item=>item.beatId));
  const brief=activeMotionPlan.scenes.find(item=>!done.has(item.beatId));
  if(!brief)return{motionIssue:null,__status:'skipped'};
  const {beat,startFrame}=sceneTiming(s,brief.beatId),index=s.scenePlan.beats.findIndex(item=>item.beatId===beat.beatId);
  const lock=readJson<MotionNarrationReceipt>(lockReceiptFile(c,s));
  const phrase=lock?.alignment.phrases[index];
  if(!phrase||phrase.phraseId!==`beat-${index}`)throw new Error(`AUTHORED_MOTION_ALIGNMENT_MISSING:${beat.beatId}`);
  const localStart=Math.round(phrase.startMs/1000*FPS)-startFrame;
  const localEnd=Math.round(phrase.endMs/1000*FPS)-startFrame;
  if(localStart<0||localEnd>beat.durationFrames||localEnd<=localStart){
    return{motionIssue:{beatId:beat.beatId,status:'review_required' as const,reason:`MOTION_ALIGNMENT_OUTSIDE_BEAT:${localStart}:${localEnd}/${beat.durationFrames}`,receiptPath:lockReceiptFile(c,s)}};
  }
  const cleanScripts=scripts(s,c);
  const ch = s.channelSnapshot?.channelId ?? s.channelId ?? (s.episodeId.startsWith('BRECHA_') ? 'brecha' : 'hsl');
  const isBrecha = ch === 'brecha';
  const channelPalette = isBrecha
    ? { background: '#0D0D0F', foreground: '#E8E2D7', yellow: '#FF5A47', red: '#FF5A47', accent: '#4F9B96', mint: '#BCD5C2' }
    : { background: '#07080B', foreground: '#E8ECF2', yellow: '#FFE500', red: '#FF2E00' };
  const channelStyle = isBrecha
    ? 'investigative digital security and fraud documentary; forensic isometric diagrams; sober Nordic/Fincher lighting; labelled reconstructions'
    : 'technical documentary; original explanatory motion';

  const input:MotionSceneInput={
    repoRoot:c.root,outputDir:motionRoot(c,s),episodeId:s.episodeId,beatId:beat.beatId,sourceBeatId:beat.sourceBeatId,
    script:cleanScripts[index],previousScript:cleanScripts[index-1],nextScript:cleanScripts[index+1],
    claimRefs:beat.evidenceRefs ? [...beat.evidenceRefs] : [],
    visualObjective:brief.visualObjective,causalRelations:brief.causalRelations,
    factualConstraints:brief.factualConstraints.map(c => c.replace(/duração de \d+ frames/gi, `duração de ${beat.durationFrames} frames`)),
    identity:{channel:ch.toUpperCase(),palette:channelPalette,style:channelStyle},
    timing:{fps:FPS,width:WIDTH,height:HEIGHT,durationInFrames:beat.durationFrames,startFrame},
    audio:{path:s.narrationLock.audioPath,sha256:fileContentHash(s.narrationLock.audioPath)},
    alignment:{path:s.narrationLock.alignmentPath,sha256:fileContentHash(s.narrationLock.alignmentPath),cues:[{text:phrase.text,startFrame:localStart,endFrame:localEnd,confidence:phrase.confidence}]},
    maxRevisions:5,provider:'codex',require3d:brief.require3d,
  };
  const result=await executeMotionScene(input);
  if(result.status!=='approved')return{motionIssue:{beatId:result.beatId,status:result.status,reason:result.reason,receiptPath:result.receiptPath}};
  const publicPath=path.join(c.root,'public','runs',s.episodeId,'motion',`${beat.beatId}.mp4`);
  copyFile(result.artifact.videoPath,publicPath);
  const artifact:AuthoredMotionArtifact={...result.artifact};
  return{
    narrationLock:{...s.narrationLock,audioSha256:fileContentHash(s.narrationLock.audioPath),alignmentSha256:fileContentHash(s.narrationLock.alignmentPath)},
    motionArtifacts:[artifact],
    videos:[{beatId:beat.beatId,path:result.artifact.videoPath,status:'ok',attempts:1,provider:'remotion-authored',sha256:result.artifact.sha256}],
    motionIssue:null
  };
};

export const motionReviewWait:NodeFn=s=>{
  if(!s.motionIssue)return{__status:'skipped'};
  const answer=interrupt({kind:'AUTHORED_MOTION_REVIEW',...s.motionIssue,message:'Corrija o runtime/provedor ou revise o diagnóstico; depois escolha retry. Use abort para encerrar esta produção.'}) as {decision?:string};
  if(answer?.decision==='abort')return{productionStatus:'ABORTED',motionIssue:null,gateDecisions:[{gate:'motion',decision:'abort',at:new Date().toISOString()}]};
  if(answer?.decision!=='retry'&&!(answer as any)?.resumed)throw new Error('AUTHORED_MOTION_DECISION_INVALID');
  return{
    motionIssue:null,
    ...(s.narrationLock?{narrationLock:{...s.narrationLock,audioSha256:fileContentHash(s.narrationLock.audioPath),alignmentSha256:fileContentHash(s.narrationLock.alignmentPath)}}:{}),
  };
};

export function routeMotionDispatch(s:State){
  if(s.motionIssue)return'motion_review_wait';
  return s.motionArtifacts.length<(s.motionPlan?.scenes.length??0)?'motion_dispatch':'motion_join';
}

export const motionJoin=(c:Context):NodeFn=>s=>{
  if(s.options.graph.motionMode!=='authored')return{__status:'skipped'};
  if(!s.motionPlan||s.motionArtifacts.length!==s.motionPlan.scenes.length)throw new Error('AUTHORED_MOTION_FAN_IN_INCOMPLETE');
  if(s.scenePlan && s.mediaPlan){
    const authored = new Set(s.mediaPlan.authoredBeatIds ?? s.mediaPlan.beats.filter(beat => beat.provider === 'remotion-authored').map(beat => beat.beatId));
    const footage = new Set(s.mediaPlan.footageBeatIds ?? s.mediaPlan.beats.filter(beat => beat.provider === 'licensed-footage').map(beat => beat.beatId));
    const expected = planMedia(s.scenePlan, s.mediaPlan.policy, authored, footage);
    s.scenePlan = expected.scenePlan;
    s.mediaPlan = expected.mediaPlan;
  }
  assertMediaCoverage(c,s);
  if(s.mediaPlan){
    writeJson(path.join(paths(c,s).run,'media-plan.json'),s.mediaPlan);
    writeJson(path.join(paths(c,s).run,'media-scene-plan.json'),s.scenePlan);
    writeJson(path.join(paths(c,s).run,'scene-plan.json'),s.scenePlan);
  }
  return{...(s.mediaPlan?{mediaPlan:s.mediaPlan,scenePlan:s.scenePlan}:{})};
};
