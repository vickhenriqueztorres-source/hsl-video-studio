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

export function activeProduction(root:string):ActiveProduction|undefined{
  const pid=activeLockPid(path.join(root,'out','production-graph.lock'));
  if(!pid)return;
  const runs=path.join(root,'runs');
  let entries:fs.Dirent[]=[];try{entries=fs.readdirSync(runs,{withFileTypes:true});}catch{}
  const episode=entries.filter(x=>x.isDirectory()).map(x=>x.name).find(id=>{
    const execution=readJson(path.join(runs,id,'graph','execution.json'));
    return execution?.active===true&&execution.pid===pid;
  });
  return{pid,...(episode?{episode}:{})};
}
