import {interrupt} from '@langchain/langgraph';
import {Context, NodeFn} from '../runtime';
export const codexAuthPrepare=(c:Context):NodeFn=>async s=>{
  if(s.options.graph.mediaMode==='legacy')return{codexAuth:{authenticated:true},__status:'skipped'};
  if(s.options.graph.offline)throw new Error('OFFLINE_CODEX_DISABLED');
  return{codexAuth:await c.deps.codexAccount()};
};
export const codexAuthWait:NodeFn=s=>{
  if(s.options.graph.mediaMode==='legacy')return{__status:'skipped'};
  if(!s.codexAuth?.authenticated)interrupt({kind:'CODEX_AUTH',command:'npm run hsl:codex:login',reason:s.codexAuth?.reason});
  return{};
};
