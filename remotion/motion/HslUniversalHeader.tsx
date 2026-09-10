import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const HSL_HEADER_PALETTE = {
  obsidian: '#0D0E15',
  acidYellow: '#FFE500',
  kleinBlue: '#0038FF',
  hyperOrange: '#FF2E00',
  recoveryGreen: '#00FF85',
  text: '#F4F4F0',
  muted: '#8E92A8'
};

export const BRECHA_HEADER_PALETTE = {
  charcoal: '#0D0D0F',
  coral: '#FF5A47',
  teal: '#4F9B96',
  mint: '#BCD5C2',
  bone: '#E8E2D7',
  mineral: '#6E6B68'
};

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const FONT_SANS = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const FONT_HEAVY = 'system-ui, "Arial Black", "Inter", sans-serif';
const FONT_MONO = '"JetBrains Mono", "Courier New", Consolas, monospace';

export interface HslUniversalHeaderProps {
  readonly channelId?: 'hsl' | 'brecha';
  readonly episodeSubtitle?: string;
  readonly stageTitle?: string;
  readonly statusLabel?: string;
  readonly accentColor?: string;
}

/**
 * Top Global Header Canônico (Adaptativo a HSL ou BRECHA)
 */
export const HslUniversalHeader: React.FC<HslUniversalHeaderProps> = ({
  channelId = 'hsl',
  episodeSubtitle,
  stageTitle,
  statusLabel = 'TELEMETRY // ACTIVE',
  accentColor
}) => {
  const isBrecha = channelId === 'brecha';
  const defaultSubtitle = isBrecha
    ? 'CANAL BRECHA // INVESTIGAÇÃO FORENSE'
    : 'HIDDEN SYSTEMS LAB // DEEP INFRASTRUCTURE';
  const defaultStageTitle = isBrecha
    ? 'ATO 01 // SUPERFÍCIE DA NORMALIDADE'
    : 'ACT 01 // THE HOOK';
  const resolvedSubtitle = episodeSubtitle || defaultSubtitle;
  const resolvedStageTitle = stageTitle || defaultStageTitle;

  const defaultAccent = isBrecha ? BRECHA_HEADER_PALETTE.coral : HSL_HEADER_PALETTE.acidYellow;
  const activeAccent = accentColor || defaultAccent;

  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], clamp);

  const seconds = Math.floor(frame / 30);
  const minutes = Math.floor(seconds / 60);
  const timecode = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}:${String(frame % 30).padStart(2, '0')}`;

  const isAlert = resolvedStageTitle.includes('BOTTLENECK') || resolvedStageTitle.includes('LIMIT') ||
    resolvedStageTitle.includes('CRISIS') || resolvedStageTitle.includes('ANOMALIA') ||
    resolvedStageTitle.includes('BRECHA');
  const badgeBg = isBrecha
    ? (isAlert ? BRECHA_HEADER_PALETTE.coral : activeAccent)
    : (isAlert ? HSL_HEADER_PALETTE.hyperOrange : activeAccent);
  const badgeColor = isBrecha ? '#0D0D0F' : (isAlert ? '#FFF' : '#000');
  const badgeText = isBrecha ? 'BRECHA' : 'HSL DOCS';

  return (
    <div style={{
      position: 'absolute',
      top: 36,
      left: 56,
      right: 56,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      opacity,
      fontFamily: isBrecha ? '"Inter", sans-serif' : FONT_SANS,
      zIndex: 25,
      pointerEvents: 'none'
    }}>
      {/* Lado Esquerdo: Tag BRECHA / HSL DOCS + Subtítulo do Sistema */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          background: badgeBg,
          color: badgeColor,
          fontSize: 12,
          fontFamily: FONT_HEAVY,
          fontWeight: 900,
          padding: '4px 10px',
          borderRadius: 2,
          letterSpacing: '0.12em',
          boxShadow: `0 0 14px ${badgeBg}88`
        }}>
          {badgeText}
        </div>
        <div style={{
          color: isBrecha ? BRECHA_HEADER_PALETTE.bone : HSL_HEADER_PALETTE.text,
          fontSize: 14,
          fontFamily: isBrecha ? '"Inter", -apple-system, sans-serif' : FONT_SANS,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}>
          {resolvedSubtitle}
        </div>
      </div>

      {/* Lado Direito: Estágio / Ato + Timecode ao Vivo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          color: isBrecha ? BRECHA_HEADER_PALETTE.bone : HSL_HEADER_PALETTE.text,
          fontSize: 13,
          fontFamily: isBrecha ? '"Inter", sans-serif' : FONT_MONO,
          fontWeight: 700,
          letterSpacing: '0.1em',
          background: isBrecha ? 'rgba(13,13,15,0.85)' : 'rgba(13,14,21,0.75)',
          padding: '4px 12px',
          borderRadius: 3,
          border: isBrecha ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.12)'
        }}>
          {resolvedStageTitle}
        </div>

        <div style={{
          color: activeAccent,
          fontSize: 12,
          fontFamily: FONT_MONO,
          fontWeight: 700,
          letterSpacing: '0.12em'
        }}>
          [{timecode}]
        </div>
      </div>
    </div>
  );
};
