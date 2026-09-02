import { runMasterEpisodePipeline } from '../hsl/pipeline/masterOrchestrator';

export const SKYSCRAPER_TOPIC_INPUT = {
  episodeId: 'HSL_EPISODE_006_SKYSCRAPER_PRESSURE',
  topic: 'The 800 PSI Problem Inside Supertall Towers',
  targetMinutes: 10,
  entity: 'Megatall Skyscraper Vertical Hydraulic Distribution Grid (Burj Khalifa / Shanghai Tower / One WTC)',
  mechanism: 'Cascaded Gravity-Fed Break Tanks (Atmospheric Reset), Staged High-Voltage Multistage Booster Pumps & Pressure Reducing Valves (PRVs)',
  constraint: 'Hydrostatic Water Head (10 Bar per 100m) & 800 PSI Base Pressure Exceeding Pipe Tensile Limits & Water Hammer Shockwaves',
  consequence: 'Catastrophic Ground-Level Pipe Flange Rupture, Vertical Core Inundation of High-Voltage Busways, Immediate Evacuation of 35,000 Occupants & $42M Cascading Repair Loss',
  thesis: 'Supertall skyscrapers are not single buildings—they are five independent vertical cities stacked on top of each other with hydraulic break tanks isolating the hydrostatic pressure.'
};

export async function runSkyscraperEpisode() {
  return runMasterEpisodePipeline(SKYSCRAPER_TOPIC_INPUT);
}

if (require.main === module) {
  runSkyscraperEpisode().catch(err => {
    console.error('SKYSCRAPER_PIPELINE_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
