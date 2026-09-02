import fs from 'node:fs';
import path from 'node:path';
import { Command } from '@langchain/langgraph';
import { createCheckpointer, REPO_ROOT } from '../checkpointer';
import { createProductionGraph, NODE_ALIASES, NODE_ORDER, NodeName } from './graph';
import { initialState, STATE_VERSION, State } from './state';
import { configFor, counts, executeProduction, readHistory, readErrors, rewind } from './runner';
import { closeAssetServer } from './lib/assetServer';

export function parseArgs(argv: string[]) {
  const command = argv.shift() ?? 'run';
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--offline') args[key] = true;
    else if (['--episode', '--gates', '--asset-concurrency', '--render-concurrency', '--from', '--decision', '--until'].includes(key)) {
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
        frames: counts(snapshot.values.frames ?? []), videos: counts(snapshot.values.videos ?? []), chunks: counts(snapshot.values.renderChunks ?? []),
        productionStatus: snapshot.values.productionStatus, errors: snapshot.values.errors, journalErrors: readErrors(REPO_ROOT, episodeId), tasks: snapshot.tasks }, null, 2));
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
    if (command === 'run' && args['--from']) {
      await rewind(graph, REPO_ROOT, episodeId, String(args['--from']));
    } else if (command === 'run') {
      if (snapshot.next.length) throw new Error('Thread pendente: utilize resume ou --from');
      const gates = String(args['--gates'] ?? '').split(',').filter(Boolean);
      if (gates.some(g => !['render', 'publish'].includes(g))) throw new Error('--gates aceita render,publish');
      input = initialState({ episodeId, graph: { offline: !!args['--offline'], assetConcurrency: Number(args['--asset-concurrency'] ?? 1), renderConcurrency: Number(args['--render-concurrency'] ?? 1), gates: { render: gates.includes('render'), publish: gates.includes('publish') } } });
    } else {
      if (!snapshot.next.length) throw new Error('Thread inexistente ou já finalizada');
      if (snapshot.tasks.some(t => t.interrupts.length)) {
        const decision = args['--decision'];
        if (decision !== 'proceed' && decision !== 'abort') throw new Error('Resume de gate requer --decision proceed|abort');
        input = new Command({ resume: { decision } });
      } else if (args['--decision']) throw new Error('Nenhum gate aguarda decisão');
    }
    snapshot = await executeProduction(graph, REPO_ROOT, episodeId, input);
    console.log(JSON.stringify({ thread_id: config.configurable.thread_id, productionStatus: snapshot.values.productionStatus, next: snapshot.next, interrupts: snapshot.tasks.flatMap(t => t.interrupts), finalVideo: snapshot.values.finalVideo }, null, 2));
    if (snapshot.tasks.some(t => t.interrupts.length)) return 2;
    if (until && snapshot.next.length) return 3;
    return snapshot.values.productionStatus === 'COMPLETED' ? 0 : 1;
  } finally {
    await closeAssetServer(); saver.db.close();
    if (lock) fs.unlinkSync(lock);
  }
}
if (require.main === module) main().then(code => { process.exitCode = code; }).catch(e => { console.error(e instanceof Error ? e.stack : e); process.exitCode = 1; });
