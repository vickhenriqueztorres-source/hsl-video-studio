import { Context, NodeFn } from '../runtime';
export const envCheck=(c:Context):NodeFn=>s=>{
  if(s.options.graph.mediaMode==='legacy') return {__status:'skipped'};
  const e=c.deps.fireflyEnvironment(); return {environment:{agentDir:e.agentDir,profileDir:e.profileDir}};
};
