import fs from 'node:fs';
import path from 'node:path';
import type {State} from '../state';
import type {Context} from '../runtime';
import {readJson,validMedia} from '../runtime';
import {assertMediaPlan} from './mediaPlan';
import {hashFile,KlingLedger} from './firefly/ledger';
import {takeRecipe} from './firefly/recipe';
import {repairReceiptPath,resolveFireflyArtifact} from './firefly/repair';

/** Physical files and provider evidence must agree with the required beat set. */
export function assertMediaCoverage(c:Context,s:State,scope:'all'|'external'='all'):void {
  const media=assertMediaPlan(s),expected=s.scenePlan!.beats.filter(b=>b.visualMode==='firefly_video'&&(scope==='all'||b.mediaProvider!=='remotion-authored'));
  const actual=new Map(s.videos.filter(v=>scope==='all'||v.provider!=='remotion-authored').map(v=>[v.beatId,v]));
  if([...actual.keys()].some(id=>!expected.some(b=>b.beatId===id)))throw new Error('MEDIA_UNEXPECTED_VIDEO');
  const ledger=media.fireflyBeatIds.length?new KlingLedger(path.join(c.root,'runs',s.episodeId,'firefly')):undefined;
  try{for(const beat of expected){
    const v=actual.get(beat.beatId);
    if(!v||v.status==='failed'||v.provider!==beat.mediaProvider||!validMedia(c,v.path))throw new Error(`MEDIA_COVERAGE_MISSING:${beat.beatId}`);
    if(v.provider==='remotion-authored'){
      const artifact=s.motionArtifacts.find(item=>item.beatId===beat.beatId);
      if(!artifact||!artifact.approved||!artifact.verified||!artifact.rendered||artifact.videoPath!==v.path||artifact.sha256!==hashFile(v.path)||!fs.existsSync(artifact.receiptPath)||artifact.durationInFrames!==beat.durationFrames)throw new Error(`MOTION_PROVENANCE_INVALID:${beat.beatId}`);
      const pub=path.join(c.root,'public','runs',s.episodeId,'motion',beat.beatId+'.mp4');
      if(!fs.existsSync(pub)||hashFile(pub)!==artifact.sha256){
        if(fs.existsSync(v.path)&&hashFile(v.path)===artifact.sha256){
          fs.mkdirSync(path.dirname(pub),{recursive:true});
          fs.copyFileSync(v.path,pub);
        }
      }
      if(!fs.existsSync(pub)||hashFile(pub)!==artifact.sha256)throw new Error(`MOTION_PUBLIC_COPY_INVALID:${beat.beatId}`);
      continue;
    }
    if(v.provider!=='firefly-kling')continue;
    const receipt=readJson<{provider:string;planHash:string;sha256:string;operations:string[];repairs?:{operationId:string;receiptPath:string;receiptHash:string}[];durationFrames:number}>(v.path+'.provenance.json');
    if(!receipt||receipt.provider!=='firefly-kling'||receipt.planHash!==media.hash||receipt.sha256!==hashFile(v.path)||receipt.durationFrames!==beat.durationFrames||Math.abs(c.deps.inspect(v.path).durationSeconds-beat.durationFrames/30)>0.2)throw new Error(`MEDIA_PROVENANCE_INVALID:${beat.beatId}`);
    const takes=s.videoTakes.filter(t=>t.beatId===beat.beatId);
    const planned=media.beats.find(b=>b.beatId===beat.beatId)!;
    if(takes.length!==planned.takeCount||!Array.isArray(receipt.operations)||takes.length!==receipt.operations.length||new Set(receipt.operations).size!==takes.length||takes.some(t=>!['ok','skipped'].includes(t.status)))throw new Error(`MEDIA_TAKE_COVERAGE_INVALID:${beat.beatId}`);
    for(const t of takes){
      if(t.recipeHash!==takeRecipe(s,t))throw new Error(`MEDIA_RECIPE_CHANGED:${beat.beatId}`);
      const op=t.operationId?ledger!.operation(t.operationId):undefined;
      if(!op||!receipt.operations.includes(op.id)||op.phase!=='validated'||op.planHash!==media.hash||op.recipeHash!==t.recipeHash||op.inputHash!==hashFile(t.firstFramePath)||op.outputHash!==hashFile(t.outputPath))throw new Error(`MEDIA_TAKE_PROVENANCE_INVALID:${beat.beatId}`);
      const runtime=path.join(c.root,'runs',s.episodeId,'firefly','runtime',op.id),transport=readJson<{phase?:string;outputPath?:string;outputHash?:string}>(path.join(runtime,'dispatch-receipt.json'));
      if(transport?.phase!=='transport_complete'||!transport.outputPath||!transport.outputHash)throw new Error(`MEDIA_TRANSPORT_PROVENANCE_INVALID:${beat.beatId}`);
      const resolved=resolveFireflyArtifact(runtime,op.id,transport.outputPath,transport.outputHash),record=receipt.repairs?.find(r=>r.operationId===op.id);
      if(hashFile(resolved.path)!==op.outputHash)throw new Error(`MEDIA_REPAIR_PROVENANCE_INVALID:${beat.beatId}`);
      if(resolved.receiptHash){if(!record||path.resolve(record.receiptPath)!==repairReceiptPath(runtime)||record.receiptHash!==resolved.receiptHash)throw new Error(`MEDIA_REPAIR_PROVENANCE_INVALID:${beat.beatId}`);}
      else if(record)throw new Error(`MEDIA_REPAIR_PROVENANCE_INVALID:${beat.beatId}`);
    }
    const pub=path.join(c.root,'public','runs',s.episodeId,'videos',beat.beatId+'.mp4');
    if(!fs.existsSync(pub)||hashFile(pub)!==receipt.sha256){
      if(fs.existsSync(v.path)&&hashFile(v.path)===receipt.sha256){
        fs.mkdirSync(path.dirname(pub),{recursive:true});
        fs.copyFileSync(v.path,pub);
      }
    }
    if(!fs.existsSync(pub)||hashFile(pub)!==receipt.sha256)throw new Error(`MEDIA_PUBLIC_COPY_INVALID:${beat.beatId}`);
  }}finally{ledger?.close();}
}
export const assertExternalMediaCoverage=(c:Context,s:State)=>assertMediaCoverage(c,s,'external');
