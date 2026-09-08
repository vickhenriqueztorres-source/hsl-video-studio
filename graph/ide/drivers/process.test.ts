import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {findCli} from './process';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-codex-discovery-'));
try {
  if(process.platform==='win32'){
    const old=path.join(root,'OpenAI','Codex','bin','old','codex.exe');
    const current=path.join(root,'OpenAI','Codex','bin','current','codex.exe');
    fs.mkdirSync(path.dirname(old),{recursive:true});fs.mkdirSync(path.dirname(current),{recursive:true});
    fs.writeFileSync(old,'old');fs.writeFileSync(current,'current');
    fs.utimesSync(old,new Date(1),new Date(1));fs.utimesSync(current,new Date(2),new Date(2));
    assert.equal(findCli('codex',{PATH:'',LOCALAPPDATA:root})?.command,current);
    assert.equal(findCli('something-absent',{PATH:'',LOCALAPPDATA:root}),undefined);
  }
  console.log('CLI_DISCOVERY_TEST_OK');
}finally{fs.rmSync(root,{recursive:true,force:true});}
