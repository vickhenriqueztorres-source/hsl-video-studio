import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {addCodexReserve,listCodexProfiles,preferCodexProfile,removeCodexReserve} from './codexProfiles';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-codex-profiles-')),env={...process.env,LOCALAPPDATA:root,HSL_CODEX_PROFILES_FILE:path.join(root,'profiles.json'),CODEX_HOME:path.join(root,'primary')};
try{
  assert.equal(listCodexProfiles(env).length,1);
  const first=addCodexReserve('Reserva 1',env),second=addCodexReserve('Reserva 2',env);
  assert.deepEqual(listCodexProfiles(env).map(x=>x.id),['primary',first.id,second.id]);
  preferCodexProfile(first.id,env);assert.equal(listCodexProfiles(env)[0].id,first.id);
  assert.equal(JSON.parse(fs.readFileSync(env.HSL_CODEX_PROFILES_FILE,'utf8')).reserves[0].home,first.home);
  removeCodexReserve(first.id,env);assert.equal(listCodexProfiles(env).some(x=>x.id===first.id),false);
  console.log('CODEX_PROFILES_TEST_OK: separate homes, preference rotation, no credentials in registry');
}finally{const absolute=path.resolve(root),temp=path.resolve(os.tmpdir());if(path.dirname(absolute)!==temp||!path.basename(absolute).startsWith('hsl-codex-profiles-'))throw Error('Unsafe test cleanup');fs.rmSync(absolute,{recursive:true,force:true});}
