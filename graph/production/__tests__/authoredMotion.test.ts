import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {initialState,type State} from '../state';
import type {Context} from '../runtime';
import {motionDispatch,routeMotionDispatch} from '../nodes/authored_motion';

const hash=(file:string)=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');

test('production motion dispatch fails closed before model calls when isolated worker is not configured',async()=>{
  const root=process.cwd(),episodeId=`AUTHORED_PARENT_TEST_${Date.now()}`,run=path.join(root,'runs',episodeId),audio=path.join(run,'audio','narration.wav'),alignment=path.join(run,'motion','alignment.json');
  fs.mkdirSync(path.dirname(audio),{recursive:true});fs.mkdirSync(path.dirname(alignment),{recursive:true});
  fs.writeFileSync(audio,'locked-audio');fs.writeFileSync(alignment,JSON.stringify({evidence:'forced_alignment'}));
  const script='Coolant carries heat away through the sealed manifold.';
  const scenePlan:any={episodeId,episodeTitle:'Cooling',subtitle:'Flow',thesis:'Heat must leave',totalDurationSeconds:5,totalFrames:150,totalBeatsCount:1,targetMinutes:5/60,acts:[{actNumber:1,title:'Flow',durationSeconds:5,beatsCount:1}],beats:[{beatId:'B001',sourceBeatId:'B001',actNumber:1,actTitle:'Flow',stage:'mechanism',durationSeconds:5,durationFrames:150,visualMode:'firefly_video',mediaProvider:'remotion-authored',shotSize:'ISOMETRIC_3D',cameraMovement:'ISOMETRIC_GLIDE',cinematicPrompt:'Coolant manifold',voiceoverScript:script,outputVideoPath:`public/runs/${episodeId}/motion/B001.mp4`} ]};
  const receipt:any={schema:'hsl.motion-narration.receipt.v1',alignment:{phrases:[{phraseId:'beat-0',intervalId:'episode',text:script,startWord:0,endWord:8,startMs:200,endMs:4200,confidence:.96}]}};
  fs.writeFileSync(path.join(run,'motion','narration-lock.json'),JSON.stringify(receipt));
  const state={...initialState({episodeId,graph:{mediaMode:'real',motionMode:'authored'}}),scenePlan,motionPlan:{schema:'hsl.authored-motion-plan/v1',inputHash:'x',scenes:[{beatId:'B001',visualObjective:'Show heat leaving through moving coolant',causalRelations:['flow transports heat'],factualConstraints:[],require3d:true}]},motionArtifacts:[],motionIssue:null,narrationLock:{audioPath:audio,audioSha256:hash(audio),durationSeconds:5,alignmentPath:alignment,alignmentSha256:hash(alignment)},videos:[]} as unknown as State;
  const previous=process.env.HSL_MOTION_WORKER_IMAGE;delete process.env.HSL_MOTION_WORKER_IMAGE;
  try{
    const update=await motionDispatch({root,deps:{} as Context['deps']})(state,{} as never);
    assert.equal((update as any).motionIssue?.status,'runtime_unavailable');
    assert.equal(routeMotionDispatch({...state,...update} as State),'motion_review_wait');
    assert.equal(state.motionArtifacts.length,0);
  }finally{if(previous===undefined)delete process.env.HSL_MOTION_WORKER_IMAGE;else process.env.HSL_MOTION_WORKER_IMAGE=previous;fs.rmSync(run,{recursive:true,force:true});fs.rmSync(path.join(root,'public','runs',episodeId),{recursive:true,force:true});}
});
