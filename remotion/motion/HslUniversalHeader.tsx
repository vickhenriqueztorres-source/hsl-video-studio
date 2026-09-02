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

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const FONT_SANS = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const FONT_HEAVY = 'system-ui, "Arial Black", "Inter", sans-serif';
const FONT_MONO = '"JetBrains Mono", "Courier New", Consolas, monospace';

export interface HslUniversalHeaderProps {
  readonly episodeSubtitle?: string;
  readonly stageTitle?: string;
  readonly statusLabel?: string;
  readonly accentColor?: string;
}

/**
 * Top Global Header Canônico HSL (Adaptativo a qualquer tema / documentário)
 */
export const HslUniversalHeader: React.FC<HslUniversalHeaderProps> = ({
  episodeSubtitle = 'HIDDEN SYSTEMS LAB // DEEP INFRASTRUCTURE',
  stageTitle = 'ACT 01 // THE HOOK',
  statusLabel = 'TELEMETRY // ACTIVE',
  accentColor = HSL_HEADER_PALETTE.acidYellow
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], clamp);

  const seconds = Math.floor(frame / 30);
  const minutes = Math.floor(seconds / 60);
  const timecode = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}:${String(frame % 30).padStart(2, '0')}`;

  const isAlert = stageTitle.includes('BOTTLENECK') || stageTitle.includes('LIMIT') || stageTitle.includes('CRISIS');
  const badgeBg = isAlert ? HSL_HEADER_PALETTE.hyperOrange : accentColor;
  const badgeColor = isAlert ? '#FFF' : '#000';

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
      fontFamily: FONT_SANS,
      zIndex: 25,
      pointerEvents: 'none'
    }}>
      {/* Lado Esquerdo: Tag HSL DOCS + Subtítulo do Sistema */}
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
          HSL DOCS
        </div>
        <div style={{
          color: HSL_HEADER_PALETTE.text,
          fontSize: 14,
          fontFamily: FONT_SANS,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}>
          {episodeSubtitle}
        </div>
      </div>

      {/* Lado Direito: Estágio / Ato + Timecode ao Vivo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          color: HSL_HEADER_PALETTE.text,
          fontSize: 13,
          fontFamily: FONT_MONO,
          fontWeight: 700,
          letterSpacing: '0.1em',
          background: 'rgba(13,14,21,0.75)',
          padding: '4px 12px',
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.12)'
        }}>
          {stageTitle}
        </div>

        <div style={{
          color: accentColor,
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
