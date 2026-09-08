import 'dotenv/config';
import path from 'node:path';
import type {NarrationGenerateOptions} from '../../../adapters/elevenLabsNarrationAdapter';
import {spawnTool,requireSuccess} from '../../lib/proc';
import {ElevenLabsKeys} from '../../ide/elevenLabsKeys';
import {safeLog} from '../telemetry';

export function applySelectedKey(config:{apiKey:string;fallbackKeys:string[]},key?:string){
  if(key){config.apiKey=key;config.fallbackKeys=[];}
}
export function redactNarrationLog(value:unknown,secrets:string[]){let text=String(value);for(const secret of secrets.filter(Boolean)){text=text.split(secret).join('[chave protegida]').split(secret.slice(0,7)+'...'+secret.slice(-4)).join('[chave protegida]');}return safeLog(text);}
export async function narrateWithManagedKey(root:string,options:NarrationGenerateOptions){
  const result=await spawnTool(process.execPath,[path.join(root,'node_modules/ts-node/dist/bin.js'),__filename,'--worker'],{cwd:root,stdin:JSON.stringify(options),timeoutMs:3600000,
    onStdout:text=>process.stdout.write(text),onStderr:text=>process.stderr.write(text)});
  requireSuccess(result,'ELEVENLABS_NARRATION');
  return options.outputPath||path.join(root,'public/audio/narration.mp3');
}
async function worker(){
  let input='';for await(const chunk of process.stdin)input+=chunk;
  const options=JSON.parse(input) as NarrationGenerateOptions;
  const {ElevenLabsConfig}=await import('../../../config/elevenlabs.config');
  const selected=await new ElevenLabsKeys().activeKey();
  applySelectedKey(ElevenLabsConfig,selected);
  const secrets=[ElevenLabsConfig.apiKey,...ElevenLabsConfig.fallbackKeys].filter(Boolean);
  const clean=(value:unknown)=>redactNarrationLog(value,secrets);
  // The legacy adapter prints key snippets. Keep its output inside this worker
  // and sanitize it before it reaches the graph's logs or CLI.
  const out=console.log.bind(console),err=console.error.bind(console);
  console.log=(...args)=>out(args.map(clean).join(' '));console.warn=(...args)=>err(args.map(clean).join(' '));console.error=(...args)=>err(args.map(clean).join(' '));
  try{const {ElevenLabsNarrationAdapter}=await import('../../../adapters/elevenLabsNarrationAdapter');await new ElevenLabsNarrationAdapter().generateSpeech(options);}
  catch(e){throw new Error(clean(e instanceof Error?e.message:e));}
}
if(require.main===module&&process.argv.includes('--worker'))worker().catch(e=>{console.error(safeLog(e instanceof Error?e.message:'Falha na narração'));process.exitCode=1});
