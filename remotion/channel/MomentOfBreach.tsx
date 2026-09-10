import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export interface MomentOfBreachProps {
  durationInFrames: number;
  highlightLabel?: string;
  subtext?: string;
  fissurePosition?: { xPercent: number; yPercent: number; widthPercent: number; heightPercent: number };
}

/**
 * Componente canônico "Momento da Brecha" (Seção 14 e 17 da Brand Bible).
 * 
 * Regras estritas:
 * 1. Freeze-frame na decisão humana crítica (ponto cego da vítima).
 * 2. Fenda coral (#FF5A47) assimétrica contornando o alvo.
 * 3. PROIBIÇÃO ABSOLUTA de pulsos concêntricos, neon, sabre de luz ou brilhos mágicos.
 * 4. Narração de referência: "A brecha estava aqui."
 */
export const MomentOfBreach: React.FC<MomentOfBreachProps> = ({
  durationInFrames,
  highlightLabel = 'CONFIRMAR TRANSAÇÃO',
  subtext = 'A brecha estava aqui. O banco nunca liga solicitando senhas ou códigos.',
  fissurePosition = { xPercent: 50, yPercent: 58, widthPercent: 32, heightPercent: 14 }
}) => {
  const frame = useCurrentFrame();

  // Transição de entrada da fenda (timing em 30 fps: indício 6-10 frames, ruptura 10-16 frames)
  const fissureProgress = interpolate(frame, [4, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const overlayDarkness = interpolate(frame, [0, 12], [0, 0.58], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const textOpacity = interpolate(frame, [14, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const { xPercent, yPercent, widthPercent, heightPercent } = fissurePosition;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 20 }}>
      {/* Camada de escurecimento periférico (isolamento do ponto cego) */}
      <AbsoluteFill
        style={{
          backgroundColor: '#0D0D0F',
          opacity: overlayDarkness,
          transition: 'opacity 0.2s ease-out'
        }}
      />

      {/* A Fissura Coral Assimétrica (Seção 14: Física, afiada, angular, sem neon) */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
      >
        <defs>
          <clipPath id="breachCutout">
            <rect x="0" y="0" width="100%" height="100%" />
          </clipPath>
        </defs>

        {/* Retângulo de destaque do botão/campo com contorno rasgado coral */}
        <g opacity={fissureProgress}>
          {/* Fenda angular superior-esquerda */}
          <path
            d={`M ${xPercent - widthPercent / 2 - 2}% ${yPercent - heightPercent / 2 - 2}% 
               L ${xPercent + widthPercent / 2 + 1}% ${yPercent - heightPercent / 2 - 3}% 
               L ${xPercent + widthPercent / 2 + 2}% ${yPercent + heightPercent / 2 + 2}% 
               L ${xPercent - widthPercent / 2 - 1}% ${yPercent + heightPercent / 2 + 1}% Z`}
            fill="none"
            stroke="#FF5A47"
            strokeWidth="3"
            strokeLinejoin="miter"
            strokeMiterlimit="4"
          />

          {/* Micro-fissuras assimétricas nos vértices (assinatura física de rasgo) */}
          <line
            x1={`${xPercent - widthPercent / 2 - 2}%`}
            y1={`${yPercent - heightPercent / 2 - 2}%`}
            x2={`${xPercent - widthPercent / 2 - 5}%`}
            y2={`${yPercent - heightPercent / 2 - 6}%`}
            stroke="#FF5A47"
            strokeWidth="2"
          />
          <line
            x1={`${xPercent + widthPercent / 2 + 1}%`}
            y1={`${yPercent - heightPercent / 2 - 3}%`}
            x2={`${xPercent + widthPercent / 2 + 6}%`}
            y2={`${yPercent - heightPercent / 2 - 1}%`}
            stroke="#FF5A47"
            strokeWidth="2"
          />
          <line
            x1={`${xPercent + widthPercent / 2 + 2}%`}
            y1={`${yPercent + heightPercent / 2 + 2}%`}
            x2={`${xPercent + widthPercent / 2 + 4}%`}
            y2={`${yPercent + heightPercent / 2 + 7}%`}
            stroke="#FF5A47"
            strokeWidth="2"
          />
          <line
            x1={`${xPercent - widthPercent / 2 - 1}%`}
            y1={`${yPercent + heightPercent / 2 + 1}%`}
            x2={`${xPercent - widthPercent / 2 - 6}%`}
            y2={`${yPercent + heightPercent / 2 + 4}%`}
            stroke="#FF5A47"
            strokeWidth="2"
          />
        </g>
      </svg>

      {/* Cartão explicativo sóbrio: "MOMENTO DA BRECHA" */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          opacity: textOpacity,
          backgroundColor: 'rgba(13, 13, 15, 0.94)',
          borderTop: '3px solid #FF5A47',
          padding: '14px 28px',
          borderRadius: 2,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85)',
          maxWidth: 820,
          textAlign: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: '"IBM Plex Mono", Consolas, monospace',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 2.5,
            color: '#FF5A47',
            textTransform: 'uppercase'
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              backgroundColor: '#FF5A47',
              borderRadius: '50%'
            }}
          />
          MOMENTO DA BRECHA // PONTO CEGO DA VÍTIMA
        </div>

        <div
          style={{
            fontFamily: '"Archivo", Impact, sans-serif',
            fontSize: 28,
            fontWeight: 800,
            color: '#E8E2D7',
            letterSpacing: -0.5,
            textTransform: 'uppercase'
          }}
        >
          {highlightLabel}
        </div>

        <div
          style={{
            fontFamily: '"Source Sans 3", sans-serif',
            fontSize: 16,
            fontWeight: 400,
            color: '#BCD5C2',
            lineHeight: 1.4,
            maxWidth: 680
          }}
        >
          {subtext}
        </div>
      </div>
    </AbsoluteFill>
  );
};
