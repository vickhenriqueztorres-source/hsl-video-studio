import {createConsoleReadline} from './terminal';
import {elevenLabsMenu} from './elevenLabsMenu';
import 'dotenv/config';
import fs from 'node:fs';
import * as readline from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import path from 'node:path';
import {REPO_ROOT} from '../checkpointer';
import {spawnTool,requireSuccess} from '../lib/proc';
import {checkCodexAccount,loginCodexAccount,loginCodexProfile,switchCodexAccount,checkCodexAccounts} from '../ide/codexAccount';
import {addCodexReserve,listCodexProfiles,preferCodexProfile,removeCodexReserve} from '../ide/codexProfiles';
import {checkAntigravityAccount,loginAntigravity} from '../ide/antigravityAccount';
import {liveProgress,formatProgress} from './progress';
import {safeLog} from '../production/telemetry';
import {episodes,overview} from './model';
import {findDuplicate,nextEpisodeId,reserveTheme,suggestThemes,themeRecords} from './themeRegistry';
import {startDashboard} from './server';
import {selectMatrixStorage} from './storageMode';
import {activeLockPid,activeProduction} from './activeProduction';

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
  [7] Contas reserva Codex
  [0] Voltar
  ${DIM}Uma conta ativa por ferramenta neste perfil de usuário.
  Trocar substitui o login usado nas próximas chamadas da CLI/grafo.
  Os checkpoints dos episódios continuam salvos.${X}`);
    const choice=(await rl.question('  contas> ')).trim();if(choice==='0'||!choice)return;
    const actions:Record<string,['codex'|'antigravity','login'|'switch']>={1:['codex','login'],2:['codex','switch'],3:['antigravity','login'],4:['antigravity','switch']};
    try{if(choice==='6')await elevenLabsMenu(rl);else if(choice==='7')await codexReserveMenu(rl);else if(choice==='5'){await accountAction(rl,'codex','status');await accountAction(rl,'antigravity','status');}else if(actions[choice])await accountAction(rl,...actions[choice]);else line('Escolha de 0 a 7.');}
    catch(error){line(`${RED}${safeLog(error)}${X}`);}
  }
}
async function codexReserveMenu(rl:readline.Interface){
  for(;;){
    console.log(`\n  ${M}CONTAS RESERVA CODEX${X}\n  [1] Adicionar conta reserva  [2] Listar/testar contas\n  [3] Entrar em conta reserva  [4] Definir conta preferencial\n  [5] Remover cadastro local   [0] Voltar\n  ${DIM}Cada conta usa um CODEX_HOME separado. Tokens ficam sob o armazenamento nativo do Codex; o Matrix salva somente apelido e caminho.${X}`);
    const choice=(await rl.question('  codex-reserva> ')).trim();if(!choice||choice==='0')return;
    try{
      if(choice==='1'){const name=(await rl.question('  Apelido da conta reserva: ')).trim();const profile=addCodexReserve(name);line(`${M}Perfil criado em ${profile.home}. Iniciando login separado...${X}`);const code=await loginCodexProfile(REPO_ROOT,profile);line(code===0?'Login da conta reserva concluído.':'Login encerrado; o perfil permanece cadastrado para tentar novamente.');continue;}
      const profiles=listCodexProfiles();profiles.forEach((p,i)=>line(`[${i+1}] ${p.name} · ${p.kind}${p.id==='primary'?' · preferencial padrão':''} · ${p.home}`));
      if(choice==='2'){const status=await checkCodexAccounts(REPO_ROOT);status.profiles.forEach(p=>line(`${p.name}: ${p.authenticated?'autenticada':'indisponível'}`));continue;}
      const value=(await rl.question('  Número da conta [Enter cancela]: ')).trim();if(!value)continue;const profile=/^[1-9]\d*$/.test(value)?profiles[Number(value)-1]:undefined;if(!profile){line('Número inválido.');continue;}
      if(choice==='3'){if(profile.kind==='primary')await loginCodexAccount(REPO_ROOT);else await loginCodexProfile(REPO_ROOT,profile);}
      else if(choice==='4'){preferCodexProfile(profile.id);line(`Conta preferencial definida: ${profile.name}. A rotação automática começa por ela.`);}
      else if(choice==='5'){if(profile.kind==='primary'){line('A conta principal não pode ser removida por este menu.');continue;}if((await rl.question(`  Remover o cadastro de ${profile.name}? Digite REMOVER: `)).trim()==='REMOVER'){removeCodexReserve(profile.id);line('Cadastro removido. A pasta de credenciais foi preservada para evitar exclusão acidental; remova-a pelo sistema se desejar.');}}
      else line('Escolha de 0 a 5.');
    }catch(error){line(`${RED}${safeLog(error)}${X}`);}
  }
}
async function graph(args:string[],paid=false){
  const episode=args[args.indexOf('--episode')+1],startsProduction=['run','resume'].includes(args[0]);
  const active=startsProduction?activeProduction(REPO_ROOT):undefined;
  if(active){
    const running=active.episode??`processo PID ${active.pid}`;
    line(`${AMBER}${running} já está em execução (PID ${active.pid}). Nenhuma segunda execução foi iniciada.${X}`);
    if(active.episode)await showStatus(active.episode);
    return 0;
  }
  const stop=startsProduction&&episode?monitor(episode):()=>{};
  try{return await runTs('graph/production/cli.ts',args,[0,2,3],paid?{HSL_ALLOW_PAID_FIREFLY_DISPATCH:'true'}:{});}
  finally{stop();if(episode&&startsProduction)await showStatus(episode);}
}
import type {ChannelId} from '../../channels/types';

const latestEpisode=()=>episodes(REPO_ROOT)[0]?.id??'HSL_EPISODE_001';
async function askEpisode(rl:readline.Interface){const fallback=latestEpisode();return(await rl.question(`  Episódio [${fallback}]: `)).trim()||fallback;}
async function askChannel(rl:readline.Interface):Promise<ChannelId>{
  console.log(`\n  ${WHITE}Selecione o canal:${X}`);
  console.log(`  ${WHITE}[1]${X} HSL — Hidden Systems Lab (Inglês, Sistemas Complexos)`);
  console.log(`  ${WHITE}[2]${X} BRECHA (Português, Fraudes Digitais, Segurança & Cibercrime)`);
  const ans=(await rl.question(`  Canal [1]: `)).trim();
  if(ans==='2'||ans.toLowerCase()==='brecha')return'brecha';
  return'hsl';
}

function showEpisodes(){
  const records=new Map(themeRecords(REPO_ROOT).map(x=>[x.episodeId,x]));
  console.table(episodes(REPO_ROOT).map(x=>{
    const rec=records.get(x.id);
    const canal=(rec?.channelId??(x.id.startsWith('BRECHA_')?'brecha':'hsl')).toUpperCase();
    return{episodio:x.id,canal,status:x.status,tema:rec?.theme.slice(0,50)??x.title,beats:x.beats,duracao:x.duration?`${Math.round(x.duration/60)} min`:'—'};
  }));
}
function showThemes(){
  const records=themeRecords(REPO_ROOT);
  if(!records.length){line('Nenhum tema registrado.');return;}
  console.table(records.map(x=>({
    episodio:x.episodeId,
    canal:(x.channelId??(x.episodeId.startsWith('BRECHA_')?'brecha':'hsl')).toUpperCase(),
    status:x.status,
    tema:x.theme.slice(0,75)
  })));
}
function showSuggestions(channel:ChannelId='hsl',limit=3){
  const ideas=suggestThemes(channel,REPO_ROOT,limit);
  const label=channel==='brecha'?'BRECHA':'HSL';
  if(!ideas.length){line(`${AMBER}O catálogo de ${label} não contém temas inéditos.${X}`);return[];}
  console.log(`\n${M}  PRÓXIMOS TEMAS INÉDITOS (${label})${X}`);
  ideas.forEach((x,i)=>{line(`${WHITE}[${i+1}]${X} ${x.theme}`);line(`${M}    Nome automático: ${x.title}${X}`);line(`${DIM}    ${x.thesis}${X}`);});
  return ideas;
}

async function newEpisode(rl:readline.Interface, args:string[]=[]){
  let channelArg: ChannelId | undefined = undefined;
  let chosenArg: string | undefined = undefined;
  let minutesArg: string | undefined = undefined;
  let modeArg: string | undefined = undefined;
  let authoredArg: boolean | undefined = undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--channel' && args[i+1]) channelArg = (args[++i].toLowerCase() === 'brecha' ? 'brecha' : 'hsl');
    else if (a === '--minutes' && args[i+1]) minutesArg = args[++i];
    else if (a === '--duration' && args[i+1]) minutesArg = args[++i];
    else if (a === '--theme' && args[i+1]) chosenArg = args[++i];
    else if (a === '--mode' && args[i+1]) modeArg = args[++i];
    else if (a === '--authored') authoredArg = true;
    else if (!channelArg && ['brecha', 'hsl'].includes(a.toLowerCase())) channelArg = a.toLowerCase() as ChannelId;
    else if (!chosenArg && /^[1-3]$/.test(a)) chosenArg = a;
    else if (!minutesArg && /^\d+$/.test(a)) minutesArg = a;
  }

  const channel = channelArg ?? (await askChannel(rl));
  const ideas=showSuggestions(channel,3);if(!ideas.length)return;
  const chosen = chosenArg ?? ((await rl.question(`\n  Digite apenas o número do tema (1-${ideas.length}) [1]: `)).trim() || '1');
  if(!/^[1-3]$/.test(chosen)||!ideas[Number(chosen)-1]){line(`${RED}Escolha somente 1, 2 ou 3.${X}`);return;}
  const idea=ideas[Number(chosen)-1],episodeId=nextEpisodeId(channel,REPO_ROOT);
  const duplicate=findDuplicate(`${idea.theme} ${idea.title} ${idea.entity}`,channel,REPO_ROOT);if(duplicate){line(`${RED}TEMA BLOQUEADO:${X} similaridade ${Math.round(duplicate.score*100)}% com ${duplicate.record.episodeId}`);line(`${DIM}${duplicate.record.theme}${X}`);return;}
  if(fs.existsSync(path.join(REPO_ROOT,'runs',episodeId))){line(`${RED}${episodeId} já existe.${X}`);return;}
  line(`${M}Canal: ${channel.toUpperCase()}${X}`);
  line(`${M}Episódio: ${episodeId}${X}`);
  line(`${WHITE}Nome: ${idea.title}${X}`);
  const minutes = minutesArg ?? ((await rl.question('  Duração em minutos [10]: ')).trim() || '10');
  console.log(`\n  ${WHITE}[1]${X} Planejar roteiro e prompts ${M}(recomendado, sem Kling)${X}\n  ${WHITE}[2]${X} Teste completo de 2 cenas (teto 3 Kling)\n  ${WHITE}[3]${X} Produção completa 100% autoral ${M}(Stills 16:9 + Motion Squad Remotion 2D/3D + Áudio, sem Kling)${X}\n  ${WHITE}[4]${X} Produção completa Híbrida Firefly/Kling`);
  const mode = modeArg ?? ((await rl.question('  Modo [1]: ')).trim() || '1');let extra:string[]=[];
  let paid=false;
  if(mode==='1')extra=['--until','visual_prompts_review_wait','--max-generations','0'];
  else if(mode==='2'){const ok=modeArg?'TESTAR':(await rl.question('  O teste pode consumir até 3 gerações Kling. Digite TESTAR: ')).trim();if(ok!=='TESTAR'){line('Cancelado.');return;}extra=['--beats','2','--test-render','--max-generations','3'];paid=true;}
  else if(mode==='3'){line(`${M}Produção completa 100% autoral selecionada: quadros 16:9 + squad de motion Remotion 2D/3D + pós-produção.${X}`);const ok=modeArg?'PRODUZIR':(await rl.question('  Digite PRODUZIR para iniciar: ')).trim();if(ok!=='PRODUZIR'){line('Cancelado.');return;}extra=['--media-policy','stills','--max-generations','0'];}
  else if(mode==='4'){line(`${AMBER}O grafo vai planejar e gerar as imagens primeiro.${X}`);line(`${AMBER}Antes do Kling, ele mostrará a quantidade exata e pedirá autorização.${X}`);const ok=modeArg?'PRODUZIR':(await rl.question('  Digite PRODUZIR para iniciar as etapas sem custo Kling: ')).trim();if(ok!=='PRODUZIR'){line('Cancelado.');return;}extra=['--media-policy','firefly-hybrid','--max-generations','0'];}
  else{line('Modo inválido.');return;}
  const authored = authoredArg ?? ((await rl.question('  Ativar squad de motion autoral 2D/3D? [s/N]: ')).trim().toLowerCase()==='s');
  if(authored)extra.push('--motion-mode','authored','--motion-scenes','3','--motion-require-3d');
  reserveTheme(episodeId,`${idea.title} · ${idea.theme}`,channel,REPO_ROOT);line(`${M}Tema reservado no catálogo (${channel.toUpperCase()}): ${episodeId}${X}`);
  const storage=selectMatrixStorage();
  if(storage.mode==='off')line(`${AMBER}Google Drive indisponível (${storage.reason}); esta execução usará armazenamento local.${X}`);
  const runArgs=['run','--channel',channel,'--episode',episodeId,'--topic',idea.title,'--entity',idea.entity,'--mechanism',idea.mechanism,'--constraint',idea.constraint,'--consequence',idea.consequence,'--thesis',idea.thesis,'--target-minutes',minutes,'--media-mode','real','--storage',storage.mode,'--prune','dry-run',...extra];
  await graph(runArgs,paid);
}

async function resumeEpisode(rl:readline.Interface,provided?:string,extraArgs:string[]=[]){
  const episode=provided||await askEpisode(rl),data=await overview(episode,REPO_ROOT);
  if(data.status==='COMPLETED'||data.live?.status==='COMPLETED'){
    line(`${M}O episódio ${episode} já está 100% concluído com sucesso!${X}`);
    line(`${WHITE}Vídeo master e entregáveis em: deliveries/${episode}/${X}`);
    return;
  }
  const needsRewindCompliance = !data.next.length && data.status === 'COMPLIANCE_FAILED';
  const currentInterrupt=data.interrupts[0];
  const quotaReview=Boolean(currentInterrupt&&currentInterrupt.kind==='IMAGE_HUMAN_REVIEW'&&/cota|quota|usage limit|rate limit|credits? exhausted/i.test(JSON.stringify(currentInterrupt)));
  const storage=selectMatrixStorage();
  if(storage.mode==='off')line(`${AMBER}Google Drive indisponível (${storage.reason}); a retomada usará armazenamento local.${X}`);
  let args = needsRewindCompliance
    ? ['run','--episode',episode,'--from','compliance_stage','--storage',storage.mode,'--prune','dry-run']
    : ['resume','--episode',episode,'--storage',storage.mode,'--prune','dry-run'];
  if(quotaReview){
    args=['run','--episode',episode,'--from','image_generate_wait','--storage',storage.mode,'--prune','dry-run'];
    line(`${AMBER}Cota do Codex detectada no gate de revisão; revalidando o inventário físico e reabrindo apenas o lote pendente para rotação automática de provedor.${X}`);
  }
  let decisionArg: string | undefined = undefined;
  let mediaPolicyArg: string | undefined = undefined;
  for (let i = 0; i < extraArgs.length; i++) {
    if (extraArgs[i] === '--decision' && extraArgs[i+1]) decisionArg = extraArgs[++i].toLowerCase();
    else if (extraArgs[i] === '--media-policy' && extraArgs[i+1]) mediaPolicyArg = extraArgs[++i].toLowerCase();
    else if (['a', 'aprovar', 'proceed'].includes(extraArgs[i].toLowerCase())) decisionArg = 'a';
    else if (['r', 'retry'].includes(extraArgs[i].toLowerCase())) decisionArg = 'r';
    else if (['x', 'abort'].includes(extraArgs[i].toLowerCase())) decisionArg = 'x';
  }
  const interrupt=quotaReview?undefined:currentInterrupt;let paid=Boolean(data.klingBudget?.approvedAt);
  if(interrupt){
    line(`${AMBER}Gate ativo: ${interrupt.kind??interrupt.gate??'DECISÃO HUMANA'}${X}`);
    if(interrupt.kind==='KLING_BUDGET'){
      line(`${WHITE}${interrupt.totalTakes} takes planejados · ${interrupt.reusableTakes} reaproveitados · ${interrupt.requiredGenerations} novas gerações${X}`);
      const ok=decisionArg==='a'?'KLING':(await rl.question(`  Autorizar exatamente ${interrupt.requiredGenerations} gerações Kling? Digite KLING: `)).trim();
      if(ok!=='KLING'){line('Retomada cancelada antes do despacho.');return;}
      args.push('--decision','proceed','--max-generations',String(interrupt.requiredGenerations));
      paid=true;
    }else if(interrupt.kind==='AUTHORED_MOTION_REVIEW'){
      line(`${RED}${interrupt.reason??'Motion autoral requer revisão.'}${X}`);
      const decision=decisionArg??(await rl.question('  [r] tentar novamente  [x] abortar  [v] voltar: ')).trim().toLowerCase();
      if(decision==='v'||!decision)return;
      if(!['r','x'].includes(decision)){line('Opção inválida.');return;}
      args.push('--decision',decision==='r'?'retry':'abort');
    }else if(interrupt.kind==='FIREFLY_LOGIN'){
      line(`${AMBER}Sessão do Adobe Firefly não autenticada no perfil configurado.${X}`);
      line(`  ${WHITE}[1]${X} Continuar no modo Stills + Motion Squad (dispensa Kling/Firefly; usa quadros 16:9 + Remotion 2D/3D)`);
      line(`  ${WHITE}[2]${X} Abrir Chrome para login no Adobe Firefly e tentar novamente`);
      line(`  ${WHITE}[v]${X} Voltar`);
      const choice = mediaPolicyArg === 'stills' ? '1' : (decisionArg === 'a' || decisionArg === 'proceed' ? '1' : ((await rl.question('  Opção [1]: ')).trim() || '1'));
      if(choice==='1'){
        line(`${M}Migrando produção para política 'stills' (reaproveita 100% dos quadros fotográficos gerados)...${X}`);
        const ch = (data as any).channelSnapshot?.channelId ?? (episode.startsWith('BRECHA_') ? 'brecha' : 'hsl');
        args=['run','--channel',ch,'--episode',episode,'--from','media_plan_prepare','--media-policy','stills','--storage',storage.mode,'--prune','dry-run'];
        paid=false;
      }else if(choice==='2'){
        await runTs('graph/production/lib/firefly/session.ts',['--open-login'],[0]);
      }else{
        return;
      }
    }else{
      const needsDecision=!interrupt.kind||interrupt.kind==='IMAGE_HUMAN_REVIEW'||interrupt.kind==='VISUAL_PROMPTS_HUMAN_REVIEW';
      if(needsDecision){
        const visualRetry=interrupt.kind==='VISUAL_PROMPTS_HUMAN_REVIEW';
        const decision=decisionArg??(await rl.question(visualRetry?'  [r] corrigir novamente  [a] aprovar  [x] abortar  [v] voltar: ':'  [a] aprovar  [x] abortar  [v] voltar: ')).trim().toLowerCase();
        if(decision==='v'||!decision)return;
        if(!['a','x',...(visualRetry?['r']:[])].includes(decision)){line('Opção inválida.');return;}
        args.push('--decision',decision==='a'?'proceed':decision==='r'?'retry':'abort');
        if(decision==='r')args.push('--prompt-review-attempts',String(Math.min(12,Number(interrupt.iterations??4)+2)));
      }
    }
  } else if (mediaPolicyArg && args[0] === 'resume') {
    args.push('--media-policy', mediaPolicyArg);
  }
  await graph(args,paid);
}
async function generateImages(rl:readline.Interface,provided?:string){
  const episode=provided||await askEpisode(rl),queue=path.join(REPO_ROOT,'runs',episode,'images','QUEUE.json');
  if(!fs.existsSync(queue)){line(`${RED}Fila de imagens ainda não existe para ${episode}.${X}`);return;}
  const production=activeProduction(REPO_ROOT);
  if(production){
    const running=production.episode??`processo PID ${production.pid}`;
    line(`${AMBER}${running} já está gerando/processando assets (PID ${production.pid}). Nenhum worker duplicado foi iniciado.${X}`);
    if(production.episode)await showStatus(production.episode);
    return;
  }
  const workerPid=activeLockPid(queue+'.worker.lock');
  if(workerPid){
    line(`${AMBER}As imagens de ${episode} já estão sendo geradas (PID ${workerPid}). Nenhum worker duplicado foi iniciado.${X}`);
    await showStatus(episode);return;
  }
  await runTs('graph/production/lib/codexImages.ts',['--queue',queue],[0]);
}
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

async function dispatch(command:string,rl:readline.Interface,args:string[]=[]){const cmd=command.toLowerCase();if(['novo','new'].includes(cmd))await newEpisode(rl,args);else if(['sugerir','suggest'].includes(cmd)){const ch=args[0]?.toLowerCase()==='brecha'?'brecha':args[0]?.toLowerCase()==='hsl'?'hsl':undefined;if(ch)showSuggestions(ch);else{showSuggestions('hsl');showSuggestions('brecha');}}else if(['continuar','resume'].includes(cmd))await resumeEpisode(rl,args[0],args.slice(1));else if(cmd==='status')await showStatus(args[0]??latestEpisode());else if(['logs','acompanhar'].includes(cmd))await watchEpisode(rl,args[0]??await askEpisode(rl));else if(cmd==='elevenlabs')await elevenLabsMenu(rl);else if(['contas','accounts'].includes(cmd))await accounts(rl);else if(cmd==='antigravity'||cmd==='codex'){if(args[0])await accountAction(rl,cmd,args[0]);else await accounts(rl);}else if(['imagens','images'].includes(cmd))await generateImages(rl,args[0]);else if(['episodios','list'].includes(cmd))showEpisodes();else if(['temas','themes'].includes(cmd))showThemes();else if(['mapa','dashboard'].includes(cmd)){rl.close();await startDashboard();return'open';}else if(cmd==='drive')await openDrive();else if(cmd==='kling')await checkKling();else if(cmd==='doctor')await doctor();else if(['ajuda','help','--help','-h'].includes(cmd))help();else line(`${RED}Comando desconhecido: ${command}${X}`);return'continue';}

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
  ${WHITE}[0]${X} Sair`);const choice=(await rl.question(`${M}\n  matrix> ${X}`)).trim().toLowerCase();if(choice==='0')break;if(/^hsl[\\_ -]*episode/i.test(choice)){line(`${AMBER}O ID é automático. Escolha [1] Criar novo episódio.${X}`);continue;}const command:{[key:string]:string}={1:'novo',2:'sugerir',3:'continuar',4:'status',5:'imagens',6:'mapa',7:'episodios',8:'temas',9:'doctor',d:'drive',k:'kling',l:'logs',a:'contas',e:'elevenlabs'};const selected=command[choice]??choice;try{if(selected==='status')await showStatus(await askEpisode(rl));else if(selected==='sugerir'){const ch=await askChannel(rl);showSuggestions(ch);}else if(await dispatch(selected,rl)==='open')return;}catch(error){line(`${RED}${error instanceof Error?error.message:String(error)}${X}`);line('O comando parou. O Matrix continua aberto; corrija a causa e use Continuar episódio.');}}
}finally{rl.close();}}
if(require.main===module)main().catch(e=>{console.error(`${RED}${e instanceof Error?e.message:e}${X}`);process.exitCode=1;});
