import { runMasterEpisodePipeline } from '../hsl/pipeline/masterOrchestrator';

export const GRID_FREQUENCY_TOPIC_INPUT = {
  episodeId: 'HSL_EPISODE_007_GRID_FREQUENCY',
  topic: 'The 0.5 Hertz Problem That Causes Total Blackouts',
  targetMinutes: 10,
  entity: 'Synchronous Continental Power Grid & Rotational Kinetic Inertia',
  mechanism: 'Massive 3,600 RPM Steam/Hydro Turbines, 765kV Transmission Backbone & Primary Frequency Governor Controls',
  constraint: 'Zero Electrical Storage Margin & Strict ±0.5 Hz Frequency Limit (Turbine Blade Resonance & Transformer Over-fluxing)',
  consequence: 'Cascading Under-Frequency Load Shedding (UFLS), Transmission Grid Islanding, $10B/Day Economic Damage & Black Start Recovery Crisis',
  thesis: 'The modern power grid has zero storage. Every watt consumed is generated in the exact same millisecond. The grid is not a static utility pipe, but a live, continent-wide standing wave balanced on a 0.5 Hertz tightrope.'
};

export async function runGridFrequencyEpisode() {
  return runMasterEpisodePipeline(GRID_FREQUENCY_TOPIC_INPUT);
}

if (require.main === module) {
  runGridFrequencyEpisode().catch(err => {
    console.error('GRID_FREQUENCY_PIPELINE_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
