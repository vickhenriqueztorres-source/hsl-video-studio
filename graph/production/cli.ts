import {deriveProgress} from '../console/progress';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Command } from '@langchain/langgraph';
import { createCheckpointer, REPO_ROOT } from '../checkpointer';
import { createProductionGraph, NODE_ALIASES, NODE_ORDER, NodeName } from './graph';
import { initialState, STATE_VERSION, State } from './state';
import { configFor, counts, executeProduction, readHistory, readErrors, rewind } from './runner';
import { closeAssetServer } from './lib/assetServer';
import { storageSummary } from './storage/index';
import { checkCodexAccount } from '../ide/codexAccount';

export function parseArgs(argv: string[]) {
  const command = argv.shift() ?? 'run';
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--offline' || key === '--test-render') args[key] = true;
    else if (['--episode','--topic','--entity','--mechanism','--constraint','--consequence','--thesis','--target-minutes','--gates','--asset-concurrency','--render-concurrency','--from','--decision','--until','--beats','--media-mode','--max-generations','--storage','--prune','--keep-local-deliverables'].includes(key)) {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Falta valor: ${key}`);
      args[key] = argv[++i];
    } else throw new Error(`Argumento desconhecido: ${key}`);
  }
  if (!['run', 'resume', 'status', 'history', 'mermaid'].includes(command)) throw new Error(`Comando desconhecido: ${command}`);
  return { command, args, episodeId: String(args['--episode'] ?? 'HSL_EPISODE_001') };
}
export async function main(argv = process.argv.slice(2)): Promise<number> {
  const { command, args, episodeId } = parseArgs(argv);
  if (args['--until'] && command !== 'run') throw new Error('--until é aceito apenas em run');
  const requestedUntil = args['--until'] ? String(args['--until']) : undefined;
  const until = requestedUntil ? (NODE_ALIASES[requestedUntil] ?? requestedUntil) as NodeName : undefined;
  if (until && !NODE_ORDER.includes(until)) throw new Error(`Nó desconhecido em --until: ${requestedUntil}`);
  const config = configFor(episodeId);
  const saver = createCheckpointer();
  const graph = createProductionGraph(saver, {}, REPO_ROOT, { interruptAfter: until ? [until] : undefined });
  let lock: string | undefined;
  try {
    if (command === 'mermaid') { console.log(graph.getGraph().drawMermaid()); return 0; }
    if (command === 'history') { console.log(JSON.stringify(readHistory(REPO_ROOT, episodeId), null, 2)); return 0; }
    let snapshot = await graph.getState(config);
    if (snapshot.values.episodeId && snapshot.values.stateVersion !== STATE_VERSION) throw new Error('Checkpoint incompatível; utilize nova stateVersion');
    if (command === 'status') {
      console.log(JSON.stringify({ thread_id: config.configurable.thread_id, next: snapshot.next,
        Progress:deriveProgress(REPO_ROOT,episodeId,snapshot.values,snapshot.next,snapshot.tasks.flatMap(t=>t.interrupts.map(i=>i.value))),
        Accounts:{codex:await checkCodexAccount(REPO_ROOT),loginCommand:'npm run hsl:codex:login'},
        frames: counts(snapshot.values.frames ?? []), videos: counts(snapshot.values.videos ?? []), chunks: counts(snapshot.values.renderChunks ?? []),
        generationCount:snapshot.values.generationCount??0,videoTakes:snapshot.values.videoTakes??[],sfxResolved:snapshot.values.sfxResolved??[],sfxUnresolved:snapshot.values.sfxUnresolved??[],
        productionStatus: snapshot.values.productionStatus,Storage:storageSummary(snapshot.values.storageIndex??[]),errors: snapshot.values.errors, journalErrors: readErrors(REPO_ROOT, episodeId), tasks: snapshot.tasks }, null, 2));
      return 0;
    }
    // Shared paths in the reference prohibit simultaneous production processes.
    const lockPath = path.join(REPO_ROOT, 'out', 'production-graph.lock');
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    if (fs.existsSync(lockPath)) {
      const pid = Number(fs.readFileSync(lockPath, 'utf8'));
      let alive = true; try { process.kill(pid, 0); } catch { alive = false; }
      if (alive) throw new Error(`Produção já em execução (PID ${pid})`);
      fs.unlinkSync(lockPath);
    }
    fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' }); lock = lockPath;
    let input: Parameters<typeof graph.stream>[0] = null;
    const historyOffset=readHistory(REPO_ROOT,episodeId).length;
    const storage=String(args['--storage']??(command==='run'?'drive':'')),prune=String(args['--prune']??'dry-run');
    if(storage&&!['off','drive'].includes(storage))throw new Error('--storage aceita off|drive');if(!['dry-run','apply'].includes(prune))throw new Error('--prune aceita dry-run|apply');
    if(args['--max-generations']!==undefined&&(!Number.isSafeInteger(Number(args['--max-generations']))||Number(args['--max-generations'])<0))throw new Error('--max-generations deve ser inteiro não negativo');
    const graphOptionUpdates:any={...(storage?{storageMode:storage}:{}),...(args['--prune']?{prune}:{}),...(args['--keep-local-deliverables']?{keepLocalDeliverables:Number(args['--keep-local-deliverables'])}:{}),...(args['--max-generations']!==undefined?{maxGenerations:Number(args['--max-generations'])}:{})};
    if (command === 'run' && args['--from']) {
      await rewind(graph, REPO_ROOT, episodeId, String(args['--from']),graphOptionUpdates);
    } else if (command === 'run') {
      if (snapshot.next.length) throw new Error('Thread pendente: utilize resume ou --from');
      const gates = String(args['--gates'] ?? '').split(',').filter(Boolean);
      if (gates.some(g => !['render', 'publish'].includes(g))) throw new Error('--gates aceita render,publish');
      const mediaMode=String(args['--media-mode']??'real');if(!['legacy','real'].includes(mediaMode))throw new Error('--media-mode aceita legacy|real');
      input = initialState({episodeId,topic:args['--topic']?String(args['--topic']):undefined,entity:args['--entity']?String(args['--entity']):undefined,mechanism:args['--mechanism']?String(args['--mechanism']):undefined,constraint:args['--constraint']?String(args['--constraint']):undefined,consequence:args['--consequence']?String(args['--consequence']):undefined,thesis:args['--thesis']?String(args['--thesis']):undefined,targetMinutes:args['--target-minutes']?Number(args['--target-minutes']):undefined,graph: { offline: !!args['--offline'], assetConcurrency: Number(args['--asset-concurrency'] ?? 1), renderConcurrency: Number(args['--render-concurrency'] ?? 1),
        mediaMode:mediaMode as 'legacy'|'real',beats:args['--beats']?Number(args['--beats']):undefined,testRender:!!args['--test-render'],maxGenerations:Number(args['--max-generations']??0),storageMode:storage as 'off'|'drive',prune:prune as 'dry-run'|'apply',keepLocalDeliverables:Number(args['--keep-local-deliverables']??1),gates: { render: gates.includes('render'), publish: gates.includes('publish') } } });
    } else {
      if (!snapshot.next.length) throw new Error('Thread inexistente ou já finalizada');
      if (snapshot.tasks.some(t => t.interrupts.length)) {
        const kind=(snapshot.tasks.flatMap(t=>t.interrupts)[0]?.value as any)?.kind;
        const decision = args['--decision'];
        const needsDecision=!kind||kind==='IMAGE_HUMAN_REVIEW'||kind==='KLING_BUDGET';
        if (needsDecision && decision !== 'proceed' && decision !== 'abort') throw new Error('Resume deste gate requer --decision proceed|abort');
        const updatedOptions=Object.keys(graphOptionUpdates).length?{...snapshot.values.options,graph:{...snapshot.values.options.graph,...graphOptionUpdates}}:undefined;
        input = new Command({ resume: needsDecision ? { decision } : { resumed:true },...(updatedOptions?{update:{options:updatedOptions}}:{}) });
      } else if (args['--decision']) throw new Error('Nenhum gate aguarda decisão');
    }
    snapshot = await executeProduction(graph, REPO_ROOT, episodeId, input);
    const executedThisCommand=[...new Set(readHistory(REPO_ROOT,episodeId).slice(historyOffset).map((event:any)=>event.node).filter(Boolean))];
    console.log(JSON.stringify({ thread_id: config.configurable.thread_id, productionStatus: snapshot.values.productionStatus, executedThisCommand, progress:deriveProgress(REPO_ROOT,episodeId,snapshot.values,snapshot.next,snapshot.tasks.flatMap(t=>t.interrupts.map(i=>i.value))).percent, next: snapshot.next, interrupts: snapshot.tasks.flatMap(t => t.interrupts), kling:{plannedTakes:snapshot.values.videoTakes?.length??0,approvedLimit:snapshot.values.options?.graph.maxGenerations??0}, generationCount:snapshot.values.generationCount??0, finalVideo: snapshot.values.finalVideo }, null, 2));
    if (snapshot.tasks.some(t => t.interrupts.length)) return 2;
    if (until && snapshot.next.length) return 3;
    return snapshot.values.productionStatus === 'COMPLETED' ? 0 : 1;
  } finally {
    await closeAssetServer(); saver.db.close();
    if (lock) fs.unlinkSync(lock);
  }
}
if (require.main === module) main().then(code => { process.exitCode = code; }).catch(e => { console.error(e instanceof Error ? e.stack : e); process.exitCode = 1; });
