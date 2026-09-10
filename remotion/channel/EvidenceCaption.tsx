import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export interface EvidenceCaptionProps {
  evidenceRefs: readonly string[];
  durationInFrames: number;
}

const FRIENDLY_SOURCES: Record<string, string> = {
  SRC_BCB_MED_2024: 'Fonte: Banco Central do Brasil — Relatório de Fraudes (MED)',
  SRC_SSP_ESTELIONATO_2025: 'Fonte: Secretaria de Segurança Pública — Boletim de Crimes Digitais',
  SRC_ANATEL_PORTABILIDADE: 'Fonte: Anatel — Relatório Geral de Portabilidade Numérica',
  SRC_FEBRABAN_FRAUDES: 'Fonte: Febraban — Pesquisa de Segurança Bancária Digital',
};

export const EvidenceCaption: React.FC<EvidenceCaptionProps> = ({
  evidenceRefs,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  if (!evidenceRefs || evidenceRefs.length === 0) return null;

  const displayRef = evidenceRefs[0];
  const text = FRIENDLY_SOURCES[displayRef] || `Fonte Documentada: ${displayRef}`;

  const opacity = interpolate(
    frame,
    [10, 20, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: 48,
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        backgroundColor: 'rgba(13, 13, 15, 0.82)',
        borderLeft: '3px solid #4F9B96',
        borderRadius: 2,
        color: '#E8E2D7',
        fontFamily: '"JetBrains Mono", Consolas, monospace',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: 0.8,
        opacity,
        zIndex: 25,
        pointerEvents: 'none',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
      }}
    >
      {text}
    </div>
  );
};
