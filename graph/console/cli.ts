import {createConsoleReadline} from './terminal';
import {elevenLabsMenu} from './elevenLabsMenu';
import 'dotenv/config';
import fs from 'node:fs';
import * as readline from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import path from 'node:path';
import {REPO_ROOT} from '../checkpointer';
import {spawnTool,requireSuccess} from '../lib/proc';
import {checkCodexAccount,loginCodexAccount,switchCodexAccount} from '../ide/codexAccount';
import {checkAntigravityAccount,loginAntigravity} from '../ide/antigravityAccount';
import {liveProgress,formatProgress} from './progress';
import {safeLog} from '../production/telemetry';
import {episodes,overview} from './model';
import {findDuplicate,nextEpisodeId,reserveTheme,suggestThemes,themeRecords} from './themeRegistry';
import {startDashboard} from './server';

const M='\x1b[38;5;108m',DIM='\x1b[38;5;243m',WHITE='\x1b[97m',RED='\x1b[38;5;167m',AMBER='\x1b[38;5;179m',X='\x1b[0m',B='\x1b[1m';
const ts=path.join(REPO_ROOT,'node_modules','ts-node','dist','bin.js');
const banner=()=>{const width=Math.min(76,Math.max(48,(output.columns||80)-4));
  const rows=width>=68?[
    'H I D D E N   S Y S T E M S   L A B', '',
    '██╗  ██╗ ███████╗ ██╗              ◇',
    '██║  ██║ ██╔════╝ ██║            ╱ ◉ ╲',
    '███████║ ███████╗ ██║           ◇─────◇',
    '██╔══██║ ╚════██║ ██║            ╲ ◉ ╱',
    '██║  ██║ ███████║ ███████╗         ◇',
    '╚═╝  ╚═╝ ╚══════╝ ╚══════╝', '',
    'M A T R I X   /   COMMAND CENTER',
    'PLANEJAR → CRIAR → REVISAR → ANIMAR → PUBLICAR'
  ]:['HIDDEN SYSTEMS LAB','','H S L   /   M A T R I X','COMMAND CENTER','','PLANEJAR → CRIAR → REVISAR → PUBLICAR'];
  console.log(M+B+'\n  ╭'+'─'.repeat(width)+'╮');for(const [index,value] of rows.entries()){const row=width>=68&&index>=2&&index<=7?value.padEnd(40):value;const left=Math.floor((width-row.length)/2);console.log('  │'+' '.repeat(left)+row+' '.repeat(width-left-row.length)+'│');}console.log('  ╰'+'─'.repeat(width)+'╯'+X);console.log(`  ${DIM}CLI executa · Mapa observa · Checkpoints recuperáveis${X}`);
};
const line=(text:string)=>console.log(`  ${text}`);
async function runTs(script:string,args:string[],accepted=[0],extraEnv:NodeJS.ProcessEnv={}){const result=await spawnTool(process.execPath,[ts,path.join(REPO_ROOT,script),...args],{cwd:REPO_ROOT,env:{...process.env,HSL_GRAPH_PROGRESS:'1',...extraEnv},timeoutMs:24*60*60*1000,onStdout:s=>output.write(M+s+X),onStderr:s=>output.write(RED+s+X)});if(!accepted.includes(result.exitCode??1))requireSuccess(result,'HSL_MATRIX');return result.exitCode??1;}
function monitor(episode:string){let busy=false,stopped=false,last='',lastPrint=0,seen=new Set<string>();
  const tick=async()=>{if(busy||stopped)return;busy=true;try{const p=await liveProgress(episode);if(stopped)return;const summary=formatProgress(p);if(summary!==last||Date.now()-lastPrint>10000){line(`${M}${episode}  ${summary}${X}`);last=summary;lastPrint=Date.now();}
    const fresh=p.logs.filter(e=>!seen.has(JSON.stringify(e)));for(const e of (seen.size?fresh:fresh.slice(-5)))line(`${DIM}${new Date(e.at).toLocaleTimeString('pt-BR')} · ${e.node} · ${e.message}${X}`);p.logs.forEach(e=>seen.add(JSON.stringify(e)));
  }catch(e){if(!stopped)line(`${AMBER}Monitor: ${safeLog(e)}${X}`);}finally{busy=false;}};
  const timer=setInterval(()=>void tick(),2000);void tick();return()=>{stopped=true;clearInterval(timer)};
}
async function showStatus(episode:string){const p=await liveProgress(episode);line(`${M}${episode}\n  ${formatProgress(p)}${X}`);line(`${DIM}${p.basis}${X}`);for(const e of p.logs.slice(-8))line(`${DIM}${new Date(e.at).toLocaleTimeString('pt-BR')} · ${e.node} · ${e.message}${X}`);}
async function watchEpisode(rl:readline.Interface,episode:string){if(!input.isTTY){await showStatus(episode);return;}const stop=monitor(episode);try{await rl.question('  Acompanhando a cada 2s. Enter para voltar (não interrompe o grafo).\n');}finally{stop();}}
async function accountAction(rl:readline.Interface,provider:'codex'|'antigravity',action:string){
  if(!['status','login','switch'].includes(action))throw new Error('Use status, login ou switch');
  if(action==='status'){const status=provider==='codex'?await checkCodexAccount(REPO_ROOT):await checkAntigravityAccount(REPO_ROOT);line(`${provider}: ${JSON.stringify(status)}`);return;}
  const wasRaw=input.isRaw;rl.pause();if(input.isTTY)input.setRawMode(false);
  try{const code=provider==='codex'?await(action==='switch'?switchCodexAccount(REPO_ROOT):loginCodexAccount(REPO_ROOT)):await loginAntigravity(REPO_ROOT,action==='switch');
    if(code!==0)line(`${AMBER}Login encerrado (código ${code}). Você pode tentar novamente pelo menu de contas.${X}`);
  }finally{if(input.isTTY)input.setRawMode(wasRaw);rl.resume();}
  await accountAction(rl,provider,'status');
}
async function accounts(rl:readline.Interface){
  for(;;){console.log(`
  ${M}CONTAS DOS AGENTES${X}
  [1] Entrar no Codex          [2] Trocar conta do Codex
  [3] Entrar no Antigravity    [4] Trocar conta do Antigravity
  [5] Verificar conexões       [6] Chaves API ElevenLabs
  [0] Voltar
  ${DIM}Uma conta ativa por ferramenta neste perfil de usuário.
  Trocar substitui o login usado nas próximas chamadas da CLI/grafo.
  Os checkpoints dos episódios continuam salvos.${X}`);
    const choice=(await rl.question('  contas> ')).trim();if(choice==='0'||!choice)return;
    const actions:Record<string,['codex'|'antigravity','login'|'switch']>={1:['codex','login'],2:['codex','switch'],3:['antigravity','login'],4:['antigravity','switch']};
    try{if(choice==='6')await elevenLabsMenu(rl);else if(choice==='5'){await accountAction(rl,'codex','status');await accountAction(rl,'antigravity','status');}else if(actions[choice])await accountAction(rl,...actions[choice]);else line('Escolha de 0 a 6.');}
    catch(error){line(`${RED}${safeLog(error)}${X}`);}
  }
}
async function graph(args:string[],paid=false){const episode=args[args.indexOf('--episode')+1],stop=['run','resume'].includes(args[0])&&episode?monitor(episode):()=>{};try{return await runTs('graph/production/cli.ts',args,[0,2,3],paid?{HSL_ALLOW_PAID_FIREFLY_DISPATCH:'true'}:{});}finally{stop();if(episode&&['run','resume'].includes(args[0]))await showStatus(episode);}}
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
async function doctor(){const codex=await checkCodexAccount(REPO_ROOT),agy=await checkAntigravityAccount(REPO_ROOT),checks=[['Antigravity CLI',agy.available,'npm run hsl:antigravity:login'],['Codex CLI',codex.authenticated,'npm run hsl:codex:login'],['Google Drive',Boolean(process.env.HSL_DRIVE_FOLDER_ID&&process.env.HSL_GOOGLE_TOKEN_FILE),'npm run hsl:drive:check'],['Agente Kling',Boolean(process.env.HSL_FIREFLY_AGENT_DIR),'Configure HSL_FIREFLY_AGENT_DIR'],['FFmpeg',Boolean(await spawnTool('ffmpeg',['-version'],{cwd:REPO_ROOT,timeoutMs:10000}).then(x=>x.exitCode===0).catch(()=>false)),'Instale ffmpeg']];console.table(checks.map(([item,ok,acao])=>({item,status:ok?'OK':'ATENÇÃO',acao:ok?'—':acao})));}
async function openDrive(){const id=process.env.HSL_DRIVE_FOLDER_ID;if(!id){line(`${RED}HSL_DRIVE_FOLDER_ID não configurado.${X}`);return;}await spawnTool('rundll32.exe',['url.dll,FileProtocolHandler',`https://drive.google.com/drive/folders/${id}`],{cwd:REPO_ROOT,timeoutMs:10000});}
async function checkKling(){await runTs('graph/production/klingSupervisor.ts',['check'],[0,2]);}
function help(){console.log(`
  ${WHITE}COMANDOS DIRETOS${X}
  npm run hsl:matrix -- novo       cria episódio com bloqueio de tema repetido
  npm run hsl:matrix -- sugerir    mostra três temas inéditos
  npm run hsl:matrix -- continuar  retoma um checkpoint
  npm run hsl:matrix -- status     mostra progresso, contadores e pausas
  npm run hsl:matrix -- imagens    gera a fila pendente pelo Codex
  npm run hsl:matrix -- episodios  lista o acervo
  npm run hsl:matrix -- temas      mostra o catálogo antirrepetição
  npm run hsl:matrix -- mapa       abre o observador web
  npm run hsl:matrix -- kling      executa o fiscal técnico sem gerar vídeo
  npm run hsl:matrix -- logs       acompanha logs e progresso em tempo real
  npm run hsl:matrix -- contas      entra ou troca contas Codex / Antigravity
  npm run hsl:matrix -- elevenlabs gerencia as chaves de narração
  npm run hsl:matrix -- doctor     verifica contas e ferramentas
`);}

async function dispatch(command:string,rl:readline.Interface,args:string[]=[]){const cmd=command.toLowerCase();if(['novo','new'].includes(cmd))await newEpisode(rl);else if(['sugerir','suggest'].includes(cmd))showSuggestions();else if(['continuar','resume'].includes(cmd))await resumeEpisode(rl,args[0]);else if(cmd==='status')await showStatus(args[0]??latestEpisode());else if(['logs','acompanhar'].includes(cmd))await watchEpisode(rl,args[0]??await askEpisode(rl));else if(cmd==='elevenlabs')await elevenLabsMenu(rl);else if(['contas','accounts'].includes(cmd))await accounts(rl);else if(cmd==='antigravity'||cmd==='codex'){if(args[0])await accountAction(rl,cmd,args[0]);else await accounts(rl);}else if(['imagens','images'].includes(cmd))await generateImages(rl,args[0]);else if(['episodios','list'].includes(cmd))showEpisodes();else if(['temas','themes'].includes(cmd))showThemes();else if(['mapa','dashboard'].includes(cmd)){rl.close();await startDashboard();return'open';}else if(cmd==='drive')await openDrive();else if(cmd==='kling')await checkKling();else if(cmd==='doctor')await doctor();else if(['ajuda','help','--help','-h'].includes(cmd))help();else line(`${RED}Comando desconhecido: ${command}${X}`);return'continue';}

export async function main(argv=process.argv.slice(2)){banner();
  if(argv.length){const directRl=createConsoleReadline();try{await dispatch(argv[0],directRl,argv.slice(1));}finally{directRl.close();}return;}
  const account=await checkCodexAccount(REPO_ROOT);line(`Codex: ${account.authenticated?M+'CONECTADO':RED+'LOGIN NECESSÁRIO'}${X}`);const rl=createConsoleReadline();try{
  for(;;){console.log(`
  ${WHITE}[1]${X} Criar novo episódio       ${WHITE}[6]${X} Abrir mapa mental
  ${WHITE}[2]${X} Sugerir próximo tema      ${WHITE}[7]${X} Listar episódios
  ${WHITE}[3]${X} Continuar episódio        ${WHITE}[8]${X} Catálogo de temas
  ${WHITE}[4]${X} Ver status                ${WHITE}[9]${X} Verificar ambiente
  ${WHITE}[5]${X} Gerar imagens pendentes   ${WHITE}[D]${X} Abrir Google Drive
  ${WHITE}[K]${X} Fiscal técnico do Kling   ${WHITE}[L]${X} Logs ao vivo
  ${WHITE}[A]${X} Contas Codex / Antigravity  ${WHITE}[E]${X} Chaves ElevenLabs
  ${WHITE}[0]${X} Sair`);const choice=(await rl.question(`${M}\n  matrix> ${X}`)).trim().toLowerCase();if(choice==='0')break;if(/^hsl[\\_ -]*episode/i.test(choice)){line(`${AMBER}O ID é automático. Escolha [1] Criar novo episódio.${X}`);continue;}const command:{[key:string]:string}={1:'novo',2:'sugerir',3:'continuar',4:'status',5:'imagens',6:'mapa',7:'episodios',8:'temas',9:'doctor',d:'drive',k:'kling',l:'logs',a:'contas',e:'elevenlabs'};const selected=command[choice]??choice;try{if(selected==='status')await showStatus(await askEpisode(rl));else if(await dispatch(selected,rl)==='open')return;}catch(error){line(`${RED}${error instanceof Error?error.message:String(error)}${X}`);line('O comando parou. O Matrix continua aberto; corrija a causa e use Continuar episódio.');}}
}finally{rl.close();}}
if(require.main===module)main().catch(e=>{console.error(`${RED}${e instanceof Error?e.message:e}${X}`);process.exitCode=1;});
