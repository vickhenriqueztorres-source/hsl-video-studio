import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {spawnTool} from '../lib/proc';

interface Entry {id:string;name:string;key:string;fingerprint:string;createdAt:string}
interface Vault {version:1;activeId?:string;entries:Entry[]}
export interface Cipher {protect:(text:string)=>Promise<string>;unprotect:(text:string)=>Promise<string>}
export const windowsCipher:Cipher={protect:text=>crypt(text,false),unprotect:text=>crypt(text,true)};
async function crypt(text:string,decrypt:boolean){
  if(process.platform!=='win32')throw Error('O cofre ElevenLabs usa proteção do usuário Windows (DPAPI).');
  // Use .NET directly: inherited PowerShell 7 module paths can prevent the
  // Windows PowerShell Security module (ConvertTo-SecureString) from loading.
  const script="$ErrorActionPreference='Stop'; try { [Console]::InputEncoding=[Text.UTF8Encoding]::new($false); [Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); [void][Reflection.Assembly]::LoadWithPartialName('System.Security'); $v=[Console]::In.ReadToEnd(); "+(decrypt?
    "[Console]::Out.Write([Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($v),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)))":
    "[Console]::Out.Write([Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes($v),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)))")+" } catch { [Console]::Error.Write('DPAPI_FAILED'); exit 1 }";
  // The secret travels only over stdin/stdout pipes, never argv or a log file.
  const r=await spawnTool('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{cwd:process.cwd(),stdin:text,timeoutMs:30000});
  if(r.exitCode!==0||r.timedOut||!r.stdout)throw Error('Não foi possível abrir/salvar o cofre ElevenLabs deste usuário Windows.');
  return r.stdout;
}
export function vaultFile(){const base=process.env.LOCALAPPDATA;if(!base)throw Error('LOCALAPPDATA não disponível.');return path.join(base,'HSLMatrix','credentials','elevenlabs.vault.json');}
export class ElevenLabsKeys {
  constructor(readonly file=vaultFile(),private cipher:Cipher=windowsCipher){}
  private async read():Promise<Vault>{
    if(!fs.existsSync(this.file))return{version:1,entries:[]};
    try{const envelope=JSON.parse(fs.readFileSync(this.file,'utf8'));if(envelope.version!==1)throw Error();const data=JSON.parse(await this.cipher.unprotect(envelope.protected));if(data.version!==1||!Array.isArray(data.entries))throw Error();return data;}
    catch{throw Error('Cofre ElevenLabs inválido ou indisponível neste usuário Windows. Nenhuma chave foi sobrescrita.');}
  }
  private async change(fn:(v:Vault)=>void){
    fs.mkdirSync(path.dirname(this.file),{recursive:true});const lock=this.file+'.lock';let fd:number;
    try{fd=fs.openSync(lock,'wx');}catch{throw Error('Cofre em uso por outro gerenciador. Feche a outra operação e tente novamente.');}
    const temp=this.file+'.'+randomUUID()+'.tmp';
    try{const data=await this.read();fn(data);const protectedData=await this.cipher.protect(JSON.stringify(data));fs.writeFileSync(temp,JSON.stringify({version:1,protected:protectedData}),{mode:0o600});fs.renameSync(temp,this.file);}
    finally{fs.closeSync(fd);fs.unlinkSync(lock);if(fs.existsSync(temp))fs.unlinkSync(temp);}
  }
  async list(){const v=await this.read();return v.entries.map(({key:_,...entry})=>({...entry,active:entry.id===v.activeId}));}
  async activeKey(){const v=await this.read();return v.entries.find(e=>e.id===v.activeId)?.key;}
  async key(id:string){const entry=(await this.read()).entries.find(e=>e.id===id);if(!entry)throw Error('Chave não encontrada.');return entry.key;}
  async add(name:string,key:string){
    name=name.trim();key=key.trim();if(!/^[\p{L}\p{N} ._-]{1,40}$/u.test(name)||/^sk[_-]/i.test(name))throw Error('Use um apelido de até 40 caracteres, como Principal ou Estudio.');
    if(key.length<16||key.length>512||/\s/.test(key))throw Error('Formato de chave inválido. Cole apenas a chave, sem espaços.');
    const fingerprint=createHash('sha256').update(key).digest('hex').slice(0,12),id=randomUUID();
    await this.change(v=>{if(v.entries.some(e=>e.key===key))throw Error('Essa chave já está cadastrada.');if(v.entries.some(e=>e.name.toLowerCase()===name.toLowerCase()))throw Error('Apelido já usado. Escolha outro.');v.entries.push({id,name,key,fingerprint,createdAt:new Date().toISOString()});if(v.entries.length===1)v.activeId=id;});return id;
  }
  async activate(id:string){await this.change(v=>{if(!v.entries.some(e=>e.id===id))throw Error('Chave não encontrada.');v.activeId=id;});}
  async remove(id:string){await this.change(v=>{if(!v.entries.some(e=>e.id===id))throw Error('Chave não encontrada.');v.entries=v.entries.filter(e=>e.id!==id);if(v.activeId===id)delete v.activeId;});}
}
export async function checkElevenLabsKey(key:string,request:typeof fetch=fetch){
  try{const r=await request('https://api.elevenlabs.io/v1/user/subscription',{headers:{'xi-api-key':key},signal:AbortSignal.timeout(15000),redirect:'error'});
    if(!r.ok)return{ok:false,message:r.status===401?'Chave recusada (401).':r.status===403?'Acesso negado (403): confira permissões de leitura da conta e restrições de IP.':`Consulta indisponível (HTTP ${r.status}).`};
    const body=await r.json() as any;
    return{ok:true,message:'Conexão validada. Nenhum áudio gerado.',used:typeof body.character_count==='number'?body.character_count:null,limit:typeof body.character_limit==='number'?body.character_limit:null};
  }catch{return{ok:false,message:'Não foi possível consultar a ElevenLabs (rede ou timeout).'};}
}
