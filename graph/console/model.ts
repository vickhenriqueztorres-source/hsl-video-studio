import fs from 'node:fs';
import path from 'node:path';
import {createCheckpointer,REPO_ROOT} from '../checkpointer';
import {createProductionGraph,NODE_ORDER} from '../production/graph';
import {configFor,readErrors,readHistory} from '../production/runner';
import {latestEntries,readIndex,storageSummary} from '../production/storage/index';

export const PHASES=[
  {id:'setup',label:'Preparação',nodes:['scene_plan','env_check','codex_auth_prepare','codex_auth_wait','drive_auth_wait','archive_scene_plan']},
  {id:'prompts',label:'Direção visual',nodes:['visual_prompts_prepare','visual_prompts_wait','visual_prompts_review_prepare','visual_prompts_review_wait']},
  {id:'images',label:'Imagens',nodes:['image_generate_prepare','image_generate_run','image_generate_wait','image_review_prepare','image_review_wait','archive_images']},
  {id:'video',label:'Vídeo Kling',nodes:['firefly_session_prepare','firefly_session_wait','firefly_guide','firefly_dispatch','firefly_intake_wait','archive_firefly','firefly_finalize']},
  {id:'audio',label:'Áudio',nodes:['narration_stage','sound_design','sfx_render','archive_audio']},
  {id:'render',label:'Render',nodes:['gatekeeper_stage','gate_render_wait','render_prepare','fan_out_render','render_chunk','stitch','pre_mux_gate','mux']},
  {id:'delivery',label:'Entrega',nodes:['packaging_stage','compliance_stage','gate_publish_wait','finalize','archive_compliance','prune_verified']},
] as const;

export const AGENTS=[
  {id:'director',name:'Scene Director',role:'Arquitetura narrativa',icon:'◈',nodes:['scene_plan']},
  {id:'visual',name:'Visual Intelligence',role:'Prompts e continuidade',icon:'◇',nodes:['visual_prompts_prepare','visual_prompts_wait','visual_prompts_review_prepare','visual_prompts_review_wait']},
  {id:'codex',name:'Codex Image Agent',role:'Geração de quadros 16:9',icon:'⬡',nodes:['codex_auth_prepare','codex_auth_wait','image_generate_prepare','image_generate_run','image_generate_wait']},
  {id:'review',name:'Vision Gatekeeper',role:'Fidelidade e qualidade',icon:'◎',nodes:['image_review_prepare','image_review_wait']},
  {id:'kling',name:'Kling 2.5 Turbo',role:'Movimento cinematográfico',icon:'▶',nodes:['firefly_session_prepare','firefly_session_wait','firefly_guide','firefly_dispatch','firefly_intake_wait','firefly_finalize']},
  {id:'voice',name:'Narration Engine',role:'Voz e sincronização',icon:'◉',nodes:['narration_stage']},
  {id:'sound',name:'Sound Design Crew',role:'SFX narrativo e mix',icon:'≋',nodes:['sound_design','sfx_render']},
  {id:'render',name:'Render Core',role:'Remotion e FFmpeg',icon:'⌁',nodes:['render_prepare','fan_out_render','render_chunk','stitch','pre_mux_gate','mux']},
  {id:'quality',name:'Compliance Sentinel',role:'Gates e conformidade',icon:'✓',nodes:['gatekeeper_stage','gate_render_wait','compliance_stage','gate_publish_wait']},
  {id:'storage',name:'Drive Vault',role:'Arquivo verificado',icon:'⬢',nodes:['drive_auth_wait','archive_scene_plan','archive_images','archive_firefly','archive_audio','archive_compliance','prune_verified']},
] as const;

const readJson=(file:string):any=>{try{return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));}catch{return null;}};
const slash=(v:string)=>v.replace(/\\/g,'/');
const rel=(root:string,file?:string|null)=>file?slash(path.relative(root,file)):null;
export function validEpisode(value:string){if(!/^[A-Za-z0-9_-]{1,160}$/.test(value))throw new Error('episode inválido');return value;}
function walk(dir:string,test:(file:string)=>boolean,limit=300):string[]{if(!fs.existsSync(dir))return[];const found:string[]=[];for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(found.length>=limit)break;const file=path.join(dir,entry.name);if(entry.isDirectory())found.push(...walk(file,test,limit-found.length));else if(test(file))found.push(file);}return found;}
function coverFor(root:string,id:string,queue:any){const candidates=[path.join(root,'deliveries',id,'thumbnails','thumbnail_variant_A_face.png'),queue?.items?.find((x:any)=>x.status==='done')?.outputPath,path.join(root,'runs',id,'frames','SCENE_001.png')].filter(Boolean) as string[];const file=candidates.find(x=>fs.existsSync(x));return file?rel(root,file):null;}

export function episodes(root=REPO_ROOT){
  const dir=path.join(root,'runs');if(!fs.existsSync(dir))return[];
  return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('.')).map(e=>{
    const folder=path.join(dir,e.name),manifest=readJson(path.join(folder,'run-manifest.json')),plan=readJson(path.join(folder,'scene-plan.json')),queue=readJson(path.join(folder,'images','QUEUE.json'));
    const changed=Math.max(...fs.readdirSync(folder).map(name=>{try{return fs.statSync(path.join(folder,name)).mtimeMs}catch{return 0}}),0),visible=Boolean(manifest||plan||queue);
    return{id:e.name,title:plan?.episodeTitle??e.name,subtitle:plan?.subtitle??'',status:manifest?.overallStatus??(queue?'IMAGE_QUEUE':'UNKNOWN'),beats:plan?.totalBeatsCount??queue?.items?.length??0,duration:plan?.totalDurationSeconds??manifest?.artifacts?.masterVideoDurationSeconds??0,images:queue?.items?.filter((x:any)=>x.status==='done').length??manifest?.artifacts?.framesCount??0,cover:coverFor(root,e.name,queue),changed,updatedAt:manifest?.updatedAt??new Date(changed).toISOString(),visible};
  }).filter(e=>e.visible).map(({visible:_,...e})=>e).sort((a,b)=>(b.id==='HSL_EPISODE_011'?1:0)-(a.id==='HSL_EPISODE_011'?1:0)||b.changed-a.changed);
}

function media(root:string,episode:string,storage:any[]){
  const index=new Map(latestEntries(storage).map(x=>[slash(x.path),x])),run=path.join(root,'runs',episode),delivery=path.join(root,'deliveries',episode),items:any[]=[];
  const add=(file:string,kind:'image'|'video'|'audio'|'document')=>{const relative=rel(root,file)!;if(items.some(x=>x.path===relative))return;const stored=index.get(relative);items.push({name:path.basename(file),kind,path:relative,sizeBytes:fs.statSync(file).size,driveUrl:stored?.driveFileId?`https://drive.google.com/open?id=${encodeURIComponent(stored.driveFileId)}`:null,status:stored?.status??'local'});};
  for(const file of walk(path.join(run,'images'),x=>/\.(png|jpg|jpeg|webp)$/i.test(x),160))add(file,'image');
  for(const file of walk(path.join(run,'frames'),x=>/\.(png|jpg|jpeg|webp)$/i.test(x),160))add(file,'image');
  for(const file of walk(path.join(delivery,'thumbnails'),x=>/\.(png|jpg|jpeg|webp)$/i.test(x),20))add(file,'image');
  for(const file of [...walk(path.join(run,'firefly'),x=>/\.mp4$/i.test(x),100),...walk(path.join(delivery,'video'),x=>/\.mp4$/i.test(x),20)])add(file,'video');
  for(const file of walk(path.join(run,'audio'),x=>/\.(mp3|wav)$/i.test(x),30))add(file,'audio');
  for(const file of [path.join(run,'scene-plan.json'),path.join(run,'publication-package.json'),path.join(run,'run-manifest.json')])if(fs.existsSync(file))add(file,'document');
  return items;
}

function stateOf(nodes:any[],ids:readonly string[]){const selected=nodes.filter(n=>ids.includes(n.id));if(selected.some(n=>n.status==='failed'))return'failed';if(selected.some(n=>n.status==='running'))return'running';if(selected.length&&selected.every(n=>['done','skipped'].includes(n.status)))return'done';if(selected.some(n=>n.status==='done'))return'active';return'pending';}

export async function overview(episode:string,root=REPO_ROOT){
  validEpisode(episode);const run=path.join(root,'runs',episode),history=readHistory(root,episode),errors=readErrors(root,episode),saver=createCheckpointer(root),graph=createProductionGraph(saver,{},root);
  try{
    const snapshot=await graph.getState(configFor(episode)),v:any=snapshot.values||{},queue=readJson(path.join(run,'images','QUEUE.json')),manifest=readJson(path.join(run,'run-manifest.json')),plan=readJson(path.join(run,'scene-plan.json')),prune=readJson(path.join(run,'prune-plan.json'));
    const timings:any[]=v.timings??[],next=[...snapshot.next],interrupts=snapshot.tasks.flatMap(t=>t.interrupts.map(i=>i.value)),lastTiming=new Map(timings.map(t=>[t.node,t])),visited=new Set(history.map((h:any)=>h.node)),failed=new Set(errors.map(e=>e.node));
    const nodes=NODE_ORDER.map(id=>({id,status:next.includes(id)?'running':failed.has(id)?'failed':lastTiming.get(id)?.status==='skipped'?'skipped':lastTiming.has(id)||visited.has(id)?'done':'pending',ms:lastTiming.get(id)?.ms??null}));
    const images=queue?.items??[],storage=latestEntries((v.storageIndex?.length?v.storageIndex:readIndex(root,episode))??[]),library=media(root,episode,storage),done=nodes.filter(n=>['done','skipped'].includes(n.status)).length;
    const driveId=process.env.HSL_DRIVE_FOLDER_ID,folders=readJson(path.join(run,'drive-folders.json'))??{},imageFolder=storage.find(x=>x.driveFolderId&&/(^|\/)images\//i.test(x.path))?.driveFolderId,videoFolder=storage.find(x=>x.driveFolderId&&/(^|\/)(firefly|videos?)\//i.test(x.path))?.driveFolderId,driveUrl=(id?:string|null)=>id?`https://drive.google.com/drive/folders/${encodeURIComponent(id)}`:null,driveRoot=driveUrl(folders.root??driveId),driveSearch=`https://drive.google.com/drive/u/0/search?q=${encodeURIComponent(episode)}`;
    return{episode,title:plan?.episodeTitle??episode,subtitle:plan?.subtitle??'',thesis:plan?.thesis??'',threadId:configFor(episode).configurable.thread_id,status:v.productionStatus??manifest?.overallStatus??'NOT_STARTED',updatedAt:manifest?.updatedAt??null,next,interrupts,nodes,phases:PHASES,progress:Math.round(done/Math.max(nodes.length,1)*100),
      agents:AGENTS.map(a=>({...a,status:stateOf(nodes,a.nodes),progress:Math.round(a.nodes.filter(id=>['done','skipped'].includes(nodes.find(n=>n.id===id)?.status??'')).length/a.nodes.length*100)})),klingBudget:{totalTakes:(v.videoTakes??[]).length,approvedLimit:v.options?.graph?.maxGenerations??0,approvedAt:(v.options?.graph?.maxGenerations??0)>0},
      metrics:{beats:plan?.totalBeatsCount??images.length,imagesDone:images.filter((x:any)=>x.status==='done').length,imagesTotal:images.length,takesDone:(v.videoTakes??[]).filter((x:any)=>['ok','skipped'].includes(x.status)).length,takesTotal:(v.videoTakes??[]).length,generations:v.generationCount??0,sfxResolved:(v.sfxResolved??[]).length,sfxUnresolved:(v.sfxUnresolved??[]).length,renderChunks:(v.renderChunks??[]).filter((x:any)=>x.status==='ok').length,duration:plan?.totalDurationSeconds??0},
      acts:(plan?.acts??[]).map((x:any)=>({number:x.actNumber,title:x.title,duration:x.durationSeconds,beats:x.beatsCount})),storage:storageSummary(storage),storageItems:storage.slice(0,300),history:history.slice(-120).reverse(),errors:errors.slice(-30).reverse(),media:library,
      drive:{rootUrl:driveRoot,episodeUrl:driveUrl(folders.episode)??driveSearch,imagesUrl:driveUrl(folders.images??imageFolder)??`https://drive.google.com/drive/u/0/search?q=${encodeURIComponent(episode+' images')}`,videosUrl:driveUrl(folders.videos??videoFolder)??`https://drive.google.com/drive/u/0/search?q=${encodeURIComponent(episode+' video')}`},
      artifacts:{finalVideo:rel(root,v.finalVideo?.outPath)??library.find(x=>x.kind==='video'&&x.path.includes('deliveries/'))?.path,narration:rel(root,v.narration?.path),sfx:rel(root,v.sfxTrackPath),scenePlan:fs.existsSync(path.join(run,'scene-plan.json'))?rel(root,path.join(run,'scene-plan.json')):null,pruneBytes:prune?.totalBytes??0}};
  }finally{saver.db.close();}
}
