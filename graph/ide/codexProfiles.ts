import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

export interface CodexProfile {id:string;name:string;home:string;kind:'primary'|'reserve'}
interface StoredProfile {id:string;name:string;home:string;createdAt:string}
interface Store {version:1;preferredId?:string;reserves:StoredProfile[]}

export function codexProfileStoreFile(env:NodeJS.ProcessEnv=process.env){
  const base=env.LOCALAPPDATA;if(!base)throw Error('LOCALAPPDATA não disponível.');
  return env.HSL_CODEX_PROFILES_FILE||path.join(base,'HSLMatrix','credentials','codex-profiles.json');
}
function defaultHome(env:NodeJS.ProcessEnv){return env.CODEX_HOME||path.join(os.homedir(),'.codex');}
function readStore(env:NodeJS.ProcessEnv):Store{
  const file=codexProfileStoreFile(env);if(!fs.existsSync(file))return{version:1,reserves:[]};
  try{const value=JSON.parse(fs.readFileSync(file,'utf8'));if(value.version!==1||!Array.isArray(value.reserves))throw Error();return value;}
  catch{throw Error('Cadastro de contas reserva Codex inválido; nenhuma credencial foi alterada.');}
}
function saveStore(env:NodeJS.ProcessEnv,value:Store){
  const file=codexProfileStoreFile(env);fs.mkdirSync(path.dirname(file),{recursive:true});
  const temp=file+'.'+randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n',{mode:0o600});fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
}
export function listCodexProfiles(env:NodeJS.ProcessEnv=process.env):CodexProfile[]{
  const store=readStore(env),primary:CodexProfile={id:'primary',name:'Principal',home:defaultHome(env),kind:'primary'};
  const reserves=store.reserves.filter(x=>path.isAbsolute(x.home)).map(x=>({...x,kind:'reserve' as const}));
  const all=[primary,...reserves],preferred=store.preferredId;
  if(!preferred)return all;
  const selected=all.find(x=>x.id===preferred);return selected?[selected,...all.filter(x=>x.id!==preferred)]:all;
}
export function addCodexReserve(name:string,env:NodeJS.ProcessEnv=process.env):CodexProfile{
  name=name.trim();if(!/^[\p{L}\p{N} ._-]{1,40}$/u.test(name))throw Error('Use um apelido de até 40 caracteres.');
  const store=readStore(env);if(store.reserves.some(x=>x.name.toLowerCase()===name.toLowerCase()))throw Error('Apelido de conta reserva já usado.');
  const id='reserve-'+randomUUID().slice(0,12),home=path.join(path.dirname(codexProfileStoreFile(env)),'codex-accounts',id);fs.mkdirSync(home,{recursive:true});
  store.reserves.push({id,name,home,createdAt:new Date().toISOString()});saveStore(env,store);return{id,name,home,kind:'reserve'};
}
export function preferCodexProfile(id:string,env:NodeJS.ProcessEnv=process.env){const store=readStore(env);if(id!=='primary'&&!store.reserves.some(x=>x.id===id))throw Error('Conta reserva Codex não encontrada.');store.preferredId=id;saveStore(env,store);}
export function removeCodexReserve(id:string,env:NodeJS.ProcessEnv=process.env){const store=readStore(env),entry=store.reserves.find(x=>x.id===id);if(!entry)throw Error('Conta reserva Codex não encontrada.');store.reserves=store.reserves.filter(x=>x.id!==id);if(store.preferredId===id)delete store.preferredId;saveStore(env,store);}
