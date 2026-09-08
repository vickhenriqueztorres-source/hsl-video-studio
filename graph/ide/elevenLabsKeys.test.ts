import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ElevenLabsKeys,checkElevenLabsKey} from './elevenLabsKeys';
import {applySelectedKey,redactNarrationLog,narrateWithManagedKey} from '../production/lib/elevenLabsNarration';
async function main(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-elevenlabs-')),file=path.join(root,'vault.json'),store=new ElevenLabsKeys(file);
  const first='fake_key_for_local_DPAPI_test_111',second='fake_key_for_local_DPAPI_test_222';
  try{
    assert.deepEqual(await store.list(),[]);
    const a=await store.add('Principal',first),b=await store.add('Reserva',second);
    assert.equal(await store.activeKey(),first);assert.equal((await store.list()).length,2);
    assert.doesNotMatch(fs.readFileSync(file,'utf8'),/fake_key|Principal|Reserva/);
    assert.equal(JSON.stringify(await store.list()).includes(first),false);
    await store.activate(b);assert.equal(await new ElevenLabsKeys(file).activeKey(),second);
    await assert.rejects(()=>store.add('Duplicada',first),/já está cadastrada/);
    await assert.rejects(()=>store.add('Principal','another_fake_key_333'),/Apelido já usado/);
    await assert.rejects(()=>store.activate('missing'),/não encontrada/);
    await store.remove(b);assert.equal(await store.activeKey(),undefined);assert.equal((await store.list())[0].id,a);
    const request:typeof fetch=async(input,init)=>{assert.equal(input,'https://api.elevenlabs.io/v1/user/subscription');assert.equal((init?.headers as Record<string,string>)['xi-api-key'],first);return new Response(JSON.stringify({character_count:10,character_limit:100}),{status:200});};
    assert.deepEqual(await checkElevenLabsKey(first,request),{ok:true,message:'Conexão validada. Nenhum áudio gerado.',used:10,limit:100});
    assert.match((await checkElevenLabsKey(first,async()=>new Response('',{status:403}))).message,/permissões/);
    assert.equal((await checkElevenLabsKey(first,async()=>{throw Error(first)})).message.includes(first),false);
    const config={apiKey:'legacy',fallbackKeys:['old']};applySelectedKey(config,second);assert.deepEqual(config,{apiKey:second,fallbackKeys:[]});
    const legacy={apiKey:'legacy',fallbackKeys:['old']};applySelectedKey(legacy);assert.deepEqual(legacy,{apiKey:'legacy',fallbackKeys:['old']});
    const masked=redactNarrationLog(`${first} ${first.slice(0,7)}...${first.slice(-4)}`,[first]);assert.equal(masked.includes(first),false);assert.equal(masked.includes('...111'),false);
    // The legacy adapter returns this fixture at its cache check, before any
    // synthesis. Exercise the real CLI worker and paths with spaces, offline.
    const cache=path.join(root,'cached narration.mp3');fs.writeFileSync(cache,Buffer.alloc(11000));
    assert.equal(await narrateWithManagedKey(process.cwd(),{text:'Cache-only smoke test.',outputPath:cache}),cache);
    fs.writeFileSync(file,'invalid');await assert.rejects(()=>store.add('Nova',first),/Nenhuma chave foi sobrescrita/);assert.equal(fs.readFileSync(file,'utf8'),'invalid');
    console.log('ELEVENLABS_KEYS_TEST_OK: Windows DPAPI, persistence, selection, removal, duplicates, corruption, API mocks, narration selection and redaction. No real API request or speech generation.');
  }finally{const absolute=path.resolve(root);if(path.dirname(absolute)!==path.resolve(os.tmpdir())||!path.basename(absolute).startsWith('hsl-elevenlabs-'))throw Error('Unsafe cleanup');fs.rmSync(absolute,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
