import { runMasterEpisodePipeline } from '../hsl/pipeline/masterOrchestrator';

export const MEGASHIP_TOPIC_INPUT = {
  episodeId: 'HSL_EPISODE_011_MEGASHIP_HYDRODYNAMICS',
  topic: 'O Monstro de 240.000 Toneladas que Precisa de 5 Km para Frear: A hidrodinâmica violenta dos Megafretes e o estrangulamento dos canais globais',
  targetMinutes: 10,
  entity: 'Ultra Large Container Vessel (ULCV), Suez Canal Transit & Hydrodynamic Bank Effect / Squat Phenomenon',
  mechanism: '100,000 HP Marine Two-Stroke Engine, 10-meter Bronze Propeller Cavitation, Bernoulli Asymmetric Pressure Drop, 1.2m Under-Keel Clearance (UKC) Squat Sinkage & 14-Tug Escort Matrix',
  constraint: '300-meter Canal Fairway Width, 20.1-meter Dredged Draft Ceiling, 250-ton Crosswind Drag vs Rudder Hydrodynamic Lift Limit',
  consequence: 'Suez Canal Grounding, 54 Trailing Ships Emergency Crash Stop, 369 Stranded Container Vessels, $9.6 Billion Daily Economic Loss, Just-In-Time Factory Shutdown',
  thesis: 'Modern globalization is a high-wire hydrodynamic balancing act where a quarter-million tons of steel glides on 1.2 meters of water, demonstrating that civilizational prosperity depends on invisible fluid dynamics stewardship in 300-meter canals.'
};

export async function runMegaShipEpisode() {
  return runMasterEpisodePipeline(MEGASHIP_TOPIC_INPUT);
}

if (require.main === module) {
  runMegaShipEpisode().catch(err => {
    console.error('MEGASHIP_PIPELINE_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
