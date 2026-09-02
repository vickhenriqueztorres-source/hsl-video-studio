import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';

// ==============================================================================
// 🎨 PALETA OFICIAL HSL CINEMATIC INFOGRAPHIC
// ==============================================================================
export const HSL_PALETTE = {
  obsidian: '#07080B',
  darkCharcoal: '#0D0E15',
  surface: '#141622',
  surfaceBorder: '#2A2E45',
  acidYellow: '#FFE500',    // Amarelo elétrico padrão HSL
  kleinBlue: '#0038FF',     // Azul técnico
  cyanTelemetry: '#00D8FF', // Ciano de telemetria
  hyperOrange: '#FF2E00',   // Bottleneck e alertas
  white: '#FFFFFF',
  offWhite: '#F4F4F0',
  muted: '#8E92A8'
};

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const FONT_TITLE = '"Impact", "Bebas Neue", "Arial Black", sans-serif';
const FONT_SANS = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const FONT_MONO = '"JetBrains Mono", "Courier New", Consolas, monospace';

export type InfographicArchetype =
  | 'HERO_PIPELINE'       // Imagem 1: Aeronave/Máquina na pista molhada + Linha neon S-curve + Steps 01-05
  | 'BOTTLENECK_RADIAL'   // Imagem 2: Caminhões tanque + Ponto de estrangulamento + Setas divergentes + Placa de Atraso
  | 'SATELLITE_MAP'       // Imagem 3: Mapa esquemático escuro + Nós (Refinery/Terminal/Airport) + Linhas de fluxo
  | 'CUTAWAY_FLOW'        // Imagem 4: Tanques na superfície + Corte subterrâneo com tubos brilhantes
  | 'MACRO_TELEMETRY';    // Imagem 5: Bocal de combustível macro + Brackets [ ] + Gauge de Pressão 87%

export interface CinematicInfographicProps {
  readonly imageSrc: string;
  readonly headline: readonly [string, string]; // [Linha 1 Branca, Linha 2 Amarela]
  readonly archetype: InfographicArchetype;
  readonly accentColor?: string;
  readonly cameraMotion?: 'DOLLY_IN' | 'SLOW_PAN' | 'TILT_UP' | 'STATIC';
  readonly systemName?: string;
  readonly metricValue?: string | number;
  readonly metricLabel?: string;
  readonly steps?: readonly string[];
}

// ------------------------------------------------------------------------------
// 🎥 CAMERA 2.5D / KEN BURNS ENGINE
// ------------------------------------------------------------------------------
const CameraRig: React.FC<{
  imageSrc: string;
  motion: CinematicInfographicProps['cameraMotion'];
  children: React.ReactNode;
}> = ({imageSrc, motion = 'DOLLY_IN', children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Movimento de câmera cinematográfico super suave
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    ...clamp
  });

  let transform = 'scale(1.04)';
  if (motion === 'DOLLY_IN') {
    const scale = interpolate(progress, [0, 1], [1.0, 1.08]);
    const panY = interpolate(progress, [0, 1], [0, -15]);
    transform = `scale(${scale}) translateY(${panY}px)`;
  } else if (motion === 'SLOW_PAN') {
    const scale = interpolate(progress, [0, 1], [1.05, 1.07]);
    const panX = interpolate(progress, [0, 1], [-20, 20]);
    transform = `scale(${scale}) translateX(${panX}px)`;
  } else if (motion === 'TILT_UP') {
    const scale = interpolate(progress, [0, 1], [1.03, 1.07]);
    const panY = interpolate(progress, [0, 1], [25, -20]);
    transform = `scale(${scale}) translateY(${panY}px)`;
  }

  // Fade in / out da cena
  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    clamp
  );

  return (
    <AbsoluteFill style={{opacity, backgroundColor: HSL_PALETTE.obsidian, overflow: 'hidden'}}>
      {/* 🖼️ Base Image com Ken Burns */}
      <AbsoluteFill style={{transform, transformOrigin: 'center center'}}>
        <Img
          src={imageSrc.startsWith('http') || imageSrc.startsWith('/') || imageSrc.startsWith('blob:') ? imageSrc : staticFile(imageSrc.replace(/\\/g, '/').replace(/^public\//, '').replace(/^\/+/, ''))}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
        {/* Vinheta cinematográfica & gradiente escuro de leitura */}
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(7,8,11,0.15) 0%, rgba(7,8,11,0.65) 80%, rgba(7,8,11,0.92) 100%)'
          }}
        />
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(90deg, rgba(7,8,11,0.85) 0%, rgba(7,8,11,0.4) 35%, rgba(7,8,11,0) 65%)'
          }}
        />
      </AbsoluteFill>

      {/* 📐 Camada Interativa de Vetores & Remotion Overlays */}
      {children}

      {/* 🌌 Textura de Granulação e Ruído Cinematográfico */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.035,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)',
          backgroundSize: '4px 4px'
        }}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------
// 🔤 KINETIC DUAL-TONE TYPOGRAPHY (WHITE + ACID YELLOW)
// ------------------------------------------------------------------------------
const KineticHeadline: React.FC<{
  headline: readonly [string, string];
  accentColor: string;
}> = ({headline, accentColor}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Animação de impacto com física elástica (Spring)
  const introSpring1 = spring({
    frame: frame - 4,
    fps,
    config: {damping: 14, stiffness: 140, mass: 0.8}
  });

  const introSpring2 = spring({
    frame: frame - 10,
    fps,
    config: {damping: 13, stiffness: 130, mass: 0.8}
  });

  const barScale = interpolate(frame, [14, 30], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        bottom: 120,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        pointerEvents: 'none'
      }}
    >
      {/* Linha 1: Branco Monumental */}
      <div
        style={{
          fontFamily: FONT_TITLE,
          fontSize: 108,
          lineHeight: 0.88,
          color: HSL_PALETTE.white,
          letterSpacing: '0.01em',
          textTransform: 'uppercase',
          textShadow: '0 8px 30px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.8)',
          opacity: interpolate(introSpring1, [0, 1], [0, 1]),
          transform: `translateY(${(1 - introSpring1) * 35}px)`
        }}
      >
        {headline[0]}
      </div>

      {/* Linha 2: Amarelo Elétrico HSL */}
      <div
        style={{
          fontFamily: FONT_TITLE,
          fontSize: 108,
          lineHeight: 0.88,
          color: accentColor,
          letterSpacing: '0.01em',
          textTransform: 'uppercase',
          marginTop: 6,
          textShadow: `0 8px 30px rgba(0,0,0,0.95), 0 0 20px ${accentColor}44`,
          opacity: interpolate(introSpring2, [0, 1], [0, 1]),
          transform: `translateY(${(1 - introSpring2) * 35}px)`
        }}
      >
        {headline[1]}
      </div>

      {/* Barra de Sublinhado Gráfico */}
      <div
        style={{
          width: 90,
          height: 9,
          backgroundColor: accentColor,
          marginTop: 18,
          transformOrigin: 'left center',
          transform: `scaleX(${barScale})`,
          boxShadow: `0 0 16px ${accentColor}aa`
        }}
      />
    </div>
  );
};

// ------------------------------------------------------------------------------
// 1️⃣ OVERLAY ARQUÉTIPO 1: HERO PIPELINE & STEPS (Ex: Imagem do Avião)
// ------------------------------------------------------------------------------
const HeroPipelineOverlay: React.FC<{accentColor: string}> = ({accentColor}) => {
  const frame = useCurrentFrame();

  // Animação de traçado da linha neon no chão da pista
  const lineProgress = interpolate(frame, [10, 60], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...clamp
  });

  const stepIcons = ['◎', '⚡', '⚙', '🧭', '✓'];

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* Linha Neon Curva no Asfalto */}
      <svg
        width="1920"
        height="1080"
        style={{position: 'absolute', inset: 0, overflow: 'visible'}}
      >
        <defs>
          <filter id="neonGlowYellow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="20" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Arco Circular Dotted ao redor da máquina */}
        <circle
          cx="1040"
          cy="420"
          r="260"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <circle
          cx="1040"
          cy="420"
          r="260"
          fill="none"
          stroke={HSL_PALETTE.kleinBlue}
          strokeWidth="2.5"
          strokeDasharray="120 400"
          strokeDashoffset={-frame * 1.5}
        />

        {/* S-Curve Neon Line desenhando no chão */}
        <path
          d="M 1040 680 Q 1060 740 1200 750 T 1400 830 Q 1550 860 1920 900"
          fill="none"
          stroke={accentColor}
          strokeWidth="7"
          strokeLinecap="round"
          filter="url(#neonGlowYellow)"
          strokeDasharray="1200"
          strokeDashoffset={(1 - lineProgress) * 1200}
        />
      </svg>

      {/* Sequência de Passos Top-Right: 01, 02, 03, 04, 05 */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 90,
          display: 'flex',
          gap: 24,
          alignItems: 'center'
        }}
      >
        {stepIcons.map((icon, idx) => {
          const stepNumber = String(idx + 1).padStart(2, '0');
          const delay = 12 + idx * 8;
          const stepAnim = interpolate(frame, [delay, delay + 10], [0, 1], clamp);
          const isActive = idx === 0;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: stepAnim,
                transform: `translateY(${(1 - stepAnim) * 10}px)`
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: isActive ? accentColor : HSL_PALETTE.muted,
                  marginBottom: 8,
                  fontWeight: 700
                }}
              >
                {stepNumber}
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: `2px solid ${isActive ? accentColor : 'rgba(255,255,255,0.25)'}`,
                  background: isActive ? 'rgba(255,229,0,0.1)' : 'rgba(13,14,21,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? accentColor : HSL_PALETTE.offWhite,
                  fontSize: 18,
                  boxShadow: isActive ? `0 0 16px ${accentColor}66` : 'none'
                }}
              >
                {icon}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------
// 2️⃣ OVERLAY ARQUÉTIPO 2: BOTTLENECK & DEPARTURE DELAYS (Ex: Imagem dos Caminhões)
// ------------------------------------------------------------------------------
const BottleneckRadialOverlay: React.FC<{accentColor: string}> = ({accentColor}) => {
  const frame = useCurrentFrame();

  // Pulso do ponto de gargalo
  const pulse = Math.sin(frame * 0.12) * 0.15 + 1;
  const burstProgress = interpolate(frame, [15, 45], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp
  });

  const departures = [
    {tag: 'FUEL 01', delay: '+00:45'},
    {tag: 'FUEL 02', delay: '+01:15'},
    {tag: 'FUEL 03', delay: '+01:40'},
    {tag: 'FUEL 04', delay: '+02:20'},
    {tag: 'FUEL 05', delay: '+03:10'},
    {tag: 'FUEL 06', delay: '+03:55'}
  ];

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        {/* Centro de Estrangulamento - Radiação concêntrica */}
        <circle
          cx="980"
          cy="550"
          r={50 * pulse}
          fill="none"
          stroke={HSL_PALETTE.hyperOrange}
          strokeWidth="3"
          opacity="0.8"
        />
        <circle
          cx="980"
          cy="550"
          r={85 * pulse}
          fill="none"
          stroke={HSL_PALETTE.hyperOrange}
          strokeWidth="1.5"
          strokeDasharray="6 6"
          opacity="0.5"
        />

        {/* Setas Radiantes Amarelas Divergentes */}
        {[
          {x2: 1380, y2: 120},
          {x2: 1390, y2: 240},
          {x2: 1360, y2: 380},
          {x2: 1280, y2: 540},
          {x2: 1210, y2: 680},
          {x2: 1260, y2: 800},
          {x2: 1820, y2: 980}
        ].map((pt, i) => {
          const arrowDelay = 14 + i * 3;
          const anim = interpolate(frame, [arrowDelay, arrowDelay + 20], [0, 1], clamp);
          const curX = 980 + (pt.x2 - 980) * anim;
          const curY = 550 + (pt.y2 - 550) * anim;
          return (
            <g key={i}>
              <line
                x1="980"
                y1="550"
                x2={curX}
                y2={curY}
                stroke={accentColor}
                strokeWidth="3.5"
                strokeDasharray="8 4"
                opacity={anim}
              />
              {anim > 0.8 && (
                <circle cx={curX} cy={curY} r="4" fill={accentColor} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Tag de Alerta: [ BOTTLENECK ] */}
      <div
        style={{
          position: 'absolute',
          left: 915,
          top: 420,
          background: 'rgba(7,8,11,0.92)',
          border: `1px solid ${HSL_PALETTE.hyperOrange}`,
          padding: '6px 14px',
          fontFamily: FONT_MONO,
          fontSize: 13,
          fontWeight: 800,
          color: HSL_PALETTE.hyperOrange,
          letterSpacing: '0.12em',
          boxShadow: `0 0 18px ${HSL_PALETTE.hyperOrange}44`
        }}
      >
        BOTTLENECK
      </div>

      {/* Placa Digital de Atrasos no Canto Direito (Split-Flap Display) */}
      <div
        style={{
          position: 'absolute',
          right: 70,
          top: 240,
          width: 380,
          background: 'rgba(13,14,21,0.95)',
          border: `2px solid ${HSL_PALETTE.surfaceBorder}`,
          borderRadius: 8,
          padding: '20px 24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
          opacity: burstProgress,
          transform: `translateX(${(1 - burstProgress) * 30}px)`
        }}
      >
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 13,
            color: HSL_PALETTE.acidYellow,
            fontWeight: 800,
            letterSpacing: '0.12em',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span style={{color: HSL_PALETTE.hyperOrange}}>■</span> DELAYED DEPARTURE
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          {departures.map((d, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: FONT_MONO,
                fontSize: 20,
                fontWeight: 700,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: 6
              }}
            >
              <span style={{color: HSL_PALETTE.offWhite}}>{d.tag}</span>
              <span style={{color: HSL_PALETTE.hyperOrange, fontVariantNumeric: 'tabular-nums'}}>
                {d.delay}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------
// 3️⃣ OVERLAY ARQUÉTIPO 3: DARK TOPOGRAPHIC SATELLITE HUD MAP (Ex: Imagem do Mapa)
// ------------------------------------------------------------------------------
const SatelliteMapOverlay: React.FC<{accentColor: string}> = ({accentColor}) => {
  const frame = useCurrentFrame();

  const flowAnim = interpolate(frame, [8, 55], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp
  });

  const nodes = [
    {name: 'REFINERY', x: 310, y: 520},
    {name: 'TERMINAL', x: 950, y: 560},
    {name: 'AIRPORT', x: 1600, y: 510}
  ];

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* Rotas de Dutos Brilhantes Amarelo e Azul */}
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        {/* Rota Azul Superior Secundária */}
        <path
          d="M 310 520 C 550 280, 750 320, 950 560 C 1150 280, 1400 320, 1600 510"
          fill="none"
          stroke={HSL_PALETTE.cyanTelemetry}
          strokeWidth="5"
          opacity="0.85"
          strokeDasharray="2000"
          strokeDashoffset={(1 - flowAnim) * 2000}
        />

        {/* Rota Principal Amarela em S-Wave */}
        <path
          d="M 310 520 C 500 620, 750 620, 950 560 C 1150 620, 1400 680, 1600 510"
          fill="none"
          stroke={accentColor}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="2000"
          strokeDashoffset={(1 - flowAnim) * 2000}
        />
      </svg>

      {/* Labeled Nodes HUD com Radar Rings */}
      {nodes.map((node, i) => {
        const nodeReveal = interpolate(frame, [10 + i * 12, 22 + i * 12], [0, 1], clamp);
        const radarPulse = ((frame * 0.8 + i * 20) % 60) / 60;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, -50%)',
              opacity: nodeReveal
            }}
          >
            {/* Anel de Radar Pulsante */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 90 * radarPulse,
                height: 90 * radarPulse,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: `1.5px solid ${accentColor}`,
                opacity: 1 - radarPulse
              }}
            />

            {/* Ponto Central do Nó */}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}`,
                margin: '0 auto'
              }}
            />

            {/* Label do Nó */}
            <div
              style={{
                position: 'absolute',
                bottom: 30,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(7,8,11,0.95)',
                border: `1px solid ${accentColor}`,
                padding: '4px 12px',
                fontFamily: FONT_MONO,
                fontSize: 14,
                fontWeight: 800,
                color: HSL_PALETTE.white,
                whiteSpace: 'nowrap',
                letterSpacing: '0.1em'
              }}
            >
              [ {node.name} ]
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------
// 4️⃣ OVERLAY ARQUÉTIPO 4: SUBTERRANEAN INDUSTRIAL CUTAWAY (Ex: Imagem dos Tanques)
// ------------------------------------------------------------------------------
const CutawayFlowOverlay: React.FC<{accentColor: string}> = ({accentColor}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* Linha de Scanner de Corte Geológico */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 560,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${HSL_PALETTE.cyanTelemetry}, transparent)`,
          boxShadow: `0 0 12px ${HSL_PALETTE.cyanTelemetry}`
        }}
      />

      {/* Vetores de Fluxo Subterrâneo Pulsando */}
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        {/* Duto Central Elevador Subterrâneo */}
        <line
          x1="1040"
          y1="560"
          x2="1040"
          y2="920"
          stroke={HSL_PALETTE.cyanTelemetry}
          strokeWidth="6"
          strokeDasharray="12 6"
        />

        {/* Setas de fluxo amarelo subindo para os tanques */}
        <path
          d="M 1320 920 L 1320 580 L 1460 580"
          fill="none"
          stroke={accentColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------
// 5️⃣ OVERLAY ARQUÉTIPO 5: MACRO HARDWARE & LIVE PRESSURE GAUGE (Ex: Bocal 87%)
// ------------------------------------------------------------------------------
const MacroTelemetryOverlay: React.FC<{
  accentColor: string;
  metricValue?: string | number;
  metricLabel?: string;
}> = ({accentColor, metricValue = 87, metricLabel = 'PRESSURE'}) => {
  const frame = useCurrentFrame();
  const compactLabel = metricLabel.split('//')[0].trim().slice(0, 14).toUpperCase() || 'PRESSURE';

  const targetValue = typeof metricValue === 'number' ? metricValue : parseInt(String(metricValue), 10) || 87;
  const currentVal = Math.round(
    interpolate(frame, [5, 55], [0, targetValue], {
      easing: Easing.out(Easing.cubic),
      ...clamp
    })
  );

  // Brackets reticulares animados travando no bocal
  const bracketScale = interpolate(frame, [0, 18], [1.4, 1.0], {
    easing: Easing.out(Easing.back(1.5)),
    ...clamp
  });
  const bracketOpacity = interpolate(frame, [0, 12], [0, 1], clamp);

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* 🎯 Targeting Brackets [ ] ao redor do Bocal */}
      <div
        style={{
          position: 'absolute',
          left: 720,
          top: 310,
          width: 320,
          height: 320,
          transform: `scale(${bracketScale})`,
          opacity: bracketOpacity
        }}
      >
        {/* Cantos amarelos */}
        <div style={{position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderTop: `4px solid ${accentColor}`, borderLeft: `4px solid ${accentColor}`}} />
        <div style={{position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderTop: `4px solid ${accentColor}`, borderRight: `4px solid ${accentColor}`}} />
        <div style={{position: 'absolute', bottom: 0, left: 0, width: 28, height: 28, borderBottom: `4px solid ${accentColor}`, borderLeft: `4px solid ${accentColor}`}} />
        <div style={{position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderBottom: `4px solid ${accentColor}`, borderRight: `4px solid ${accentColor}`}} />
      </div>

      {/* 🎛️ Live Circular Arc Gauge */}
      <div
        style={{
          position: 'absolute',
          left: 1120,
          top: 310,
          background: 'rgba(13,14,21,0.92)',
          border: `1px solid ${HSL_PALETTE.surfaceBorder}`,
          borderRadius: 12,
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
        }}
      >
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 13,
            color: accentColor,
            fontWeight: 800,
            letterSpacing: '0.15em',
            marginBottom: 10
          }}
        >
          {compactLabel}
        </div>

        {/* SVG Arc Gauge */}
        <div style={{position: 'relative', width: 140, height: 90}}>
          <svg width="140" height="90" viewBox="0 0 140 90">
            {/* Trilho de fundo do arco */}
            <path
              d="M 15 75 A 55 55 0 0 1 125 75"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="4 6"
            />
            {/* Arco Ativo Amarelo com preenchimento progressivo */}
            <path
              d="M 15 75 A 55 55 0 0 1 125 75"
              fill="none"
              stroke={accentColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="180"
              strokeDashoffset={180 - (currentVal / 100) * 180}
            />
          </svg>
        </div>

        <div
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 52,
            lineHeight: 1,
            color: HSL_PALETTE.white,
            marginTop: 4,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {currentVal}<span style={{fontSize: 28, color: accentColor}}>%</span>
        </div>
      </div>

      {/* Indicador Vertical de Etapas 01..04 no canto esquerdo */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontFamily: FONT_MONO,
          fontSize: 13,
          fontWeight: 700
        }}
      >
        <div style={{color: HSL_PALETTE.muted}}>— 01</div>
        <div style={{color: HSL_PALETTE.muted}}>— 02</div>
        <div style={{color: HSL_PALETTE.muted}}>— 03</div>
        <div style={{color: accentColor, fontWeight: 900}}>▸ 04</div>
      </div>
    </AbsoluteFill>
  );
};

// ==============================================================================
// 🎬 COMPONENTE PRINCIPAL: CINEMATIC INFOGRAPHIC BEAT
// ==============================================================================
export const CinematicInfographic: React.FC<CinematicInfographicProps> = ({
  imageSrc,
  headline,
  archetype,
  accentColor = HSL_PALETTE.acidYellow,
  cameraMotion = 'DOLLY_IN',
  metricLabel,
  metricValue
}) => {
  return (
    <CameraRig imageSrc={imageSrc} motion={cameraMotion}>
      {/* 🔤 Tipografia Cinética Padrão Vox / Netflix */}
      <KineticHeadline headline={headline} accentColor={accentColor} />

      {/* 📐 Overlays Vetoriais Específicos por Arquétipo */}
      {archetype === 'HERO_PIPELINE' && <HeroPipelineOverlay accentColor={accentColor} />}
      {archetype === 'BOTTLENECK_RADIAL' && <BottleneckRadialOverlay accentColor={accentColor} />}
      {archetype === 'SATELLITE_MAP' && <SatelliteMapOverlay accentColor={accentColor} />}
      {archetype === 'CUTAWAY_FLOW' && <CutawayFlowOverlay accentColor={accentColor} />}
      {archetype === 'MACRO_TELEMETRY' && (
        <MacroTelemetryOverlay accentColor={accentColor} metricValue={metricValue} metricLabel={metricLabel} />
      )}
    </CameraRig>
  );
};
