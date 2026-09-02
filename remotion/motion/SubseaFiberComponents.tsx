import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';

export const SUBSEA_PALETTE = {
  obsidian: '#0D0E15',
  surface: '#141622',
  surface2: '#1C1F30',
  border: '#2A2E45',
  acidYellow: '#FFE500',   // Editorial focus, laser frequency, discovery
  kleinBlue: '#0038FF',    // Deep ocean, normal subsea fiber transmission
  hyperOrange: '#FF2E00',  // Cable sever, BGP overload, critical strain
  recoveryGreen: '#00FF85',// Optical amplifier, reroute path, repair ship
  text: '#F4F4F0',
  muted: '#8E92A8'
};

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const FONT_SANS = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const FONT_HEAVY = 'system-ui, "Arial Black", Impact, sans-serif';
const FONT_MONO = '"JetBrains Mono", "Courier New", Consolas, monospace';

// ------------------------------------------------------------------------------
// Top Global Header for Subsea Episode
// ------------------------------------------------------------------------------
export const HslSubseaHeader: React.FC<{stageTitle?: string}> = ({
  stageTitle = 'SUBSEA FIBER // PRESSURE TEST'
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], clamp);

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
      zIndex: 20
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{
          background: SUBSEA_PALETTE.acidYellow,
          color: '#000',
          fontSize: 12,
          fontFamily: FONT_HEAVY,
          padding: '4px 10px',
          letterSpacing: '0.12em'
        }}>
          HSL DOCS
        </div>
        <div style={{
          color: SUBSEA_PALETTE.text,
          fontSize: 15,
          fontFamily: FONT_SANS,
          fontWeight: 800,
          letterSpacing: '0.08em'
        }}>
          GLOBAL SUBSEA GRID // 6,000 MILES
        </div>
      </div>
      <div style={{
        color: SUBSEA_PALETTE.acidYellow,
        fontSize: 13,
        fontFamily: FONT_MONO,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase'
      }}>
        {stageTitle}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------
// 1. Bandwidth Capacity Graph Overlay (64% -> 94% Critical)
// ------------------------------------------------------------------------------
export const SubseaBandwidthOverlay: React.FC<{
  startPercent: number;
  endPercent: number;
  label?: string;
}> = ({startPercent, endPercent, label = 'BANDWIDTH LOAD'}) => {
  const frame = useCurrentFrame();
  const currentPct = Math.round(interpolate(frame, [0, 90], [startPercent, endPercent], clamp));

  const p1 = {x: 20, y: 130};
  const p2 = {x: 100, y: 110 - (startPercent * 0.4)};
  const p3 = {x: 220, y: 120 - (currentPct * 0.9)};

  const isCritical = currentPct >= 90;
  const accentColor = isCritical ? SUBSEA_PALETTE.hyperOrange : SUBSEA_PALETTE.acidYellow;

  return (
    <div style={{
      position: 'absolute',
      right: 70,
      bottom: 70,
      width: 360,
      padding: '22px 28px',
      background: 'rgba(13,14,21,0.92)',
      border: `1px solid ${SUBSEA_PALETTE.border}`,
      backdropFilter: 'blur(16px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
      fontFamily: FONT_SANS
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <div style={{color: SUBSEA_PALETTE.muted, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.1em'}}>
          {label}
        </div>
        <div style={{
          color: accentColor,
          fontSize: 60,
          fontFamily: FONT_HEAVY,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums'
        }}>
          {currentPct}%
        </div>
      </div>

      <svg width="300" height="80" style={{marginTop: 12, overflow: 'visible'}}>
        <path
          d={`M ${p1.x} ${p1.y} Q ${p2.x} ${p2.y} ${p3.x} ${p3.y}`}
          fill="none"
          stroke={accentColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx={p3.x} cy={p3.y} r="5" fill={accentColor} />
        <circle cx={p3.x} cy={p3.y} r="12" fill={accentColor} opacity="0.3" />
      </svg>
    </div>
  );
};

// ------------------------------------------------------------------------------
// 2. Optical Repeater Chain Graph (10,000V Power Loop + Light Pulse)
// ------------------------------------------------------------------------------
export const OpticalRepeaterGrid: React.FC = () => {
  const frame = useCurrentFrame();

  const nodes = [
    {id: 'SHORE A', type: 'LANDING', voltage: '10,000V DC', x: 240, y: 540},
    {id: 'REP 01', type: 'OPTICAL', voltage: '9,200V', x: 580, y: 540},
    {id: 'REP 02', type: 'OPTICAL', voltage: '8,400V', x: 920, y: 540},
    {id: 'REP 03', type: 'SEVER_POINT', voltage: '0V (DARK)', x: 1260, y: 540},
    {id: 'SHORE B', type: 'LANDING', voltage: 'GROUND', x: 1600, y: 540}
  ];

  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: FONT_SANS}}>
      <div style={{position: 'absolute', left: 70, top: 110}}>
        <div style={{color: SUBSEA_PALETTE.acidYellow, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.12em'}}>
          TRANSATLANTIC POWER FEED
        </div>
        <div style={{color: SUBSEA_PALETTE.text, fontSize: 40, fontFamily: FONT_HEAVY, marginTop: 4, letterSpacing: '0.04em'}}>
          10,000-VOLT CONSTANT CURRENT LOOP
        </div>
      </div>

      {/* Cable Connecting Wire */}
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        {nodes.slice(0, -1).map((n, i) => {
          const next = nodes[i + 1];
          const lineAnim = interpolate(frame, [i * 8, i * 8 + 18], [0, 1], clamp);
          const isSevered = next.type === 'SEVER_POINT';
          return (
            <line
              key={n.id}
              x1={n.x}
              y1={n.y}
              x2={n.x + (next.x - n.x) * lineAnim}
              y2={n.y}
              stroke={isSevered ? SUBSEA_PALETTE.hyperOrange : SUBSEA_PALETTE.kleinBlue}
              strokeWidth="5"
              strokeDasharray={isSevered ? '10 8' : 'none'}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => {
        const isSever = node.type === 'SEVER_POINT';
        const nodeAnim = spring({frame: frame - i * 6, fps: 30, config: {damping: 14}});
        const nodeColor = isSever ? SUBSEA_PALETTE.hyperOrange : SUBSEA_PALETTE.acidYellow;

        return (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              transform: `translate(-50%, -50%) scale(${nodeAnim})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div style={{
              width: 86,
              height: 86,
              borderRadius: '50%',
              background: isSever ? 'rgba(255,46,0,0.25)' : SUBSEA_PALETTE.surface2,
              border: `3px solid ${nodeColor}`,
              boxShadow: isSever ? `0 0 40px ${SUBSEA_PALETTE.hyperOrange}` : `0 0 20px ${SUBSEA_PALETTE.kleinBlue}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: SUBSEA_PALETTE.text,
              fontSize: 16,
              fontFamily: FONT_HEAVY,
              textAlign: 'center'
            }}>
              {node.id}
            </div>

            <div style={{
              marginTop: 16,
              background: 'rgba(13,14,21,0.94)',
              border: `1px solid ${nodeColor}`,
              padding: '6px 14px',
              color: nodeColor,
              fontSize: 14,
              fontFamily: FONT_MONO,
              fontWeight: 700
            }}>
              {node.voltage}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------------------
// 3. Anchor Sever Radar (Point of Physical Break at 4,000m Depth)
// ------------------------------------------------------------------------------
export const AnchorSeverRadar: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 30, [0, 15, 30], [1, 1.08, 1]);
  const reveal = interpolate(frame, [10, 30], [0, 1], clamp);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT_SANS
    }}>
      <div style={{position: 'absolute', left: 90, top: '38%', opacity: reveal}}>
        <div style={{color: SUBSEA_PALETTE.muted, fontSize: 14, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.12em'}}>
          PHYSICAL SEVER DETECTED
        </div>
        <div style={{
          color: SUBSEA_PALETTE.acidYellow,
          fontSize: 72,
          fontFamily: FONT_HEAVY,
          lineHeight: 1,
          marginTop: 6
        }}>
          4,200 <span style={{fontSize: 28, fontFamily: FONT_MONO}}>METERS DEPTH</span>
        </div>
        <div style={{
          color: SUBSEA_PALETTE.hyperOrange,
          fontSize: 32,
          fontFamily: FONT_HEAVY,
          letterSpacing: '0.08em',
          marginTop: 16
        }}>
          OPTICAL DISCONTINUITY.
        </div>
      </div>

      {/* Reticle Lock */}
      <div style={{
        position: 'relative',
        width: 420,
        height: 420,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `2px dashed ${SUBSEA_PALETTE.hyperOrange}`,
          transform: `scale(${pulse}) rotate(${frame * 1.5}deg)`,
          opacity: 0.8
        }} />
        <div style={{
          position: 'absolute',
          inset: 36,
          borderRadius: '50%',
          border: `2px solid ${SUBSEA_PALETTE.acidYellow}`,
          opacity: 0.5
        }} />
        <div style={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255,46,0,0.3)',
          border: `4px solid ${SUBSEA_PALETTE.hyperOrange}`,
          boxShadow: `0 0 60px ${SUBSEA_PALETTE.hyperOrange}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFF',
          fontFamily: FONT_HEAVY,
          textAlign: 'center'
        }}>
          <div style={{fontSize: 26}}>SNAG</div>
          <div style={{fontSize: 12, fontFamily: FONT_MONO, color: SUBSEA_PALETTE.hyperOrange}}>ANCHOR HIT</div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------
// 4. BGP Latency Spike Card (+85ms Delay)
// ------------------------------------------------------------------------------
export const BgpOverloadCard: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = spring({frame, fps: 30, config: {damping: 14}});

  return (
    <div style={{
      position: 'absolute',
      right: 90,
      top: '32%',
      width: 440,
      background: 'rgba(13,14,21,0.94)',
      border: `2px solid ${SUBSEA_PALETTE.hyperOrange}`,
      padding: '32px 36px',
      transform: `scale(${scale})`,
      fontFamily: FONT_SANS,
      boxShadow: '0 16px 50px rgba(0,0,0,0.9)'
    }}>
      <div style={{color: SUBSEA_PALETTE.hyperOrange, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.12em'}}>
        ROUTE DEFLECTION // BGP OVERLOAD
      </div>
      <div style={{
        color: SUBSEA_PALETTE.text,
        fontSize: 64,
        fontFamily: FONT_HEAVY,
        lineHeight: 1,
        marginTop: 10
      }}>
        +85 <span style={{fontSize: 26, fontFamily: FONT_MONO, color: SUBSEA_PALETTE.hyperOrange}}>MILLISECONDS</span>
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 20}}>
        <div style={{color: SUBSEA_PALETTE.muted, fontSize: 12, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.1em'}}>
          SURVIVING CABLE LOAD:
        </div>
        <div style={{color: SUBSEA_PALETTE.hyperOrange, fontSize: 22, fontFamily: FONT_HEAVY, letterSpacing: '0.1em'}}>
          94% CRITICAL
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------
// 5. Cable Repair Ship Cleanroom Panel
// ------------------------------------------------------------------------------
export const RepairShipPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [5, 25], [0, 1], clamp);

  const items = [
    'GRAPNEL HOOK DEPLOYED (4,200M)',
    'ACOUSTIC BEACON LOCALIZATION',
    'CLEANROOM FUSION SPLICING',
    'OVERMOLD WATERPROOF PRESSURE SEAL'
  ];

  return (
    <div style={{
      position: 'absolute',
      left: 80,
      top: '30%',
      width: 560,
      background: 'rgba(13,14,21,0.94)',
      border: `2px solid ${SUBSEA_PALETTE.recoveryGreen}`,
      padding: '32px 38px',
      opacity: reveal,
      fontFamily: FONT_SANS
    }}>
      <div style={{color: SUBSEA_PALETTE.recoveryGreen, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.12em'}}>
        SPECIALIZED REPAIR SHIP // MITIGATION
      </div>
      <div style={{color: SUBSEA_PALETTE.text, fontSize: 34, fontFamily: FONT_HEAVY, margin: '10px 0 20px', letterSpacing: '0.04em'}}>
        DEEP SEA SPLICING PROTOCOL
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        {items.map(item => (
          <div key={item} style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{width: 8, height: 8, background: SUBSEA_PALETTE.recoveryGreen}} />
            <div style={{color: SUBSEA_PALETTE.text, fontSize: 15, fontFamily: FONT_SANS, fontWeight: 700}}>{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------
// 6. Master Subsea Pressure Map
// ------------------------------------------------------------------------------
export const MasterSubseaPressureMap: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 20], [0, 1], clamp);

  return (
    <div style={{position: 'absolute', inset: 0, opacity: reveal, fontFamily: FONT_SANS}}>
      <div style={{position: 'absolute', left: 80, top: 100, maxWidth: 900}}>
        <div style={{color: SUBSEA_PALETTE.acidYellow, fontSize: 48, fontFamily: FONT_HEAVY, lineHeight: 1.05, letterSpacing: '0.04em'}}>
          THE PHYSICAL INTERNET BENEATH THE OCEAN
        </div>
        <div style={{color: SUBSEA_PALETTE.text, fontSize: 20, fontFamily: FONT_SANS, fontWeight: 700, marginTop: 12}}>
          THE "CLOUD" RESTS ON GLASS THREADS IN THE DEEP SEA.
        </div>
      </div>

      <div style={{
        position: 'absolute',
        left: 80,
        right: 80,
        bottom: 140,
        background: 'rgba(20,22,34,0.96)',
        border: `2px solid ${SUBSEA_PALETTE.border}`,
        padding: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{color: SUBSEA_PALETTE.muted, fontSize: 15, fontFamily: FONT_MONO, fontWeight: 700}}>BEACH LANDING</div>
        <div style={{color: SUBSEA_PALETTE.muted}}>➔</div>
        <div style={{color: SUBSEA_PALETTE.acidYellow, fontSize: 20, fontFamily: FONT_HEAVY}}>DWDM LASER (100G)</div>
        <div style={{color: SUBSEA_PALETTE.muted}}>➔</div>
        <div style={{color: SUBSEA_PALETTE.acidYellow, fontSize: 20, fontFamily: FONT_HEAVY}}>10,000V DC FEED</div>
        <div style={{color: SUBSEA_PALETTE.muted}}>➔</div>
        <div style={{
          color: '#FFF',
          background: SUBSEA_PALETTE.hyperOrange,
          padding: '8px 20px',
          borderRadius: 6,
          fontSize: 24,
          fontFamily: FONT_HEAVY,
          boxShadow: `0 0 30px ${SUBSEA_PALETTE.hyperOrange}`
        }}>
          ANCHOR SEVER (4,000M)
        </div>
        <div style={{color: SUBSEA_PALETTE.muted}}>➔</div>
        <div style={{color: SUBSEA_PALETTE.recoveryGreen, fontSize: 20, fontFamily: FONT_HEAVY}}>BGP REROUTE (94%)</div>
        <div style={{color: SUBSEA_PALETTE.muted}}>➔</div>
        <div style={{color: SUBSEA_PALETTE.muted, fontSize: 15, fontFamily: FONT_MONO, fontWeight: 700}}>GLOBAL RECOVERY</div>
      </div>
    </div>
  );
};
