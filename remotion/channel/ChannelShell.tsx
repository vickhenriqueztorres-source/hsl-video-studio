import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { ReconstructionLabel } from './ReconstructionLabel';
import { EvidenceCaption } from './EvidenceCaption';

export interface ChannelShellProps {
  channelId?: 'hsl' | 'brecha';
  isReconstruction?: boolean;
  evidenceRefs?: readonly string[];
  telemetryLabel?: string;
  durationInFrames: number;
  children: React.ReactNode;
}

export const ChannelShell: React.FC<ChannelShellProps> = ({
  channelId = 'hsl',
  isReconstruction,
  evidenceRefs,
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();

  const watermarkOpacity = interpolate(
    frame,
    [0, 15],
    [0, 0.7],
    { extrapolateRight: 'clamp' }
  );

  const isBrecha = channelId === 'brecha';

  return (
    <AbsoluteFill style={{ backgroundColor: isBrecha ? '#0D0D0F' : '#07080B' }}>
      {/* Underlying scene content */}
      {children}

      {/* Reconstruction Label (mandatory on reenactment scenes in BRECHA) */}
      {isBrecha && isReconstruction && (
        <ReconstructionLabel durationInFrames={durationInFrames} />
      )}

      {/* Evidence Source Caption (shown when evidenceRefs are attached) */}
      {isBrecha && evidenceRefs && evidenceRefs.length > 0 && (
        <EvidenceCaption evidenceRefs={evidenceRefs} durationInFrames={durationInFrames} />
      )}

      {/* Subtle Channel Watermark in Top-Right Corner */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          right: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          opacity: watermarkOpacity,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        {isBrecha ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                backgroundColor: '#FF5A47',
                borderRadius: '50%',
              }}
            />
            <span
              style={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: 3,
                color: '#E8E2D7',
                textTransform: 'uppercase',
              }}
            >
              BRECHA
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: '"JetBrains Mono", Consolas, monospace',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 2,
                color: '#FFE500',
              }}
            >
              HSL
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
