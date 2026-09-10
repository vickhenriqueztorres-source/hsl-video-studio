import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export interface ReconstructionLabelProps {
  label?: string;
  durationInFrames: number;
}

export const ReconstructionLabel: React.FC<ReconstructionLabelProps> = ({
  label = 'RECONSTITUIÇÃO ILUSTRATIVA',
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 36,
        left: 48,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        backgroundColor: 'rgba(13, 13, 15, 0.88)',
        border: '1px solid rgba(232, 226, 215, 0.35)',
        borderLeft: '4px solid #FF5A47',
        borderRadius: 3,
        color: '#E8E2D7',
        fontFamily: '"JetBrains Mono", Consolas, monospace',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        opacity,
        zIndex: 25,
        pointerEvents: 'none',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: '#FF5A47',
          display: 'inline-block',
        }}
      />
      {label}
    </div>
  );
};
