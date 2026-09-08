import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from '../../checkpointer';
import { assertWithin } from '../lib/assets';
import { driveUploadVerified,driveVerify } from './drive';
import { md5File } from './hash';
import { latestEntries,storageSummary } from './index';
import type { DriveManifestItem,StorageEntry,StorageTier } from './model';
import { classifyHeuristic,relativeStoragePath,remoteSubpath } from './tiers';

interface Migration {
  root:string;
  updatedAt:string;
  items:StorageEntry[];
  totals:ReturnType<typeof storageSummary>;
}

const walk=(dir:string):string[]=>!fs.existsSync(dir)?[]:fs.readdirSync(dir,{withFileTypes:true})
  .flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const reportPath=(root:string)=>path.join(root,'runs','storage-migration.json');

function parse(argv:string[]){
  const mode=argv.find(value=>['--scan','--upload','--verify','--prune'].includes(value));
  if(!mode)throw new Error('use --scan|--upload|--verify|--prune');
  const value=(key:string)=>{const index=argv.indexOf(key);return index>=0?argv[index+1]:undefined;};
  return{mode,episode:value('--episode'),root:path.resolve(value('--root')??REPO_ROOT),apply:argv.includes('--apply')};
}

function isScanCandidate(root:string,file:string,episode?:string){
  const rel=relativeStoragePath(root,file);
  if(rel.startsWith('assets/audio-library/')||rel.startsWith('database/'))return false;
  if(/^runs\/(?:\.storage\/|storage-migration(?:-[^/]*)?\.json$)/i.test(rel))return false;
  return !episode||rel.includes(episode);
}

async function scan(root:string,episode?:string){
  const roots=['runs','deliveries','out','public/runs','build'].map(value=>path.join(root,value));
  const files=[...new Set(roots.flatMap(walk).filter(file=>isScanCandidate(root,file,episode)))];
  const items=new Array<StorageEntry>(files.length);let cursor=0,completed=0;
  const worker=async()=>{while(true){
    const index=cursor++;if(index>=files.length)return;const file=files[index],candidate=classifyHeuristic(root,file);
    items[index]={path:relativeStoragePath(root,file),tier:candidate.tier,sizeBytes:fs.statSync(file).size,md5:await md5File(file),status:'local'};
    completed++;if(completed%250===0||completed===files.length)console.error(`[scan] ${completed}/${files.length}`);
  }};
  await Promise.all(Array.from({length:Math.min(4,files.length||1)},worker));
  const migration:Migration={root,updatedAt:new Date().toISOString(),items,totals:storageSummary(items)};
  fs.mkdirSync(path.dirname(reportPath(root)),{recursive:true});
  fs.writeFileSync(reportPath(root),JSON.stringify(migration,null,2)+'\n');
  return migration;
}

function read(root:string):Migration{return JSON.parse(fs.readFileSync(reportPath(root),'utf8').replace(/^\uFEFF/,''));}

async function transfer(root:string,migration:Migration,verify:boolean){
  const candidates=migration.items.filter(entry=>['intermediate','deliverable','save'].includes(entry.tier)&&(verify?entry.status==='both':entry.status!=='both'));
  const manifest=path.join(root,'runs',`storage-migration-${verify?'verify':'upload'}-manifest.json`);
  const result=path.join(root,'runs',`storage-migration-${verify?'verify':'upload'}-result.json`);
  const items:DriveManifestItem[]=candidates.map(entry=>({
    localPath:path.join(root,entry.path),
    remoteSubpath:remoteSubpath({tier:entry.tier,path:path.join(root,entry.path)},episodeOf(entry.path),'migration',root),
    md5:entry.md5,sizeBytes:entry.sizeBytes,driveFileId:entry.driveFileId,
  }));
  fs.writeFileSync(manifest,JSON.stringify({folderId:process.env.HSL_DRIVE_FOLDER_ID,items},null,2));
  const response=await(verify?driveVerify(root,manifest,result):driveUploadVerified(root,manifest,result));
  const byPath=new Map(response.items.map(item=>[path.resolve(item.localPath),item]));
  for(const entry of migration.items){
    const item=byPath.get(path.resolve(root,entry.path));if(!item)continue;
    entry.driveFileId=item.driveFileId;entry.remoteMd5=item.remoteMd5;entry.uploadedAt=new Date().toISOString();
    entry.status=(['already','uploaded'].includes(item.status)&&item.remoteMd5===entry.md5)?'both':item.status==='mismatch'?'mismatch':'pending-upload';
    entry.error=item.error;
  }
  migration.updatedAt=new Date().toISOString();migration.totals=storageSummary(migration.items);
  fs.writeFileSync(reportPath(root),JSON.stringify(migration,null,2)+'\n');
  return migration;
}

function episodeOf(rel:string){
  const parts=rel.replace(/\\/g,'/').split('/');
  return (parts[0]==='runs'||parts[0]==='deliveries')&&parts.length>2?parts[1]||'SHARED':'SHARED';
}

async function prune(root:string,migration:Migration,apply:boolean){
  const episodes=[...new Set(migration.items.filter(entry=>entry.tier==='deliverable').map(entry=>episodeOf(entry.path)).filter(value=>value!=='SHARED'))].sort().reverse();
  const keep=new Set(episodes.slice(0,1)),plan=[] as {path:string;tier:StorageTier;sizeBytes:number}[];
  for(const entry of latestEntries(migration.items)){
    const absolute=path.join(root,entry.path);
    if(entry.tier==='save'||entry.tier==='library'||!fs.existsSync(absolute))continue;
    const transient=entry.tier==='transient';
    const verified=entry.status==='both'&&entry.remoteMd5===entry.md5&&await md5File(absolute)===entry.md5;
    const retained=entry.tier==='deliverable'&&keep.has(episodeOf(entry.path));
    if((transient||verified)&&!retained){
      plan.push({path:entry.path,tier:entry.tier,sizeBytes:entry.sizeBytes});
      if(apply){fs.rmSync(assertWithin(root,absolute),{recursive:true,force:true});entry.status='remote-only';entry.prunedAt=new Date().toISOString();}
    }
  }
  const out=path.join(root,'runs','storage-migration-prune-plan.json');
  fs.writeFileSync(out,JSON.stringify({mode:apply?'apply':'dry-run',items:plan,totalBytes:plan.reduce((sum,item)=>sum+item.sizeBytes,0)},null,2)+'\n');
  if(apply)fs.writeFileSync(reportPath(root),JSON.stringify(migration,null,2)+'\n');
  return{plan,totalBytes:plan.reduce((sum,item)=>sum+item.sizeBytes,0)};
}

export async function migrate(argv=process.argv.slice(2)){
  const args=parse(argv);let data=args.mode==='--scan'?await scan(args.root,args.episode):read(args.root);
  if(args.mode==='--upload')data=await transfer(args.root,data,false);
  if(args.mode==='--verify')data=await transfer(args.root,data,true);
  const pruned=args.mode==='--prune'?await prune(args.root,data,args.apply):undefined;
  console.log(JSON.stringify({totals:storageSummary(data.items),prune:pruned},null,2));return 0;
}

if(require.main===module)migrate().then(code=>process.exitCode=code).catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
