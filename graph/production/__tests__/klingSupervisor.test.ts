import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {reconcileUnstartedAgentTake,runAgentTake,type FireflyEnvironment} from '../lib/firefly/process';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-kling-supervisor-'));
const agent=path.join(root,'agent'),profile=path.join(root,'profile');fs.mkdirSync(agent,{recursive:true});fs.mkdirSync(profile,{recursive:true});
fs.writeFileSync(path.join(agent,'main.py'),String.raw`
const fs=require('fs'),path=require('path'),args=process.argv.slice(2),root=args[args.indexOf('--root')+1];
fs.mkdirSync(root,{recursive:true});const action=args.includes('--feed-guide')?'feed':args.includes('--requeue-unstarted-infra-job')?'reconcile':'run';fs.appendFileSync(path.join(root,'calls.log'),action+'\n');
if(args.includes('--feed-guide')){const g=JSON.parse(fs.readFileSync(args[args.indexOf('--feed-guide')+1],'utf8'));if(path.isAbsolute(g.items[0].image))process.exit(9);fs.writeFileSync(path.join(root,'name.txt'),g.items[0].name);process.exit(0);}
if(args.includes('--requeue-unstarted-infra-job'))process.exit(0);
if(fs.existsSync(path.join(root,'fail-run')))process.exit(7);const name=fs.readFileSync(path.join(root,'name.txt'),'utf8');fs.mkdirSync(path.join(root,'saida'),{recursive:true});fs.writeFileSync(path.join(root,'saida',name+'.mp4'),'mock-video');process.exit(2);
`);
const env:FireflyEnvironment={agentDir:agent,profileDir:profile,python:process.execPath};
const image=path.join(root,'frame.png');fs.writeFileSync(image,'png');
function guide(runtime:string,name:string){const file=path.join(runtime,'guide.json');fs.mkdirSync(runtime,{recursive:true});fs.writeFileSync(file,JSON.stringify({items:[{name,image,prompt:'slow cinematic motion',model:'Kling 2.5 Turbo',resolution:'1080p',aspect_ratio:'16:9',duration_seconds:5,generate_audio:false}]}));return file;}

async function main(){
  const previous=process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH;process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH='true';
  try{
    const ok=path.join(root,'ok'),okGuide=guide(ok,'SAFE_TAKE');await runAgentTake(env,ok,okGuide,path.join(ok,'run.log'));await runAgentTake(env,ok,okGuide,path.join(ok,'run.log'));
    assert.equal(fs.readFileSync(path.join(ok,'calls.log'),'utf8'),'feed\nrun\n');assert.equal(JSON.parse(fs.readFileSync(path.join(ok,'dispatch-receipt.json'),'utf8')).phase,'succeeded');
    const fail=path.join(root,'fail'),failGuide=guide(fail,'UNCERTAIN_TAKE');fs.writeFileSync(path.join(fail,'fail-run'),'1');await assert.rejects(runAgentTake(env,fail,failGuide,path.join(fail,'run.log')),/FIREFLY_RUN/);await assert.rejects(runAgentTake(env,fail,failGuide,path.join(fail,'run.log')),/KLING_DISPATCH_UNCERTAIN/);
    assert.equal(fs.readFileSync(path.join(fail,'calls.log'),'utf8'),'feed\nrun\n');assert.equal(JSON.parse(fs.readFileSync(path.join(fail,'dispatch-receipt.json'),'utf8')).phase,'uncertain');
    await reconcileUnstartedAgentTake(env,fail,failGuide,path.join(fail,'reconcile.log'));assert.equal(JSON.parse(fs.readFileSync(path.join(fail,'dispatch-receipt.json'),'utf8')).phase,'enqueued');
    fs.rmSync(path.join(fail,'fail-run'));await runAgentTake(env,fail,failGuide,path.join(fail,'run.log'));assert.equal(fs.readFileSync(path.join(fail,'calls.log'),'utf8'),'feed\nrun\nreconcile\nrun\n');
    console.log('KLING_SUPERVISOR_TEST_OK');
  }finally{if(previous===undefined)delete process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH;else process.env.HSL_ALLOW_PAID_FIREFLY_DISPATCH=previous;}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
