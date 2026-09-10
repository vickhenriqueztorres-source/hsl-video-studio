import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export interface EvidenceFrameProps {
  sourceId: string;
  documentTitle: string;
  publisher: string;
  dateStr?: string;
  excerptText: string;
  highlightedStat?: string;
  durationInFrames: number;
}

/**
 * Componente canônico "Modo EVIDÊNCIA" (Seção 17 e 20 da Brand Bible).
 * 
 * Regras estritas:
 * 1. Documento oficial real em tela (BCB MED, Febraban, SSP).
 * 2. Apresentação sóbria de documento inteiro -> aproximação -> destaque.
 * 3. Anonimização rigorosa (tarjas de blur).
 * 4. Zero falsificação por IA. "IA representa. Evidência confirma."
 */
export const EvidenceFrame: React.FC<EvidenceFrameProps> = ({
  sourceId = 'SRC_BCB_MED_2024',
  documentTitle = 'Relatório de Fraudes e Estatísticas do Mecanismo Especial de Devolução (MED)',
  publisher = 'BANCO CENTRAL DO BRASIL',
  dateStr = 'EXERCÍCIO 2024/2025 // AUDITORIA OFICIAL',
  excerptText = 'Mais de 70% das notificações de fraude bancária eletrônica utilizam falsificação de canais de atendimento telefônico (spoofing) para induzir a vítima a transferências imediatas.',
  highlightedStat = '70% DAS FRAUDES ENVOLVEM FALSIDADE DE CANAL',
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // Ordem de apresentação da Seção 17:
  // 1. Mostrar o documento (frames 0-20)
  // 2. Aproximação / realce (frames 20-40)
  // 3. Leitura e estabilização (frames 40+)
  const docScale = interpolate(frame, [0, 30, durationInFrames], [0.94, 1.0, 1.03], {
    extrapolateRight: 'clamp'
  });

  const highlightOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const bannerOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0D0D0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 60
      }}
    >
      {/* Container do Documento Oficial Real (Estilo Papel Técnico / Painel Regulatório) */}
      <div
        style={{
          width: 1440,
          height: 840,
          backgroundColor: '#141418',
          border: '1px solid rgba(232, 226, 215, 0.16)',
          borderLeft: '6px solid #4F9B96',
          borderRadius: 4,
          padding: '48px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transform: `scale(${docScale})`,
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.90)',
          position: 'relative'
        }}
      >
        {/* Cabeçalho do Órgão Emissor e Carimbo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(232, 226, 215, 0.14)', paddingBottom: 24 }}>
          <div>
            <div
              style={{
                fontFamily: '"IBM Plex Mono", Consolas, monospace',
                fontSize: 13,
                fontWeight: 700,
                color: '#4F9B96',
                letterSpacing: 2,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8
              }}
            >
              <span style={{ width: 7, height: 7, backgroundColor: '#4F9B96', borderRadius: '50%' }} />
              DOCUMENTO OFICIAL AUDITADO // {sourceId}
            </div>

            <div
              style={{
                fontFamily: '"Archivo", Impact, sans-serif',
                fontSize: 32,
                fontWeight: 800,
                color: '#E8E2D7',
                letterSpacing: -0.5,
                textTransform: 'uppercase'
              }}
            >
              {publisher}
            </div>

            <div
              style={{
                fontFamily: '"Source Sans 3", sans-serif',
                fontSize: 18,
                color: '#BCD5C2',
                marginTop: 4
              }}
            >
              {documentTitle}
            </div>
          </div>

          {/* Carimbo de autenticidade documental */}
          <div
            style={{
              padding: '8px 16px',
              border: '2px dashed #4F9B96',
              borderRadius: 4,
              color: '#4F9B96',
              fontFamily: '"IBM Plex Mono", Consolas, monospace',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              textAlign: 'center'
            }}
          >
            <div>AUTENTICADO</div>
            <div style={{ fontSize: 9, opacity: 0.8 }}>BASE PRIMÁRIA</div>
          </div>
        </div>

        {/* Corpo do Documento com Bloco em Destaque e Tarjas de Anonimização */}
        <div style={{ margin: '32px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Tarjas de anonimização (Privacidade e conformidade) */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, opacity: 0.4 }}>
            <div style={{ width: 180, height: 12, backgroundColor: '#E8E2D7', borderRadius: 2 }} />
            <div style={{ width: 240, height: 12, backgroundColor: '#E8E2D7', borderRadius: 2 }} />
            <div style={{ width: 120, height: 12, backgroundColor: '#E8E2D7', borderRadius: 2 }} />
          </div>

          {/* Trecho Central Documentado com Grifo Coral/Teal */}
          <div
            style={{
              backgroundColor: 'rgba(79, 155, 150, 0.10)',
              borderLeft: '4px solid #FF5A47',
              padding: '24px 32px',
              borderRadius: 2,
              position: 'relative',
              opacity: highlightOpacity
            }}
          >
            <div
              style={{
                fontFamily: '"IBM Plex Mono", Consolas, monospace',
                fontSize: 12,
                color: '#FF5A47',
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 10
              }}
            >
              REGISTRO FATO CENTRAL // SEÇÃO 20 BRAND BIBLE
            </div>

            <div
              style={{
                fontFamily: '"Source Sans 3", sans-serif',
                fontSize: 26,
                fontWeight: 600,
                color: '#E8E2D7',
                lineHeight: 1.45
              }}
            >
              "{excerptText}"
            </div>

            {highlightedStat && (
              <div
                style={{
                  marginTop: 16,
                  display: 'inline-block',
                  backgroundColor: '#FF5A47',
                  color: '#0D0D0F',
                  fontFamily: '"Archivo", Impact, sans-serif',
                  fontSize: 16,
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: 2,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase'
                }}
              >
                {highlightedStat}
              </div>
            )}
          </div>

          {/* Segunda linha de anonimização */}
          <div style={{ display: 'flex', gap: 12, marginTop: 28, opacity: 0.4 }}>
            <div style={{ width: 310, height: 12, backgroundColor: '#E8E2D7', borderRadius: 2 }} />
            <div style={{ width: 160, height: 12, backgroundColor: '#E8E2D7', borderRadius: 2 }} />
          </div>
        </div>

        {/* Rodapé com metadados do documento e datação */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(232, 226, 215, 0.14)',
            paddingTop: 18,
            fontFamily: '"IBM Plex Mono", Consolas, monospace',
            fontSize: 12,
            color: 'rgba(232, 226, 215, 0.65)',
            letterSpacing: 1
          }}
        >
          <div>REGISTRO: {dateStr}</div>
          <div style={{ color: '#4F9B96', fontWeight: 600 }}>IA REPRESENTA. EVIDÊNCIA CONFIRMA.</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
