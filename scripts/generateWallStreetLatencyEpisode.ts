import { runMasterEpisodePipeline } from '../hsl/pipeline/masterOrchestrator';

export const WALL_STREET_LATENCY_TOPIC_INPUT = {
  episodeId: 'HSL_EPISODE_008_WALL_STREET_LATENCY',
  topic: 'Why Wall Street Drilled Mountains to Save 3 Milliseconds',
  targetMinutes: 10,
  entity: 'High-Frequency Trading Exchange Network Between Chicago Futures and New Jersey Equity Data Centers',
  mechanism: 'Near-straight dark fiber, colocation cross-connects, microwave relay towers and free-space optical latency paths',
  constraint: 'Refractive index of optical fiber versus air propagation, Earth curvature, line-of-sight clearance, rain fade and exchange queue priority',
  consequence: 'Failed latency arbitrage, adverse selection, lost queue position and tens of millions of dollars in annual opportunity cost',
  thesis: 'At the frontier of modern finance, the market is not decided by analysts. It is decided by electromagnetic propagation: the geometry of light, air, glass, towers and matching-engine queues.'
};

export async function runWallStreetLatencyEpisode() {
  return runMasterEpisodePipeline(WALL_STREET_LATENCY_TOPIC_INPUT);
}

if (require.main === module) {
  runWallStreetLatencyEpisode().catch(err => {
    console.error('WALL_STREET_LATENCY_PIPELINE_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
