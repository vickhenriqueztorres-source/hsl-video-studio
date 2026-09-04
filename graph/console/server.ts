import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type {Server} from 'node:http';
import {REPO_ROOT} from '../checkpointer';
import {spawnTool} from '../lib/proc';
import {episodes,overview,validEpisode} from './model';
import {liveProgress} from './progress';

const allowedMedia=['runs','out','deliveries'];
function mediaPath(root:string,input:string){const target=path.resolve(root,input),relative=path.relative(root,target),top=relative.split(path.sep)[0];if(!allowedMedia.includes(top)||relative.startsWith('..')||path.isAbsolute(relative)||!fs.existsSync(target)||!fs.statSync(target).isFile())throw new Error('arquivo não permitido');if(!/\.(png|jpg|jpeg|webp|mp4|mp3|wav|json)$/i.test(target))throw new Error('formato não permitido');return target;}

export function createDashboard(root=REPO_ROOT){
  const app=express(),ui=path.join(__dirname,'public');
  app.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-HSL-Console-Mode','read-only');next();});
  app.use(express.static(ui));
  app.get('/api/episodes',(_req,res)=>res.json(episodes(root)));
  app.get('/api/progress/:episode',async(req,res)=>{try{res.json(await liveProgress(validEpisode(req.params.episode),root));}catch(e){res.status(400).json({error:(e as Error).message});}});
  app.get('/api/overview/:episode',async(req,res)=>{try{res.json(await overview(validEpisode(req.params.episode),root));}catch(e){res.status(400).json({error:(e as Error).message});}});
  app.get('/api/media',(req,res)=>{try{res.sendFile(mediaPath(root,String(req.query.path??'')));}catch(e){res.status(404).json({error:(e as Error).message});}});
  app.all('/api/*',(_req,res)=>res.status(405).json({error:'Painel somente leitura. Use a CLI para executar operações.'}));
  return app;
}

export async function startDashboard({root=REPO_ROOT,port=2030,open=true}:{root?:string;port?:number;open?:boolean}={}){
  const app=createDashboard(root),url=`http://127.0.0.1:${port}`,openBrowser=()=>{if(open&&process.platform==='win32')void spawnTool('rundll32.exe',['url.dll,FileProtocolHandler',url],{cwd:root,timeoutMs:10_000});};
  return new Promise<Server|null>((resolve,reject)=>{const server=app.listen(port,'127.0.0.1',()=>{console.log(`\x1b[90m[HSL GRAPH]\x1b[0m Observer: ${url}`);openBrowser();resolve(server);});server.on('error',async(error:NodeJS.ErrnoException)=>{if(error.code!=='EADDRINUSE'){reject(error);return;}try{const response=await fetch(url),html=await response.text();if(!html.includes('HSL Graph Observer'))throw error;console.log(`\x1b[90m[HSL GRAPH]\x1b[0m Observer já está ativo: ${url}`);openBrowser();resolve(null);}catch{reject(error);}});});
}
if(require.main===module)startDashboard({open:!process.argv.includes('--no-open')}).catch(e=>{console.error(e);process.exitCode=1;});
