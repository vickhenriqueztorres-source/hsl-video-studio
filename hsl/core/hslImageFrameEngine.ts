import fs from 'fs';
import path from 'path';
import {Resvg} from '@resvg/resvg-js';
import {HslSceneBeat} from './types';
import {isValidPngFile} from './hslPathResolver';

export interface ImageFrameEngineResult {
  readonly totalGenerated: number;
  readonly outputDirectory: string;
  readonly generatedFrames: readonly string[];
}

type GridSceneKind =
  | 'substation_765kv'
  | 'turbine_rotor_3600'
  | 'swing_equation_math'
  | 'resonance_stress_59hz'
  | 'blackout_island_map'
  | 'ufls_triage_ladder'
  | 'black_start_corridor'
  | 'standing_wave_thesis';

type AiCoolingSceneKind =
  | 'datacenter_aisle_120kw'
  | 'copper_cold_plate_200um'
  | 'thermodynamic_heat_flux'
  | 'thermal_runaway_105c'
  | 'cavitation_pump_trip'
  | 'redundant_n2_chiller'
  | 'evaporative_water_towers'
  | 'thermodynamic_furnace_thesis';

type KesslerSceneKind =
  | 'orbital_highway_550km'
  | 'orbit_crossing_geometry'
  | 'hypervelocity_impact_physics'
  | 'kessler_critical_density'
  | 'iridium_cosmos_collision'
  | 'whipple_shield_cutaway'
  | 'global_gps_grid_collapse'
  | 'space_commons_thesis';

type MegashipSceneKind =
  | 'megaship_wake_5km'
  | 'propeller_cavitation_10m'
  | 'bank_effect_hydrodynamics'
  | 'squat_effect_keel'
  | 'ever_given_blockage'
  | 'salvage_bollard_pull'
  | 'global_maritime_chokepoints'
  | 'maritime_commons_thesis';

type TaipeiTmdSceneKind =
  | 'tmd_sphere_660t'
  | 'suspension_cables_42mm'
  | 'hydraulic_dampers_300bar'
  | 'vortex_shedding_015hz'
  | 'seismic_overstroke_limit'
  | 'thermal_viscosity_silicone'
  | 'megatall_resilience_blueprint'
  | 'anti_phase_master_thesis';

const GRID_FREQUENCY_ID_PATTERN = /grid|frequency|hertz|blackout|power/i;
const AI_COOLING_ID_PATTERN = /ai[_ -]?cooling|datacenter|thermal|gpu|evaporat/i;
const KESSLER_ID_PATTERN = /kessler|debris|satellite|orbit|space|paint|28,000/i;
const MEGASHIP_ID_PATTERN = /megaship|ship|suez|monstro|240000|240_000|container|frear|canal/i;
const TAIPEI_TMD_ID_PATTERN = /taipei|tmd|damper|boliche|660|amortecedor/i;

const esc = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

// -----------------------------------------------------------------------------
// AI DATACENTER COOLING SVG SCENE TEMPLATES (EPISODE 009)
// -----------------------------------------------------------------------------
const aiCoolingSceneKindForBeat = (beat: HslSceneBeat, index: number): AiCoolingSceneKind => {
  const act = beat.actNumber;
  if (act === 1) return 'datacenter_aisle_120kw';
  if (act === 2) return 'copper_cold_plate_200um';
  if (act === 3) return 'thermodynamic_heat_flux';
  if (act === 4) return 'thermal_runaway_105c';
  if (act === 5) return 'cavitation_pump_trip';
  if (act === 6) return 'redundant_n2_chiller';
  if (act === 7) return 'evaporative_water_towers';
  return 'thermodynamic_furnace_thesis';
};

const aiCoolingSvgShell = (beat: HslSceneBeat, index: number, body: string): string => {
  const seed = hashString(`${beat.beatId}:${beat.graphicHeadline}:${beat.telemetryLabel}`);
  const glowX = 240 + (seed % 1440);
  const glowY = 180 + ((seed >> 8) % 650);
  const isAlert = beat.actNumber >= 4 && beat.actNumber <= 5;
  const accent = isAlert ? '#FF2E00' : '#00D8FF';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="#0E1624"/>
      <stop offset="50%" stop-color="#080C14"/>
      <stop offset="100%" stop-color="#030508"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="coolGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0038FF" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#00D8FF" stop-opacity="1"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="glowFilter" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#F4F4F0" stroke-opacity="0.05" stroke-width="1"/>
      <circle cx="80" cy="80" r="1.5" fill="${accent}" opacity="0.3"/>
    </pattern>
    <style>
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; }
      .sans { font-family: Inter, Arial, sans-serif; font-weight: 900; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <rect width="1920" height="1080" fill="url(#grid)"/>
  <circle cx="${glowX}" cy="${glowY}" r="480" fill="url(#glow)"/>
  ${body}
  <rect x="0" y="0" width="1920" height="1080" fill="none" stroke="${accent}" stroke-opacity="0.16" stroke-width="2"/>
  <text x="80" y="90" class="mono" font-size="20" fill="${accent}" letter-spacing="4">HSL // EPISODE 009 // ACT 0${beat.actNumber} // ${esc(beat.stage.toUpperCase())}</text>
  <text x="1840" y="90" class="mono" font-size="20" fill="#F4F4F0" text-anchor="end" opacity="0.6">BEAT ${esc(beat.beatId)}</text>
  <line x1="80" y1="110" x2="1840" y2="110" stroke="#F4F4F0" stroke-opacity="0.12" stroke-width="1"/>
  <rect x="80" y="1000" width="14" height="14" fill="${accent}"/>
  <text x="110" y="1013" class="mono" font-size="18" fill="#F4F4F0">${esc(beat.telemetryLabel || `${beat.stage} METRIC`)}</text>
</svg>`;
};

const drawAiDataCenterAisle = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Server Rack Row Perspective -->
    <g transform="translate(1080 160)">
      ${Array.from({length: 6}, (_, i) => {
        const x = i * 120;
        const h = 720 - i * 40;
        return `
          <rect x="${x}" y="${(720 - h) / 2}" width="95" height="${h}" rx="6" fill="#121828" stroke="#2B3650" stroke-width="3"/>
          <line x1="${x + 47}" y1="20" x2="${x + 47}" y2="${h - 20}" stroke="#00D8FF" stroke-width="6" stroke-opacity="0.7" filter="url(#glowFilter)"/>
          ${[60, 160, 260, 360, 460].map(y => `<rect x="${x + 15}" y="${y}" width="65" height="16" fill="${(i + y) % 3 === 0 ? '#00D8FF' : '#0038FF'}" opacity="0.85"/>`).join('')}
        `;
      }).join('')}
    </g>
    <!-- Coolant Flow Velocity Wave -->
    <path d="M120 540 Q 320 380 520 540 T 920 540" fill="none" stroke="url(#coolGrad)" stroke-width="12" filter="url(#glowFilter)"/>
    <text x="120" y="320" class="sans" font-size="96" fill="#F4F4F0">1.2 GIGAWATTS</text>
    <text x="125" y="400" class="mono" font-size="44" fill="#00D8FF">100 KW / RACK DENSITY</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">45,000 LITERS/MIN DIRECT-TO-CHIP FLOW</text>
    <g transform="translate(120 640)">
      <rect width="520" height="130" rx="8" fill="#121828" stroke="#2B3650" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#00D8FF">THERMAL EQUILIBRIUM</text>
      <text x="30" y="92" class="sans" font-size="38" fill="#F4F4F0">FLOW LOSS = MELTDOWN IN 45s</text>
    </g>
  </g>`;

const drawCopperColdPlateMicrochannels = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- 200um Micro-channel Copper Cutaway -->
    <g transform="translate(1120 240)">
      <rect width="680" height="520" rx="12" fill="#161F32" stroke="#D97706" stroke-width="4" filter="url(#glowFilter)"/>
      <text x="40" y="60" class="mono" font-size="24" fill="#F59E0B">COPPER COLD PLATE // 0.2mm MICRO-FINS</text>
      <!-- Micro-fins array -->
      ${Array.from({length: 18}, (_, i) => {
        const x = 50 + i * 33;
        return `
          <rect x="${x}" y="100" width="16" height="340" fill="#D97706"/>
          <rect x="${x + 16}" y="100" width="17" height="340" fill="#00D8FF" opacity="0.65"/>
        `;
      }).join('')}
      <text x="50" y="480" class="mono" font-size="18" fill="#00D8FF">1,500% HEAT TRANSFER SURFACE MULTIPLIER</text>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#F59E0B">200 MICRONS</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#F4F4F0">MICRO-CHANNEL ARCHITECTURE</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#00D8FF">ABSORBS 200 WATTS / CM²</text>
    <g transform="translate(120 620)">
      <rect width="560" height="130" rx="8" fill="#121828" stroke="#2B3650" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#0038FF">HYDRAULIC INTERFACE</text>
      <text x="30" y="92" class="sans" font-size="34" fill="#F4F4F0">ZERO-DRIP DRY-BREAK COUPLINGS</text>
    </g>
  </g>`;

const drawThermodynamicHeatFlux = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Heat Transfer Math Model -->
    <g transform="translate(120 280)">
      <rect width="1680" height="240" rx="12" fill="#101828" stroke="#00D8FF" stroke-width="4" filter="url(#glowFilter)"/>
      <text x="60" y="90" class="mono" font-size="26" fill="#00D8FF">THE GOVERNING LAW OF CHIP HEAT DISSIPATION // FIRST LAW</text>
      <text x="60" y="175" class="mono" font-size="64" fill="#F4F4F0">Q = ṁ * C_p * ΔT = 120,000 WATTS / RACK</text>
    </g>
    <!-- Thermodynamic Flow Balance -->
    <g transform="translate(960 740)">
      <line x1="-400" y1="0" x2="400" y2="0" stroke="#F4F4F0" stroke-width="8"/>
      <polygon points="0,-40 -30,40 30,40" fill="#00D8FF"/>
      <g transform="translate(-320 -20)">
        <rect x="-140" y="-80" width="280" height="80" rx="6" fill="#0038FF" opacity="0.85"/>
        <text x="0" y="-35" class="mono" font-size="22" fill="#F4F4F0" text-anchor="middle">DIELECTRIC FLOW (45k L/m)</text>
      </g>
      <g transform="translate(320 20)">
        <rect x="-140" y="-80" width="280" height="80" rx="6" fill="#FF2E00" opacity="0.85"/>
        <text x="0" y="-35" class="mono" font-size="22" fill="#F4F4F0" text-anchor="middle">BLACKWELL THERMAL FLUX</text>
      </g>
    </g>
    <text x="120" y="600" class="sans" font-size="52" fill="#00D8FF">IF FLOW RATE DROPS 10% → SILICON BOILS</text>
  </g>`;

const drawThermalRunawaySilicon = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- 105°C Thermal Trip Curve -->
    <g transform="translate(1080 260)">
      <rect width="720" height="540" rx="8" fill="#140C12" stroke="#FF2E00" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="22" fill="#FF2E00">JUNCTION TEMPERATURE COLLAPSE (T_j)</text>
      <!-- Critical Zone -->
      <rect x="40" y="100" width="640" height="120" fill="#FF2E00" fill-opacity="0.22"/>
      <text x="60" y="165" class="mono" font-size="28" fill="#FF2E00">CRITICAL SILICON TRIP POINT (105°C)</text>
      <!-- Temperature Exponential Rise -->
      <path d="M 60 480 Q 340 440 440 140 T 660 110" fill="none" stroke="#FF2E00" stroke-width="8" filter="url(#glowFilter)"/>
      <circle cx="440" cy="140" r="14" fill="#FFE500"/>
      <text x="460" y="130" class="mono" font-size="20" fill="#FFE500">THERMAL RUNAWAY IN 45s</text>
    </g>
    <text x="120" y="340" class="sans" font-size="96" fill="#FF2E00">105.0°C</text>
    <text x="125" y="420" class="mono" font-size="44" fill="#F4F4F0">JUNCTION MELTDOWN THRESHOLD</text>
    <text x="125" y="480" class="mono" font-size="28" fill="#FFE500">ELECTRON MOBILITY COLLAPSES TO ZERO</text>
  </g>`;

const drawCavitationPumpTrip = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Cavitation & Pressure Drop Schematic -->
    <g transform="translate(1020 240)">
      <circle cx="360" cy="280" r="260" fill="#120A10" stroke="#FF2E00" stroke-width="4"/>
      <!-- Impeller Blades -->
      ${[0, 60, 120, 180, 240, 300].map(deg => `
        <line x1="360" y1="280" x2="${360 + Math.cos(deg * Math.PI / 180) * 220}" y2="${280 + Math.sin(deg * Math.PI / 180) * 220}" stroke="#FF2E00" stroke-width="8"/>
      `).join('')}
      <!-- Cavitation Vapor Bubbles -->
      <circle cx="440" cy="200" r="32" fill="#FFE500" opacity="0.8" filter="url(#glowFilter)"/>
      <circle cx="280" cy="340" r="24" fill="#FFE500" opacity="0.8" filter="url(#glowFilter)"/>
      <text x="360" y="520" class="mono" font-size="22" fill="#FF2E00" text-anchor="middle">VAPOR IMPLOSION DESTROYS IMPELLER</text>
    </g>
    <text x="120" y="340" class="sans" font-size="88" fill="#FF2E00">PUMP CAVITATION</text>
    <text x="125" y="420" class="mono" font-size="40" fill="#F4F4F0">PRESSURE COLLAPSE IN 800ms</text>
    <text x="125" y="480" class="mono" font-size="28" fill="#FF2E00">100,000 CHIPS CUT OFF FROM COOLANT FLOW</text>
  </g>`;

const drawRedundantN2Chiller = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- N+2 CDU Redundancy & 4ms Isolation Diagram -->
    <g transform="translate(1000 220)">
      ${[
        {name: 'CDU LOOP A (PRIMARY)', status: 'ACTIVE // 1,800 GPM', col: '#00D8FF'},
        {name: 'CDU LOOP B (HOT STANDBY)', status: 'STANDBY // 100% PRESSURE', col: '#0038FF'},
        {name: 'CDU LOOP C (FAILOVER ISOLATION)', status: 'ISOLATION VALVES READY (4ms)', col: '#10B981'}
      ].map((cdu, i) => `
        <g transform="translate(0 ${i * 170})">
          <rect width="800" height="135" rx="10" fill="#101828" stroke="${cdu.col}" stroke-width="3"/>
          <text x="40" y="55" class="mono" font-size="28" fill="${cdu.col}">${cdu.name}</text>
          <text x="40" y="100" class="mono" font-size="22" fill="#F4F4F0">${cdu.status}</text>
        </g>
      `).join('')}
    </g>
    <text x="120" y="340" class="sans" font-size="88" fill="#00D8FF">N+2 REDUNDANCY</text>
    <text x="125" y="420" class="mono" font-size="38" fill="#F4F4F0">4 MILLISECOND LEAK ISOLATION</text>
    <text x="125" y="480" class="mono" font-size="28" fill="#10B981">ZERO COMPUTE DOWNTIME DURING PUMP SWAP</text>
  </g>`;

const drawEvaporativeWaterTowers = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- 4 Billion Liters/Day Evaporation Diagram -->
    <g transform="translate(1000 240)">
      <rect width="800" height="560" rx="10" fill="#0E1624" stroke="#00D8FF" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="24" fill="#00D8FF">HYPERSCALE EVAPORATIVE CONSUMPTION</text>
      <!-- Dual Cooling Towers Wireframe -->
      <g transform="translate(120 120)">
        <path d="M 0 340 L 40 80 L 160 80 L 200 340 Z" fill="#162238" stroke="#00D8FF" stroke-width="4"/>
        <path d="M 40 80 Q 100 0 160 80" fill="none" stroke="#F4F4F0" stroke-width="6" stroke-dasharray="10 8" opacity="0.6"/>
      </g>
      <g transform="translate(420 120)">
        <path d="M 0 340 L 40 80 L 160 80 L 200 340 Z" fill="#162238" stroke="#00D8FF" stroke-width="4"/>
        <path d="M 40 80 Q 100 0 160 80" fill="none" stroke="#F4F4F0" stroke-width="6" stroke-dasharray="10 8" opacity="0.6"/>
      </g>
      <text x="40" y="520" class="mono" font-size="20" fill="#FFE500">4,000,000,000 LITERS EVAPORATED DAILY ACROSS GLOBAL HUBS</text>
    </g>
    <text x="120" y="340" class="sans" font-size="88" fill="#F4F4F0">4 BILLION LITERS</text>
    <text x="125" y="420" class="mono" font-size="40" fill="#00D8FF">DAILY WATER CONSUMPTION</text>
    <text x="125" y="480" class="mono" font-size="26" fill="#FFE500">$1.2 BILLION ECONOMIC LOSS PER DRIED BASIN</text>
  </g>`;

const drawThermodynamicFurnaceThesis = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Continental Thermodynamic Furnace Hero Card -->
    <path d="M 80 540 Q 300 280 520 540 T 960 540 T 1400 540 T 1840 540" fill="none" stroke="url(#coolGrad)" stroke-width="16" filter="url(#glowFilter)"/>
    <text x="960" y="320" class="sans" font-size="88" fill="#F4F4F0" text-anchor="middle">THE CLOUD IS A THERMODYNAMIC FURNACE</text>
    <text x="960" y="400" class="mono" font-size="38" fill="#00D8FF" text-anchor="middle">HUMAN REASONING IS GOVERNED BY THE LAWS OF FLUID DYNAMICS</text>
    <g transform="translate(660 660)">
      <rect width="600" height="120" rx="10" fill="#101828" stroke="#00D8FF" stroke-width="3"/>
      <text x="300" y="50" class="mono" font-size="20" fill="#0038FF" text-anchor="middle">HIDDEN SYSTEMS LAB</text>
      <text x="300" y="92" class="sans" font-size="32" fill="#F4F4F0" text-anchor="middle">SYSTEMS MOVE MODERN LIFE</text>
    </g>
  </g>`;

const aiCoolingSceneSvg = (beat: HslSceneBeat, index: number): string => {
  const kind = aiCoolingSceneKindForBeat(beat, index);
  const body = {
    datacenter_aisle_120kw: drawAiDataCenterAisle,
    copper_cold_plate_200um: drawCopperColdPlateMicrochannels,
    thermodynamic_heat_flux: drawThermodynamicHeatFlux,
    thermal_runaway_105c: drawThermalRunawaySilicon,
    cavitation_pump_trip: drawCavitationPumpTrip,
    redundant_n2_chiller: drawRedundantN2Chiller,
    evaporative_water_towers: drawEvaporativeWaterTowers,
    thermodynamic_furnace_thesis: drawThermodynamicFurnaceThesis
  }[kind](beat, index);

  return aiCoolingSvgShell(beat, index, body);
};

// -----------------------------------------------------------------------------
// GRID FREQUENCY SVG TEMPLATES
// -----------------------------------------------------------------------------
const gridSceneKindForBeat = (beat: HslSceneBeat, index: number): GridSceneKind => {
  const act = beat.actNumber;
  if (act === 1) return 'substation_765kv';
  if (act === 2) return 'turbine_rotor_3600';
  if (act === 3) return 'swing_equation_math';
  if (act === 4) return 'resonance_stress_59hz';
  if (act === 5) return 'blackout_island_map';
  if (act === 6) return 'ufls_triage_ladder';
  if (act === 7) return 'black_start_corridor';
  return 'standing_wave_thesis';
};

const gridSvgShell = (beat: HslSceneBeat, index: number, body: string): string => {
  const seed = hashString(`${beat.beatId}:${beat.graphicHeadline}:${beat.telemetryLabel}`);
  const glowX = 240 + (seed % 1440);
  const glowY = 180 + ((seed >> 8) % 650);
  const isAlert = beat.actNumber >= 4 && beat.actNumber <= 5;
  const accent = isAlert ? '#FF2E00' : '#FFE500';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="#121622"/>
      <stop offset="50%" stop-color="#0A0D15"/>
      <stop offset="100%" stop-color="#030407"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0038FF" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#FFE500" stop-opacity="1"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="glowFilter" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#F4F4F0" stroke-opacity="0.05" stroke-width="1"/>
      <circle cx="80" cy="80" r="1.5" fill="${accent}" opacity="0.3"/>
    </pattern>
    <style>
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; }
      .sans { font-family: Inter, Arial, sans-serif; font-weight: 900; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <rect width="1920" height="1080" fill="url(#grid)"/>
  <circle cx="${glowX}" cy="${glowY}" r="480" fill="url(#glow)"/>
  ${body}
  <rect x="0" y="0" width="1920" height="1080" fill="none" stroke="${accent}" stroke-opacity="0.16" stroke-width="2"/>
  <text x="80" y="90" class="mono" font-size="20" fill="${accent}" letter-spacing="4">HSL // EPISODE 007 // ACT 0${beat.actNumber} // ${esc(beat.stage.toUpperCase())}</text>
  <text x="1840" y="90" class="mono" font-size="20" fill="#F4F4F0" text-anchor="end" opacity="0.6">BEAT ${esc(beat.beatId)}</text>
  <line x1="80" y1="110" x2="1840" y2="110" stroke="#F4F4F0" stroke-opacity="0.12" stroke-width="1"/>
  <rect x="80" y="1000" width="14" height="14" fill="${accent}"/>
  <text x="110" y="1013" class="mono" font-size="18" fill="#F4F4F0">${esc(beat.telemetryLabel || `${beat.stage} METRIC`)}</text>
</svg>`;
};

const drawSubstation765kv = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1120 180)">
      <path d="M280 0 L100 780 H460 Z" fill="none" stroke="#F4F4F0" stroke-opacity="0.45" stroke-width="6"/>
      <line x1="160" y1="220" x2="400" y2="220" stroke="#F4F4F0" stroke-opacity="0.4" stroke-width="5"/>
      <line x1="130" y1="420" x2="430" y2="420" stroke="#F4F4F0" stroke-opacity="0.4" stroke-width="5"/>
      <line x1="110" y1="600" x2="450" y2="600" stroke="#F4F4F0" stroke-opacity="0.4" stroke-width="5"/>
      <line x1="0" y1="220" x2="560" y2="220" stroke="#FFE500" stroke-width="8" filter="url(#glowFilter)"/>
      <circle cx="0" cy="220" r="16" fill="#FFE500"/>
      <circle cx="280" cy="220" r="16" fill="#FFE500"/>
      <circle cx="560" cy="220" r="16" fill="#FFE500"/>
      ${[0, 280, 560].map(cx => `
        <line x1="${cx}" y1="220" x2="${cx}" y2="340" stroke="#0038FF" stroke-width="12" stroke-dasharray="14 6"/>
        <line x1="${cx}" y1="340" x2="${cx + 40}" y2="780" stroke="#FFE500" stroke-width="6" stroke-opacity="0.8"/>
      `).join('')}
    </g>
    <path d="M120 540 Q 220 400 320 540 T 520 540 T 720 540 T 920 540 T 1120 540" fill="none" stroke="url(#waveGrad)" stroke-width="12" filter="url(#glowFilter)"/>
    <text x="120" y="340" class="sans" font-size="96" fill="#F4F4F0">765,000 VOLTS</text>
    <text x="125" y="420" class="mono" font-size="44" fill="#FFE500">60.000 HZ SYNCHRONISM</text>
    <text x="125" y="480" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">ZERO ENERGY STORAGE IN TRANSIT</text>
    <g transform="translate(120 660)">
      <rect width="440" height="120" rx="8" fill="#141824" stroke="#2B3245" stroke-width="2"/>
      <text x="30" y="50" class="mono" font-size="18" fill="#FFE500">INSTANT POWER BALANCE</text>
      <text x="30" y="95" class="sans" font-size="42" fill="#F4F4F0">GENERATION = LOAD</text>
    </g>
  </g>`;

const drawTurbineRotor3600 = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1280 540)">
      <circle cx="0" cy="0" r="300" fill="#0E121E" stroke="#2B3245" stroke-width="6"/>
      <circle cx="0" cy="0" r="220" fill="#141A2B" stroke="#0038FF" stroke-width="8" stroke-dasharray="32 16" filter="url(#glowFilter)"/>
      <circle cx="0" cy="0" r="140" fill="#1B2238" stroke="#FFE500" stroke-width="10"/>
      <circle cx="0" cy="0" r="60" fill="#FFE500" filter="url(#glowFilter)"/>
      <path d="M -180 -180 L 180 180 M -180 180 L 180 -180" stroke="#FFE500" stroke-width="4" stroke-dasharray="12 8"/>
      <text x="0" y="10" class="mono" font-size="24" fill="#0D0E15" text-anchor="middle">ROTOR</text>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#F4F4F0">3,600 RPM</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FFE500">SYNCHRONOUS INERTIA</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">500 TONS OF ROTATING STEEL</text>
    <g transform="translate(120 620)">
      <rect width="600" height="140" rx="8" fill="#141824" stroke="#2B3245" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#0038FF">KINETIC ENERGY BUFFER</text>
      <text x="30" y="95" class="sans" font-size="38" fill="#F4F4F0">10^10 JOULES STORED</text>
      <text x="30" y="125" class="mono" font-size="16" fill="#FFE500">RESISTS FREQUENCY DROP FOR 3 SECONDS</text>
    </g>
  </g>`;

const drawSwingEquationMath = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(120 280)">
      <rect width="1680" height="240" rx="12" fill="#101420" stroke="#FFE500" stroke-width="4" filter="url(#glowFilter)"/>
      <text x="60" y="90" class="mono" font-size="26" fill="#FFE500">THE GOVERNING LAW OF CONTINENTAL ROTATION // SWING EQUATION</text>
      <text x="60" y="175" class="mono" font-size="64" fill="#F4F4F0">J * (dω / dt) = T_mech - T_elec = ΔP</text>
    </g>
    <g transform="translate(960 740)">
      <line x1="-400" y1="0" x2="400" y2="0" stroke="#F4F4F0" stroke-width="8"/>
      <polygon points="0,-40 -30,40 30,40" fill="#FFE500"/>
      <g transform="translate(-320 -20)">
        <rect x="-120" y="-80" width="240" height="80" rx="6" fill="#0038FF" opacity="0.85"/>
        <text x="0" y="-35" class="mono" font-size="24" fill="#F4F4F0" text-anchor="middle">GENERATION (P_gen)</text>
      </g>
      <g transform="translate(320 20)">
        <rect x="-120" y="-80" width="240" height="80" rx="6" fill="#FF2E00" opacity="0.85"/>
        <text x="0" y="-35" class="mono" font-size="24" fill="#F4F4F0" text-anchor="middle">DEMAND LOAD (P_load)</text>
      </g>
    </g>
    <text x="120" y="600" class="sans" font-size="54" fill="#FF2E00">IF LOAD > GENERATION → FREQUENCY COLLAPSES</text>
  </g>`;

const drawResonanceStress59hz = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1080 260)">
      <rect width="720" height="540" rx="8" fill="#121624" stroke="#FF2E00" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="22" fill="#FF2E00">TURBINE BLADE HARMONIC RESONANCE (FEA)</text>
      <rect x="40" y="100" width="640" height="120" fill="#FF2E00" fill-opacity="0.18"/>
      <text x="60" y="165" class="mono" font-size="28" fill="#FF2E00">CRITICAL DESTRUCTION ZONE (59.50 HZ - 58.50 HZ)</text>
      <path d="M 60 480 Q 300 460 420 140 T 660 480" fill="none" stroke="#FF2E00" stroke-width="8" filter="url(#glowFilter)"/>
      <circle cx="420" cy="140" r="14" fill="#FFE500"/>
      <text x="440" y="130" class="mono" font-size="20" fill="#FFE500">BLADE FRACTURE IN 8 SECONDS</text>
    </g>
    <text x="120" y="340" class="sans" font-size="96" fill="#FF2E00">59.50 HZ</text>
    <text x="125" y="420" class="mono" font-size="44" fill="#F4F4F0">PHYSICAL DESTRUCTION LIMIT</text>
    <text x="125" y="480" class="mono" font-size="28" fill="#FFE500">MECHANICAL RESONANCE TEARS ROTORS APART</text>
  </g>`;

const drawBlackoutIslandMap = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(980 240)">
      <path d="M 80 140 Q 280 60 520 100 T 780 280 Q 720 540 500 620 T 140 480 Z" fill="#0C101A" stroke="#2B3245" stroke-width="4"/>
      <line x1="280" y1="60" x2="380" y2="600" stroke="#FF2E00" stroke-width="8" stroke-dasharray="20 14" filter="url(#glowFilter)"/>
      <line x1="140" y1="320" x2="720" y2="340" stroke="#FF2E00" stroke-width="8" stroke-dasharray="20 14" filter="url(#glowFilter)"/>
      <circle cx="240" cy="220" r="28" fill="#FF2E00" opacity="0.6"/>
      <text x="240" y="228" class="mono" font-size="18" fill="#F4F4F0" text-anchor="middle">ISLAND A: 57.2 HZ</text>
      <circle cx="580" cy="200" r="28" fill="#FF2E00" opacity="0.6"/>
      <text x="580" y="208" class="mono" font-size="18" fill="#F4F4F0" text-anchor="middle">ISLAND B: 62.8 HZ</text>
      <circle cx="420" cy="480" r="28" fill="#030407" stroke="#FF2E00" stroke-width="4"/>
      <text x="420" y="488" class="mono" font-size="18" fill="#FF2E00" text-anchor="middle">BLACKOUT: 0.0 HZ</text>
    </g>
    <text x="120" y="340" class="sans" font-size="88" fill="#FF2E00">CASCADING COLLAPSE</text>
    <text x="125" y="420" class="mono" font-size="40" fill="#F4F4F0">GRID ISLANDING IN 1.2 SECONDS</text>
    <text x="125" y="480" class="mono" font-size="28" fill="#FF2E00">MILLIONS PLUNGED INTO MATTE OBSIDIAN DARKNESS</text>
  </g>`;

const drawUflsTriageLadder = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1020 220)">
      ${[
        {hz: '59.3 Hz', shed: 'STAGE 1: 10% LOAD SHED (100ms)', col: '#FFE500'},
        {hz: '59.0 Hz', shed: 'STAGE 2: +15% LOAD SHED (100ms)', col: '#FF8800'},
        {hz: '58.7 Hz', shed: 'STAGE 3: +20% LOAD SHED (100ms)', col: '#FF2E00'},
        {hz: '58.4 Hz', shed: 'STAGE 4: TOTAL ISLAND ISOLATION', col: '#FF0055'}
      ].map((s, i) => `
        <g transform="translate(0 ${i * 125})">
          <rect width="780" height="100" rx="8" fill="#121624" stroke="${s.col}" stroke-width="3"/>
          <text x="40" y="62" class="mono" font-size="34" fill="${s.col}">${s.hz}</text>
          <text x="220" y="62" class="mono" font-size="24" fill="#F4F4F0">${s.shed}</text>
        </g>
      `).join('')}
    </g>
    <text x="120" y="340" class="sans" font-size="88" fill="#FFE500">UFLS TRIAGE</text>
    <text x="125" y="420" class="mono" font-size="38" fill="#F4F4F0">100 MILLISECOND DEFENSE SYSTEM</text>
    <text x="125" y="480" class="mono" font-size="28" fill="#0038FF">SACRIFICING CITIES TO SAVE THE GENERATORS</text>
  </g>`;

const drawBlackStartCorridor = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1000 240)">
      <rect width="800" height="560" rx="10" fill="#101420" stroke="#0038FF" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="24" fill="#0038FF">BLACK START RESTORATION CORRIDOR</text>
      <g transform="translate(40 100)">
        <rect width="720" height="85" rx="6" fill="#182032"/>
        <text x="30" y="52" class="mono" font-size="22" fill="#FFE500">01. DIESEL GENERATOR CRANKS HYDRO UNIT</text>
      </g>
      <g transform="translate(40 210)">
        <rect width="720" height="85" rx="6" fill="#182032"/>
        <text x="30" y="52" class="mono" font-size="22" fill="#FFE500">02. HYDRO ENERGIZES 230kV TRANSMISSION LINE</text>
      </g>
      <g transform="translate(40 320)">
        <rect width="720" height="85" rx="6" fill="#182032"/>
        <text x="30" y="52" class="mono" font-size="22" fill="#FFE500">03. THERMAL POWER PLANT MOTORS RESTART</text>
      </g>
      <g transform="translate(40 430)">
        <rect width="720" height="85" rx="6" fill="#182032"/>
        <text x="30" y="52" class="mono" font-size="22" fill="#FFE500">04. PHASE-ANGLE SYNC (Δθ &lt; 5°) RECONNECTS CONTINENT</text>
      </g>
    </g>
    <text x="120" y="340" class="sans" font-size="88" fill="#F4F4F0">$10.4 BILLION</text>
    <text x="125" y="420" class="mono" font-size="40" fill="#FF2E00">DAILY ECONOMIC LOSS</text>
    <text x="125" y="480" class="mono" font-size="26" fill="#FFE500">48 TO 72 HOURS TO REBOOT A CONTINENT</text>
  </g>`;

const drawStandingWaveThesis = (beat: HslSceneBeat, index: number): string => `
  <g>
    <path d="M 80 540 Q 300 280 520 540 T 960 540 T 1400 540 T 1840 540" fill="none" stroke="url(#waveGrad)" stroke-width="16" filter="url(#glowFilter)"/>
    <text x="960" y="320" class="sans" font-size="88" fill="#F4F4F0" text-anchor="middle">A CONTINENTAL STANDING WAVE</text>
    <text x="960" y="400" class="mono" font-size="38" fill="#FFE500" text-anchor="middle">NOT A STATIC WIRE — A LIVING ELECTROMAGNETIC FIELD</text>
    <g transform="translate(660 660)">
      <rect width="600" height="120" rx="10" fill="#121624" stroke="#FFE500" stroke-width="3"/>
      <text x="300" y="50" class="mono" font-size="20" fill="#0038FF" text-anchor="middle">HIDDEN SYSTEMS LAB</text>
      <text x="300" y="92" class="sans" font-size="32" fill="#F4F4F0" text-anchor="middle">SYSTEMS MOVE MODERN LIFE</text>
    </g>
  </g>`;

const gridSceneSvg = (beat: HslSceneBeat, index: number): string => {
  const kind = gridSceneKindForBeat(beat, index);
  const body = {
    substation_765kv: drawSubstation765kv,
    turbine_rotor_3600: drawTurbineRotor3600,
    swing_equation_math: drawSwingEquationMath,
    resonance_stress_59hz: drawResonanceStress59hz,
    blackout_island_map: drawBlackoutIslandMap,
    ufls_triage_ladder: drawUflsTriageLadder,
    black_start_corridor: drawBlackStartCorridor,
    standing_wave_thesis: drawStandingWaveThesis
  }[kind](beat, index);

  return gridSvgShell(beat, index, body);
};

// -----------------------------------------------------------------------------
// KESSLER SYNDROME & SPACE DEBRIS SVG SCENE TEMPLATES (EPISODE 010)
// -----------------------------------------------------------------------------
const kesslerSceneKindForBeat = (beat: HslSceneBeat, index: number): KesslerSceneKind => {
  const act = beat.actNumber;
  if (act === 1) return 'orbital_highway_550km';
  if (act === 2) return 'orbit_crossing_geometry';
  if (act === 3) return 'hypervelocity_impact_physics';
  if (act === 4) return 'kessler_critical_density';
  if (act === 5) return 'iridium_cosmos_collision';
  if (act === 6) return 'whipple_shield_cutaway';
  if (act === 7) return 'global_gps_grid_collapse';
  return 'space_commons_thesis';
};

const getKesslerBaseImageBase64 = (actNumber: number): string => {
  const root = process.cwd();
  let imgPath = path.resolve(root, 'public', 'images', 'kessler', 'act1_leo_orbit.jpg');
  if (actNumber === 2) imgPath = path.resolve(root, 'public', 'images', 'kessler', 'act2_crossing_planes.jpg');
  else if (actNumber === 3) imgPath = path.resolve(root, 'public', 'images', 'kessler', 'act3_impact_physics.jpg');
  else if (actNumber === 4) imgPath = path.resolve(root, 'public', 'images', 'kessler', 'act4_mission_control.jpg');
  else if (actNumber === 5) imgPath = path.resolve(root, 'public', 'images', 'kessler', 'act5_collision_cascade.jpg');
  else if (actNumber === 6) imgPath = path.resolve(root, 'public', 'images', 'kessler', 'act6_whipple_shield.jpg');
  else if (actNumber === 7) imgPath = path.resolve(root, 'public', 'images', 'kessler', 'act4_mission_control.jpg');
  else if (actNumber === 8) imgPath = path.resolve(root, 'public', 'images', 'kessler', 'act1_leo_orbit.jpg');

  try {
    if (fs.existsSync(imgPath)) {
      return fs.readFileSync(imgPath).toString('base64');
    }
  } catch {}
  return '';
};

const kesslerSvgShell = (beat: HslSceneBeat, index: number, body: string, isDiagram: boolean = false): string => {
  const seed = hashString(`${beat.beatId}:${beat.graphicHeadline}:${beat.telemetryLabel}`);
  const glowX = 240 + (seed % 1440);
  const glowY = 180 + ((seed >> 8) % 650);
  const isAlert = beat.actNumber >= 4 && beat.actNumber <= 5;
  const accent = isAlert ? '#FF2E00' : '#FFE500';
  const base64 = getKesslerBaseImageBase64(beat.actNumber);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <!-- Cinematic Chiaroscuro Overlay -->
    <linearGradient id="leftRightDark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.94' : '0.40'}"/>
      <stop offset="35%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.75' : '0.12'}"/>
      <stop offset="65%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.25' : '0.04'}"/>
      <stop offset="100%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.70' : '0.30'}"/>
    </linearGradient>
    <linearGradient id="topBottomDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#030408" stop-opacity="${isDiagram ? '0.88' : '0.30'}"/>
      <stop offset="22%" stop-color="#030408" stop-opacity="0.04"/>
      <stop offset="72%" stop-color="#030408" stop-opacity="${isDiagram ? '0.45' : '0.08'}"/>
      <stop offset="100%" stop-color="#030408" stop-opacity="${isDiagram ? '0.95' : '0.45'}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.4"/>
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glowFilter" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="heavyShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.95"/>
    </filter>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#F4F4F0" stroke-opacity="0.03" stroke-width="1"/>
      <circle cx="80" cy="80" r="1.5" fill="${accent}" opacity="0.25"/>
    </pattern>
    <style>
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; }
      .sans { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
    </style>
  </defs>

  <!-- 1. Photorealistic 35mm AI Base Image -->
  ${base64 ? `<image href="data:image/jpeg;base64,${base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>` : `<rect width="1920" height="1080" fill="#0E121E"/>`}

  <!-- 2. Dual Chiaroscuro Cinematic Overlays -->
  <rect width="1920" height="1080" fill="url(#leftRightDark)"/>
  <rect width="1920" height="1080" fill="url(#topBottomDark)"/>

  ${isDiagram ? `
  <!-- 3. Technical Grid Texture & Glow -->
  <rect width="1920" height="1080" fill="url(#grid)"/>
  <circle cx="${glowX}" cy="${glowY}" r="450" fill="url(#glow)"/>

  <!-- 4. Dynamic Scene Body (HUD, Reticles, Telemetry Panels) -->
  ${body}

  <!-- 5. Global Technical Borders & Timecode HUD -->
  <rect x="0" y="0" width="1920" height="1080" fill="none" stroke="${accent}" stroke-opacity="0.16" stroke-width="2"/>
  <text x="80" y="90" class="mono" font-size="20" fill="${accent}" letter-spacing="4">HSL // EPISODE 010 // ACT 0${beat.actNumber} // ${esc(beat.stage.toUpperCase())}</text>
  <text x="1840" y="90" class="mono" font-size="20" fill="#F4F4F0" text-anchor="end" opacity="0.6">BEAT ${esc(beat.beatId)}</text>
  <line x1="80" y1="110" x2="1840" y2="110" stroke="#F4F4F0" stroke-opacity="0.12" stroke-width="1"/>
  <rect x="80" y="1000" width="14" height="14" fill="${accent}"/>
  <text x="110" y="1013" class="mono" font-size="18" fill="#F4F4F0">${esc(beat.telemetryLabel || `${beat.stage} METRIC`)}</text>
  ` : ''}
</svg>`;
};

const drawOrbitalHighway550km = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Earth Arc & Orbit Rings -->
    <g transform="translate(400 1200)">
      <circle cx="0" cy="0" r="800" fill="#0A1020" stroke="#00D8FF" stroke-width="4" filter="url(#glowFilter)"/>
      <ellipse cx="0" cy="0" rx="950" ry="950" fill="none" stroke="#FFE500" stroke-width="3" stroke-dasharray="16 8"/>
      <ellipse cx="0" cy="0" rx="1100" ry="1100" fill="none" stroke="#FF2E00" stroke-width="2" stroke-dasharray="8 6" opacity="0.7"/>
    </g>
    <!-- Satellite Icon & Debris Cluster -->
    <g transform="translate(1320 380)">
      <rect x="-80" y="-30" width="160" height="60" rx="6" fill="#141828" stroke="#FFE500" stroke-width="3"/>
      <line x1="-160" y1="0" x2="-80" y2="0" stroke="#00D8FF" stroke-width="8"/>
      <line x1="80" y1="0" x2="160" y2="0" stroke="#00D8FF" stroke-width="8"/>
      <circle cx="0" cy="0" r="12" fill="#FFE500" filter="url(#glowFilter)"/>
      <text x="0" y="70" class="mono" font-size="20" fill="#FFE500" text-anchor="middle">ACTIVE SATELLITE (550 KM)</text>
      <!-- Surrounding Debris Swarm -->
      <circle cx="-120" cy="-140" r="4" fill="#FF2E00"/>
      <circle cx="180" cy="-80" r="5" fill="#FF2E00"/>
      <circle cx="100" cy="140" r="3" fill="#FF2E00"/>
      <circle cx="-200" cy="90" r="4" fill="#FF2E00"/>
    </g>
    <text x="120" y="320" class="sans" font-size="96" fill="#F4F4F0">28,000 KM/H</text>
    <text x="125" y="400" class="mono" font-size="44" fill="#FFE500">7.8 KM/S ORBITAL VELOCITY</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">35,000 TRACKED DEBRIS OBJECTS IN LEO</text>
    <g transform="translate(120 620)">
      <rect width="640" height="150" rx="8" fill="#0E121E" stroke="#2B3245" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#00D8FF">LOW EARTH ORBIT CONGESTION</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">10,000 ACTIVE SATELLITES</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#FF2E00">ZERO ATMOSPHERIC DRAG AT 550 KM</text>
    </g>
  </g>`;

const drawOrbitCrossingGeometry = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Orthogonal Orbital Crossing Coordinate Grid -->
    <g transform="translate(1260 520)">
      <line x1="-340" y1="0" x2="340" y2="0" stroke="#00D8FF" stroke-width="6"/>
      <line x1="0" y1="-340" x2="0" y2="340" stroke="#FFE500" stroke-width="6"/>
      <circle cx="0" cy="0" r="280" fill="none" stroke="#2B3245" stroke-width="2" stroke-dasharray="10 6"/>
      <circle cx="0" cy="0" r="20" fill="#FF2E00" filter="url(#glowFilter)"/>
      <polygon points="0,-20 180,-180 160,-200" fill="#FF2E00" opacity="0.7"/>
      <text x="20" y="-30" class="mono" font-size="24" fill="#FF2E00">IMPACT CONE (90° INTERSECT)</text>
      <text x="0" y="320" class="mono" font-size="20" fill="#00D8FF" text-anchor="middle">POLAR PLANE vs EQUATORIAL PLANE</text>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#F4F4F0">11.3 KM/S</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FF2E00">RELATIVE CLOSING SPEED</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">V_rel = 2 * V * sin(θ/2)</text>
    <g transform="translate(120 620)">
      <rect width="640" height="150" rx="8" fill="#0E121E" stroke="#FF2E00" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#FFE500">REACTION TIME WINDOW</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">800 MILLISECONDS</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#FF2E00">HUMAN INTERVENTION IMPOSSIBLE</text>
    </g>
  </g>`;

const drawHypervelocityImpactPhysics = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Hugoniot Shock Physics Plate Cutaway -->
    <g transform="translate(1120 280)">
      <rect width="680" height="520" rx="8" fill="#0A0E18" stroke="#FFE500" stroke-width="3"/>
      <text x="40" y="50" class="mono" font-size="22" fill="#FFE500">HYDRODYNAMIC PHASE TRANSITION (FEA)</text>
      <!-- Aluminum Plate Cutaway with Impact Crater -->
      <rect x="60" y="100" width="560" height="80" rx="4" fill="#2B3245"/>
      <polygon points="340,100 280,240 400,240" fill="#FF2E00" filter="url(#glowFilter)"/>
      <circle cx="340" cy="70" r="10" fill="#FFE500"/>
      <text x="60" y="300" class="mono" font-size="20" fill="#FF2E00">120 GIGAPASCAL SHOCK WAVE</text>
      <text x="60" y="340" class="mono" font-size="20" fill="#F4F4F0">SOLID METAL → EXPANDING PLASMA JET (3,000 M/S)</text>
      <text x="60" y="420" class="sans" font-size="34" fill="#FFE500">1 GRAM = 50 KILOJOULES</text>
    </g>
    <text x="120" y="320" class="sans" font-size="88" fill="#F4F4F0">E_k = 1/2 m v²</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FFE500">100X ENERGY MULTIPLIER</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">1CM PAINT FLECK = EXPLODING GRENADE</text>
    <g transform="translate(120 620)">
      <rect width="560" height="150" rx="8" fill="#0E121E" stroke="#2B3245" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#00D8FF">STRUCTURAL HULL FAILURE</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#FF2E00">INSTANT DISINTEGRATION</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#F4F4F0">HYDRAZINE TANK OVERPRESSURE</text>
    </g>
  </g>`;

const drawKesslerCriticalDensity = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Kessler Cascade Exponential Graph -->
    <g transform="translate(1100 260)">
      <rect width="700" height="540" rx="8" fill="#0D101C" stroke="#FF2E00" stroke-width="3"/>
      <text x="40" y="50" class="mono" font-size="22" fill="#FF2E00">DONALD KESSLER 1978 // CRITICAL DENSITY (D_crit)</text>
      <!-- Exponential Debris Curve -->
      <path d="M 80 460 Q 300 440 450 320 T 640 100" fill="none" stroke="#FF2E00" stroke-width="8" filter="url(#glowFilter)"/>
      <line x1="80" y1="320" x2="640" y2="320" stroke="#FFE500" stroke-width="3" stroke-dasharray="12 6"/>
      <text x="90" y="305" class="mono" font-size="18" fill="#FFE500">COLLISION RATE = ATMOSPHERIC DECAY RATE (THRESHOLD)</text>
      <text x="90" y="140" class="sans" font-size="34" fill="#FF2E00">AUTOCATALYTIC RUNAWAY</text>
    </g>
    <text x="120" y="320" class="sans" font-size="88" fill="#F4F4F0">KESSLER LIMIT</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FF2E00">SELF-SUSTAINING CASCADE</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">COLLISIONS MULTIPLY WITH ZERO NEW LAUNCHES</text>
    <g transform="translate(120 620)">
      <rect width="560" height="150" rx="8" fill="#0E121E" stroke="#FFE500" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#00D8FF">ORBITAL RESIDENCE LIFETIME</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#FFE500">1,000+ YEARS</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#F4F4F0">ABOVE 700 KM ALTITUDE</text>
    </g>
  </g>`;

const drawIridiumCosmosCollision = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Historical Collision Map Reconstruction (2009) -->
    <g transform="translate(1120 280)">
      <rect width="680" height="500" rx="8" fill="#080C14" stroke="#FF2E00" stroke-width="3"/>
      <text x="40" y="50" class="mono" font-size="22" fill="#FFE500">FEB 10, 2009 // 16:56:00 UTC // 789 KM</text>
      <text x="40" y="95" class="sans" font-size="38" fill="#F4F4F0">IRIDIUM 33 vs COSMOS 2251</text>
      <line x1="40" y1="120" x2="640" y2="120" stroke="#2B3245" stroke-width="2"/>
      <g transform="translate(340 300)">
        <circle cx="0" cy="0" r="140" fill="none" stroke="#FF2E00" stroke-width="2" stroke-dasharray="8 4"/>
        <circle cx="0" cy="0" r="18" fill="#FF2E00" filter="url(#glowFilter)"/>
        <text x="0" y="60" class="mono" font-size="20" fill="#FF2E00" text-anchor="middle">2,296 TRACKED PIECES (>10CM)</text>
        <text x="0" y="90" class="mono" font-size="16" fill="#F4F4F0" text-anchor="middle">300,000 UNTRACKED MICRO-SHARDS</text>
      </g>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#F4F4F0">16.7 GIGAJOULES</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FF2E00">4 TONS TNT EQUIVALENT</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">11.7 KM/S IMPACT OBLITERATION</text>
    <g transform="translate(120 620)">
      <rect width="560" height="150" rx="8" fill="#0E121E" stroke="#FF2E00" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#FFE500">ISS CONJUNCTION THREAT</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">5 EVACUATION ALERTS</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#FF2E00">1,400+ PIECES STILL IN ORBIT TODAY</text>
    </g>
  </g>`;

const drawWhippleShieldCutaway = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Whipple Shield Multi-Wall Bumper Diagram -->
    <g transform="translate(1120 260)">
      <rect width="680" height="540" rx="8" fill="#0A0E18" stroke="#00D8FF" stroke-width="3"/>
      <text x="40" y="50" class="mono" font-size="22" fill="#00D8FF">FRED WHIPPLE SACRIFICIAL BUMPER (1947)</text>
      <!-- Outer Bumper 1.27mm -->
      <line x1="80" y1="120" x2="80" y2="440" stroke="#FFE500" stroke-width="8"/>
      <text x="60" y="480" class="mono" font-size="16" fill="#FFE500">1.27MM BUMPER</text>
      <!-- Standoff Gap 100mm -->
      <line x1="90" y1="280" x2="490" y2="280" stroke="#00D8FF" stroke-width="2" stroke-dasharray="6 4"/>
      <text x="280" y="260" class="mono" font-size="18" fill="#00D8FF" text-anchor="middle">100MM VACUUM STANDOFF GAP</text>
      <!-- Vapor Expansion Cone -->
      <polygon points="80,280 490,160 490,400" fill="#FFE500" opacity="0.25"/>
      <!-- Inner Pressure Wall -->
      <line x1="500" y1="120" x2="500" y2="440" stroke="#00D8FF" stroke-width="20"/>
      <text x="440" y="480" class="mono" font-size="16" fill="#00D8FF">PRESSURE WALL</text>
    </g>
    <text x="120" y="320" class="sans" font-size="88" fill="#F4F4F0">100:1 AREA SPREAD</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#00D8FF">PHASE DISPERSION SHIELD</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">SOLID PROJECTILE → EXPANDING GAS CLOUD</text>
    <g transform="translate(120 620)">
      <rect width="560" height="150" rx="8" fill="#0E121E" stroke="#00D8FF" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#FFE500">ACTIVE COLLISION AVOIDANCE (CAM)</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">50,000 BURNS/YEAR</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#00D8FF">850M AUTONOMOUS MISS DISTANCE</text>
    </g>
  </g>`;

const drawGlobalGpsGridCollapse = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Ground Impact Scoreboard -->
    <g transform="translate(1120 280)">
      <rect width="680" height="500" rx="8" fill="#140808" stroke="#FF2E00" stroke-width="3"/>
      <text x="40" y="50" class="mono" font-size="22" fill="#FF2E00">SYSTEMIC GROUND CASCADE // 72 HOURS</text>
      <g transform="translate(40 100)">
        <rect width="600" height="70" rx="6" fill="#200606" stroke="#FF2E00" stroke-width="1.5"/>
        <text x="25" y="45" class="mono" font-size="20" fill="#FFE500">31 GPS ATOMIC CLOCKS SEVERED</text>
      </g>
      <g transform="translate(40 190)">
        <rect width="600" height="70" rx="6" fill="#200606" stroke="#FF2E00" stroke-width="1.5"/>
        <text x="25" y="45" class="mono" font-size="20" fill="#FF2E00">60 HZ CONTINENTAL POWER GRID TRIP</text>
      </g>
      <g transform="translate(40 280)">
        <rect width="600" height="70" rx="6" fill="#200606" stroke="#FF2E00" stroke-width="1.5"/>
        <text x="25" y="45" class="mono" font-size="20" fill="#F4F4F0">10,000 TRANSOCEANIC FLIGHTS GROUNDED</text>
      </g>
      <text x="40" y="430" class="sans" font-size="44" fill="#FF2E00">$3.2 TRILLION LOSS</text>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#F4F4F0">TOTAL ISOLATION</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FF2E00">300-YEAR ORBITAL PRISON</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">SPACE ACCESS SHUT DOWN FOR GENERATIONS</text>
    <g transform="translate(120 620)">
      <rect width="560" height="150" rx="8" fill="#0E121E" stroke="#FF2E00" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#FFE500">CRITICAL FAILURE HORIZON</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#FF2E00">72 HOURS TO RUNAWAY</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#F4F4F0">IF TRAFFIC MANAGEMENT HALTS</text>
    </g>
  </g>`;

const drawSpaceCommonsThesis = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Monumental Thesis Arc -->
    <path d="M 80 540 Q 400 260 960 260 T 1840 540" fill="none" stroke="url(#orbitGrad)" stroke-width="14" filter="url(#glowFilter)"/>
    <text x="960" y="440" class="sans" font-size="80" fill="#F4F4F0" text-anchor="middle">THE ORBIT IS A KINETIC HIGHWAY</text>
    <text x="960" y="520" class="mono" font-size="36" fill="#FFE500" text-anchor="middle">NOT AN INFINITE VOID — A FINITE GEOMETRIC CAPACITY</text>
    <g transform="translate(660 660)">
      <rect width="600" height="120" rx="10" fill="#101424" stroke="#FFE500" stroke-width="3"/>
      <text x="300" y="48" class="mono" font-size="20" fill="#00D8FF" text-anchor="middle">HIDDEN SYSTEMS LAB</text>
      <text x="300" y="92" class="sans" font-size="32" fill="#F4F4F0" text-anchor="middle">SYSTEMS MOVE MODERN LIFE</text>
    </g>
  </g>`;

const kesslerSceneSvg = (beat: HslSceneBeat, index: number): string => {
  const isDiagram = Boolean(beat.infographicArchetype);
  if (isDiagram) {
    const kind = kesslerSceneKindForBeat(beat, index);
    const body = {
      orbital_highway_550km: drawOrbitalHighway550km,
      orbit_crossing_geometry: drawOrbitCrossingGeometry,
      hypervelocity_impact_physics: drawHypervelocityImpactPhysics,
      kessler_critical_density: drawKesslerCriticalDensity,
      iridium_cosmos_collision: drawIridiumCosmosCollision,
      whipple_shield_cutaway: drawWhippleShieldCutaway,
      global_gps_grid_collapse: drawGlobalGpsGridCollapse,
      space_commons_thesis: drawSpaceCommonsThesis
    }[kind](beat, index);

    return kesslerSvgShell(beat, index, body, true);
  }

  return kesslerSvgShell(beat, index, '', false);
};

// -----------------------------------------------------------------------------
// MEGASHIP HYDRODYNAMICS SVG SCENE TEMPLATES (EPISODE 011)
// -----------------------------------------------------------------------------
const megashipSceneKindForBeat = (beat: HslSceneBeat, index: number): MegashipSceneKind => {
  const act = beat.actNumber;
  if (act === 1) return 'megaship_wake_5km';
  if (act === 2) return 'propeller_cavitation_10m';
  if (act === 3) return 'bank_effect_hydrodynamics';
  if (act === 4) return 'squat_effect_keel';
  if (act === 5) return 'ever_given_blockage';
  if (act === 6) return 'salvage_bollard_pull';
  if (act === 7) return 'global_maritime_chokepoints';
  return 'maritime_commons_thesis';
};

const getMegashipBaseImageBase64 = (actNumber: number): string => {
  const root = process.cwd();
  const candidatePaths = [
    path.resolve(root, 'public', 'images', 'megaship', `act${actNumber}.jpg`),
    path.resolve(root, 'public', 'images', 'megaship', `act${actNumber}.png`),
    path.resolve(root, 'runs', 'HSL_EPISODE_011_MEGASHIP_HYDRODYNAMICS', 'images', `act${actNumber}.jpg`)
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p).toString('base64');
      } catch {}
    }
  }
  return '';
};

const megashipSvgShell = (beat: HslSceneBeat, index: number, body: string, isDiagram: boolean = false): string => {
  const seed = hashString(`${beat.beatId}:${beat.graphicHeadline}:${beat.telemetryLabel}`);
  const glowX = 240 + (seed % 1440);
  const glowY = 180 + ((seed >> 8) % 650);
  const isAlert = beat.actNumber >= 4 && beat.actNumber <= 5;
  const accent = isAlert ? '#FF2E00' : '#FFE500';
  const base64 = getMegashipBaseImageBase64(beat.actNumber);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <!-- Cinematic Chiaroscuro Overlay -->
    <linearGradient id="leftRightDark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.94' : '0.40'}"/>
      <stop offset="35%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.75' : '0.12'}"/>
      <stop offset="65%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.25' : '0.04'}"/>
      <stop offset="100%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.70' : '0.30'}"/>
    </linearGradient>
    <linearGradient id="topBottomDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#030408" stop-opacity="${isDiagram ? '0.88' : '0.30'}"/>
      <stop offset="22%" stop-color="#030408" stop-opacity="0.04"/>
      <stop offset="72%" stop-color="#030408" stop-opacity="${isDiagram ? '0.45' : '0.08'}"/>
      <stop offset="100%" stop-color="#030408" stop-opacity="${isDiagram ? '0.95' : '0.45'}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.4"/>
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="waterGrad" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#081426"/>
      <stop offset="50%" stop-color="#040A14"/>
      <stop offset="100%" stop-color="#020408"/>
    </radialGradient>
    <filter id="glowFilter" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="heavyShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.95"/>
    </filter>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#F4F4F0" stroke-opacity="0.03" stroke-width="1"/>
      <circle cx="80" cy="80" r="1.5" fill="${accent}" opacity="0.25"/>
    </pattern>
    <style>
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; }
      .sans { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
    </style>
  </defs>

  <!-- 1. Base Image or Dark Maritime Atmosphere -->
  ${base64 ? `<image href="data:image/jpeg;base64,${base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>` : `<rect width="1920" height="1080" fill="url(#waterGrad)"/>`}

  <!-- 2. Dual Chiaroscuro Overlays -->
  <rect width="1920" height="1080" fill="url(#leftRightDark)"/>
  <rect width="1920" height="1080" fill="url(#topBottomDark)"/>

  ${isDiagram ? `
  <!-- 3. Technical Grid Texture & Glow -->
  <rect width="1920" height="1080" fill="url(#grid)"/>
  <circle cx="${glowX}" cy="${glowY}" r="450" fill="url(#glow)"/>

  <!-- 4. Dynamic Scene Body (HUD, Reticles, Telemetry Panels) -->
  ${body}

  <!-- 5. Global Technical Borders & Timecode HUD -->
  <rect x="0" y="0" width="1920" height="1080" fill="none" stroke="${accent}" stroke-opacity="0.16" stroke-width="2"/>
  <text x="80" y="90" class="mono" font-size="20" fill="${accent}" letter-spacing="4">HSL // EPISODE 011 // ACT 0${beat.actNumber} // ${esc(beat.stage.toUpperCase())}</text>
  <text x="1840" y="90" class="mono" font-size="20" fill="#F4F4F0" text-anchor="end" opacity="0.6">BEAT ${esc(beat.beatId)}</text>
  <line x1="80" y1="110" x2="1840" y2="110" stroke="#F4F4F0" stroke-opacity="0.12" stroke-width="1"/>
  <rect x="80" y="1000" width="14" height="14" fill="${accent}"/>
  <text x="110" y="1013" class="mono" font-size="18" fill="#F4F4F0">${esc(beat.telemetryLabel || `${beat.stage} METRIC`)}</text>
  ` : ''}
</svg>`;
};

const drawMegaShipWake5km = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- 400m Hull Silhouette & Stopping Distance Arc -->
    <g transform="translate(1080 340)">
      <rect x="-380" y="-40" width="760" height="80" rx="40" fill="#101828" stroke="#FFE500" stroke-width="3"/>
      <!-- Container Stacks -->
      <rect x="-320" y="-70" width="640" height="30" fill="#FFE500" opacity="0.8"/>
      <line x1="-380" y1="80" x2="380" y2="80" stroke="#00D8FF" stroke-width="4" stroke-dasharray="12 6"/>
      <text x="0" y="120" class="mono" font-size="20" fill="#00D8FF" text-anchor="middle">STOPPING DISTANCE: 5,200 METERS // 14:00 MIN</text>
    </g>
    <text x="120" y="320" class="sans" font-size="96" fill="#F4F4F0">240,000 TONS</text>
    <text x="125" y="400" class="mono" font-size="44" fill="#FFE500">8.2 BILLION JOULES KINETIC ENERGY</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">400M LOA // 24,000 TEU CAPACITY</text>
    <g transform="translate(120 620)">
      <rect width="640" height="150" rx="8" fill="#0E121E" stroke="#2B3245" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#00D8FF">HYDRODYNAMIC INERTIA LIMIT</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">5.2 KM RUNOUT DISTANCE</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#FF2E00">ZERO FRICTION WATER BOUNDARY</text>
    </g>
  </g>`;

const drawPropellerCavitation10m = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- 10m Propeller Hub & Cavitation Streamlines -->
    <g transform="translate(1320 480)">
      <circle cx="0" cy="0" r="260" fill="none" stroke="#FFE500" stroke-width="4" stroke-dasharray="20 10"/>
      <circle cx="0" cy="0" r="60" fill="#1A2234" stroke="#00D8FF" stroke-width="4"/>
      <!-- Blades -->
      <line x1="0" y1="-60" x2="0" y2="-240" stroke="#FFE500" stroke-width="24" stroke-linecap="round"/>
      <line x1="52" y1="30" x2="208" y2="120" stroke="#FFE500" stroke-width="24" stroke-linecap="round"/>
      <line x1="-52" y1="30" x2="-208" y2="120" stroke="#FFE500" stroke-width="24" stroke-linecap="round"/>
      <text x="0" y="300" class="mono" font-size="20" fill="#FF2E00" text-anchor="middle">CAVITATION PRESSURE: -1.2 BAR</text>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#F4F4F0">100,000 HP</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FFE500">11-CYLINDER 2-STROKE TURBO</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">480-TON CRANKSHAFT // 84 RPM</text>
    <g transform="translate(120 620)">
      <rect width="640" height="150" rx="8" fill="#0E121E" stroke="#FFE500" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#00D8FF">PROPULSION TORQUE</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">10.2M FIXED BRONZE</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#FF2E00">300 TONS FUEL / DAY CONSUMPTION</text>
    </g>
  </g>`;

const drawBankEffectHydrodynamics = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Trapezoid Canal Profile & Bernoulli Vectors -->
    <g transform="translate(1180 320)">
      <polygon points="-380,-140 380,-140 280,180 -280,180" fill="#08101C" stroke="#2B3245" stroke-width="3"/>
      <!-- Ship Cross-Section -->
      <rect x="-120" y="-60" width="240" height="180" fill="#141E30" stroke="#FFE500" stroke-width="3"/>
      <!-- Bank Suction Vectors -->
      <line x1="120" y1="20" x2="260" y2="20" stroke="#FF2E00" stroke-width="8" marker-end="url(#arrow)"/>
      <text x="190" y="0" class="mono" font-size="18" fill="#FF2E00">SUCTION</text>
      <text x="0" y="240" class="mono" font-size="20" fill="#FFE500" text-anchor="middle">BERNOULLI PRESSURE DROP: -0.85 BAR</text>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#F4F4F0">BANK EFFECT</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FF2E00">ASYMMETRIC SUCTION VORTEX</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">P + 1/2*rho*v^2 = CONSTANT</text>
    <g transform="translate(120 620)">
      <rect width="640" height="150" rx="8" fill="#0E121E" stroke="#FF2E00" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#FFE500">CANAL LATERAL CLEARANCE</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">&lt; 60 METERS MARGIN</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#FF2E00">UNRECOVERABLE YAWING IN 8 SECONDS</text>
    </g>
  </g>`;

const drawSquatEffectKeel = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Under-Keel Clearance & Squat Sinkage -->
    <g transform="translate(1180 340)">
      <rect x="-340" y="-120" width="680" height="140" rx="8" fill="#101828" stroke="#00D8FF" stroke-width="3"/>
      <!-- Seabed line -->
      <line x1="-380" y1="120" x2="380" y2="120" stroke="#FFE500" stroke-width="6"/>
      <!-- UKC Gap -->
      <line x1="0" y1="20" x2="0" y2="120" stroke="#FF2E00" stroke-width="4"/>
      <text x="20" y="75" class="mono" font-size="22" fill="#FF2E00">UKC: 0.48M (SINKAGE -72CM)</text>
      <text x="0" y="160" class="mono" font-size="20" fill="#FFE500" text-anchor="middle">CANAL BED FRICTION BOUNDARY</text>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#F4F4F0">1.2M MARGIN</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FFE500">DYNAMIC SQUAT SINKAGE</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">VENTURI ACCELERATION UNDER KEEL</text>
    <g transform="translate(120 620)">
      <rect width="640" height="150" rx="8" fill="#0E121E" stroke="#FF2E00" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#00D8FF">HYDRODYNAMIC SINKAGE</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">CRITICAL FROUDE NUMBER</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#FF2E00">RUDDER AUTHORITY COLLAPSE</text>
    </g>
  </g>`;

const drawEverGivenBlockage = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Diagonal Grounding Layout -->
    <g transform="translate(1240 440)">
      <rect x="-300" y="-180" width="600" height="360" fill="none" stroke="#2B3245" stroke-width="3"/>
      <!-- Diagonal Ship -->
      <line x1="-240" y1="120" x2="240" y2="-120" stroke="#FF2E00" stroke-width="28" stroke-linecap="round"/>
      <circle cx="240" cy="-120" r="16" fill="#FFE500" filter="url(#glowFilter)"/>
      <text x="0" y="180" class="mono" font-size="20" fill="#FF2E00" text-anchor="middle">60° DIAGONAL LOCK // SUEZ KM 151</text>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#FF2E00">CANAL WEDGED</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#F4F4F0">20-SECOND TOTAL BLOCKADE</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#FFE500">369 CONTAINER SHIPS STRANDED</text>
    <g transform="translate(120 620)">
      <rect width="640" height="150" rx="8" fill="#0E121E" stroke="#FF2E00" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#FFE500">CONVOY HALT SEQUENCE</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">54 VESSELS CRASH STOP</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#FF2E00">10% GLOBAL COMMERCE FROZEN</text>
    </g>
  </g>`;

const drawSalvageBollardPull = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Salvage Tug Force Matrix -->
    <g transform="translate(1200 420)">
      <circle cx="0" cy="0" r="180" fill="none" stroke="#00D8FF" stroke-width="4"/>
      <text x="0" y="-10" class="sans" font-size="48" fill="#F4F4F0" text-anchor="middle">1,200T</text>
      <text x="0" y="30" class="mono" font-size="20" fill="#FFE500" text-anchor="middle">BOLLARD PULL</text>
      <text x="0" y="120" class="mono" font-size="18" fill="#00D8FF" text-anchor="middle">14 OCEAN TUGS COMBINED</text>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#F4F4F0">SALVAGE PHYSICS</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FFE500">30,000 M3 DREDGED SAND</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">+45CM SPRING TIDE BUOYANCY</text>
    <g transform="translate(120 620)">
      <rect width="640" height="150" rx="8" fill="#0E121E" stroke="#00D8FF" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#FFE500">DE-BALLASTING MASS</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">-9,000 TONS WATER</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#00D8FF">DAY 6: HULL UNLOCKED</text>
    </g>
  </g>`;

const drawGlobalMaritimeChokepoints = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Global Maritime Choke-Points -->
    <g transform="translate(1200 360)">
      <rect width="620" height="380" rx="10" fill="#0A0E18" stroke="#FF2E00" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="22" fill="#FFE500">GLOBAL CHOKE-POINT VULNERABILITY</text>
      <text x="40" y="120" class="mono" font-size="20" fill="#F4F4F0">• SUEZ: $9.6B / DAY (12% TRADE)</text>
      <text x="40" y="170" class="mono" font-size="20" fill="#F4F4F0">• MALACCA: 90,000 SHIPS / YR</text>
      <text x="40" y="220" class="mono" font-size="20" fill="#F4F4F0">• PANAMA: 36 TRANSITS / DAY</text>
      <text x="40" y="270" class="mono" font-size="20" fill="#FF2E00">• BAB-EL-MANDEB: 6.2M BBL OIL/D</text>
      <text x="40" y="330" class="mono" font-size="18" fill="#00D8FF">ZERO INVENTORY BUFFER MARGIN</text>
    </g>
    <text x="120" y="320" class="sans" font-size="92" fill="#F4F4F0">$9.6 BILLION</text>
    <text x="125" y="400" class="mono" font-size="42" fill="#FF2E00">DAILY LOGISTICS LOSS</text>
    <text x="125" y="460" class="mono" font-size="28" fill="#F4F4F0" opacity="0.75">$54 BILLION FREIGHT TRAPPED</text>
    <g transform="translate(120 620)">
      <rect width="640" height="150" rx="8" fill="#0E121E" stroke="#FF2E00" stroke-width="2"/>
      <text x="30" y="45" class="mono" font-size="18" fill="#FFE500">SUPPLY CHAIN CONTAGION</text>
      <text x="30" y="90" class="sans" font-size="40" fill="#F4F4F0">+14 DAYS CAPE DETOUR</text>
      <text x="30" y="125" class="mono" font-size="18" fill="#FF2E00">RATES TRIPLED: $12,000 / FEU</text>
    </g>
  </g>`;

const drawMaritimeCommonsThesis = (beat: HslSceneBeat, index: number): string => `
  <g>
    <!-- Monumental Thesis Arc -->
    <path d="M 80 540 Q 400 260 960 260 T 1840 540" fill="none" stroke="url(#glow)" stroke-width="14" filter="url(#glowFilter)"/>
    <text x="960" y="440" class="sans" font-size="80" fill="#F4F4F0" text-anchor="middle">GLOBALIZATION IS A HYDRODYNAMIC CONDUIT</text>
    <text x="960" y="520" class="mono" font-size="36" fill="#FFE500" text-anchor="middle">240,000 TONS BALANCED IN 300-METER CANALS</text>
    <g transform="translate(660 660)">
      <rect width="600" height="120" rx="10" fill="#101424" stroke="#FFE500" stroke-width="3"/>
      <text x="300" y="48" class="mono" font-size="20" fill="#00D8FF" text-anchor="middle">HIDDEN SYSTEMS LAB</text>
      <text x="300" y="92" class="sans" font-size="32" fill="#F4F4F0" text-anchor="middle">SYSTEMS MOVE MODERN LIFE</text>
    </g>
  </g>`;

const megashipSceneSvg = (beat: HslSceneBeat, index: number): string => {
  const isDiagram = Boolean(beat.infographicArchetype);
  if (isDiagram) {
    const kind = megashipSceneKindForBeat(beat, index);
    const body = {
      megaship_wake_5km: drawMegaShipWake5km,
      propeller_cavitation_10m: drawPropellerCavitation10m,
      bank_effect_hydrodynamics: drawBankEffectHydrodynamics,
      squat_effect_keel: drawSquatEffectKeel,
      ever_given_blockage: drawEverGivenBlockage,
      salvage_bollard_pull: drawSalvageBollardPull,
      global_maritime_chokepoints: drawGlobalMaritimeChokepoints,
      maritime_commons_thesis: drawMaritimeCommonsThesis
    }[kind](beat, index);

    return megashipSvgShell(beat, index, body, true);
  }

  return megashipSvgShell(beat, index, '', false);
};

const universalThemeSceneSvg = (beat: HslSceneBeat, index: number, base64Image?: string): string => {
  const seed = hashString(`${beat.beatId}:${beat.graphicHeadline}:${beat.telemetryLabel}`);
  const glowX = 240 + (seed % 1440);
  const glowY = 180 + ((seed >> 8) % 650);
  const isAlert = beat.actNumber >= 4 && beat.actNumber <= 5;
  const accent = isAlert ? '#FF2E00' : '#FFE500';
  const isDiagram = Boolean(beat.infographicArchetype);

  const headlineParts = beat.graphicHeadline ? beat.graphicHeadline.split(' ') : [];
  const primaryWord = esc(headlineParts.slice(0, Math.ceil(headlineParts.length / 2)).join(' ') || 'CRITICAL SYSTEM');
  const secondaryWord = esc(headlineParts.slice(Math.ceil(headlineParts.length / 2)).join(' ') || 'BOTTLENECK FLOW');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#0E121E"/>
      <stop offset="50%" stop-color="#080A12"/>
      <stop offset="100%" stop-color="#020306"/>
    </radialGradient>
    <linearGradient id="leftRightDark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.94' : '0.40'}"/>
      <stop offset="35%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.75' : '0.12'}"/>
      <stop offset="65%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.25' : '0.04'}"/>
      <stop offset="100%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.70' : '0.30'}"/>
    </linearGradient>
    <linearGradient id="topBottomDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#030408" stop-opacity="${isDiagram ? '0.88' : '0.30'}"/>
      <stop offset="22%" stop-color="#030408" stop-opacity="0.04"/>
      <stop offset="72%" stop-color="#030408" stop-opacity="${isDiagram ? '0.45' : '0.08'}"/>
      <stop offset="100%" stop-color="#030408" stop-opacity="${isDiagram ? '0.95' : '0.45'}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.4"/>
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="heavyShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.95"/>
    </filter>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#F4F4F0" stroke-opacity="0.03" stroke-width="1"/>
      <circle cx="80" cy="80" r="1.5" fill="${accent}" opacity="0.25"/>
    </pattern>
    <style>
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; }
      .sans { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
    </style>
  </defs>

  ${base64Image ? `<image href="data:image/jpeg;base64,${base64Image}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>` : `<rect width="1920" height="1080" fill="url(#bg)"/>`}
  <rect width="1920" height="1080" fill="url(#leftRightDark)"/>
  <rect width="1920" height="1080" fill="url(#topBottomDark)"/>

  ${isDiagram ? `
  <rect width="1920" height="1080" fill="url(#grid)"/>
  <circle cx="${glowX}" cy="${glowY}" r="450" fill="url(#glow)"/>

  <!-- Dynamic Typography & Telemetry only for Diagrams -->
  <g filter="url(#heavyShadow)">
    <text x="120" y="340" class="sans" font-size="96" fill="#F4F4F0">${primaryWord}</text>
    <text x="120" y="440" class="sans" font-size="96" fill="${accent}">${secondaryWord}</text>
  </g>

  <!-- Technical Telemetry Widget -->
  <g transform="translate(120 540)" filter="url(#heavyShadow)">
    <rect width="680" height="90" rx="8" fill="#0A0E18" fill-opacity="0.88" stroke="${accent}" stroke-width="2"/>
    <circle cx="36" cy="45" r="10" fill="${accent}"/>
    <text x="64" y="53" class="mono" font-size="24" fill="${accent}">${esc(beat.telemetryLabel || `${beat.stage} METRIC`)}</text>
  </g>

  <!-- Global HUD Borders -->
  <rect x="0" y="0" width="1920" height="1080" fill="none" stroke="${accent}" stroke-opacity="0.16" stroke-width="2"/>
  <text x="80" y="90" class="mono" font-size="20" fill="${accent}" letter-spacing="4">HSL // ACT 0${beat.actNumber} // ${esc(beat.stage.toUpperCase())}</text>
  <text x="1840" y="90" class="mono" font-size="20" fill="#F4F4F0" text-anchor="end" opacity="0.6">BEAT ${esc(beat.beatId)}</text>
  <line x1="80" y1="110" x2="1840" y2="110" stroke="#F4F4F0" stroke-opacity="0.12" stroke-width="1"/>
  <rect x="80" y="1000" width="14" height="14" fill="${accent}"/>
  <text x="110" y="1013" class="mono" font-size="18" fill="#F4F4F0">${esc(beat.telemetryLabel || `${beat.stage} METRIC`)}</text>
  ` : ''}
</svg>`;
};

// -----------------------------------------------------------------------------
// TAIPEI 101 TUNED MASS DAMPER SVG SCENE TEMPLATES (EPISODE 012)
// -----------------------------------------------------------------------------
const taipeiTmdSceneKindForBeat = (beat: HslSceneBeat, index: number): TaipeiTmdSceneKind => {
  const act = beat.actNumber;
  if (act === 1) return 'tmd_sphere_660t';
  if (act === 2) return 'suspension_cables_42mm';
  if (act === 3) return 'hydraulic_dampers_300bar';
  if (act === 4) return 'vortex_shedding_015hz';
  if (act === 5) return 'seismic_overstroke_limit';
  if (act === 6) return 'thermal_viscosity_silicone';
  if (act === 7) return 'megatall_resilience_blueprint';
  return 'anti_phase_master_thesis';
};

const getTaipeiTmdBaseImageBase64 = (actNumber: number): string => {
  const root = process.cwd();
  const candidatePaths = [
    path.resolve(root, 'public', 'images', 'taipei101_tmd', `act${actNumber}.jpg`),
    path.resolve(root, 'public', 'images', 'taipei101_tmd', `act${actNumber}.png`),
    path.resolve(root, 'runs', 'HSL_EPISODE_012_TAIPEI_TMD', 'images', `act${actNumber}.jpg`)
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p).toString('base64');
      } catch {}
    }
  }
  return '';
};

const taipeiTmdSvgShell = (beat: HslSceneBeat, index: number, body: string, isDiagram: boolean = false): string => {
  const seed = hashString(`${beat.beatId}:${beat.graphicHeadline}:${beat.telemetryLabel}`);
  const glowX = 240 + (seed % 1440);
  const glowY = 180 + ((seed >> 8) % 650);
  const isAlert = beat.actNumber >= 4 && beat.actNumber <= 5;
  const accent = isAlert ? '#FF2E00' : '#FFE500';
  const base64 = getTaipeiTmdBaseImageBase64(beat.actNumber);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <!-- Cinematic Chiaroscuro Overlay -->
    <linearGradient id="leftRightDark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.94' : '0.40'}"/>
      <stop offset="35%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.75' : '0.12'}"/>
      <stop offset="65%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.25' : '0.04'}"/>
      <stop offset="100%" stop-color="#05070D" stop-opacity="${isDiagram ? '0.70' : '0.30'}"/>
    </linearGradient>
    <linearGradient id="topBottomDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#030408" stop-opacity="${isDiagram ? '0.88' : '0.30'}"/>
      <stop offset="22%" stop-color="#030408" stop-opacity="0.04"/>
      <stop offset="72%" stop-color="#030408" stop-opacity="${isDiagram ? '0.45' : '0.08'}"/>
      <stop offset="100%" stop-color="#030408" stop-opacity="${isDiagram ? '0.95' : '0.45'}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.4"/>
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glowFilter" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="heavyShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.95"/>
    </filter>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#F4F4F0" stroke-opacity="0.03" stroke-width="1"/>
      <circle cx="80" cy="80" r="1.5" fill="${accent}" opacity="0.25"/>
    </pattern>
    <style>
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; }
      .sans { font-family: Impact, 'Arial Black', -apple-system, sans-serif; font-weight: 900; }
    </style>
  </defs>

  ${base64 ? `<image href="data:image/jpeg;base64,${base64}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>` : `<rect width="1920" height="1080" fill="#080A12"/>`}
  <rect width="1920" height="1080" fill="url(#leftRightDark)"/>
  <rect width="1920" height="1080" fill="url(#topBottomDark)"/>

  ${isDiagram ? `
  <rect width="1920" height="1080" fill="url(#grid)"/>
  <circle cx="${glowX}" cy="${glowY}" r="450" fill="url(#glow)"/>

  <!-- Technical Schematic & Infographic Layer -->
  ${body}

  <!-- Header Branding & Stage Progress -->
  <rect x="0" y="0" width="1920" height="1080" fill="none" stroke="${accent}" stroke-opacity="0.16" stroke-width="2"/>
  <text x="80" y="90" class="mono" font-size="20" fill="${accent}" letter-spacing="4">HSL // ACT 0${beat.actNumber} // ${esc(beat.stage.toUpperCase())}</text>
  <text x="1840" y="90" class="mono" font-size="20" fill="#F4F4F0" text-anchor="end" opacity="0.6">BEAT ${esc(beat.beatId)}</text>
  <line x1="80" y1="110" x2="1840" y2="110" stroke="#F4F4F0" stroke-opacity="0.12" stroke-width="1"/>

  <!-- Lower Left Telemetry HUD -->
  <g transform="translate(80 970)">
    <rect width="700" height="60" rx="6" fill="#0A0E18" fill-opacity="0.90" stroke="${accent}" stroke-width="2"/>
    <circle cx="25" cy="30" r="8" fill="${accent}"/>
    <text x="50" y="38" class="mono" font-size="20" fill="${accent}">${esc(beat.telemetryLabel || 'TAIPEI 101 TMD // 660,000 KG')}</text>
  </g>
  ` : ''}
</svg>`;
};

const drawTaipeiTmdSphere660t = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1080 240)">
      <rect width="720" height="580" rx="10" fill="#0E121E" stroke="#FFE500" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="24" fill="#FFE500">660-TON PENDULUM INERTIA GRID</text>
      <g transform="translate(40 100)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#F4F4F0">PENDULUM MASS: 660,000 KG (4X B747)</text>
      </g>
      <g transform="translate(40 210)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#FFE500">PEAK TOWER DEFLECTION: 1.5 METERS</text>
      </g>
      <g transform="translate(40 320)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#00D8FF">RESONANT SWAY REDUCTION: -42%</text>
      </g>
      <text x="40" y="470" class="sans" font-size="52" fill="#FFE500">508 METERS</text>
      <text x="40" y="520" class="mono" font-size="22" fill="#F4F4F0">88TH FLOOR SUSPENDED ATRIUM</text>
    </g>
    <text x="120" y="340" class="sans" font-size="96" fill="#F4F4F0">660 TONS</text>
    <text x="125" y="430" class="mono" font-size="44" fill="#FFE500">INERTIAL BALLAST</text>
    <text x="125" y="490" class="mono" font-size="28" fill="#F4F4F0" opacity="0.8">5.5M DIAMETER // 41 CONCENTRIC PLATES</text>
  </g>`;

const drawTaipeiSuspensionCables = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1080 240)">
      <rect width="720" height="580" rx="10" fill="#0E121E" stroke="#0038FF" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="24" fill="#00D8FF">8X 42MM BRAIDED STEEL MATRIX</text>
      <g transform="translate(40 100)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#FFE500">8X DUAL-INCH HIGH-TENSILE ROPES</text>
      </g>
      <g transform="translate(40 210)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#F4F4F0">SAFETY FACTOR: 4.2X MAXIMUM LOAD</text>
      </g>
      <g transform="translate(40 320)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#00D8FF">ANCHOR LEVEL: FLOOR 92 BOX GIRDERS</text>
      </g>
      <text x="40" y="470" class="sans" font-size="52" fill="#00D8FF">6.5 MN TENSION</text>
      <text x="40" y="520" class="mono" font-size="22" fill="#F4F4F0">TOTAL SUSPENSION CAPACITY</text>
    </g>
    <text x="120" y="340" class="sans" font-size="96" fill="#F4F4F0">8 CABLES</text>
    <text x="125" y="430" class="mono" font-size="44" fill="#00D8FF">COLD-DRAWN ALLOY</text>
    <text x="125" y="490" class="mono" font-size="28" fill="#F4F4F0" opacity="0.8">ZERO CABLE FATIGUE TOLERANCE</text>
  </g>`;

const drawTaipeiHydraulicDampers = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1080 240)">
      <rect width="720" height="580" rx="10" fill="#0E121E" stroke="#FFE500" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="24" fill="#FFE500">RADIAL HYDRAULIC DISSIPATION GRID</text>
      <g transform="translate(40 100)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#FFE500">8X VISCOUS DAMPERS (RADIAL ARRAY)</text>
      </g>
      <g transform="translate(40 210)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#F4F4F0">OPERATING PRESSURE: 300 BAR (4,350 PSI)</text>
      </g>
      <g transform="translate(40 320)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#00D8FF">DISSIPATION: KINETIC -> THERMAL FLUID</text>
      </g>
      <text x="40" y="470" class="sans" font-size="52" fill="#FFE500">F = C · V²</text>
      <text x="40" y="520" class="mono" font-size="22" fill="#F4F4F0">NON-LINEAR VELOCITY BRAKING</text>
    </g>
    <text x="120" y="340" class="sans" font-size="96" fill="#F4F4F0">300 BAR</text>
    <text x="125" y="430" class="mono" font-size="44" fill="#FFE500">HYDRAULIC BRAKE</text>
    <text x="125" y="490" class="mono" font-size="28" fill="#F4F4F0" opacity="0.8">8 RADIAL PISTONS UNDER SPHERE BASE</text>
  </g>`;

const drawTaipeiVortexShedding = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1080 240)">
      <rect width="720" height="580" rx="10" fill="#140808" stroke="#FF2E00" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="24" fill="#FF2E00">AERODYNAMIC RESONANCE TRAP</text>
      <g transform="translate(40 100)">
        <rect width="640" height="85" rx="6" fill="#200606"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#FFE500">VON KÁRMÁN VORTICES: 0.15 HZ</text>
      </g>
      <g transform="translate(40 210)">
        <rect width="640" height="85" rx="6" fill="#200606"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#FF2E00">CROSS-WIND SUCTION LOCK</text>
      </g>
      <g transform="translate(40 320)">
        <rect width="640" height="85" rx="6" fill="#200606"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#F4F4F0">PAGODA NOTCHED CORNERS: -25% DRAG</text>
      </g>
      <text x="40" y="470" class="sans" font-size="52" fill="#FF2E00">0.15 HZ LOCK</text>
      <text x="40" y="520" class="mono" font-size="22" fill="#F4F4F0">COUNTER-HARMONIC SUPPRESSION</text>
    </g>
    <text x="120" y="340" class="sans" font-size="96" fill="#FF2E00">VORTEX TRAP</text>
    <text x="125" y="430" class="mono" font-size="44" fill="#F4F4F0">250 KM/H CROSS-WIND</text>
    <text x="125" y="490" class="mono" font-size="28" fill="#FFE500" opacity="0.8">PERPENDICULAR SUCTION DESTROYED</text>
  </g>`;

const drawTaipeiSeismicOverstroke = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1080 240)">
      <rect width="720" height="580" rx="10" fill="#140808" stroke="#FF2E00" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="24" fill="#FF2E00">SEISMIC STRAIN &amp; FAIL-SAFE LIMIT</text>
      <g transform="translate(40 100)">
        <rect width="640" height="85" rx="6" fill="#200606"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#FFE500">RYUKYU TRENCH: M7.4 EARTHQUAKE</text>
      </g>
      <g transform="translate(40 210)">
        <rect width="640" height="85" rx="6" fill="#200606"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#FF2E00">3 KM/S GROUND SHOCKWAVE</text>
      </g>
      <g transform="translate(40 320)">
        <rect width="640" height="85" rx="6" fill="#200606"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#00D8FF">STAGE 2 THROTTLING: 300% BRAKE</text>
      </g>
      <text x="40" y="470" class="sans" font-size="52" fill="#FF2E00">1.5M BUMPER</text>
      <text x="40" y="520" class="mono" font-size="22" fill="#F4F4F0">ELASTOMERIC OVER-STROKE ARRESTOR</text>
    </g>
    <text x="120" y="340" class="sans" font-size="96" fill="#FF2E00">M7.4 QUAKE</text>
    <text x="125" y="430" class="mono" font-size="44" fill="#F4F4F0">ZERO DAMAGE</text>
    <text x="125" y="490" class="mono" font-size="28" fill="#FFE500" opacity="0.8">HISTORIC 1.0M SWAY IN TYPHOON SOUDELOR</text>
  </g>`;

const drawTaipeiThermalViscosity = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1080 240)">
      <rect width="720" height="580" rx="10" fill="#0E121E" stroke="#FFE500" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="24" fill="#FFE500">THERMODYNAMIC FLUID EQUILIBRIUM</text>
      <g transform="translate(40 100)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#FFE500">PDMS SILICONE: -40°C TO +200°C</text>
      </g>
      <g transform="translate(40 210)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#F4F4F0">14,000 STROKE CYCLES / 8H TYPHOON</text>
      </g>
      <g transform="translate(40 320)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#00D8FF">ALUMINUM CONVECTIVE COOLING FINS</text>
      </g>
      <text x="40" y="470" class="sans" font-size="52" fill="#FFE500">48.6 MJ</text>
      <text x="40" y="520" class="mono" font-size="22" fill="#F4F4F0">TOTAL STORM HEAT DISSIPATION</text>
    </g>
    <text x="120" y="340" class="sans" font-size="96" fill="#F4F4F0">SILICONE</text>
    <text x="125" y="430" class="mono" font-size="44" fill="#FFE500">THERMAL BUFFER</text>
    <text x="125" y="490" class="mono" font-size="28" fill="#F4F4F0" opacity="0.8">ZERO VISCOSITY DEGRADATION UNDER LOAD</text>
  </g>`;

const drawTaipeiMegatallResilience = (beat: HslSceneBeat, index: number): string => `
  <g>
    <g transform="translate(1080 240)">
      <rect width="720" height="580" rx="10" fill="#0E121E" stroke="#0038FF" stroke-width="3"/>
      <text x="40" y="60" class="mono" font-size="24" fill="#00D8FF">GLOBAL MEGATALL ADOPTION BLUEPRINT</text>
      <g transform="translate(40 100)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#FFE500">25 MAJOR GLOBAL FINANCIAL HUBS</text>
      </g>
      <g transform="translate(40 210)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#F4F4F0">-18,000 TONS CONCRETE SAVINGS</text>
      </g>
      <g transform="translate(40 320)">
        <rect width="640" height="85" rx="6" fill="#141B2D"/>
        <text x="25" y="52" class="mono" font-size="22" fill="#00D8FF">SLENDERNESS RATIO: 1:8 ASPECT</text>
      </g>
      <text x="40" y="470" class="sans" font-size="52" fill="#00D8FF">PACIFIC RIM</text>
      <text x="40" y="520" class="mono" font-size="22" fill="#F4F4F0">VERTICAL CIVILIZATION SURVIVAL</text>
    </g>
    <text x="120" y="340" class="sans" font-size="96" fill="#F4F4F0">VERTICAL</text>
    <text x="125" y="430" class="mono" font-size="44" fill="#00D8FF">CIVILIZATION</text>
    <text x="125" y="490" class="mono" font-size="28" fill="#F4F4F0" opacity="0.8">INERTIAL CONTROL REPLACES MASS</text>
  </g>`;

const drawTaipeiAntiPhaseThesis = (beat: HslSceneBeat, index: number): string => `
  <g>
    <path d="M 80 540 Q 400 260 960 260 T 1840 540" fill="none" stroke="#FFE500" stroke-width="12" filter="url(#glowFilter)"/>
    <text x="960" y="420" class="sans" font-size="80" fill="#F4F4F0" text-anchor="middle">SURVIVAL THROUGH ANTI-PHASE INERTIA</text>
    <text x="960" y="500" class="mono" font-size="34" fill="#FFE500" text-anchor="middle">NOT BRUTE RESISTANCE — A DANCE OF CONTRARY MASS</text>
    <g transform="translate(660 640)">
      <rect width="600" height="120" rx="10" fill="#101424" stroke="#FFE500" stroke-width="3"/>
      <text x="300" y="48" class="mono" font-size="20" fill="#00D8FF" text-anchor="middle">HIDDEN SYSTEMS LAB</text>
      <text x="300" y="92" class="sans" font-size="32" fill="#F4F4F0" text-anchor="middle">SYSTEMS MOVE MODERN LIFE</text>
    </g>
  </g>`;

const taipeiTmdSceneSvg = (beat: HslSceneBeat, index: number): string => {
  const isDiagram = Boolean(beat.infographicArchetype);
  if (isDiagram) {
    const kind = taipeiTmdSceneKindForBeat(beat, index);
    const body = {
      tmd_sphere_660t: drawTaipeiTmdSphere660t,
      suspension_cables_42mm: drawTaipeiSuspensionCables,
      hydraulic_dampers_300bar: drawTaipeiHydraulicDampers,
      vortex_shedding_015hz: drawTaipeiVortexShedding,
      seismic_overstroke_limit: drawTaipeiSeismicOverstroke,
      thermal_viscosity_silicone: drawTaipeiThermalViscosity,
      megatall_resilience_blueprint: drawTaipeiMegatallResilience,
      anti_phase_master_thesis: drawTaipeiAntiPhaseThesis
    }[kind](beat, index);

    return taipeiTmdSvgShell(beat, index, body, true);
  }

  return taipeiTmdSvgShell(beat, index, '', false);
};

export class HslImageFrameEngine {
  public static async generateFramesForEpisode(
    episodeId: string,
    beats: readonly HslSceneBeat[]
  ): Promise<ImageFrameEngineResult> {
    if (TAIPEI_TMD_ID_PATTERN.test(episodeId)) {
      return this.generateTaipeiTmdFrames(episodeId, beats);
    }

    if (MEGASHIP_ID_PATTERN.test(episodeId)) {
      return this.generateMegaShipFrames(episodeId, beats);
    }

    if (KESSLER_ID_PATTERN.test(episodeId)) {
      return this.generateKesslerSpaceFrames(episodeId, beats);
    }

    if (AI_COOLING_ID_PATTERN.test(episodeId)) {
      return this.generateAiCoolingFrames(episodeId, beats);
    }

    if (GRID_FREQUENCY_ID_PATTERN.test(episodeId)) {
      return this.generateGridFrequencyFrames(episodeId, beats);
    }

    return this.generateUniversalThemeFrames(episodeId, beats);
  }

  public static generateUniversalThemeFrames(
    episodeId: string,
    beats: readonly HslSceneBeat[]
  ): ImageFrameEngineResult {
    const root = process.cwd();
    const framesDir = path.resolve(root, 'public', 'runs', episodeId, 'frames');
    const localFramesDir = path.resolve(root, 'runs', episodeId, 'frames');
    const tempDir = path.resolve(root, 'runs', episodeId, 'temp-universal-svg-frames');
    fs.mkdirSync(framesDir, {recursive: true});
    fs.mkdirSync(localFramesDir, {recursive: true});
    fs.mkdirSync(tempDir, {recursive: true});

    console.log(`\n[HslImageFrameEngine] Gerando ${beats.length} frames 100% INÉDITOS e dedicados para ${episodeId} em: ${framesDir}`);

    const generatedFrames: string[] = [];
    const missingFrames: string[] = [];

    const episodeImagesDir = path.resolve(root, 'runs', episodeId, 'images');
    const dedicatedImages = fs.existsSync(episodeImagesDir)
      ? fs.readdirSync(episodeImagesDir).filter(f => (f.endsWith('.jpg') || f.endsWith('.png')) && !f.startsWith('.')).map(f => path.join(episodeImagesDir, f))
      : [];

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i];
      const targetFileName = `${beat.beatId}.png`;
      const targetFile = path.join(framesDir, targetFileName);
      const localTargetFile = path.join(localFramesDir, targetFileName);

      let base64Image = '';
      if (dedicatedImages.length > 0) {
        const matchingImg = dedicatedImages[(beat.actNumber - 1) % dedicatedImages.length];
        try {
          base64Image = fs.readFileSync(matchingImg).toString('base64');
        } catch {}
      }

      const svg = universalThemeSceneSvg(beat, i, base64Image);
      const svgPath = path.join(tempDir, `${beat.beatId}.svg`);
      fs.writeFileSync(svgPath, svg, 'utf8');

      try {
        const png = new Resvg(svg, {
          fitTo: {mode: 'width', value: 1920},
          font: { loadSystemFonts: true }
        }).render().asPng();
        fs.writeFileSync(targetFile, png);
      } catch (err: any) {
        missingFrames.push(`Beat #${i + 1} (${beat.beatId}): falha ao renderizar SVG para PNG: ${err.message}`);
        continue;
      }

      fs.copyFileSync(targetFile, localTargetFile);
      const errorCount = missingFrames.length;
      this.validateGeneratedFrame(targetFile, i, beat, missingFrames);
      if (missingFrames.length === errorCount) {
        generatedFrames.push(`runs/${episodeId}/frames/${targetFileName}`);
      }
    }

    if (missingFrames.length > 0) {
      throw new Error(
        `IMAGE_ENGINE_GATE_FATAL: Falha ao gerar ${missingFrames.length}/${beats.length} frames para ${episodeId}:\n${missingFrames.join('\n')}`
      );
    }

    return {
      totalGenerated: generatedFrames.length,
      outputDirectory: framesDir,
      generatedFrames
    };
  }

  public static generateKesslerSpaceFrames(
    episodeId: string,
    beats: readonly HslSceneBeat[]
  ): ImageFrameEngineResult {
    const root = process.cwd();
    const framesDir = path.resolve(root, 'public', 'runs', episodeId, 'frames');
    const localFramesDir = path.resolve(root, 'runs', episodeId, 'frames');
    const tempDir = path.resolve(root, 'runs', episodeId, 'temp-kessler-svg-frames');
    fs.mkdirSync(framesDir, {recursive: true});
    fs.mkdirSync(localFramesDir, {recursive: true});
    fs.mkdirSync(tempDir, {recursive: true});

    console.log(`\n[HslImageFrameEngine] Gerando 96 frames 100% INEDITOS para o episodio de Kessler Syndrome em: ${framesDir}`);

    const generatedFrames: string[] = [];
    const missingFrames: string[] = [];

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i];
      const targetFileName = `${beat.beatId}.png`;
      const targetFile = path.join(framesDir, targetFileName);
      const localTargetFile = path.join(localFramesDir, targetFileName);

      const svg = kesslerSceneSvg(beat, i);
      const svgPath = path.join(tempDir, `${beat.beatId}.svg`);
      fs.writeFileSync(svgPath, svg, 'utf8');

      try {
        const png = new Resvg(svg, {
          fitTo: {mode: 'width', value: 1920},
          font: {
            loadSystemFonts: true
          }
        }).render().asPng();
        fs.writeFileSync(targetFile, png);
      } catch (err: any) {
        missingFrames.push(`Beat #${i + 1} (${beat.beatId}): falha ao renderizar SVG para PNG: ${err.message}`);
        continue;
      }

      fs.copyFileSync(targetFile, localTargetFile);
      const errorCount = missingFrames.length;
      this.validateGeneratedFrame(targetFile, i, beat, missingFrames);
      if (missingFrames.length === errorCount) {
        generatedFrames.push(`runs/${episodeId}/frames/${targetFileName}`);
      }
    }

    if (missingFrames.length > 0) {
      throw new Error(
        `IMAGE_ENGINE_GATE_FATAL: Falha ao gerar ${missingFrames.length}/${beats.length} frames de Kessler Syndrome:\n${missingFrames.join('\n')}`
      );
    }

    console.log(`[HslImageFrameEngine] ${generatedFrames.length} frames 100% INEDITOS de Kessler Syndrome validados com sucesso.`);

    return {
      totalGenerated: generatedFrames.length,
      outputDirectory: framesDir,
      generatedFrames
    };
  }

  public static generateMegaShipFrames(
    episodeId: string,
    beats: readonly HslSceneBeat[]
  ): ImageFrameEngineResult {
    const root = process.cwd();
    const framesDir = path.resolve(root, 'public', 'runs', episodeId, 'frames');
    const localFramesDir = path.resolve(root, 'runs', episodeId, 'frames');
    const tempDir = path.resolve(root, 'runs', episodeId, 'temp-megaship-svg-frames');
    fs.mkdirSync(framesDir, {recursive: true});
    fs.mkdirSync(localFramesDir, {recursive: true});
    fs.mkdirSync(tempDir, {recursive: true});

    console.log(`\n[HslImageFrameEngine] Gerando 96 frames 100% INEDITOS para o episodio de Megaship Hydrodynamics em: ${framesDir}`);

    const generatedFrames: string[] = [];
    const missingFrames: string[] = [];

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i];
      const targetFileName = `${beat.beatId}.png`;
      const targetFile = path.join(framesDir, targetFileName);
      const localTargetFile = path.join(localFramesDir, targetFileName);

      const svg = megashipSceneSvg(beat, i);
      const svgPath = path.join(tempDir, `${beat.beatId}.svg`);
      fs.writeFileSync(svgPath, svg, 'utf8');

      try {
        const png = new Resvg(svg, {
          fitTo: {mode: 'width', value: 1920},
          font: {
            loadSystemFonts: true
          }
        }).render().asPng();
        fs.writeFileSync(targetFile, png);
      } catch (err: any) {
        missingFrames.push(`Beat #${i + 1} (${beat.beatId}): falha ao renderizar SVG para PNG: ${err.message}`);
        continue;
      }

      fs.copyFileSync(targetFile, localTargetFile);
      const errorCount = missingFrames.length;
      this.validateGeneratedFrame(targetFile, i, beat, missingFrames);
      if (missingFrames.length === errorCount) {
        generatedFrames.push(`runs/${episodeId}/frames/${targetFileName}`);
      }
    }

    if (missingFrames.length > 0) {
      throw new Error(
        `IMAGE_ENGINE_GATE_FATAL: Falha ao gerar ${missingFrames.length}/${beats.length} frames de Megaship Hydrodynamics:\n${missingFrames.join('\n')}`
      );
    }

    console.log(`[HslImageFrameEngine] ${generatedFrames.length} frames 100% INEDITOS de Megaship Hydrodynamics validados com sucesso.`);

    return {
      totalGenerated: generatedFrames.length,
      outputDirectory: framesDir,
      generatedFrames
    };
  }

  public static generateAiCoolingFrames(
    episodeId: string,
    beats: readonly HslSceneBeat[]
  ): ImageFrameEngineResult {
    const root = process.cwd();
    const framesDir = path.resolve(root, 'public', 'runs', episodeId, 'frames');
    const localFramesDir = path.resolve(root, 'runs', episodeId, 'frames');
    const tempDir = path.resolve(root, 'runs', episodeId, 'temp-aicooling-svg-frames');
    fs.mkdirSync(framesDir, {recursive: true});
    fs.mkdirSync(localFramesDir, {recursive: true});
    fs.mkdirSync(tempDir, {recursive: true});

    console.log(`\n[HslImageFrameEngine] Gerando 96 frames 100% INEDITOS para o episodio de AI Datacenter Cooling em: ${framesDir}`);

    const chatgptBotDir = path.resolve(root, 'chatgpt-image-bot', 'output');
    const botPhotos = fs.existsSync(chatgptBotDir)
      ? fs.readdirSync(chatgptBotDir)
          .filter(f => f.endsWith('.png') && !f.includes('manifest') && !f.includes('session') && !f.includes('dom_inspect') && !f.includes('login') && !f.includes('run_status') && !f.includes('gato'))
          .map(f => path.join(chatgptBotDir, f))
      : [];

    const generatedFrames: string[] = [];
    const missingFrames: string[] = [];

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i];
      const targetFileName = `${beat.beatId}.png`;
      const targetFile = path.join(framesDir, targetFileName);
      const localTargetFile = path.join(localFramesDir, targetFileName);

      const shouldUseBotPhoto = botPhotos.length > 0 && (i % 8 === 0 || i === 0);
      if (shouldUseBotPhoto) {
        const photo = botPhotos[Math.floor(i / 8) % botPhotos.length];
        fs.copyFileSync(photo, targetFile);
      } else {
        const svg = aiCoolingSceneSvg(beat, i);
        const svgPath = path.join(tempDir, `${beat.beatId}.svg`);
        fs.writeFileSync(svgPath, svg, 'utf8');

        try {
          const png = new Resvg(svg, {
            fitTo: {mode: 'width', value: 1920},
            font: {
              loadSystemFonts: true
            }
          }).render().asPng();
          fs.writeFileSync(targetFile, png);
        } catch (err: any) {
          missingFrames.push(`Beat #${i + 1} (${beat.beatId}): falha ao renderizar SVG para PNG: ${err.message}`);
          continue;
        }
      }

      fs.copyFileSync(targetFile, localTargetFile);
      const errorCount = missingFrames.length;
      this.validateGeneratedFrame(targetFile, i, beat, missingFrames);
      if (missingFrames.length === errorCount) {
        generatedFrames.push(`runs/${episodeId}/frames/${targetFileName}`);
      }
    }

    if (missingFrames.length > 0) {
      throw new Error(
        `IMAGE_ENGINE_GATE_FATAL: Falha ao gerar ${missingFrames.length}/${beats.length} frames de AI Cooling:\n${missingFrames.join('\n')}`
      );
    }

    console.log(`[HslImageFrameEngine] ${generatedFrames.length} frames 100% INEDITOS de AI Cooling validados com sucesso.`);

    return {
      totalGenerated: generatedFrames.length,
      outputDirectory: framesDir,
      generatedFrames
    };
  }

  public static generateGridFrequencyFrames(
    episodeId: string,
    beats: readonly HslSceneBeat[]
  ): ImageFrameEngineResult {
    const root = process.cwd();
    const framesDir = path.resolve(root, 'public', 'runs', episodeId, 'frames');
    const localFramesDir = path.resolve(root, 'runs', episodeId, 'frames');
    const tempDir = path.resolve(root, 'runs', episodeId, 'temp-grid-svg-frames');
    fs.mkdirSync(framesDir, {recursive: true});
    fs.mkdirSync(localFramesDir, {recursive: true});
    fs.mkdirSync(tempDir, {recursive: true});

    console.log(`\n[HslImageFrameEngine] Gerando 96 frames 100% INEDITOS para o episodio da Rede Eletrica em: ${framesDir}`);

    const chatgptBotDir = path.resolve(root, 'chatgpt-image-bot', 'output');
    const botPhotos = fs.existsSync(chatgptBotDir)
      ? fs.readdirSync(chatgptBotDir)
          .filter(f => f.endsWith('.png') && !f.includes('manifest') && !f.includes('session') && !f.includes('dom_inspect') && !f.includes('login') && !f.includes('run_status') && !f.includes('gato'))
          .map(f => path.join(chatgptBotDir, f))
      : [];

    const generatedFrames: string[] = [];
    const missingFrames: string[] = [];

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i];
      const targetFileName = `${beat.beatId}.png`;
      const targetFile = path.join(framesDir, targetFileName);
      const localTargetFile = path.join(localFramesDir, targetFileName);

      const shouldUseBotPhoto = botPhotos.length > 0 && (i % 8 === 0 || i === 0);
      if (shouldUseBotPhoto) {
        const photo = botPhotos[Math.floor(i / 8) % botPhotos.length];
        fs.copyFileSync(photo, targetFile);
      } else {
        const svg = gridSceneSvg(beat, i);
        const svgPath = path.join(tempDir, `${beat.beatId}.svg`);
        fs.writeFileSync(svgPath, svg, 'utf8');

        try {
          const png = new Resvg(svg, {
            fitTo: {mode: 'width', value: 1920},
            font: {
              loadSystemFonts: true
            }
          }).render().asPng();
          fs.writeFileSync(targetFile, png);
        } catch (err: any) {
          missingFrames.push(`Beat #${i + 1} (${beat.beatId}): falha ao renderizar SVG para PNG: ${err.message}`);
          continue;
        }
      }

      fs.copyFileSync(targetFile, localTargetFile);
      const errorCount = missingFrames.length;
      this.validateGeneratedFrame(targetFile, i, beat, missingFrames);
      if (missingFrames.length === errorCount) {
        generatedFrames.push(`runs/${episodeId}/frames/${targetFileName}`);
      }
    }

    if (missingFrames.length > 0) {
      throw new Error(
        `IMAGE_ENGINE_GATE_FATAL: Falha ao gerar ${missingFrames.length}/${beats.length} frames da Rede Eletrica:\n${missingFrames.join('\n')}`
      );
    }

    console.log(`[HslImageFrameEngine] ${generatedFrames.length} frames 100% INEDITOS da Rede Eletrica validados com sucesso.`);

    return {
      totalGenerated: generatedFrames.length,
      outputDirectory: framesDir,
      generatedFrames
    };
  }

  public static generateTaipeiTmdFrames(
    episodeId: string,
    beats: readonly HslSceneBeat[]
  ): ImageFrameEngineResult {
    const root = process.cwd();
    const framesDir = path.resolve(root, 'public', 'runs', episodeId, 'frames');
    const localFramesDir = path.resolve(root, 'runs', episodeId, 'frames');
    const tempDir = path.resolve(root, 'runs', episodeId, 'temp-taipei-svg-frames');
    fs.mkdirSync(framesDir, {recursive: true});
    fs.mkdirSync(localFramesDir, {recursive: true});
    fs.mkdirSync(tempDir, {recursive: true});

    console.log(`\n[HslImageFrameEngine] Gerando ${beats.length} frames 100% INEDITOS para o episodio de Taipei 101 TMD em: ${framesDir}`);

    const generatedFrames: string[] = [];
    const missingFrames: string[] = [];

    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i];
      const targetFileName = `${beat.beatId}.png`;
      const targetFile = path.join(framesDir, targetFileName);
      const localTargetFile = path.join(localFramesDir, targetFileName);

      const svg = taipeiTmdSceneSvg(beat, i);
      const svgPath = path.join(tempDir, `${beat.beatId}.svg`);
      fs.writeFileSync(svgPath, svg, 'utf8');

      try {
        const png = new Resvg(svg, {
          fitTo: {mode: 'width', value: 1920},
          font: {
            loadSystemFonts: true
          }
        }).render().asPng();
        fs.writeFileSync(targetFile, png);
      } catch (err: any) {
        missingFrames.push(`Beat #${i + 1} (${beat.beatId}): falha ao renderizar SVG para PNG: ${err.message}`);
        continue;
      }

      fs.copyFileSync(targetFile, localTargetFile);
      const errorCount = missingFrames.length;
      this.validateGeneratedFrame(targetFile, i, beat, missingFrames);
      if (missingFrames.length === errorCount) {
        generatedFrames.push(`runs/${episodeId}/frames/${targetFileName}`);
      }
    }

    if (missingFrames.length > 0) {
      throw new Error(
        `IMAGE_ENGINE_GATE_FATAL: Falha ao gerar ${missingFrames.length}/${beats.length} frames de Taipei 101 TMD:\n${missingFrames.join('\n')}`
      );
    }

    console.log(`[HslImageFrameEngine] ${generatedFrames.length} frames 100% INEDITOS de Taipei 101 TMD validados com sucesso.`);

    return {
      totalGenerated: generatedFrames.length,
      outputDirectory: framesDir,
      generatedFrames
    };
  }

  private static validateGeneratedFrame(
    targetFile: string,
    index: number,
    beat: HslSceneBeat,
    errors: string[]
  ): void {
    if (!fs.existsSync(targetFile)) {
      errors.push(`Beat #${index + 1} (${beat.beatId}): Arquivo nao foi criado no destino ${targetFile}`);
      return;
    }

    const stat = fs.statSync(targetFile);
    if (stat.size < 5000) {
      errors.push(`Beat #${index + 1} (${beat.beatId}): Arquivo PNG com tamanho insuficiente (${stat.size} bytes < 5KB) em ${targetFile}`);
      return;
    }

    if (!isValidPngFile(targetFile)) {
      errors.push(`Beat #${index + 1} (${beat.beatId}): Header PNG corrompido em ${targetFile}`);
    }
  }
}
