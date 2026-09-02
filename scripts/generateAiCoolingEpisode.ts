import { runMasterEpisodePipeline } from '../hsl/pipeline/masterOrchestrator';

export const AI_COOLING_TOPIC_INPUT = {
  episodeId: 'HSL_EPISODE_009_AI_DATACENTER_COOLING',
  topic: 'The Machine That Evaporates Rivers to Keep AI Alive',
  targetMinutes: 10,
  entity: 'Hyperscale AI Supercomputers & Direct-to-Chip Liquid Cooling Infrastructure',
  mechanism: '50,000 Blackwell GPUs, Machined Copper Micro-Fin Cold Plates, CDUs, 45,000 L/min Dielectric Coolant Loops & Industrial Evaporative Cooling Towers',
  constraint: '100 kW/Rack Extreme Heat Flux Density & Strict 105°C Silicon Junction Limit (Thermal Runaway in 45 Seconds)',
  consequence: 'Catastrophic Thermal Throttling, Silicon Junction Melting, Multi-Billion Dollar Cluster Shutdown & Continental River Evaporation Crisis',
  thesis: 'Frontier AI is not an ethereal cloud algorithm, but a violent thermodynamic furnace consuming gigawatts of electrical flux and rivers of evaporative coolant to prevent microscopic silicon gates from melting in seconds.'
};

export async function runAiCoolingEpisode() {
  return runMasterEpisodePipeline(AI_COOLING_TOPIC_INPUT);
}

if (require.main === module) {
  runAiCoolingEpisode().catch(err => {
    console.error('AI_COOLING_PIPELINE_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
