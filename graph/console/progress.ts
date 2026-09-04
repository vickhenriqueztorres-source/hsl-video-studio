import fs from 'node:fs';
import path from 'node:path';
import {createCheckpointer,REPO_ROOT} from '../checkpointer';
import {createProductionGraph,NODE_ORDER} from '../production/graph';
import {configFor} from '../production/runner';
import {safeLog,tailJson} from '../production/telemetry';

const aliases:Record<string,string>={narration:'narration_stage',sound_design:'sound_design',gatekeeper:'gatekeeper_stage',packaging:'packaging_stage',compliance:'compliance_stage'};
const normalized=(id:string)=>aliases[id]??id;
const legacyOnly=new Set(['fan_out_frames','image_frames','fan_out_videos','firefly_videos']);
const read=(file:string)=>{try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return null}};
export const progressBar=(percent:number,width=22)=>{const n=Math.round(Math.max(0,Math.min(100,percent))*width/100);return'█'.repeat(n)+'░'.repeat(width-n)};

export function deriveProgress(root:string,episode:string,v:any={},next:string[]=[],interrupts:any[]=[]){
  const run=path.join(root,'runs',episode),events=tailJson(path.join(run,'graph','node-events.jsonl')),live=tailJson(path.join(run,'graph','live.jsonl'));
  const journal=tailJson(path.join(run,'graph','history.jsonl'));
  let applicable=NODE_ORDER.filter(id=>v.options?.graph?.mediaMode==='legacy'?!id.startsWith('image_generate')&&!id.startsWith('image_review')&&!id.startsWith('visual_prompts')&&(!id.startsWith('firefly_')||id==='firefly_videos')&&!['archive_images','archive_firefly'].includes(id):!legacyOnly.has(id));
  const timings=new Map<string,any>();
  for(const t of [...(v.timings??[]),...events.filter(x=>x.type==='timing')]){const key=normalized(t.node),prior=timings.get(key);if(!prior||t.endedAt>=prior.endedAt)timings.set(key,t);}
  // Older checkpoints can predate nodes in the current topology. Do not show
  // unrecorded historical steps as pending work on a completed episode.
  const finished=v.productionStatus==='COMPLETED'&&!next.length;
  if(finished)applicable=applicable.filter(id=>timings.has(id));
  let lastEntry=events.filter(x=>x.type==='entry').at(-1);
  const journalEntry=journal.at(-1);if(journalEntry&&(!lastEntry||journalEntry.at>lastEntry.at))lastEntry=journalEntry;
  const active=lastEntry?normalized(lastEntry.node):next[0];
  let alive=false;try{const execution=read(path.join(run,'graph','execution.json'));if(execution?.active&&execution.pid){process.kill(execution.pid,0);alive=true;}}catch{}
  const hasOpenEntry=lastEntry&&(!timings.get(active)||lastEntry.at>timings.get(active).endedAt);
  const terminal=['COMPLETED','ABORTED','COMPLIANCE_FAILED','BLOCKED_PRE_RENDER'].includes(v.productionStatus);
  const gate=interrupts[0];
  const status=gate?'WAITING':alive?'RUNNING':terminal&&!(v.productionStatus==='COMPLETED'&&next.length)?v.productionStatus:next.length?'PAUSED':'NOT_STARTED';
  const currentNode=gate?next[0]:hasOpenEntry?active:next[0]??null;
  const queue=read(path.join(run,'images','QUEUE.json'))?.items??[];
  const imageDone=queue.filter((x:any)=>x.status==='done').length;
  const takes=v.videoTakes??[],takesDone=takes.filter((x:any)=>['ok','skipped'].includes(x.status)).length;
  const plan=v.scenePlan??read(path.join(run,'scene-plan.json'));
  const expectedChunks=v.options?.graph?.testRender?1:Math.ceil((plan?.totalFrames??0)/4500);
  const chunks=new Map((v.renderChunks??[]).map((x:any)=>[x.index,x]));
  const chunksDone=[...chunks.values()].filter((x:any)=>['ok','skipped'].includes(x.status)).length;
  const partial:Record<string,number>={image_generate_run:queue.length?imageDone/queue.length:0,firefly_dispatch:takes.length?takesDone/takes.length:0,firefly_intake_wait:takes.length?takesDone/takes.length:0,render_chunk:expectedChunks?chunksDone/expectedChunks:0};
  const itemTotals:Record<string,number>={image_generate_run:queue.length,firefly_dispatch:takes.length,firefly_intake_wait:takes.length,render_chunk:expectedChunks};
  const reviewProgress=live.filter(x=>normalized(x.node)==='image_review_prepare'&&x.total&&(!lastEntry||x.at>=lastEntry.at)).at(-1);
  if(reviewProgress)partial.image_review_prepare=reviewProgress.current/reviewProgress.total;
  const nodes=NODE_ORDER.map(id=>{
    const timing=timings.get(id),isCurrent=id===currentNode;
    const skipped=!applicable.includes(id),isDone=timing&&timing.status!=='failed';
    const unfinishedItems=Boolean(isDone&&itemTotals[id]>0&&partial[id]<1&&!finished);
    const nodeStatus=skipped?'skipped':isCurrent?(gate?'waiting':status==='RUNNING'?'running':timing?.status==='failed'?'failed':'paused'):timing?.status==='failed'?'failed':unfinishedItems?'partial':isDone?timing.status==='skipped'?'skipped':'done':'pending';
    const fraction=skipped?1:isCurrent||unfinishedItems?(partial[id]??0):isDone?1:0;
    return{id,status:nodeStatus,ms:timing?.ms??null,progress:Math.round(Math.min(1,fraction)*100),applicable:!skipped,note:skipped?'Fora do caminho executado / sem registro neste checkpoint concluído':null};
  });
  const completed=nodes.filter(n=>n.applicable&&['done','skipped'].includes(n.status)).length;
  const fraction=nodes.filter(n=>n.applicable).reduce((n,x)=>n+x.progress/100,0)/Math.max(1,applicable.length);
  const percent=v.productionStatus==='COMPLETED'&&!next.length?100:Math.min(99,Math.floor(fraction*100));
  const oldLogs=events.filter(x=>['entry','timing','error'].includes(x.type)).map(x=>({at:x.at??x.endedAt,node:normalized(x.node),kind:x.type==='error'?'error':x.type==='entry'?'start':'done',message:safeLog(x.message??(x.type==='entry'?'Iniciando':`${x.status} · ${Math.round(x.ms/1000)}s`))}));
  const logs=[...oldLogs.filter(x=>!live.some(y=>normalized(y.node)===x.node&&Math.abs(Date.parse(y.at)-Date.parse(x.at))<1000)),...live.map(x=>({...x,node:normalized(x.node),message:safeLog(x.message)}))].sort((a,b)=>a.at.localeCompare(b.at)).slice(-80);
  const updatedAt=logs.at(-1)?.at??null;
  return{percent,status,currentNode,gate:gate?{kind:safeLog(gate.kind??'HUMAN'),reason:safeLog(typeof gate.reason==='string'?gate.reason:'Decisão necessária na CLI')}:null,
    basis:'Etapas concluídas; não representa tempo restante',completed,total:applicable.length,nodes,logs,updatedAt,
    elapsedSeconds:currentNode&&lastEntry?Math.max(0,Math.round((Date.now()-Date.parse(lastEntry.at))/1000)):0,
    images:{done:imageDone,total:queue.length},takes:{done:takesDone,total:takes.length},chunks:{done:chunksDone,total:expectedChunks},
    detail:live.filter(x=>normalized(x.node)===currentNode).at(-1)?.message??null};
}
export async function liveProgress(episode:string,root=REPO_ROOT){
  configFor(episode);
  if(!fs.existsSync(path.join(root,'database','langgraph-checkpoints.sqlite')))return deriveProgress(root,episode);
  const saver=createCheckpointer(root);try{const s=await createProductionGraph(saver,{},root).getState(configFor(episode));return deriveProgress(root,episode,s.values,s.next,s.tasks.flatMap(t=>t.interrupts.map(i=>i.value)));}finally{saver.db.close();}
}
export function formatProgress(p:ReturnType<typeof deriveProgress>){return`[${progressBar(p.percent)}] ${p.percent}% · ${p.status} · ${p.currentNode??'sem etapa ativa'}\n  Imagens ${p.images.done}/${p.images.total} | Takes ${p.takes.done}/${p.takes.total} | Render ${p.chunks.done}/${p.chunks.total}${p.gate?'\n  Gate '+p.gate.kind+': '+p.gate.reason:''}`;}
