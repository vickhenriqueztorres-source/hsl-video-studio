import fs from 'node:fs';import path from 'node:path';import Database from 'better-sqlite3';
import { interrupt } from '@langchain/langgraph';
import type { Context,NodeFn } from '../runtime';import { paths,writeJson } from '../runtime';
import type { State,NodeError } from '../state';import type { DriveManifestItem,StorageCandidate,StorageEntry } from './model';
import { md5File } from './hash';import { relativeStoragePath,remoteSubpath,classifyHeuristic } from './tiers';import { latestEntries,persistIndex } from './index';
import { assertWithin } from '../lib/assets';

export const driveAuthWait=(c:Context):NodeFn=>async s=>{
  if((s.options.graph.storageMode??'off')==='off')return{__status:'skipped'};
  const result=await c.deps.driveCheckAuth();
  if(result.exitCode===0)return{};
  if(result.exitCode===2){interrupt({kind:'DRIVE_AUTH',command:'npm run hsl:drive:auth'});return{};}
  throw new Error(`DRIVE_AUTH_CHECK_FAILED:${result.stderr||result.stdout||result.errorCode||'unknown'}`);
};

function snapshotDatabase(root:string,episodeId:string){
  const source=path.join(root,'database','langgraph-checkpoints.sqlite');if(!fs.existsSync(source))return;
  const target=path.join(root,'runs',episodeId,'checkpoints','langgraph-checkpoints.sqlite');fs.mkdirSync(path.dirname(target),{recursive:true});if(fs.existsSync(target))fs.unlinkSync(target);
  const db=new Database(source);try{db.exec(`VACUUM INTO '${target.replace(/'/g,"''")}'`);}finally{db.close();}
}

export function archiveStage(label:string,selector:(root:string,s:State)=>StorageCandidate[]):((c:Context)=>NodeFn){return(c)=>async s=>{
  const mode=s.options.graph.storageMode??'off',checkpoint=path.join(c.root,'runs',s.episodeId,'checkpoints','langgraph-checkpoints.sqlite');
  if(label==='compliance'&&(mode==='drive'||!fs.existsSync(checkpoint)))snapshotDatabase(c.root,s.episodeId);
  const prior=latestEntries(s.storageIndex??[]),known=new Map(prior.map(entry=>[entry.path,entry])),candidates=selector(c.root,s),fresh:StorageEntry[]=[];
  for(const candidate of candidates){
    if(!fs.existsSync(candidate.path)||!fs.statSync(candidate.path).isFile())continue;
    const entry:StorageEntry={path:relativeStoragePath(c.root,candidate.path),tier:candidate.tier,sizeBytes:fs.statSync(candidate.path).size,md5:await md5File(candidate.path),status:'local'};
    const previous=known.get(entry.path),complete=mode==='off'?previous?.status==='local':previous?.status==='both';
    if(previous&&complete&&previous.md5===entry.md5&&previous.sizeBytes===entry.sizeBytes)continue;
    fresh.push(entry);
  }
  if(mode==='off'){if(fresh.length)persistIndex(c.root,s.episodeId,[...prior,...fresh]);return{storageIndex:fresh,__status:fresh.length?'ok':'skipped'};}
  const folderId=process.env.HSL_DRIVE_FOLDER_ID!;const manifestPath=path.join(paths(c,s).audit,'storage',`${label}-manifest.json`),resultPath=path.join(paths(c,s).audit,'storage',`${label}-result.json`);
  const manifestItems:DriveManifestItem[]=fresh.filter(x=>x.tier!=='transient'&&x.tier!=='library').map(entry=>{const absolute=path.join(c.root,entry.path);const category=candidates.find(x=>path.resolve(x.path)===path.resolve(absolute))?.category??'files';return{localPath:absolute,remoteSubpath:remoteSubpath({tier:entry.tier,path:absolute},s.episodeId,category,c.root),md5:entry.md5,sizeBytes:entry.sizeBytes};});
  writeJson(manifestPath,{folderId,items:manifestItems});const errors:NodeError[]=[];
  try{const result=await c.deps.driveUploadVerified(manifestPath,resultPath),byPath=new Map(result.items.map(x=>[path.resolve(x.localPath),x]));for(const entry of fresh){const item=byPath.get(path.resolve(c.root,entry.path));if(!item)continue;entry.driveFileId=item.driveFileId;entry.driveFolderId=item.driveFolderId;entry.remoteMd5=item.remoteMd5;entry.uploadedAt=new Date().toISOString();entry.status=(['uploaded','already'].includes(item.status)&&item.remoteMd5===entry.md5)?'both':item.status==='mismatch'?'mismatch':'pending-upload';entry.error=item.error;if(entry.status!=='both')errors.push({node:`archive_${label}`,message:item.error??`DRIVE_${item.status}:${entry.path}`,at:new Date().toISOString()});}}
  catch(error){for(const entry of fresh.filter(x=>x.tier!=='transient'&&x.tier!=='library')){entry.status='pending-upload';entry.error=error instanceof Error?error.message:String(error);}errors.push({node:`archive_${label}`,message:error instanceof Error?error.message:String(error),at:new Date().toISOString()});}
  persistIndex(c.root,s.episodeId,[...prior,...fresh]);
  if(label==='compliance'){
    const indexFile=path.join(c.root,'runs',s.episodeId,'storage-index.json');
    if(fs.existsSync(indexFile)){
      const indexManifest=path.join(paths(c,s).audit,'storage','storage-index-manifest.json'),indexResult=path.join(paths(c,s).audit,'storage','storage-index-result.json');
      const md5=await md5File(indexFile),sizeBytes=fs.statSync(indexFile).size;
      writeJson(indexManifest,{folderId,items:[{localPath:indexFile,remoteSubpath:remoteSubpath({tier:'save',path:indexFile},s.episodeId,'saves',c.root),md5,sizeBytes}]});
      try{const result=await c.deps.driveUploadVerified(indexManifest,indexResult),item=result.items[0];if(!item||!['uploaded','already'].includes(item.status)||item.remoteMd5!==md5)errors.push({node:'archive_compliance',message:item?.error??'DRIVE_STORAGE_INDEX_MISMATCH',at:new Date().toISOString()});}
      catch(error){errors.push({node:'archive_compliance',message:error instanceof Error?error.message:String(error),at:new Date().toISOString()});}
    }
  }
  return{storageIndex:fresh,errors};
};}

function walk(dir:string):string[]{if(!fs.existsSync(dir))return[];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
export async function pruneStorage(root:string,s:State,apply:boolean){
  const entries=latestEntries(s.storageIndex??[]),plan:{path:string;tier:string;sizeBytes:number;reason:string}[]=[],errors:string[]=[];
  const currentDeliverables=new Set([s.finalVideo?.outPath,s.finalVideo?.deliveryPath,s.finalVideo?.runPath].filter(Boolean).map(file=>relativeStoragePath(root,file!)));
  const transientFiles=[...walk(path.join(root,'build')),...walk(path.join(root,'public','runs',s.episodeId)),...walk(path.join(root,'out')).filter(f=>/^temp_|^concat_/i.test(path.basename(f)))];
  for(const file of transientFiles){const c=classifyHeuristic(root,file);if(c.tier==='transient')entries.push({path:relativeStoragePath(root,file),tier:'transient',sizeBytes:fs.statSync(file).size,md5:await md5File(file),status:'local'});}
  const latest=latestEntries(entries);
  for(const entry of latest){const absolute=path.resolve(root,entry.path);try{
    relativeStoragePath(root,absolute);if(!fs.existsSync(absolute)||entry.tier==='save'||entry.tier==='library')continue;
    let eligible=false,reason='';
    if(entry.tier==='transient'){eligible=s.productionStatus==='COMPLETED';reason=eligible?'completed transient':'production incomplete';}
    else if(entry.tier==='deliverable'&&(s.options.graph.keepLocalDeliverables??1)>0&&(entry.path.replace(/\\/g,'/').startsWith(`runs/${s.episodeId}/`)||entry.path.replace(/\\/g,'/').startsWith(`deliveries/${s.episodeId}/`)||currentDeliverables.has(entry.path))){reason='current deliverable retained';}
    else{const localMd5=await md5File(absolute);eligible=entry.status==='both'&&entry.remoteMd5===entry.md5&&localMd5===entry.md5;reason=eligible?'remote md5 verified':'remote md5 not verified';}
    if(eligible){plan.push({path:entry.path,tier:entry.tier,sizeBytes:entry.sizeBytes,reason});if(apply){fs.rmSync(assertWithin(root,absolute),{recursive:true,force:true});entry.status='remote-only';entry.prunedAt=new Date().toISOString();}}
  }catch(error){errors.push(`${entry.path}: ${error instanceof Error?error.message:String(error)}`);}}
  const planFile=path.join(root,'runs',s.episodeId,'prune-plan.json');writeJson(planFile,{mode:apply?'apply':'dry-run',items:plan,totalBytes:plan.reduce((n,x)=>n+x.sizeBytes,0),errors});persistIndex(root,s.episodeId,latest);return{entries:latest,plan,errors,planFile};
}
export const pruneVerified=(c:Context):NodeFn=>async s=>{const result=await pruneStorage(c.root,s,(s.options.graph.prune??'dry-run')==='apply');return{storageIndex:result.entries,errors:result.errors.map(message=>({node:'prune_verified',message,at:new Date().toISOString()})),__status:(s.options.graph.storageMode??'off')==='off'?'skipped':undefined};};
