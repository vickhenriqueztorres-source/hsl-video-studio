import fs from 'node:fs';
import path from 'node:path';

export type ActiveProduction = {pid:number;episode?:string};

function readJson(file:string):any{
  try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}
}

export function activeLockPid(lock:string):number|undefined{
  let pid:number;
  try{pid=Number(fs.readFileSync(lock,'utf8').trim());}catch{return;}
  if(!Number.isSafeInteger(pid)||pid<1)return;
  try{process.kill(pid,0);}catch{return;}
  return pid;
}

export function activeProduction(root:string, targetEpisode?:string):ActiveProduction|undefined{
  const out=path.join(root,'out');
  const lockFiles = targetEpisode 
    ? [path.join(out,`production-graph-${targetEpisode}.lock`), path.join(out,'production-graph.lock')]
    : [path.join(out,'production-graph.lock'), ...(fs.existsSync(out)?fs.readdirSync(out).filter(f=>f.startsWith('production-graph-')&&f.endsWith('.lock')).map(f=>path.join(out,f)):[])];
  const runs=path.join(root,'runs');
  let entries:fs.Dirent[]=[];try{entries=fs.readdirSync(runs,{withFileTypes:true});}catch{}
  for (const lockFile of lockFiles) {
    const pid=activeLockPid(lockFile);
    if(!pid)continue;
    const episode=entries.filter(x=>x.isDirectory()).map(x=>x.name).find(id=>{
      const execution=readJson(path.join(runs,id,'graph','execution.json'));
      return execution?.active===true&&execution.pid===pid;
    });
    return{pid,...(episode?{episode}:{})};
  }
  return undefined;
}
