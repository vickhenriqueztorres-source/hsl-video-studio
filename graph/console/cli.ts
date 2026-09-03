import 'dotenv/config';
import fs from 'node:fs';
import * as readline from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import path from 'node:path';
import {REPO_ROOT} from '../checkpointer';
import {spawnTool,requireSuccess} from '../lib/proc';
import {checkCodexAccount} from '../ide/codexAccount';
import {episodes,overview} from './model';
import {findDuplicate,nextEpisodeId,reserveTheme,suggestThemes,themeRecords} from './themeRegistry';
import {startDashboard} from './server';

const M='\x1b[38;5;108m',DIM='\x1b[38;5;243m',WHITE='\x1b[97m',RED='\x1b[38;5;167m',AMBER='\x1b[38;5;179m',X='\x1b[0m',B='\x1b[1m';
const ts=path.join(REPO_ROOT,'node_modules','ts-node','dist','bin.js');
const banner=()=>console.log(`${M}${B}
  ┌──────────────────────────────────────────────────────┐
  │  HSL MATRIX CLI                         ONLINE  ●    │
  │  Hidden Systems Lab · Production Control             │
  └──────────────────────────────────────────────────────┘${X}`);
const line=(text:string)=>console.log(`  ${text}`);
async function runTs(script:string,args:string[],accepted=[0],extraEnv:NodeJS.ProcessEnv={}){const result=await spawnTool(process.execPath,[ts,path.join(REPO_ROOT,script),...args],{cwd:REPO_ROOT,env:{...process.env,...extraEnv},timeoutMs:24*60*60*1000,onStdout:s=>output.write(M+s+X),onStderr:s=>output.write(RED+s+X)});if(!accepted.includes(result.exitCode??1))requireSuccess(result,'HSL_MATRIX');return result.exitCode??1;}
async function graph(args:string[],paid=false){return runTs('graph/production/cli.ts',args,[0,2,3],paid?{HSL_ALLOW_PAID_FIREFLY_DISPATCH:'true'}:{});}
const latestEpisode=()=>episodes(REPO_ROOT)[0]?.id??'HSL_EPISODE_001';
async function askEpisode(rl:readline.Interface){const fallback=latestEpisode();return(await rl.question(`  Episódio [${fallback}]: `)).trim()||fallback;}

function showEpisodes(){const records=new Map(themeRecords(REPO_ROOT).map(x=>[x.episodeId,x]));console.table(episodes(REPO_ROOT).map(x=>({episodio:x.id,status:x.status,tema:records.get(x.id)?.theme.slice(0,54)??x.title,beats:x.beats,duracao:x.duration?`${Math.round(x.duration/60)} min`:'—'})));}
function showThemes(){const records=themeRecords(REPO_ROOT);if(!records.length){line('Nenhum tema registrado.');return;}console.table(records.map(x=>({episodio:x.episodeId,status:x.status,tema:x.theme.slice(0,82)})));}
function showSuggestions(limit=3){const ideas=suggestThemes(REPO_ROOT,limit);if(!ideas.length){line(`${AMBER}O catálogo atual não contém temas inéditos.${X}`);return[]}console.log(`\n${M}  PRÓXIMOS TEMAS INÉDITOS${X}`);ideas.forEach((x,i)=>{line(`${WHITE}[${i+1}]${X} ${x.theme}`);line(`${M}    Nome automático: ${x.title}${X}`);line(`${DIM}    ${x.thesis}${X}`)});return ideas;}

async function newEpisode(rl:readline.Interface){
  const ideas=showSuggestions(3);if(!ideas.length)return;
  const chosen=(await rl.question(`\n  Digite apenas o número do tema (1-${ideas.length}) [1]: `)).trim()||'1';
  if(!/^[1-3]$/.test(chosen)||!ideas[Number(chosen)-1]){line(`${RED}Escolha somente 1, 2 ou 3.${X}`);return;}
  const idea=ideas[Number(chosen)-1],episodeId=nextEpisodeId(REPO_ROOT);
  const duplicate=findDuplicate(`${idea.theme} ${idea.title} ${idea.entity}`,REPO_ROOT);if(duplicate){line(`${RED}TEMA BLOQUEADO:${X} similaridade ${Math.round(duplicate.score*100)}% com ${duplicate.record.episodeId}`);line(`${DIM}${duplicate.record.theme}${X}`);return;}
  if(fs.existsSync(path.join(REPO_ROOT,'runs',episodeId))){line(`${RED}${episodeId} já existe.${X}`);return;}
  line(`${M}Episódio: ${episodeId}${X}`);
  line(`${WHITE}Nome: ${idea.title}${X}`);
  const minutes=(await rl.question('  Duração em minutos [10]: ')).trim()||'10';
  console.log(`\n  ${WHITE}[1]${X} Planejar roteiro e prompts ${M}(recomendado, sem Kling)${X}\n  ${WHITE}[2]${X} Teste completo de 2 cenas (teto 3 Kling)\n  ${WHITE}[3]${X} Produção completa`);
  const mode=(await rl.question('  Modo [1]: ')).trim()||'1';let extra:string[]=[];
  let paid=false;
  if(mode==='1')extra=['--until','visual_prompts_review_wait','--max-generations','0'];
  else if(mode==='2'){const ok=(await rl.question('  O teste pode consumir até 3 gerações Kling. Digite TESTAR: ')).trim();if(ok!=='TESTAR'){line('Cancelado.');return;}extra=['--beats','2','--test-render','--max-generations','3'];paid=true;}
  else if(mode==='3'){line(`${AMBER}O grafo vai planejar e gerar as imagens primeiro.${X}`);line(`${AMBER}Antes do Kling, ele mostrará a quantidade exata e pedirá autorização.${X}`);const ok=(await rl.question('  Digite PRODUZIR para iniciar as etapas sem custo Kling: ')).trim();if(ok!=='PRODUZIR'){line('Cancelado.');return;}extra=['--max-generations','0'];}
  else{line('Modo inválido.');return;}
  reserveTheme(episodeId,`${idea.title} · ${idea.theme}`,REPO_ROOT);line(`${M}Tema reservado no catálogo: ${episodeId}${X}`);
  const args=['run','--episode',episodeId,'--topic',idea.title,'--entity',idea.entity,'--mechanism',idea.mechanism,'--constraint',idea.constraint,'--consequence',idea.consequence,'--thesis',idea.thesis,'--target-minutes',minutes,'--media-mode','real','--storage','drive','--prune','dry-run',...extra];
  await graph(args,paid);
}

async function resumeEpisode(rl:readline.Interface,provided?:string){const episode=provided||await askEpisode(rl),data=await overview(episode,REPO_ROOT),args=['resume','--episode',episode,'--storage','drive','--prune','dry-run'];const interrupt=data.interrupts[0];let paid=Boolean(data.klingBudget?.approvedAt);if(interrupt){line(`${AMBER}Gate ativo: ${interrupt.kind??interrupt.gate??'DECISÃO HUMANA'}${X}`);if(interrupt.kind==='KLING_BUDGET'){line(`${WHITE}${interrupt.totalTakes} takes planejados · ${interrupt.reusableTakes} reaproveitados · ${interrupt.requiredGenerations} novas gerações${X}`);const ok=(await rl.question(`  Autorizar exatamente ${interrupt.requiredGenerations} gerações Kling? Digite KLING: `)).trim();if(ok!=='KLING'){line('Retomada cancelada antes do despacho.');return;}args.push('--decision','proceed','--max-generations',String(interrupt.requiredGenerations));paid=true;}else{const needsDecision=!interrupt.kind||interrupt.kind==='IMAGE_HUMAN_REVIEW';if(needsDecision){const decision=(await rl.question('  [a] aprovar  [x] abortar  [v] voltar: ')).trim().toLowerCase();if(decision==='v'||!decision)return;if(!['a','x'].includes(decision)){line('Opção inválida.');return;}args.push('--decision',decision==='a'?'proceed':'abort');}}}await graph(args,paid);}
async function generateImages(rl:readline.Interface,provided?:string){const episode=provided||await askEpisode(rl),queue=path.join(REPO_ROOT,'runs',episode,'images','QUEUE.json');if(!fs.existsSync(queue)){line(`${RED}Fila de imagens ainda não existe para ${episode}.${X}`);return;}await runTs('graph/production/lib/codexImages.ts',['--queue',queue],[0]);}
async function doctor(){const codex=await checkCodexAccount(REPO_ROOT),checks=[['Codex CLI',codex.authenticated,'npm run hsl:codex:login'],['Google Drive',Boolean(process.env.HSL_DRIVE_FOLDER_ID&&process.env.HSL_GOOGLE_TOKEN_FILE),'npm run hsl:drive:check'],['Agente Kling',Boolean(process.env.HSL_FIREFLY_AGENT_DIR),'Configure HSL_FIREFLY_AGENT_DIR'],['FFmpeg',Boolean(await spawnTool('ffmpeg',['-version'],{cwd:REPO_ROOT,timeoutMs:10000}).then(x=>x.exitCode===0).catch(()=>false)),'Instale ffmpeg']];console.table(checks.map(([item,ok,acao])=>({item,status:ok?'OK':'ATENÇÃO',acao:ok?'—':acao})));}
async function openDrive(){const id=process.env.HSL_DRIVE_FOLDER_ID;if(!id){line(`${RED}HSL_DRIVE_FOLDER_ID não configurado.${X}`);return;}await spawnTool('rundll32.exe',['url.dll,FileProtocolHandler',`https://drive.google.com/drive/folders/${id}`],{cwd:REPO_ROOT,timeoutMs:10000});}
async function checkKling(){await runTs('graph/production/klingSupervisor.ts',['check'],[0,2]);}
function help(){console.log(`
  ${WHITE}COMANDOS DIRETOS${X}
  npm run hsl:matrix -- novo       cria episódio com bloqueio de tema repetido
  npm run hsl:matrix -- sugerir    mostra três temas inéditos
  npm run hsl:matrix -- continuar  retoma um checkpoint
  npm run hsl:matrix -- status     mostra estado técnico
  npm run hsl:matrix -- imagens    gera a fila pendente pelo Codex
  npm run hsl:matrix -- episodios  lista o acervo
  npm run hsl:matrix -- temas      mostra o catálogo antirrepetição
  npm run hsl:matrix -- mapa       abre o observador web
  npm run hsl:matrix -- kling      executa o fiscal técnico sem gerar vídeo
  npm run hsl:matrix -- doctor     verifica contas e ferramentas
`);}

async function dispatch(command:string,rl:readline.Interface,args:string[]=[]){const cmd=command.toLowerCase();if(['novo','new'].includes(cmd))await newEpisode(rl);else if(['sugerir','suggest'].includes(cmd))showSuggestions();else if(['continuar','resume'].includes(cmd))await resumeEpisode(rl,args[0]);else if(cmd==='status')await graph(['status','--episode',args[0]??latestEpisode()]);else if(['imagens','images'].includes(cmd))await generateImages(rl,args[0]);else if(['episodios','list'].includes(cmd))showEpisodes();else if(['temas','themes'].includes(cmd))showThemes();else if(['mapa','dashboard'].includes(cmd)){rl.close();await startDashboard();return'open';}else if(cmd==='drive')await openDrive();else if(cmd==='kling')await checkKling();else if(cmd==='doctor')await doctor();else if(['ajuda','help','--help','-h'].includes(cmd))help();else line(`${RED}Comando desconhecido: ${command}${X}`);return'continue';}

export async function main(argv=process.argv.slice(2)){banner();
  if(argv.length){const directRl=readline.createInterface({input,output});try{await dispatch(argv[0],directRl,argv.slice(1));}finally{directRl.close();}return;}
  const account=await checkCodexAccount(REPO_ROOT);line(`Codex: ${account.authenticated?M+'CONECTADO':RED+'LOGIN NECESSÁRIO'}${X}`);const rl=readline.createInterface({input,output});try{
  for(;;){console.log(`
  ${WHITE}[1]${X} Criar novo episódio       ${WHITE}[6]${X} Abrir mapa mental
  ${WHITE}[2]${X} Sugerir próximo tema      ${WHITE}[7]${X} Listar episódios
  ${WHITE}[3]${X} Continuar episódio        ${WHITE}[8]${X} Catálogo de temas
  ${WHITE}[4]${X} Ver status                ${WHITE}[9]${X} Verificar ambiente
  ${WHITE}[5]${X} Gerar imagens pendentes   ${WHITE}[D]${X} Abrir Google Drive
  ${WHITE}[K]${X} Fiscal técnico do Kling
  ${WHITE}[0]${X} Sair`);const choice=(await rl.question(`${M}\n  matrix> ${X}`)).trim().toLowerCase();if(choice==='0')break;if(/^hsl[\\_ -]*episode/i.test(choice)){line(`${AMBER}O ID é automático. Escolha [1] Criar novo episódio.${X}`);continue;}const command:{[key:string]:string}={1:'novo',2:'sugerir',3:'continuar',4:'status',5:'imagens',6:'mapa',7:'episodios',8:'temas',9:'doctor',d:'drive',k:'kling'};const selected=command[choice]??choice;if(selected==='status')await graph(['status','--episode',await askEpisode(rl)]);else if(await dispatch(selected,rl)==='open')return;}
}finally{rl.close();}}
if(require.main===module)main().catch(e=>{console.error(`${RED}${e instanceof Error?e.message:e}${X}`);process.exitCode=1;});
