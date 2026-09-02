import { runMasterEpisodePipeline } from '../hsl/pipeline/masterOrchestrator';

export const TAIPEI_TMD_TOPIC_INPUT = {
  episodeId: 'HSL_EPISODE_012_TAIPEI_TMD',
  topic: 'O Boliche de 660 Toneladas Dentro do Prédio que Impede a Cidade de Cair: A física de inércia dos Amortecedores de Massa Sintonizada (TMD) e como arranha-céus de 500m sobrevivem a tufões de 250 km/h',
  targetMinutes: 10,
  entity: 'Taipei 101 Tuned Mass Damper (660t Spherical Pendulum & Radial Hydraulic Dissipation Grid)',
  mechanism: '8x 42mm Braided Steel Suspension Cables, 41 Concentric Steel Plates, 8x Radial Silicone Oil Viscous Dampers operating at 300 Bar & Elastomeric Over-Stroke Ring Bumper',
  constraint: 'von Kármán Vortex Shedding at 508m elevation, 0.15 Hz Structural Resonance Lock, Ryukyu Subduction Trench M7.4 Earthquakes & Hydraulic Fluid Viscosity Limit under 8-hour storm loads',
  consequence: 'Resonant shear wave amplification, elevator shaft destruction, reinforced core cracking & catastrophic structural collapse of 500-meter megatall tower',
  thesis: 'Modern megatall skyscrapers do not resist catastrophic natural forces through rigid mass accumulation; they survive by delegating kinetic energy to a 660-ton pendulum dancing in anti-phase, proving that resilient vertical civilization depends on invisible mechanical equilibrium.'
};

export async function runTaipeiTmdEpisode() {
  return runMasterEpisodePipeline(TAIPEI_TMD_TOPIC_INPUT);
}

if (require.main === module) {
  runTaipeiTmdEpisode().catch(err => {
    console.error('TAIPEI_TMD_PIPELINE_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
