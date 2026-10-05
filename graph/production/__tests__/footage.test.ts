import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { HslLongFormProjectPlan, HslSceneBeat } from '../../../hsl/core/types';
import type { FootageArtifact, FootageOptions } from '../../footage/contracts';
import { planFootage, validateFootageOptions } from '../../footage/planner';
import { acquireFootage, validateFootageArtifact } from '../../footage/acquire';
import { planMedia, validateMediaPlan } from '../lib/mediaPlan';

const options: FootageOptions = {
  mode:'auto', sources:['pexels'], maxTimelineShare:0.5, maxCandidatesPerBeat:6,
  maxQueryVariantsPerBeat:2, maxDownloadsPerBeat:2, downloadConcurrency:2,
  maxSearchRequestsPerEpisode:30, maxDownloadBytesPerEpisode:1024*1024,
  sourceAudio:'mute', fallback:'original-provider',
  targetVisualModes:['firefly_video'],
};
const beat=(id:string,overrides:Partial<HslSceneBeat>={}):HslSceneBeat=>({
  beatId:id,sourceBeatId:id,actNumber:1,actTitle:'System',stage:'context',durationSeconds:5,durationFrames:150,
  visualMode:'firefly_video',shotSize:'WIDE',cameraMovement:'SLOW_DOLLY_IN',narrativeRole:'KINETIC_FLOW',
  cinematicPrompt:'Documentary footage of airport baggage conveyors moving suitcases through a sorting hall',
  promptSubject:'airport baggage conveyors moving suitcases',voiceoverScript:'The conveyor moves each bag through the system.',...overrides,
});
const plan=(beats:HslSceneBeat[]):HslLongFormProjectPlan=>({episodeId:'FOOTAGE_TEST',episodeTitle:'Airport baggage system',subtitle:'',thesis:'',
  totalFrames:beats.reduce((n,b)=>n+b.durationFrames,0),totalDurationSeconds:beats.reduce((n,b)=>n+b.durationFrames,0)/30,
  totalBeatsCount:beats.length,targetMinutes:beats.reduce((n,b)=>n+b.durationFrames,0)/1800,
  acts:[{actNumber:1,title:'System',durationSeconds:beats.reduce((n,b)=>n+b.durationFrames,0)/30,beatsCount:beats.length}],beats});

test('footage planner reserves authored/diagram beats and stays inside the timeline budget',()=>{
  validateFootageOptions(options);
  const source=plan([beat('real'),beat('reserved'),beat('diagram',{infographicArchetype:'CUTAWAY'}),beat('still',{visualMode:'generated_image_35mm'})]);
  const briefs=planFootage(source,'hsl',options,new Set(['reserved']));
  assert.deepEqual(briefs.map(item=>item.beatId),['real']);
  assert.equal(briefs[0].durationFrames,150);
  assert.ok(briefs[0].queries[0].includes('airport'));
  assert.equal(planFootage(source,'hsl',{...options,mode:'off'}).length,0);
  assert.throws(()=>validateFootageOptions({...options,maxTimelineShare:0.8}),/SHARE_INVALID/);
});

test('approved footage becomes a distinct media provider without changing duration or Firefly fallback',()=>{
  const source=plan([beat('footage'),beat('firefly')]);
  const selected=planMedia(source,'firefly-hybrid',new Set(),new Set(['footage']));
  assert.equal(selected.mediaPlan.schema,'hsl-media-plan/v2');
  assert.deepEqual(selected.mediaPlan.footageBeatIds,['footage']);
  assert.deepEqual(selected.mediaPlan.fireflyBeatIds,['firefly']);
  assert.equal(selected.mediaPlan.totalTakes,1);
  assert.equal(selected.scenePlan.beats[0].mediaProvider,'licensed-footage');
  assert.equal(selected.scenePlan.beats[0].outputVideoPath,'public/runs/FOOTAGE_TEST/videos/footage.mp4');
  validateMediaPlan(selected.scenePlan,selected.mediaPlan);
});

test('footage validation binds media bytes to its rights receipt',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-footage-test-')),folder=path.join(root,'runs','FOOTAGE_TEST','footage');
  fs.mkdirSync(folder,{recursive:true});
  const original=path.join(folder,'original.mp4'),video=path.join(folder,'video.mp4'),rightsPath=path.join(folder,'rights.json'),recipe=path.join(folder,'recipe.json'),provenance=path.join(folder,'provenance.json'),review=path.join(folder,'review.json');
  fs.writeFileSync(original,'original footage bytes');fs.writeFileSync(video,'conformed footage bytes');
  fs.writeFileSync(rightsPath,JSON.stringify({schema:'hsl-footage-rights/v1',source:'pexels',externalId:'42',pageUrl:'https://www.pexels.com/video/42/',creator:'Creator',creatorUrl:'https://www.pexels.com/@creator',licenseName:'Pexels License',licenseUrl:'https://www.pexels.com/license/',commercialUse:true,modificationsAllowed:true,attributionRequired:false,creditLine:'Video by Creator on Pexels',checkedAt:new Date().toISOString(),policyVersion:'hsl-footage-rights/1',decision:'eligible'}));
  const digest=(file:string)=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const artifact:FootageArtifact={schema:'hsl-footage-artifact/v1',beatId:'beat',sourceBeatId:'beat',provider:'licensed-footage',source:'pexels',externalId:'42',sourcePageUrl:'https://www.pexels.com/video/42/',originalPath:original,originalSha256:digest(original),videoPath:video,videoSha256:digest(video),provenancePath:provenance,rightsReceiptPath:rightsPath,recipePath:recipe,durationFrames:150,durationSeconds:5,width:1920,height:1080,fps:30,rightsStatus:'approved',editorialStatus:'approved',technicalStatus:'approved',creditLine:'Video by Creator on Pexels',visualReviewPath:review};
  fs.writeFileSync(recipe,JSON.stringify({schema:'hsl-footage-conform/v1',originalSha256:artifact.originalSha256,durationFrames:150,fps:30,width:1920,height:1080,audio:'removed'}));
  fs.writeFileSync(review,JSON.stringify({schema:'hsl-footage-visual-review/v1',beatId:'beat',score:90,showsRealCameraFootage:true,semanticallyMatches:true,textOrWatermark:false,misleadingSpecificity:false,issues:[],artifactSha256:artifact.videoSha256,briefHash:'brief',approved:true}));
  fs.writeFileSync(provenance,JSON.stringify(artifact));
  const deps={inspect:()=>({durationSeconds:5,width:1920,height:1080,codecName:'h264',hasVideo:true,hasAudio:false})};
  validateFootageArtifact(root,artifact,deps);
  fs.appendFileSync(video,'tamper');
  assert.throws(()=>validateFootageArtifact(root,artifact,deps),/HASH_INVALID/);
});

test('automatic acquisition degrades to the original provider when the Pexels key is absent',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-footage-no-key-'));
  const previous=process.env.PEXELS_API_KEY;
  delete process.env.PEXELS_API_KEY;
  try{
    const briefs=planFootage(plan([beat('fallback'),beat('still',{visualMode:'generated_image_35mm'})]),'hsl',options);
    const result=await acquireFootage(root,'FOOTAGE_TEST',briefs,options,{inspect:()=>{throw new Error('inspect must not run without an API key');}});
    assert.deepEqual(result.artifacts,[]);
    assert.deepEqual(result.failures,[{beatId:'fallback',reason:'PEXELS_API_KEY_REQUIRED'}]);
    assert.ok(fs.existsSync(result.candidatesPath));
    assert.ok(fs.existsSync(result.manifestPath));
  }finally{
    if(previous===undefined)delete process.env.PEXELS_API_KEY;else process.env.PEXELS_API_KEY=previous;
  }
});

test('footage planner replaces generated_image_35mm documentary beats when targetVisualModes includes them',()=>{
  const source=plan([
    beat('still_doc',{visualMode:'generated_image_35mm',promptSubject:'refrigerated pharmaceutical vaccine storage truck',cinematicPrompt:'Cinematic documentary view of refrigerated truck'}),
    beat('still_diagram',{visualMode:'generated_image_35mm',infographicArchetype:'CUTAWAY',promptSubject:'telemetry network cutaway diagram'}),
    beat('still_telemetry',{visualMode:'generated_image_35mm',promptSubject:'industrial SCADA telemetry dashboard'}),
  ]);
  const briefs=planFootage(source,'hsl',{...options,targetVisualModes:['firefly_video','generated_image_35mm']});
  assert.deepEqual(briefs.map(b=>b.beatId),['still_doc']);
  assert.equal(briefs[0].durationFrames,150);
  assert.ok(briefs[0].queries[0].includes('vaccine') || briefs[0].queries[0].includes('refrigerated'));
});

test('production CLI parseArgs accepts --footage-mode and --footage-share',()=>{
  const { parseArgs } = require('../cli');
  const parsed = parseArgs(['run', '--episode', 'HSL_EPISODE_018', '--footage-mode', 'auto', '--footage-share', '0.2']);
  assert.equal(parsed.args['--footage-mode'], 'auto');
  assert.equal(parsed.args['--footage-share'], '0.2');
  assert.throws(()=>parseArgs(['run', '--footage-mode', 'invalid']), /--footage-mode/);
  assert.throws(()=>parseArgs(['run', '--footage-share', '1.5']), /--footage-share/);
});

