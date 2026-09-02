import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {HslSceneBeat, HslLongFormProjectPlan} from '../hsl/core/types';
import {HslUniversalHeader} from './motion/HslUniversalHeader';
import {RemotionCinematicAudioBed} from './TestVideo1MinAudio';

export interface HslLongFormCompositionProps {
  readonly plan?: HslLongFormProjectPlan;
}

const isWallStreetLatencyPlan = (episodeId: string, subtitle?: string): boolean =>
  episodeId.toLowerCase().includes('wall_street') ||
  episodeId.toLowerCase().includes('latency') ||
  episodeId.toLowerCase().includes('hft') ||
  Boolean(subtitle && (
    subtitle.toLowerCase().includes('wall street') ||
    subtitle.toLowerCase().includes('latency') ||
    subtitle.toLowerCase().includes('high-frequency trading')
  ));

const resolveMediaSrc = (assetPath: string, assetBaseUrl?: string): string => {
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) return assetPath;
  const clean = assetPath.replace(/\\/g, '/').replace(/^public\//, '').replace(/^\/+/, '');
  if (assetBaseUrl) {
    return `${assetBaseUrl.replace(/\/+$/, '')}/${clean}`;
  }
  return staticFile(clean);
};

const LatencySafeMotionOverlay: React.FC<{
  beat: HslSceneBeat;
  frame: number;
  durationInFrames: number;
  accentColor: string;
}> = ({beat, frame, durationInFrames, accentColor}) => {
  const reveal = interpolate(frame, [8, 24], [0, 1], {extrapolateRight: 'clamp'});
  const sweep = interpolate(frame, [0, durationInFrames], [-260, 2180], {extrapolateRight: 'clamp'});
  const pulse = Math.sin(frame * 0.12) * 0.18 + 0.82;
  const telemetry = (beat.telemetryLabel || `${beat.stage} // LATENCY`).split('//').slice(0, 2).join(' // ');

  return (
    <AbsoluteFill style={{pointerEvents: 'none', zIndex: 8, opacity: reveal}}>
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`latencyGlow-${beat.beatId}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line
          x1={sweep}
          y1="110"
          x2={sweep - 520}
          y2="1010"
          stroke={accentColor}
          strokeWidth="2"
          opacity="0.16"
        />
        <circle
          cx={beat.actNumber % 2 === 0 ? 1450 : 520}
          cy={beat.actNumber >= 5 ? 430 : 560}
          r={58 + pulse * 18}
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          strokeOpacity="0.42"
          filter={`url(#latencyGlow-${beat.beatId})`}
        />
        <circle
          cx={beat.actNumber % 2 === 0 ? 1450 : 520}
          cy={beat.actNumber >= 5 ? 430 : 560}
          r="6"
          fill={accentColor}
          opacity="0.82"
        />
        <path
          d={beat.actNumber % 2 === 0 ? 'M220 870 C610 765 920 835 1350 660' : 'M310 780 C720 565 1100 620 1620 350'}
          fill="none"
          stroke={accentColor}
          strokeWidth="4"
          strokeDasharray="18 18"
          strokeOpacity="0.26"
        />
      </svg>
      <div style={{
        position: 'absolute',
        left: 74,
        bottom: 62,
        maxWidth: 560,
        padding: '9px 14px',
        backgroundColor: 'rgba(7,8,11,0.72)',
        borderLeft: `4px solid ${accentColor}`,
        color: accentColor,
        fontFamily: '"JetBrains Mono", Consolas, monospace',
        fontSize: 15,
        fontWeight: 800,
        letterSpacing: 1.2,
        textTransform: 'uppercase'
      }}>
        {telemetry}
      </div>
    </AbsoluteFill>
  );
};

const MediaBeatLayer: React.FC<{
  beat: HslSceneBeat;
  durationInFrames: number;
  index: number;
  episodeId: string;
  subtitle?: string;
  assetBaseUrl?: string;
}> = ({beat, durationInFrames, index, episodeId, subtitle, assetBaseUrl}) => {
  const frame = useCurrentFrame();

  const isGridEpisode = episodeId.toLowerCase().includes('grid') ||
    episodeId.toLowerCase().includes('frequency') ||
    episodeId.toLowerCase().includes('hertz') ||
    episodeId.toLowerCase().includes('blackout') ||
    (subtitle && subtitle.toLowerCase().includes('hz'));
  const isWallStreetLatencyEpisode = isWallStreetLatencyPlan(episodeId, subtitle);
  const accentColor = beat.actNumber >= 4 && beat.actNumber <= 5 ? '#FF2E00' : '#FFE500';

  // 🎥 DYNAMIC CAMERA MATRIX BASEADA NO CAMERAMOVEMENT
  let scale = 1.0;
  let translateX = 0;
  let translateY = 0;

  switch (beat.cameraMovement) {
    case 'SLOW_DOLLY_IN':
      scale = interpolate(frame, [0, durationInFrames], [1.0, 1.09], {extrapolateRight: 'clamp'});
      break;
    case 'ZOOM_OUT_REVEAL':
      scale = interpolate(frame, [0, durationInFrames], [1.12, 1.0], {extrapolateRight: 'clamp'});
      break;
    case 'SLOW_PAN_RIGHT':
      scale = 1.06;
      translateX = interpolate(frame, [0, durationInFrames], [-28, 28], {extrapolateRight: 'clamp'});
      break;
    case 'SLOW_PAN_LEFT':
      scale = 1.06;
      translateX = interpolate(frame, [0, durationInFrames], [28, -28], {extrapolateRight: 'clamp'});
      break;
    case 'CAMERA_DRIFT':
      scale = interpolate(frame, [0, durationInFrames], [1.02, 1.08], {extrapolateRight: 'clamp'});
      translateX = interpolate(frame, [0, durationInFrames], [index % 2 === 0 ? -18 : 18, index % 2 === 0 ? 18 : -18], {extrapolateRight: 'clamp'});
      translateY = interpolate(frame, [0, durationInFrames], [-10, 10], {extrapolateRight: 'clamp'});
      break;
    case 'FAST_WHIP_PAN':
      scale = interpolate(frame, [0, Math.min(18, durationInFrames)], [1.14, 1.04], {extrapolateRight: 'clamp'});
      translateX = interpolate(frame, [0, Math.min(18, durationInFrames)], [50, 0], {extrapolateRight: 'clamp'});
      break;
    case 'ISOMETRIC_GLIDE':
      scale = 1.08;
      translateX = interpolate(frame, [0, durationInFrames], [-35, 15], {extrapolateRight: 'clamp'});
      translateY = interpolate(frame, [0, durationInFrames], [15, -15], {extrapolateRight: 'clamp'});
      break;
    case 'PULSING_ORBIT':
      scale = interpolate(frame, [0, Math.max(1, durationInFrames / 2), durationInFrames], [1.02, 1.07, 1.03], {extrapolateRight: 'clamp'});
      translateX = interpolate(frame, [0, durationInFrames], [-15, 15], {extrapolateRight: 'clamp'});
      break;
    case 'LOCKED_TELEMETRY':
    default:
      scale = interpolate(frame, [0, durationInFrames], [1.0, 1.03], {extrapolateRight: 'clamp'});
      break;
  }

  // Defesa em profundidade: Validação estrita por visualMode
  if (beat.visualMode === 'firefly_video' && !beat.outputVideoPath) {
    throw new Error(`REMOTION_CONTRACT_ERROR: Beat #${index + 1} (${beat.beatId}) declarado como firefly_video sem outputVideoPath.`);
  }

  if (beat.visualMode === 'generated_image_35mm' && !beat.outputFramePath) {
    throw new Error(`REMOTION_CONTRACT_ERROR: Beat #${index + 1} (${beat.beatId}) declarado como generated_image_35mm sem outputFramePath.`);
  }

  const headlineParts = beat.graphicHeadline ? beat.graphicHeadline.split(' ') : [];
  const primaryWord = headlineParts.slice(0, Math.ceil(headlineParts.length / 2)).join(' ') || 'SYSTEM';
  const secondaryWord = headlineParts.slice(Math.ceil(headlineParts.length / 2)).join(' ') || 'FLOW';

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#0D0E15'}}>
      {/* 🎬 SEÇÃO 1: RENDERIZAÇÃO DO MODO VISUAL */}
      {beat.visualMode === 'firefly_video' ? (
        /* 🎥 VÍDEO DE MOVIMENTO CONTÍNUO */
        <AbsoluteFill style={{transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`}}>
          <OffthreadVideo
            src={resolveMediaSrc(beat.outputVideoPath!, assetBaseUrl)}
            muted
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
          <AbsoluteFill style={{
            background: 'radial-gradient(circle at center, rgba(13,14,21,0.05) 0%, rgba(13,14,21,0.50) 100%)'
          }} />
        </AbsoluteFill>
      ) : (
        /* 🖼️ IMAGEM 35MM / FRAME SVG DE ALTA DEFINIÇÃO COM KEN BURNS */
        <AbsoluteFill style={{transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`}}>
          <Img
            src={resolveMediaSrc(beat.outputFramePath!, assetBaseUrl)}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
          <AbsoluteFill style={{
            background: 'radial-gradient(circle at center, rgba(13,14,21,0.08) 0%, rgba(13,14,21,0.60) 100%)'
          }} />
        </AbsoluteFill>
      )}

      {isWallStreetLatencyEpisode && (
        <LatencySafeMotionOverlay
          beat={beat}
          frame={frame}
          durationInFrames={durationInFrames}
          accentColor={accentColor}
        />
      )}

      {/* 🎯 CORNER HUD RETICLES (Estética Apple / Vox Technical) */}
      <div style={{position: 'absolute', top: 30, left: 30, color: 'rgba(255,229,0,0.4)', fontFamily: 'monospace', fontSize: 16}}>+</div>
      <div style={{position: 'absolute', top: 30, right: 30, color: 'rgba(255,229,0,0.4)', fontFamily: 'monospace', fontSize: 16}}>+</div>
      <div style={{position: 'absolute', bottom: 30, left: 30, color: 'rgba(255,229,0,0.4)', fontFamily: 'monospace', fontSize: 16}}>+</div>
      <div style={{position: 'absolute', bottom: 30, right: 30, color: 'rgba(255,229,0,0.4)', fontFamily: 'monospace', fontSize: 16}}>+</div>

      {/* 📐 UNIVERSAL TOP HUD HEADER (Adaptativo a qualquer tema) */}
      <HslUniversalHeader
        episodeSubtitle={subtitle || (
          (episodeId.toLowerCase().includes('megaship') || episodeId.toLowerCase().includes('ship') || episodeId.toLowerCase().includes('suez') || episodeId.toLowerCase().includes('240000'))
            ? 'THE 240,000-TON MONSTER THAT NEEDS 5 KM TO BRAKE // MEGASHIP HYDRODYNAMICS'
            : (episodeId.toLowerCase().includes('kessler') || episodeId.toLowerCase().includes('debris'))
            ? 'THE 28,000 KM/H PAINT FLECK // SATELLITE CASCADE'
            : 'HIDDEN SYSTEMS LAB // TECHNICAL DOCUMENTARY'
        )}
        stageTitle={`ACT 0${beat.actNumber} // ${beat.stage}`}
        accentColor={accentColor}
      />

      {/* ⚡ TIPOGRAFIA MONUMENTAL VOX / HSL (Exibida em cenas fotorrealistas sem texto embutido) */}
      {!beat.infographicArchetype && beat.visualMode !== 'motion_image_diagram' && beat.graphicHeadline && (
        <div style={{
          position: 'absolute',
          bottom: 110,
          left: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          opacity: interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'}),
          transform: `translateY(${interpolate(frame, [0, 15], [25, 0], {extrapolateRight: 'clamp'})}px)`,
          zIndex: 10
        }}>
          {primaryWord && (
            <div style={{
              fontFamily: 'Impact, Inter, -apple-system, Arial Black, sans-serif',
              fontWeight: 900,
              fontSize: 96,
              lineHeight: 0.9,
              color: '#F4F4F0',
              textTransform: 'uppercase',
              letterSpacing: -2,
              textShadow: '0 8px 32px rgba(0,0,0,0.95)'
            }}>
              {primaryWord}
            </div>
          )}
          {secondaryWord && (
            <div style={{
              fontFamily: 'Impact, Inter, -apple-system, Arial Black, sans-serif',
              fontWeight: 900,
              fontSize: 96,
              lineHeight: 0.9,
              color: beat.actNumber === 5 ? '#FF2E00' : '#FFE500',
              textTransform: 'uppercase',
              letterSpacing: -2,
              textShadow: '0 8px 32px rgba(0,0,0,0.95)'
            }}>
              {secondaryWord}
            </div>
          )}
          {beat.telemetryLabel && (
            <div style={{
              marginTop: 16,
              padding: '8px 16px',
              backgroundColor: 'rgba(7,8,11,0.90)',
              borderLeft: `4px solid ${beat.actNumber === 5 ? '#FF2E00' : '#FFE500'}`,
              borderRadius: 4,
              fontFamily: '"JetBrains Mono", Consolas, monospace',
              fontSize: 20,
              fontWeight: 700,
              color: beat.actNumber === 5 ? '#FF2E00' : '#FFE500',
              letterSpacing: 2,
              textTransform: 'uppercase',
              boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
            }}>
              {beat.telemetryLabel}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const HslLongFormComposition: React.FC<HslLongFormCompositionProps | any> = (props) => {
  // Prioriza props passados diretamente pela CLI (--props=scene-plan.json) onde beats está no topo
  let effectivePlan = (props?.beats && props.beats.length > 0)
    ? props
    : (props?.plan?.beats && props.plan.beats.length > 0)
    ? props.plan
    : undefined;

  if (!effectivePlan || !effectivePlan.beats || effectivePlan.beats.length === 0) {
    try {
      const fs = require('fs');
      const path = require('path');
      const candidateFiles = [
        path.resolve(process.cwd(), 'runs', 'HSL_EPISODE_004_JET_FUEL', 'scene-plan.json'),
        path.resolve(process.cwd(), 'runs', 'HSL_EPISODE_003_TRAFFIC', 'scene-plan.json'),
        path.resolve(process.cwd(), 'runs', 'HSL_EPISODE_001', 'scene-plan.json')
      ];
      for (const p of candidateFiles) {
        if (fs.existsSync(p)) {
          effectivePlan = JSON.parse(fs.readFileSync(p, 'utf8'));
          break;
        }
      }
    } catch {}
  }

  if (!effectivePlan || !effectivePlan.beats || effectivePlan.beats.length === 0) {
    throw new Error('REMOTION_CONTRACT_ERROR: HslLongFormComposition recebeu um plano vazio ou indefinido.');
  }

  const plan = effectivePlan;

  let accumulatedFrame = 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#07080B', color: '#E8ECF2'}}>
      {/* 🎬 DYNAMIC BEATS SEQUENCE (96+ BEATS OF VALIDATED MEDIA) */}
      {plan.beats.map((beat: HslSceneBeat, idx: number) => {
        const fromFrame = accumulatedFrame;
        accumulatedFrame += beat.durationFrames;

        return (
          <Sequence key={beat.beatId} from={fromFrame} durationInFrames={beat.durationFrames}>
            <MediaBeatLayer
              beat={beat}
              durationInFrames={beat.durationFrames}
              index={idx}
              episodeId={plan.episodeId}
              subtitle={plan.episodeTitle || 'AIRPORT JET FUEL LOGISTICS // 150 PSI MAIN'}
              assetBaseUrl={plan.assetBaseUrl}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
