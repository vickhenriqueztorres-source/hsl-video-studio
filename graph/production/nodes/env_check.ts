import { Context, NodeFn } from '../runtime';
export const envCheck=(c:Context):NodeFn=>s=>{
  if((s.options.graph.storageMode??'off')==='drive'){
    if(!process.env.HSL_DRIVE_FOLDER_ID)throw new Error('HSL_DRIVE_FOLDER_ID obrigatório em storageMode drive');
    const secret=process.env.HSL_GOOGLE_CLIENT_SECRET_FILE;if(!secret||!require('node:path').isAbsolute(secret))throw new Error('HSL_GOOGLE_CLIENT_SECRET_FILE deve ser path absoluto');
  }
  if(s.options.graph.mediaMode==='legacy') return {__status:'skipped'};
  const e=c.deps.fireflyEnvironment(); return {environment:{agentDir:e.agentDir,profileDir:e.profileDir}};
};
