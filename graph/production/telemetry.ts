import fs from 'node:fs';
import path from 'node:path';

export interface LiveEvent {at:string;node:string;kind:'start'|'done'|'progress'|'gate'|'error';message:string;current?:number;total?:number}
export function safeLog(message:unknown):string {
  return String(message??'').replace(/\x1b\[[0-9;]*[A-Za-z]/g,'')
    .replace(/https?:\/\/[^\s"<>]+/gi,'[link]')
    .replace(/\b(?:sk-|GOCSPX-|ya29\.)[\w.-]+/g,'[redacted]')
    .replace(/\bBearer\s+\S+/gi,'Bearer [redacted]')
    .replace(/((?:access_token|refresh_token|client_secret|api_key|authorization|password)\s*["']?\s*[:=]\s*["']?)[^\s,"'}]+/gi,'$1[redacted]')
    .replace(/[\r\n]+/g,' ').slice(0,600);
}
export function emitLive(root:string,episode:string,event:Omit<LiveEvent,'at'>){
  if(!/^[A-Za-z0-9_-]+$/.test(episode))return;
  try{
    const file=path.join(root,'runs',episode,'graph','live.jsonl');fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.appendFileSync(file,JSON.stringify({...event,message:safeLog(event.message),at:new Date().toISOString()})+'\n');
  }catch{/* Telemetry must never fail production. */}
}
export function tailJson(file:string,maxBytes=128*1024):any[]{
  let fd:number|undefined;
  try{fd=fs.openSync(file,'r');const size=fs.fstatSync(fd).size,start=Math.max(0,size-maxBytes),buffer=Buffer.alloc(size-start);fs.readSync(fd,buffer,0,buffer.length,start);
    const lines=buffer.toString('utf8').split('\n');if(start)lines.shift();return lines.flatMap(line=>{try{return[JSON.parse(line)]}catch{return[]}});
  }catch{return[]}finally{if(fd!==undefined)fs.closeSync(fd);}
}
