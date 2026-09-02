import { runMasterEpisodePipeline } from '../hsl/pipeline/masterOrchestrator';

export const KESSLER_TOPIC_INPUT = {
  episodeId: 'HSL_EPISODE_010_KESSLER_SYNDROME',
  topic: 'The 28,000 km/h Paint Fleck That Can Destroy The Internet in 72 Hours',
  targetMinutes: 10,
  entity: 'Low Earth Orbit (LEO) Satellites, Space Debris & The Kessler Syndrome Cascade',
  mechanism: '10,000 Active Satellites, 35,000 Tracked Fragments, 1cm Paint Flecks at 7.8 km/s, Fred Whipple Multi-Wall Shields, Autonomous Collision Avoidance Maneuvers (CAM) & Ground Phased-Array Radar Fusion',
  constraint: 'Critical Spatial Density (D_crit) & Exponential Autocatalytic Collision Cascade (Zero Drag above 700 km)',
  consequence: '31 GPS Satellites Severed, Continental Power Grid 60 Hz Frequency Loss, Global Interbank Financial Settlement Freeze, Transoceanic Flight Grounding, $3.2 Trillion Economic Loss & 300-Year Orbital Moratorium',
  thesis: 'Low Earth orbit is not an infinite vacuum void, but a finite, fragile kinetic highway travelling at 28,000 km/h where a single 1cm projectile carries the explosive energy of a grenade, demanding flawless engineering stewardship to prevent an irreversible 300-year orbital collapse.'
};

export async function runKesslerEpisode() {
  return runMasterEpisodePipeline(KESSLER_TOPIC_INPUT);
}

if (require.main === module) {
  runKesslerEpisode().catch(err => {
    console.error('KESSLER_PIPELINE_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
