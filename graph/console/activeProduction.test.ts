import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {activeLockPid,activeProduction} from './activeProduction';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-active-production-'));
try{
  assert.equal(activeProduction(root),undefined);
  const graph=path.join(root,'runs','EP_TEST','graph');fs.mkdirSync(graph,{recursive:true});
  fs.mkdirSync(path.join(root,'out'),{recursive:true});
  fs.writeFileSync(path.join(root,'out','production-graph.lock'),String(process.pid));
  assert.equal(activeLockPid(path.join(root,'out','production-graph.lock')),process.pid);
  fs.writeFileSync(path.join(graph,'execution.json'),JSON.stringify({pid:process.pid,active:true}));
  assert.deepEqual(activeProduction(root),{pid:process.pid,episode:'EP_TEST'});
  fs.writeFileSync(path.join(graph,'execution.json'),JSON.stringify({pid:process.pid,active:false}));
  assert.deepEqual(activeProduction(root),{pid:process.pid});
  console.log('ACTIVE_PRODUCTION_TEST_OK');
}finally{
  const absolute=path.resolve(root),temp=path.resolve(os.tmpdir());
  if(path.dirname(absolute)!==temp||!path.basename(absolute).startsWith('hsl-active-production-'))throw Error('Unsafe test cleanup');
  fs.rmSync(absolute,{recursive:true,force:true});
}
