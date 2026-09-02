import { createCheckpointer } from '../../checkpointer';
import { createProductionGraph } from '../graph';
import { initialState } from '../state';
import { executeProduction } from '../runner';
import { fixtures } from './fixtures';
async function main() {
  const [root, phase] = process.argv.slice(2), episodeId = 'KILL_TEST';
  const saver = createCheckpointer(root);
  try {
    const { deps } = fixtures(root, episodeId, { killWave: phase === 'kill' });
    const graph = createProductionGraph(saver, deps, root);
    const input = phase === 'kill' ? initialState({ episodeId, graph: { renderConcurrency: 2 } }) : null;
    const snapshot = await executeProduction(graph, root, episodeId, input);
    process.send?.({ status: snapshot.values.productionStatus });
  } finally { saver.db.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
