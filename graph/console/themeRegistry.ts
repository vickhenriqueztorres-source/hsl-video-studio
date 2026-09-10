import fs from 'node:fs';
import path from 'node:path';
import {REPO_ROOT} from '../checkpointer';
import type {ChannelId} from '../../channels/types';

export interface ThemeIdea {theme:string;title:string;entity:string;mechanism:string;constraint:string;consequence:string;thesis:string}
export interface ThemeRecord {episodeId:string;channelId?:ChannelId;theme:string;status:'reserved'|'in-production'|'produced';source:'catalog'|'episode';createdAt:string}
const STOP=new Set('a an and as at by como da das de do dos e em for hidden how is keeps o of on or para por que sistema system the um uma why with through'.split(' '));
const SYNONYMS:Record<string,string>={
  aeroporto:'airport',aeroportos:'airport',combustivel:'fuel',logistica:'logistics',cidade:'urban',cidades:'urban',agua:'water',pressao:'pressure',vacina:'vaccine',vacinas:'vaccine',cadeia:'chain',fria:'cold',eletrica:'electrical',energia:'power',apagao:'blackout',cabos:'cable',submarinos:'submarine',internet:'internet',supermercado:'supermarket',supermercados:'supermarket',porto:'port',portos:'port',conteiner:'container',conteineres:'container',esgoto:'wastewater',tempestade:'storm',tempestades:'storm',elevador:'elevator',elevadores:'elevator',arranhaceu:'skyscraper',carga:'cargo',aerea:'air',hospital:'hospital',hospitais:'hospital',oxigenio:'oxygen',dinheiro:'money',bancos:'bank',banco:'bank',bancaria:'bank',bancario:'bank',celular:'phone',smartphone:'phone',telefone:'phone',golpe:'fraud',fraude:'fraud',estelionato:'fraud',chip:'sim',voz:'voice',vozes:'voice',ligacao:'call',chamada:'call',
  roubo:'theft',roubos:'theft',roubado:'theft',roubada:'theft',roubaram:'theft',furto:'theft',furtado:'theft',clonagem:'clone',clonado:'clone',clonar:'clone',invasao:'hack',hack:'hack'
};

export const HSL_CATALOG:ThemeIdea[]=[
  {theme:'A cadeia fria invisível que mantém vacinas vivas',title:'The Invisible Cold Chain That Keeps Vaccines Alive',entity:'Vaccine Cold Chain',mechanism:'Refrigerated handoffs from factory to last-mile clinics',constraint:'Temperature excursion beyond the validated range',consequence:'An entire batch becomes unusable before reaching patients',thesis:'A vaccine is only as effective as the uninterrupted temperature system behind it.'},
  {theme:'Como uma cidade mantém pressão de água nos horários de pico',title:'The Hidden Pressure System Behind Every City Tap',entity:'Urban Water Pressure Network',mechanism:'Reservoirs, pumps and pressure zones balancing demand',constraint:'Peak demand exceeds the pressure envelope',consequence:'Upper floors and critical facilities lose supply first',thesis:'The visible product is water; the hidden product is controlled pressure.'},
  {theme:'O sistema de resfriamento que impede data centers de derreter',title:'The Cooling System That Keeps Data Centers Alive',entity:'Data Center Cooling Infrastructure',mechanism:'Chillers, cooling towers and hot-aisle containment',constraint:'Heat rejection capacity during extreme weather',consequence:'Compute workloads throttle and services cascade offline',thesis:'Cloud computing depends on a physical machine for moving heat.'},
  {theme:'Como a rede elétrica reinicia depois de um apagão total',title:'How the Power Grid Restarts After a Total Blackout',entity:'Electrical Grid Black Start',mechanism:'Black-start generators progressively energizing grid islands',constraint:'Generation and load must remain balanced during restoration',consequence:'One mistimed connection can collapse the recovering grid',thesis:'Restoring electricity requires electricity from a carefully staged hidden system.'},
  {theme:'Quem conserta os cabos submarinos que carregam a internet',title:'How the Internet Gets Repaired at the Bottom of the Ocean',entity:'Submarine Cable Repair Network',mechanism:'Fault localization, cable ships and seabed recovery',constraint:'Weather windows and precise deep-ocean positioning',consequence:'Countries lose capacity while traffic is rerouted through longer paths',thesis:'The global internet is repaired by ships pulling glass from the ocean floor.'},
  {theme:'A logística noturna que reabastece supermercados antes do amanhecer',title:'The Overnight System That Keeps Supermarket Shelves Full',entity:'Supermarket Replenishment Network',mechanism:'Forecasting, distribution centers and timed store deliveries',constraint:'Shelf capacity and narrow receiving windows',consequence:'A small delay becomes an empty shelf across hundreds of stores',thesis:'A full shelf is the final frame of a synchronized overnight system.'},
  {theme:'Como portos decidem qual contêiner sai primeiro',title:'The Hidden Logic That Controls Every Container Port',entity:'Container Terminal Control System',mechanism:'Yard stacking, crane scheduling and truck appointments',constraint:'Limited crane moves and yard access lanes',consequence:'One misplaced container multiplies handling time across the terminal',thesis:'Port speed depends less on ships than on the hidden order of boxes on land.'},
  {theme:'O sistema que impede esgoto de voltar para a cidade durante tempestades',title:'The Underground System That Keeps Storms Out of Your Home',entity:'Urban Wastewater Network',mechanism:'Gravity sewers, lift stations and overflow control',constraint:'Rain inflow exceeds pipe and treatment capacity',consequence:'Contaminated water backs up into streets and waterways',thesis:'Sanitation is a continuous capacity race beneath the pavement.'},
  {theme:'Como elevadores coordenam milhares de pessoas em arranha-céus',title:'The Invisible Traffic System Inside Every Skyscraper',entity:'High-Rise Elevator Dispatch',mechanism:'Destination control grouping passengers by route',constraint:'Finite shaft capacity during directional peaks',consequence:'Lobby queues grow faster than elevators can recover',thesis:'A skyscraper works only when vertical traffic is scheduled like a transit network.'},
  {theme:'A corrida de horas que move carga aérea entre continentes',title:'The Nighttime Race That Moves Air Cargo Across the World',entity:'Air Cargo Hub Sortation',mechanism:'Arrival banks, automated sortation and connecting flights',constraint:'Short transfer windows between aircraft',consequence:'A late inbound flight strands cargo for an entire cycle',thesis:'Express delivery is produced inside a few synchronized nighttime hubs.'},
  {theme:'Como hospitais distribuem oxigênio sem cilindros em cada quarto',title:'The Hidden Oxygen Network Behind Every Hospital Bed',entity:'Hospital Medical Gas Network',mechanism:'Bulk storage, vaporizers and regulated pipeline zones',constraint:'Pressure and reserve capacity during demand surges',consequence:'A local valve or supply failure threatens many patients at once',thesis:'The breath beside a hospital bed begins in an industrial system outside the building.'},
  {theme:'O caminho invisível do dinheiro entre bancos',title:'The Hidden System That Moves Money Between Banks',entity:'Interbank Settlement Infrastructure',mechanism:'Clearing, netting and central-bank settlement',constraint:'Liquidity available at settlement deadlines',consequence:'A delayed participant can freeze payments far beyond one bank',thesis:'A payment appears instant because risk and liquidity move through a hidden timed network.'},
];

export const BRECHA_CATALOG:ThemeIdea[]=[
  {
    theme:'Roubaram o celular. O banco foi aberto 8 minutos depois',
    title:'O Roubo dos 8 Minutos: A Fraude do Celular Desbloqueado',
    entity:'Engenharia Social e Fraude de Dispositivo Móvel',
    mechanism:'Troca de chip, reset de senha bancária e evasão de autenticação em dois fatores',
    constraint:'Janela de reação da vítima antes do bloqueio da linha telefônica e do aparelho',
    consequence:'Transferências via Pix e empréstimos contratados em cascata em contas intermediárias',
    thesis:'O roubo de celular no Brasil deixou de ser sobre o aparelho; tornou-se um ataque coordenado contra o ecossistema bancário digital durante uma janela de vulnerabilidade de minutos.'
  },
  {
    theme:'A ligação era perfeita — até este detalhe',
    title:'A Falsa Central: Como o Golpe Mais Sofisticado do Brasil Engana até Especialistas',
    entity:'Falsa Central Telefônica de Segurança Bancária',
    mechanism:'Spoofing de identificador de chamada (BINA), URAs falsas pré-gravadas e transferência simulada',
    constraint:'Vítima em estado de alerta e urgência induzida por suposta fraude em andamento',
    consequence:'Instalação de app de acesso remoto ou transferência para conta supostamente segura',
    thesis:'A fraude moderna não quebra a criptografia dos bancos; ela simula a autoridade das instituições para fazer a própria vítima entregar a chave.'
  },
  {
    theme:'A voz era da filha dela. A filha nunca ligou.',
    title:'Vozes Sintéticas: O Novo Sequestro Virtual por IA',
    entity:'Clonagem de Voz por Inteligência Artificial e Engenharia Social',
    mechanism:'Raspagem de áudios de redes sociais, treinamento de modelo TTS e ligação em tempo real',
    constraint:'Segundos de fala suficiente para induzir pânico familiar antes de verificação cruzada',
    consequence:'Resgate financeiro pago por Pix em minutos a contas mulas indetectáveis',
    thesis:'Quando a voz humana perde seu status de prova biológica de identidade, qualquer protocolo baseado em confiança auditiva desaba.'
  },
  {
    theme:'A rota invisível do Pix: onde foi parar o dinheiro?',
    title:'A Máquina de Lavar Pix: Contas Laranja, Mulas e Saques Imediatos',
    entity:'Infraestrutura de Contas Laranjas e Liquidação Fracionada',
    mechanism:'Dispersão instantânea em dezenas de contas bancárias e compras em maquininhas de rua',
    constraint:'Tempo de resposta do Mecanismo Especial de Devolução (MED) do Banco Central',
    consequence:'Vítimas encontram saldo zerado nas contas destinatárias em menos de 120 segundos',
    thesis:'O Pix criou a liquidação mais eficiente do mundo para os cidadãos, mas a arquitetura de contas fantasmas tornou a lavagem de dinheiro igualmente instantânea.'
  },
  {
    theme:'Troca de chip silenciosa: o golpe do SIM Swap',
    title:'SIM Swap: Como Criminosos Sequestram Seu Número Sem Tocar no Aparelho',
    entity:'Portabilidade Numérica e Alocação de IMSI em Operadoras',
    mechanism:'Suborno de operadores de telecom ou engenharia social para migrar linha para chip sob controle criminoso',
    constraint:'Ausência de sinal na linha legítima da vítima durante a madrugada',
    consequence:'Interceptação de SMS de recuperação de senha, WhatsApp e perda de controle de contas corporativas',
    thesis:'O número de telefone nunca foi projetado para ser identidade de segurança; transformá-lo em chave mestra da vida digital é o pecado original da autenticação.'
  },
  {
    theme:'Celular roubado: a janela crítica dos primeiros 30 minutos',
    title:'Os Primeiros 30 Minutos: O Protocolo de Sobrevivência Digital',
    entity:'Protocolos de Resposta a Incidentes Pessoais e Bloqueio em Camadas',
    mechanism:'Bloqueio remoto via IMEI, desativação de eSIM/chip e desconexão de sessões bancárias ativas',
    constraint:'Pânico da vítima e falta de acesso a dispositivos secundários confiáveis',
    consequence:'Diferença entre perda de dados e prejuízo financeiro irreparável',
    thesis:'Em segurança digital, os primeiros trinta minutos definem se você foi apenas furtado ou se sua identidade financeira foi totalmente expropriada.'
  }
];

export const CATALOG:ThemeIdea[]=HSL_CATALOG;

function clean(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export function tokens(value:string){return [...new Set(clean(value).split(/\s+/).filter(x=>x.length>2&&!STOP.has(x)).map(x=>SYNONYMS[x]??x))];}
export function similarity(a:string,b:string){const aa=tokens(a),bb=tokens(b);if(!aa.length||!bb.length)return 0;const right=new Set(bb),intersection=aa.filter(x=>right.has(x)).length,containment=intersection/Math.min(aa.length,bb.length),jaccard=intersection/new Set([...aa,...bb]).size;return Number(Math.max(containment*.82+jaccard*.18,jaccard).toFixed(4));}
const readJson=(file:string):any=>{try{return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));}catch{return null;}};
const registryFile=(root:string)=>path.join(root,'runs','.catalog','theme-registry.json');
function stored(root:string):ThemeRecord[]{return readJson(registryFile(root))?.items??[];}
function hasVideo(root:string,id:string){const dir=path.join(root,'deliveries',id);if(!fs.existsSync(dir))return false;const scan=(folder:string):boolean=>fs.readdirSync(folder,{withFileTypes:true}).some(e=>e.isDirectory()?scan(path.join(folder,e.name)):/\.mp4$/i.test(e.name));return scan(dir);}
export function themeRecords(root=REPO_ROOT):ThemeRecord[]{
  const found=new Map<string,ThemeRecord>();
  for(const item of stored(root)){
    const ch:ChannelId=item.channelId??(item.episodeId.startsWith('BRECHA_')?'brecha':'hsl');
    found.set(item.episodeId,{...item,channelId:ch});
  }
  const runs=path.join(root,'runs');
  if(fs.existsSync(runs)){
    for(const entry of fs.readdirSync(runs,{withFileTypes:true})){
      if(!entry.isDirectory()||entry.name.startsWith('.'))continue;
      const plan=readJson(path.join(runs,entry.name,'scene-plan.json'));
      if(!plan)continue;
      const text=[plan.episodeTitle,plan.subtitle,plan.thesis,plan.entity,plan.topic].filter(Boolean).join(' · ');
      const manifest=readJson(path.join(runs,entry.name,'run-manifest.json'));
      const channelId:ChannelId=manifest?.channelId??(entry.name.startsWith('BRECHA_')?'brecha':'hsl');
      found.set(entry.name,{
        episodeId:entry.name,
        channelId,
        theme:text||entry.name,
        status:hasVideo(root,entry.name)||manifest?.overallStatus==='COMPLETED'?'produced':'in-production',
        source:'episode',
        createdAt:manifest?.createdAt??new Date().toISOString()
      });
    }
  }
  return [...found.values()].sort((a,b)=>a.episodeId.localeCompare(b.episodeId));
}

export function findDuplicate(theme:string,channelOrRoot?:ChannelId|string,root=REPO_ROOT,threshold=.6){
  let channel:ChannelId|undefined=undefined;
  let effectiveRoot=root;
  if(channelOrRoot==='hsl'||channelOrRoot==='brecha'){
    channel=channelOrRoot;
  }else if(typeof channelOrRoot==='string'){
    effectiveRoot=channelOrRoot;
  }
  return themeRecords(effectiveRoot)
    .filter(record=>!channel||record.channelId===channel)
    .map(record=>({record,score:similarity(theme,record.theme)}))
    .filter(x=>x.score>=threshold)
    .sort((a,b)=>b.score-a.score)[0]??null;
}

export function suggestThemes(channelOrRoot:ChannelId|string='hsl',rootOrLimit:string|number=REPO_ROOT,limit=3):ThemeIdea[]{
  let channel:ChannelId='hsl';
  let effectiveRoot=REPO_ROOT;
  let effectiveLimit=limit;
  if(channelOrRoot==='hsl'||channelOrRoot==='brecha'){
    channel=channelOrRoot;
    if(typeof rootOrLimit==='string')effectiveRoot=rootOrLimit;
    if(typeof rootOrLimit==='number')effectiveLimit=rootOrLimit;
  }else{
    effectiveRoot=channelOrRoot;
    if(typeof rootOrLimit==='number')effectiveLimit=rootOrLimit;
  }
  const catalog=channel==='brecha'?BRECHA_CATALOG:HSL_CATALOG;
  return catalog.filter(idea=>!findDuplicate(`${idea.theme} ${idea.title} ${idea.entity}`,channel,effectiveRoot)).slice(0,effectiveLimit);
}

export function reserveTheme(episodeId:string,theme:string,channelOrRoot:ChannelId|string='hsl',root=REPO_ROOT){
  const isChannel=channelOrRoot==='hsl'||channelOrRoot==='brecha';
  const channel:ChannelId=isChannel?(channelOrRoot as ChannelId):(episodeId.startsWith('BRECHA_')?'brecha':'hsl');
  const effectiveRoot=isChannel?root:channelOrRoot;
  const file=registryFile(effectiveRoot);
  const items=stored(effectiveRoot).filter(x=>x.episodeId!==episodeId);
  items.push({episodeId,channelId:channel,theme,status:'reserved',source:'catalog',createdAt:new Date().toISOString()});
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const temp=file+'.tmp';
  fs.writeFileSync(temp,JSON.stringify({updatedAt:new Date().toISOString(),items},null,2)+'\n');
  fs.renameSync(temp,file);
  return file;
}

export function nextEpisodeId(channelOrRoot:ChannelId|string='hsl',root=REPO_ROOT):string{
  const isChannel=channelOrRoot==='hsl'||channelOrRoot==='brecha';
  const channel:ChannelId=isChannel?(channelOrRoot as ChannelId):'hsl';
  const effectiveRoot=isChannel?root:channelOrRoot;
  const prefix=channel==='brecha'?'BRECHA_EPISODE_':'HSL_EPISODE_';
  const regex=new RegExp(`^${prefix}(\\d+)$`);
  const numbers=themeRecords(effectiveRoot).map(x=>regex.exec(x.episodeId)?.[1]).filter((x):x is string=>Boolean(x)).map(Number);
  return`${prefix}${String(Math.max(0,...numbers)+1).padStart(3,'0')}`;
}

export function ideaForTheme(theme:string,channel:ChannelId='hsl'){
  const catalog=channel==='brecha'?BRECHA_CATALOG:HSL_CATALOG;
  return catalog.find(x=>x.theme===theme)??HSL_CATALOG.find(x=>x.theme===theme);
}
