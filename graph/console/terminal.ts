import {Writable} from 'node:stream';
import {createInterface,Interface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';

const controls=new WeakMap<Interface,{muted:boolean}>();
export function createConsoleReadline(){
  const state={muted:false};
  const output=new Writable({write(chunk,encoding,callback){if(state.muted){callback();return;}stdout.write(chunk,encoding as BufferEncoding,callback);}});
  Object.defineProperty(output,'columns',{get:()=>stdout.columns});
  const resize=()=>output.emit('resize');stdout.on('resize',resize);
  const rl=createInterface({input:stdin,output,terminal:!!(stdin.isTTY&&stdout.isTTY)});
  controls.set(rl,state);rl.once('close',()=>{stdout.off('resize',resize);output.end();});return rl;
}
export async function hiddenQuestion(rl:Interface):Promise<string>{
  if(!stdin.isTTY)throw Error('Cadastre a chave em um terminal interativo para ocultar a entrada.');
  const state=controls.get(rl);if(!state)throw Error('Terminal não suporta entrada oculta.');
  const terminal=rl as Interface & {history?:string[]},history=terminal.history?[...terminal.history]:undefined;
  stdout.write('  Cole a chave (entrada oculta; Enter salva, vazio cancela): ');
  state.muted=true;
  try{return(await rl.question('')).trim();}finally{state.muted=false;if(history)terminal.history=history;stdout.write('\n');}
}
