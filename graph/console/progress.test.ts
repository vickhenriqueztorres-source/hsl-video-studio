import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {deriveProgress} from './progress';
import {emitLive,safeLog,tailJson} from '../production/telemetry';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-progress-')),episode='TEST',run=path.join(root,'runs',episode);
const write=(file:string,value:unknown)=>{const p=path.join(run,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(value));};
const timing=(node:string,status='ok',endedAt='2026-01-01T00:01:00Z')=>({node,status,startedAt:'2026-01-01T00:00:00Z',endedAt,ms:60000});
try{
  let p=deriveProgress(root,episode);assert.equal(p.percent,0);assert.equal(p.status,'NOT_STARTED');
  write('graph/execution.json',{active:true,pid:process.pid});
  fs.writeFileSync(path.join(run,'graph/node-events.jsonl'),JSON.stringify({type:'entry',node:'image_generate_run',at:'2026-01-01T00:02:00Z'})+'\n');
  write('images/QUEUE.json',{items:[{status:'done'},{status:'pending'}]});
  p=deriveProgress(root,episode,{timings:[timing('scene_plan')]},['image_generate_run']);
  assert.equal(p.status,'RUNNING');assert.equal(p.nodes.find(x=>x.id==='image_generate_run')?.progress,50);assert.equal(p.images.done,1);
  write('images/QUEUE.json',{items:[{status:'done'},{status:'done'}]});
  assert.equal(deriveProgress(root,episode).images.done,2);
  p=deriveProgress(root,episode,{},['image_generate_wait'],[{kind:'RECOVERY',reason:'quota'}]);
  assert.equal(p.status,'WAITING');assert.ok(p.percent<100);assert.equal(p.nodes.find(x=>x.id==='image_generate_wait')?.status,'waiting');
  write('graph/execution.json',{active:false,pid:process.pid});
  assert.equal(deriveProgress(root,episode,{},['image_generate_run']).status,'PAUSED');
  p=deriveProgress(root,episode,{timings:[timing('env_check','failed'),timing('env_check','ok','2026-01-01T00:03:00Z')]});
  assert.equal(p.nodes.find(x=>x.id==='env_check')?.status,'done');
  p=deriveProgress(root,episode,{timings:[timing('firefly_dispatch')],videoTakes:[{status:'ok'},{status:'pending'}]},['archive_firefly']);
  assert.equal(p.nodes.find(x=>x.id==='firefly_dispatch')?.progress,50);assert.equal(p.nodes.find(x=>x.id==='firefly_dispatch')?.status,'partial');
  p=deriveProgress(root,episode,{productionStatus:'COMPLETED'},['archive_compliance']);assert.ok(p.percent<100);assert.equal(p.status,'PAUSED');
  p=deriveProgress(root,episode,{productionStatus:'COMPLETED'});assert.equal(p.percent,100);assert.equal(p.status,'COMPLETED');
  emitLive(root,episode,{node:'env_check',kind:'error',message:'Bearer private-value access_token=secret-value https://example.test/?token=hidden'});
  const events=tailJson(path.join(run,'graph/live.jsonl'));assert.equal(events.length,1);assert.doesNotMatch(events[0].message,/private-value|secret-value|token=hidden/);
  assert.doesNotMatch(safeLog('{"client_secret":"secret-value"}'),/secret-value/);
  emitLive(root,'../escape',{node:'x',kind:'start',message:'no'});assert.equal(fs.existsSync(path.join(root,'escape')),false);
  console.log('PROGRESS_TEST_OK: counters, liveness, gates, retries, completion, redaction');
}finally{
  const absolute=path.resolve(root),temp=path.resolve(os.tmpdir());if(path.dirname(absolute)!==temp||!path.basename(absolute).startsWith('hsl-progress-'))throw Error('Unsafe test cleanup');fs.rmSync(absolute,{recursive:true,force:true});
}
