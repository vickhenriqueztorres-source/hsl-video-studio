import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import {HslSceneBeat} from '../../hsl/core/types';

export interface GridSceneVisualizerProps {
  beat: HslSceneBeat;
  durationInFrames: number;
  index: number;
}

const PALETTE = {
  bg: '#07080B',
  bgMatte: '#0D0E15',
  cardBg: '#12141F',
  cardBorder: '#23273A',
  yellow: '#FFE500',
  orange: '#FF2E00',
  blue: '#0044FF',
  blueCyan: '#00D2FF',
  white: '#F4F4F0',
  muted: '#8A90A6',
  green: '#00FF66'
};

export const HslGridFrequencySceneVisualizer: React.FC<GridSceneVisualizerProps> = ({
  beat,
  durationInFrames,
  index
}) => {
  const frame = useCurrentFrame();
  const act = beat.actNumber;
  const beatInAct = ((index) % 12) + 1;

  const isAlert = act === 4 || act === 5;
  const accent = isAlert ? PALETTE.orange : act === 6 ? PALETTE.blueCyan : PALETTE.yellow;

  // Spring animations
  const introSpring = spring({
    frame,
    fps: 30,
    config: {damping: 18, stiffness: 120, mass: 0.8}
  });

  const liveProgress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp'
  });

  // Calculate dynamic frequency value based on the narrative arc
  let freqValue = 60.000;
  if (act === 1) freqValue = 60.000 + Math.sin(frame * 0.08) * 0.015;
  else if (act === 2) freqValue = 60.000 + Math.cos(frame * 0.05) * 0.01;
  else if (act === 3) freqValue = 60.000 - liveProgress * 0.28; // Dropping 60.00 -> 59.72
  else if (act === 4) freqValue = 59.650 - liveProgress * 0.15; // 59.65 -> 59.50 limit
  else if (act === 5) freqValue = 59.500 - liveProgress * 0.45; // Crash down to 59.05 / 0 Hz
  else if (act === 6) freqValue = 59.100 + liveProgress * 0.75; // UFLS recovery -> 59.85 Hz
  else if (act === 7) freqValue = 59.850 + Math.sin(frame * 0.1) * 0.05; // Black start tuning
  else freqValue = 60.000 + Math.sin(frame * 0.05) * 0.005; // Stable 60.000 Hz

  return (
    <AbsoluteFill style={{backgroundColor: PALETTE.bg, overflow: 'hidden'}}>
      {/* 1. BACKGROUND TECHNICAL GRID & RADIAL GLOW */}
      <svg width="100%" height="100%" style={{position: 'absolute', top: 0, left: 0, opacity: 0.22}}>
        <defs>
          <pattern id={`grid-pattern-${index}`} width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke={PALETTE.cardBorder} strokeWidth="1" />
            <circle cx="80" cy="80" r="1.5" fill={accent} opacity="0.6" />
          </pattern>
          <radialGradient id={`glow-${index}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={accent} stopOpacity={isAlert ? 0.18 : 0.1} />
            <stop offset="100%" stopColor={PALETTE.bg} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-pattern-${index})`} />
        <rect width="100%" height="100%" fill={`url(#glow-${index})`} />
      </svg>

      {/* 2. TOP TELEMETRY STATUS BAR */}
      <div style={{
        position: 'absolute',
        top: 80,
        left: 80,
        right: 80,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${PALETTE.cardBorder}`,
        paddingBottom: 16,
        opacity: introSpring
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isAlert ? PALETTE.orange : PALETTE.green,
            boxShadow: `0 0 12px ${isAlert ? PALETTE.orange : PALETTE.green}`
          }} />
          <span style={{fontFamily: 'monospace', fontSize: 16, color: PALETTE.white, letterSpacing: '0.15em'}}>
            NODE: {beat.stage.toUpperCase()} // BEAT_{String(index + 1).padStart(3, '0')}
          </span>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 32}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
            <span style={{fontFamily: 'monospace', fontSize: 13, color: PALETTE.muted}}>SYSTEM FREQUENCY:</span>
            <span style={{fontFamily: 'monospace', fontSize: 24, fontWeight: 900, color: accent}}>
              {freqValue.toFixed(3)} Hz
            </span>
          </div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
            <span style={{fontFamily: 'monospace', fontSize: 13, color: PALETTE.muted}}>INERTIA BUFFER:</span>
            <span style={{fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: PALETTE.white}}>
              {act >= 5 ? '0.8s (CRITICAL)' : '3.8s (NORMAL)'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. CENTER DYNAMIC GRAPHIC STAGE (BESPOKE PER ACT) */}
      <div style={{
        position: 'absolute',
        top: 170,
        left: 80,
        right: 80,
        bottom: 140,
        display: 'flex',
        gap: 40,
        alignItems: 'center'
      }}>
        {/* LEFT COLUMN: HERO TECHNICAL VISUALIZATION */}
        <div style={{
          flex: 1.2,
          height: '100%',
          backgroundColor: PALETTE.cardBg,
          border: `1px solid ${PALETTE.cardBorder}`,
          borderRadius: 8,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          {/* ACT-SPECIFIC VISUALIZATION LOGIC */}
          {act === 1 && (
            <Act1OscilloscopeWaveform frame={frame} freqValue={freqValue} accent={accent} />
          )}
          {act === 2 && (
            <Act2SynchronousGeneratorCutaway frame={frame} accent={accent} />
          )}
          {act === 3 && (
            <Act3SwingEquationSim frame={frame} progress={liveProgress} accent={accent} />
          )}
          {act === 4 && (
            <Act4ResonanceStressDiagram frame={frame} isAlert={isAlert} accent={accent} />
          )}
          {act === 5 && (
            <Act5CascadingBlackoutMap frame={frame} progress={liveProgress} accent={accent} />
          )}
          {act === 6 && (
            <Act6UFLSDefenseLadder frame={frame} progress={liveProgress} accent={accent} />
          )}
          {act === 7 && (
            <Act7BlackStartRecoveryNetwork frame={frame} progress={liveProgress} accent={accent} />
          )}
          {act === 8 && (
            <Act8StandingWaveContinentalThesis frame={frame} accent={accent} />
          )}
        </div>

        {/* RIGHT COLUMN: TECHNICAL METRICS & MATHEMATICAL TELEMETRY */}
        <div style={{
          flex: 0.8,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 20
        }}>
          {/* Card 1: Primary Headline / Subject */}
          <div style={{
            backgroundColor: PALETTE.cardBg,
            border: `1px solid ${PALETTE.cardBorder}`,
            borderRadius: 8,
            padding: '24px 28px',
            position: 'relative'
          }}>
            <div style={{width: 32, height: 4, backgroundColor: accent, marginBottom: 12}} />
            <div style={{fontFamily: 'monospace', fontSize: 13, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase'}}>
              {beat.telemetryLabel || `${beat.stage} METRIC`}
            </div>
            <div style={{fontSize: 28, fontWeight: 900, color: PALETTE.white, lineHeight: 1.15, marginTop: 8}}>
              {beat.graphicHeadline || beat.voiceoverScript.slice(0, 45).toUpperCase()}
            </div>
          </div>

          {/* Card 2: Real-time Telemetry Data Box */}
          <div style={{
            flex: 1,
            backgroundColor: PALETTE.cardBg,
            border: `1px solid ${PALETTE.cardBorder}`,
            borderRadius: 8,
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${PALETTE.cardBorder}`, paddingBottom: 12}}>
              <span style={{fontFamily: 'monospace', fontSize: 13, color: PALETTE.muted}}>CONTINENTAL LOAD:</span>
              <span style={{fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: PALETTE.white}}>
                {Math.round(485000 + Math.sin(frame * 0.05) * 12000)} MW
              </span>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${PALETTE.cardBorder}`, paddingBottom: 12}}>
              <span style={{fontFamily: 'monospace', fontSize: 13, color: PALETTE.muted}}>ROCOF RATE:</span>
              <span style={{fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: isAlert ? PALETTE.orange : PALETTE.yellow}}>
                {isAlert ? '-0.245 Hz/s [CRITICAL]' : '-0.012 Hz/s [NOMINAL]'}
              </span>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${PALETTE.cardBorder}`, paddingBottom: 12}}>
              <span style={{fontFamily: 'monospace', fontSize: 13, color: PALETTE.muted}}>GRID INERTIA (H):</span>
              <span style={{fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: PALETTE.white}}>
                3.82 GW·s / GVA
              </span>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span style={{fontFamily: 'monospace', fontSize: 13, color: PALETTE.muted}}>SYNCHRONOUS PHASE:</span>
              <span style={{fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: PALETTE.blueCyan}}>
                Δθ = {(Math.sin(frame * 0.04) * 2.4).toFixed(2)}° ELEC
              </span>
            </div>
          </div>

          {/* Card 3: Takeaway Badge */}
          <div style={{
            backgroundColor: isAlert ? 'rgba(255,46,0,0.12)' : 'rgba(255,229,0,0.08)',
            border: `1px solid ${accent}`,
            borderRadius: 8,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{
              width: 10,
              height: 10,
              backgroundColor: accent,
              transform: `rotate(${frame * 4}deg)`
            }} />
            <span style={{fontSize: 14, fontWeight: 800, color: PALETTE.white, letterSpacing: '0.04em'}}>
              {act === 1 ? 'ZERO STORAGE // 100% INSTANTANEOUS BALANCE' :
               act === 2 ? '3,600 RPM MECHANICAL ROTATIONAL INERTIA' :
               act === 3 ? 'SWING EQUATION: DELTA P DRIVES FREQUENCY' :
               act === 4 ? '59.50 HZ HARMONIC BLADE RESONANCE TRIP' :
               act === 5 ? 'CASCADING DESYNCHRONIZATION IN < 10 SEC' :
               act === 6 ? '100MS LOAD SHEDDING ARRESTS COLLAPSE' :
               act === 7 ? '$10B/DAY DAMAGE // COMPLEX BLACK START' :
               'LIVE 60 HZ CONTINENTAL STANDING WAVE'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM NARRATIVE PROGRESS BAR */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 80,
        right: 80,
        height: 4,
        backgroundColor: PALETTE.cardBorder,
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${liveProgress * 100}%`,
          backgroundColor: accent
        }} />
      </div>
    </AbsoluteFill>
  );
};

/* --- PROCEDURAL ACT VISUALIZERS --- */

const Act1OscilloscopeWaveform: React.FC<{frame: number; freqValue: number; accent: string}> = ({frame, freqValue, accent}) => {
  const width = 800;
  const height = 400;
  const points: string[] = [];

  for (let x = 0; x <= width; x += 4) {
    const timeFactor = frame * 0.15;
    const waveFreq = 0.035 * (freqValue / 60);
    const y = height / 2 + Math.sin(x * waveFreq + timeFactor) * 90 + Math.sin(x * 0.08 + timeFactor * 1.5) * 12;
    points.push(`${x},${y}`);
  }

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* Grid Lines */}
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={PALETTE.cardBorder} strokeDasharray="4 4" />
      <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke={PALETTE.cardBorder} strokeDasharray="4 4" />

      {/* Glow path */}
      <polyline points={points.join(' ')} fill="none" stroke={accent} strokeWidth="6" opacity="0.3" filter="blur(4px)" />
      {/* Main Sine Wave */}
      <polyline points={points.join(' ')} fill="none" stroke={accent} strokeWidth="3" />

      {/* Waveform Telemetry Overlay */}
      <text x="30" y="50" fill={accent} fontFamily="monospace" fontSize="18" fontWeight="bold">
        CONTINENTAL VOLTAGE OSCILLATION // 60.000 HZ
      </text>
      <text x="30" y="80" fill={PALETTE.white} fontFamily="monospace" fontSize="14">
        V_PEAK: 765 kV // INSTANTANEOUS SINE WAVE
      </text>
    </svg>
  );
};

const Act2SynchronousGeneratorCutaway: React.FC<{frame: number; accent: string}> = ({frame, accent}) => {
  const angle = (frame * 6) % 360;
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 400">
      {/* Stator Outer Ring */}
      <circle cx="300" cy="200" r="140" fill="none" stroke={PALETTE.cardBorder} strokeWidth="24" />
      {/* Stator Windings (Klein Blue) */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <circle
          key={i}
          cx={300 + Math.cos(deg * Math.PI / 180) * 140}
          cy={200 + Math.sin(deg * Math.PI / 180) * 140}
          r="16"
          fill={PALETTE.blue}
          stroke={PALETTE.white}
          strokeWidth="2"
        />
      ))}

      {/* Rotor Rotating Core */}
      <g transform={`rotate(${angle} 300 200)`}>
        <rect x="260" y="110" width="80" height="180" rx="12" fill={accent} opacity="0.9" />
        <circle cx="300" cy="140" r="12" fill={PALETTE.bg} />
        <circle cx="300" cy="260" r="12" fill={PALETTE.bg} />
        <text x="290" y="146" fill={accent} fontWeight="bold" fontSize="16">N</text>
        <text x="292" y="266" fill={accent} fontWeight="bold" fontSize="16">S</text>
      </g>

      {/* Center Shaft */}
      <circle cx="300" cy="200" r="28" fill={PALETTE.white} />
      <circle cx="300" cy="200" r="14" fill={PALETTE.bg} />

      <text x="300" y="375" textAnchor="middle" fill={PALETTE.white} fontFamily="monospace" fontSize="16" fontWeight="bold">
        SYNCHRONOUS ROTOR // 3,600 RPM LOCKED SPEED
      </text>
    </svg>
  );
};

const Act3SwingEquationSim: React.FC<{frame: number; progress: number; accent: string}> = ({frame, progress, accent}) => {
  return (
    <div style={{width: '90%', height: '80%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 24}}>
      <div style={{fontFamily: 'monospace', fontSize: 26, fontWeight: 900, color: accent, letterSpacing: '0.08em'}}>
        J · (dω / dt) = T_mechanical - T_electrical
      </div>
      <div style={{width: '100%', display: 'flex', gap: 20, justifyContent: 'center'}}>
        <div style={{flex: 1, backgroundColor: PALETTE.bg, padding: 18, borderRadius: 6, border: `1px solid ${PALETTE.cardBorder}`}}>
          <div style={{fontSize: 12, fontFamily: 'monospace', color: PALETTE.muted}}>MECHANICAL POWER (P_m):</div>
          <div style={{fontSize: 22, fontWeight: 800, color: PALETTE.white, marginTop: 4}}>480,000 MW</div>
        </div>
        <div style={{flex: 1, backgroundColor: PALETTE.bg, padding: 18, borderRadius: 6, border: `1px solid ${PALETTE.orange}`}}>
          <div style={{fontSize: 12, fontFamily: 'monospace', color: PALETTE.orange}}>ELECTRICAL DEMAND (P_e):</div>
          <div style={{fontSize: 22, fontWeight: 800, color: PALETTE.orange, marginTop: 4}}>
            {(480000 + progress * 2400).toFixed(0)} MW
          </div>
        </div>
      </div>
      <div style={{fontSize: 15, fontFamily: 'monospace', color: PALETTE.white, textAlign: 'center'}}>
        IMBALANCE EXTRACTS KINETIC ENERGY DIRECTLY FROM ROTATING MASS
      </div>
    </div>
  );
};

const Act4ResonanceStressDiagram: React.FC<{frame: number; isAlert: boolean; accent: string}> = ({frame, isAlert, accent}) => {
  const vibration = Math.sin(frame * 0.8) * 12;
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 400">
      {/* 59.50 Hz Trip Line */}
      <line x1="50" y1="120" x2="550" y2="120" stroke={PALETTE.orange} strokeWidth="2" strokeDasharray="6 6" />
      <text x="460" y="110" fill={PALETTE.orange} fontFamily="monospace" fontSize="13" fontWeight="bold">
        59.50 HZ TRIP LIMIT
      </text>

      {/* Turbine Blade Profile */}
      <path
        d={`M 180 320 Q ${220 + vibration} 220, ${280 + vibration * 1.5} 130 Q 300 130, 310 160 Q 280 250, 240 320 Z`}
        fill={accent}
        opacity="0.85"
      />

      <text x="300" y="60" textAnchor="middle" fill={PALETTE.white} fontFamily="monospace" fontSize="18" fontWeight="bold">
        TITANIUM BLADE HARMONIC RESONANCE
      </text>
      <text x="300" y="370" textAnchor="middle" fill={PALETTE.muted} fontFamily="monospace" fontSize="14">
        STANDING ACOUSTIC WAVES INDUCE CYCLIC SHEAR FATIGUE
      </text>
    </svg>
  );
};

const Act5CascadingBlackoutMap: React.FC<{frame: number; progress: number; accent: string}> = ({frame, progress, accent}) => {
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 400">
      {/* Islanding Grid Rectangles */}
      {[
        {x: 60, y: 70, w: 220, h: 120, name: 'ISLAND A: 48.2 Hz (COLLAPSED)', dead: progress > 0.3},
        {x: 320, y: 70, w: 220, h: 120, name: 'ISLAND B: 52.1 Hz (TRIPPED)', dead: progress > 0.5},
        {x: 60, y: 220, w: 220, h: 120, name: 'ISLAND C: 0.0 Hz (BLACKOUT)', dead: progress > 0.7},
        {x: 320, y: 220, w: 220, h: 120, name: 'ISLAND D: 57.4 Hz (ISOLATED)', dead: progress > 0.2}
      ].map((isle, i) => (
        <g key={i}>
          <rect
            x={isle.x}
            y={isle.y}
            width={isle.w}
            height={isle.h}
            rx="6"
            fill={isle.dead ? 'rgba(255,46,0,0.15)' : PALETTE.bg}
            stroke={isle.dead ? PALETTE.orange : PALETTE.cardBorder}
            strokeWidth="2"
          />
          <text x={isle.x + 16} y={isle.y + 35} fill={isle.dead ? PALETTE.orange : PALETTE.white} fontFamily="monospace" fontSize="12" fontWeight="bold">
            {isle.name}
          </text>
        </g>
      ))}
      <text x="300" y="40" textAnchor="middle" fill={PALETTE.orange} fontFamily="monospace" fontSize="16" fontWeight="bold">
        CONTINENTAL GRID FRACTURE // ASYNCHRONOUS ISLANDING
      </text>
    </svg>
  );
};

const Act6UFLSDefenseLadder: React.FC<{frame: number; progress: number; accent: string}> = ({frame, progress, accent}) => {
  return (
    <div style={{width: '90%', height: '80%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around'}}>
      <div style={{fontSize: 18, fontFamily: 'monospace', fontWeight: 900, color: accent, textAlign: 'center'}}>
        UNDER-FREQUENCY LOAD SHEDDING (UFLS) TRIAGE LADDER
      </div>
      {[
        {stage: 'TIER 1 (59.3 Hz)', action: 'AUTOMATED 10% LOAD SHED (100ms)', active: progress > 0.2},
        {stage: 'TIER 2 (59.1 Hz)', action: 'BATTERY BESS SYNTHETIC INERTIA (16ms)', active: progress > 0.4},
        {stage: 'TIER 3 (58.8 Hz)', action: 'HYDROELECTRIC EMERGENCY GATE SURGE (10s)', active: progress > 0.6},
        {stage: 'TIER 4 (58.5 Hz)', action: 'AERODERIVATIVE GAS PEAKERS (5 MIN)', active: progress > 0.8}
      ].map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: item.active ? 'rgba(0,210,255,0.12)' : PALETTE.bg,
            border: `1px solid ${item.active ? PALETTE.blueCyan : PALETTE.cardBorder}`,
            padding: '12px 20px',
            borderRadius: 6
          }}
        >
          <span style={{fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: item.active ? PALETTE.blueCyan : PALETTE.muted}}>
            {item.stage}
          </span>
          <span style={{fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: PALETTE.white}}>
            {item.action}
          </span>
        </div>
      ))}
    </div>
  );
};

const Act7BlackStartRecoveryNetwork: React.FC<{frame: number; progress: number; accent: string}> = ({frame, progress, accent}) => {
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 400">
      {/* Step by step Black Start Nodes */}
      <circle cx="120" cy="200" r="30" fill={PALETTE.cardBg} stroke={PALETTE.yellow} strokeWidth="3" />
      <text x="120" y="205" textAnchor="middle" fill={PALETTE.yellow} fontFamily="monospace" fontSize="11" fontWeight="bold">DIESEL</text>

      <line x1="150" y1="200" x2="270" y2="200" stroke={PALETTE.yellow} strokeWidth="3" strokeDasharray="4 4" />

      <circle cx="300" cy="200" r="30" fill={PALETTE.cardBg} stroke={PALETTE.blueCyan} strokeWidth="3" />
      <text x="300" y="205" textAnchor="middle" fill={PALETTE.blueCyan} fontFamily="monospace" fontSize="11" fontWeight="bold">HYDRO</text>

      <line x1="330" y1="200" x2="450" y2="200" stroke={PALETTE.white} strokeWidth="3" strokeDasharray="4 4" />

      <circle cx="480" cy="200" r="30" fill={PALETTE.cardBg} stroke={PALETTE.white} strokeWidth="3" />
      <text x="480" y="205" textAnchor="middle" fill={PALETTE.white} fontFamily="monospace" fontSize="11" fontWeight="bold">THERMAL</text>

      <text x="300" y="80" textAnchor="middle" fill={PALETTE.white} fontFamily="monospace" fontSize="18" fontWeight="bold">
        BLACK START SYNCHRONIZATION CORRIDOR
      </text>
      <text x="300" y="320" textAnchor="middle" fill={PALETTE.muted} fontFamily="monospace" fontSize="14">
        REBUILDING THE CONTINENTAL WAVE SECTION BY SECTION
      </text>
    </svg>
  );
};

const Act8StandingWaveContinentalThesis: React.FC<{frame: number; accent: string}> = ({frame, accent}) => {
  return (
    <div style={{width: '90%', height: '80%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 24}}>
      <div style={{fontSize: 32, fontWeight: 900, color: PALETTE.white, textAlign: 'center', lineHeight: 1.2}}>
        THE GRID IS A LIVE STANDING WAVE
      </div>
      <div style={{fontSize: 20, fontFamily: 'monospace', fontWeight: 700, color: accent}}>
        60.000 HZ CONTINENTAL PULSE // ZERO STORAGE
      </div>
      <div style={{width: '60%', height: 2, backgroundColor: accent}} />
      <div style={{fontSize: 16, fontFamily: 'monospace', color: PALETTE.muted, textAlign: 'center'}}>
        HIDDEN SYSTEMS RULE THE WORLD // HIDDEN SYSTEMS LAB
      </div>
    </div>
  );
};
