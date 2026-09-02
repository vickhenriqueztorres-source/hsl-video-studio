import React from 'react';
import {AbsoluteFill, Img} from 'remotion';

export interface HslThumbnailProps extends Record<string, unknown> {
  readonly variantId?: 'A' | 'B' | 'C';
  readonly baseImageSrc: string;
  readonly secondaryImageSrc?: string;
  readonly headlineLines: readonly string[];
  readonly badgeText?: string;
  readonly textSide?: 'LEFT' | 'RIGHT' | 'CENTER';
  readonly role?: 'MECHANISM' | 'CONSEQUENCE' | 'FINAL_HANDOFF';
  readonly accentColor?: string;
  readonly telemetryLabel?: string;
  readonly metricValue?: string;
  readonly leftLabel?: string;
  readonly rightLabel?: string;
  readonly episodeLabel?: string;
  readonly assetBaseUrl?: string;
}

const publicAssetSrc = (assetPath: string, assetBaseUrl?: string): string => {
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) return assetPath;
  const normalized = assetPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (assetBaseUrl) return `${assetBaseUrl.replace(/\/+$/, '')}/${normalized}`;
  return `/${normalized}`;
};

export const HslThumbnail: React.FC<HslThumbnailProps> = ({
  variantId = 'A',
  baseImageSrc,
  secondaryImageSrc,
  headlineLines = ['5 KM', 'TO BRAKE'],
  badgeText = 'HYDRODYNAMIC INERTIA // 5,200 METERS',
  textSide = 'LEFT',
  accentColor = '#FFE500',
  telemetryLabel = '240,000 TONS // 24,000 TEU // 8.2 GJ',
  metricValue = 'STOPPING DISTANCE: 5.2 KM',
  leftLabel = 'OPEN OCEAN // 22 KNOTS',
  rightLabel = 'CANAL FAIRWAY // 8-SEC LOCK',
  episodeLabel = 'HIDDEN SYSTEMS LAB // DOCUMENTARY',
  assetBaseUrl
}) => {
  const isLeft = textSide === 'LEFT';

  // ---------------------------------------------------------------------------
  // VARIANTE B: SPLIT SCREEN BEFORE vs AFTER
  // ---------------------------------------------------------------------------
  if (variantId === 'B' && secondaryImageSrc) {
    return (
      <AbsoluteFill style={{backgroundColor: '#07090E', overflow: 'hidden'}}>
        {/* Lado Esquerdo */}
        <div style={{position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', overflow: 'hidden'}}>
          <Img
            src={publicAssetSrc(baseImageSrc, assetBaseUrl)}
            style={{width: '200%', height: '100%', objectFit: 'cover', transform: 'translateX(0%)'}}
          />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,9,14,0.4) 0%, rgba(7,9,14,0.1) 40%, rgba(7,9,14,0.85) 100%)'}} />
          
          <div style={{
            position: 'absolute',
            top: 50,
            left: 50,
            backgroundColor: 'rgba(7,9,14,0.92)',
            borderLeft: '6px solid #00E5FF',
            padding: '10px 22px',
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            fontSize: 24,
            fontWeight: 800,
            color: '#00E5FF',
            letterSpacing: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
          }}>
            {leftLabel}
          </div>
        </div>

        {/* Lado Direito */}
        <div style={{position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', overflow: 'hidden'}}>
          <Img
            src={publicAssetSrc(secondaryImageSrc, assetBaseUrl)}
            style={{width: '200%', height: '100%', objectFit: 'cover', transform: 'translateX(-50%)'}}
          />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,46,0,0.2) 0%, rgba(7,9,14,0.1) 40%, rgba(7,9,14,0.88) 100%)'}} />
          
          <div style={{
            position: 'absolute',
            top: 50,
            right: 50,
            backgroundColor: 'rgba(255,46,0,0.95)',
            borderRight: '6px solid #F4F4F0',
            padding: '10px 22px',
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            fontSize: 24,
            fontWeight: 900,
            color: '#F4F4F0',
            letterSpacing: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
          }}>
            {rightLabel}
          </div>
        </div>

        {/* Divisória Laser Central */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: 6,
          transform: 'translateX(-50%)',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 0 25px 8px #FF2E00, 0 0 50px 16px #FFE500',
          zIndex: 20
        }} />

        {/* Tipografia Monumental Inferior Centralizada */}
        <div style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 30
        }}>
          {badgeText && (
            <div style={{
              backgroundColor: 'rgba(7,9,14,0.94)',
              padding: '8px 24px',
              borderRadius: 6,
              marginBottom: 12,
              border: `2px solid ${accentColor}`,
              fontFamily: '"JetBrains Mono", Consolas, monospace',
              fontSize: 26,
              fontWeight: 800,
              color: accentColor,
              letterSpacing: 3,
              boxShadow: '0 8px 30px rgba(0,0,0,0.9)'
            }}>
              {badgeText}
            </div>
          )}
          {headlineLines.map((line, idx) => (
            <div key={idx} style={{
              fontFamily: 'Impact, -apple-system, Arial Black, sans-serif',
              fontSize: 140,
              lineHeight: 0.9,
              fontWeight: 900,
              textTransform: 'uppercase',
              color: idx === headlineLines.length - 1 ? accentColor : '#FFFFFF',
              textShadow: '0 8px 32px rgba(0,0,0,0.98), 0 0 24px rgba(0,0,0,0.9)',
              letterSpacing: -1,
              backgroundColor: 'rgba(7,9,14,0.65)',
              padding: '0 20px',
              borderRadius: 4
            }}>
              {line}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANTE C: HERO CRISIS + RETÍCULA CIRCULAR TELEMETRY
  // ---------------------------------------------------------------------------
  if (variantId === 'C') {
    return (
      <AbsoluteFill style={{backgroundColor: '#07090E', overflow: 'hidden'}}>
        <Img
          src={publicAssetSrc(baseImageSrc, assetBaseUrl)}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
        
        {/* Vinheta Radial Cinematográfica */}
        <AbsoluteFill style={{
          background: 'radial-gradient(circle at 65% 50%, rgba(7,9,14,0.15) 0%, rgba(7,9,14,0.70) 65%, rgba(7,9,14,0.95) 100%)'
        }} />

        {/* Retícula Circular HUD */}
        <div style={{
          position: 'absolute',
          top: '42%',
          right: '25%',
          transform: 'translate(50%, -50%)',
          width: 420,
          height: 420,
          borderRadius: '50%',
          border: '3px dashed rgba(255,46,0,0.85)',
          boxShadow: '0 0 40px rgba(255,46,0,0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10
        }}>
          <div style={{width: 260, height: 260, borderRadius: '50%', border: '2px solid rgba(255,229,0,0.9)'}} />
          <div style={{position: 'absolute', width: 2, height: 480, backgroundColor: 'rgba(255,46,0,0.6)'}} />
          <div style={{position: 'absolute', width: 480, height: 2, backgroundColor: 'rgba(255,46,0,0.6)'}} />
          <div style={{
            position: 'absolute',
            bottom: -20,
            backgroundColor: '#FF2E00',
            color: '#FFFFFF',
            padding: '6px 16px',
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 2,
            boxShadow: '0 4px 16px rgba(0,0,0,0.8)'
          }}>
            {telemetryLabel}
          </div>
        </div>

        {/* Top Header Badge */}
        <div style={{
          position: 'absolute',
          top: 50,
          left: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          zIndex: 20
        }}>
          <div style={{width: 14, height: 14, backgroundColor: accentColor, borderRadius: '50%'}} />
          <div style={{
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            fontSize: 24,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: 3,
            backgroundColor: 'rgba(7,9,14,0.85)',
            padding: '6px 16px',
            borderRadius: 4
          }}>
            {episodeLabel}
          </div>
        </div>

        {/* Tipografia Monumental Inferior Esquerda */}
        <div style={{
          position: 'absolute',
          bottom: 60,
          left: 60,
          maxWidth: 900,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          zIndex: 20
        }}>
          {badgeText && (
            <div style={{
              backgroundColor: 'rgba(7,9,14,0.92)',
              borderLeft: `6px solid ${accentColor}`,
              padding: '6px 18px',
              marginBottom: 10,
              fontFamily: '"JetBrains Mono", Consolas, monospace',
              fontSize: 26,
              fontWeight: 900,
              color: accentColor,
              letterSpacing: 2
            }}>
              {badgeText}
            </div>
          )}
          {headlineLines.map((line, idx) => (
            <div key={idx} style={{
              fontFamily: 'Impact, -apple-system, Arial Black, sans-serif',
              fontSize: 145,
              lineHeight: 0.9,
              fontWeight: 900,
              textTransform: 'uppercase',
              color: idx === headlineLines.length - 1 ? '#FF2E00' : '#FFFFFF',
              textShadow: '0 12px 36px rgba(0,0,0,0.98)',
              letterSpacing: -1,
              backgroundColor: 'rgba(7,9,14,0.7)',
              padding: '0 16px',
              borderRadius: 4,
              marginBottom: 4
            }}>
              {line}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANTE A (DEFAULT): HERO SCALE + HIGH CONTRAST DOCUMENTARY
  // ---------------------------------------------------------------------------
  return (
    <AbsoluteFill style={{backgroundColor: '#07090E', overflow: 'hidden'}}>
      <Img
        src={publicAssetSrc(baseImageSrc, assetBaseUrl)}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
      
      {/* Vinheta Lateral Suave (Preserva o Navio/Imagem) */}
      <AbsoluteFill style={{
        background: isLeft
          ? 'linear-gradient(90deg, rgba(7,9,14,0.95) 0%, rgba(7,9,14,0.80) 38%, rgba(7,9,14,0.30) 65%, rgba(7,9,14,0.05) 100%)'
          : 'linear-gradient(270deg, rgba(7,9,14,0.95) 0%, rgba(7,9,14,0.80) 38%, rgba(7,9,14,0.30) 65%, rgba(7,9,14,0.05) 100%)'
      }} />

      {/* Retículas Técnicas nos Cantos */}
      <div style={{position: 'absolute', top: 35, left: 35, color: accentColor, fontFamily: 'monospace', fontSize: 22, fontWeight: 900}}>+</div>
      <div style={{position: 'absolute', top: 35, right: 35, color: accentColor, fontFamily: 'monospace', fontSize: 22, fontWeight: 900}}>+</div>
      <div style={{position: 'absolute', bottom: 35, left: 35, color: accentColor, fontFamily: 'monospace', fontSize: 22, fontWeight: 900}}>+</div>
      <div style={{position: 'absolute', bottom: 35, right: 35, color: accentColor, fontFamily: 'monospace', fontSize: 22, fontWeight: 900}}>+</div>

      {/* Caixa de Texto Principal com Tipografia Monumental */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: isLeft ? 70 : undefined,
        right: isLeft ? undefined : 70,
        width: 820,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: isLeft ? 'flex-start' : 'flex-end',
        textAlign: isLeft ? 'left' : 'right',
        zIndex: 20
      }}>
        {/* Top Episode Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          backgroundColor: 'rgba(7,9,14,0.90)',
          borderLeft: `5px solid ${accentColor}`,
          padding: '8px 18px',
          marginBottom: 18,
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.7)'
        }}>
          <div style={{width: 10, height: 10, backgroundColor: accentColor, borderRadius: '50%'}} />
          <span style={{
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            fontSize: 22,
            fontWeight: 800,
            color: accentColor,
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}>
            {badgeText}
          </span>
        </div>

        {/* Linhas de Headline Pop */}
        {headlineLines.map((line, index) => (
          <div
            key={`${line}-${index}`}
            style={{
              fontFamily: 'Impact, -apple-system, Arial Black, sans-serif',
              fontSize: 155,
              lineHeight: 0.90,
              fontWeight: 900,
              color: index === headlineLines.length - 1 ? accentColor : '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: -1,
              textShadow: '0 12px 40px rgba(0,0,0,0.98)',
              whiteSpace: 'nowrap',
              backgroundColor: 'rgba(7,9,14,0.65)',
              padding: '0 16px',
              borderRadius: 4,
              marginBottom: 6
            }}
          >
            {line}
          </div>
        ))}

        {/* Sub-Telemetria de Suporte */}
        {telemetryLabel && (
          <div style={{
            marginTop: 20,
            padding: '8px 18px',
            backgroundColor: 'rgba(7,9,14,0.90)',
            border: `1px solid ${accentColor}44`,
            borderRadius: 4,
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            fontSize: 20,
            fontWeight: 700,
            color: '#E0E5F0',
            letterSpacing: 2
          }}>
            {telemetryLabel}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
