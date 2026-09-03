import assert from 'node:assert/strict';
import type {AddressInfo} from 'node:net';
import {createDashboard} from './server';

async function main(){
  const server=createDashboard().listen(0,'127.0.0.1');
  await new Promise<void>((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
  const port=(server.address() as AddressInfo).port,base=`http://127.0.0.1:${port}`;
  try{
    const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/HSL Graph Observer/);
    const episodes=await fetch(`${base}/api/episodes`);assert.equal(episodes.status,200);assert.ok(Array.isArray(await episodes.json()));
    const overview=await fetch(`${base}/api/overview/HSL_EPISODE_011`);assert.equal(overview.status,200);
    const data:any=await overview.json();assert.equal(data.episode,'HSL_EPISODE_011');assert.ok(Array.isArray(data.nodes));
    const traversal=await fetch(`${base}/api/media?path=../package.json`);assert.equal(traversal.status,404);
    const invalid=await fetch(`${base}/api/actions`,{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({action:'invalid',episode:'HSL_EPISODE_011'})});
    assert.equal(invalid.status,405);
    assert.equal(invalid.headers.get('x-hsl-console-mode'),'read-only');
    console.log('MATRIX_CONSOLE_TEST_OK');
  }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
