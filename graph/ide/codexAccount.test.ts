import assert from 'node:assert/strict';
import {switchCodexAccount} from './codexAccount';
async function main(){
  const calls:string[]=[];
  const code=await switchCodexAccount('fixture',async(_root,args)=>{calls.push(args.join(' '));return{exitCode:0,stdout:'',stderr:'',timedOut:false,durationMs:1};},async()=>{calls.push('login');return 0;});
  assert.equal(code,0);assert.deepEqual(calls,['logout','login']);
  await assert.rejects(()=>switchCodexAccount('fixture',async()=>({exitCode:1,stdout:'',stderr:'mock failure',timedOut:false,durationMs:1}),async()=>{throw Error('must not login');}),/CODEX_LOGOUT: mock failure/);
  assert.equal(await switchCodexAccount('fixture',async()=>({exitCode:0,stdout:'',stderr:'',timedOut:false,durationMs:1}),async()=>2),2);
  console.log('ACCOUNT_SWITCH_TEST_OK: logout before login, failure stops flow, login exit propagated; no credentials touched');
}
main().catch(e=>{console.error(e);process.exitCode=1});
