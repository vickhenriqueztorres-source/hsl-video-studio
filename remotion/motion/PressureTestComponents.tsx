import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';

// ==============================================================================
// 🎨 OFFICIAL HSL PRESSURE TEST COLOR SYSTEM
// ==============================================================================
export const PRESSURE_PALETTE = {
  obsidian: '#0D0E15',
  surface: '#141622',
  surface2: '#1C1F30',
  border: '#2A2E45',
  acidYellow: '#FFE500',   // Editorial focus, primary metric, discovery
  kleinBlue: '#0038FF',    // Normal operation, infrastructure, routes
  hyperOrange: '#FF2E00',  // Bottleneck, queues, critical stress
  recoveryGreen: '#00FF85',// Bypass, alternative routes, recovery
  text: '#F4F4F0',
  muted: '#8E92A8'
};

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const FONT_SANS = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const FONT_HEAVY = 'system-ui, "Arial Black", Impact, sans-serif';
const FONT_MONO = '"JetBrains Mono", "Courier New", Consolas, monospace';

// ------------------------------------------------------------------------------
// Top Global Header (No internal tags, pure documentary branding)
// ------------------------------------------------------------------------------
export const HslHeader: React.FC<{systemName?: string; stageTitle?: string}> = ({
  systemName = 'INTERNATIONAL AIRPORT',
  stageTitle = 'PRESSURE TEST'
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
          background: PRESSURE_PALETTE.acidYellow,
          color: '#000',
          fontSize: 12,
          fontFamily: FONT_HEAVY,
          padding: '4px 10px',
          letterSpacing: '0.12em'
        }}>
          HSL DOCS
        </div>
        <div style={{
          color: PRESSURE_PALETTE.text,
          fontSize: 15,
          fontFamily: FONT_SANS,
          fontWeight: 800,
          letterSpacing: '0.08em'
        }}>
          {systemName}
        </div>
      </div>
      <div style={{
        color: PRESSURE_PALETTE.acidYellow,
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
// 1. Capacity Graph Overlay (Rising percentage + live animated SVG curve)
// ------------------------------------------------------------------------------
export const CapacityGraphOverlay: React.FC<{
  startPercent: number;
  endPercent: number;
  label?: string;
}> = ({startPercent, endPercent, label = 'CAPACITY'}) => {
  const frame = useCurrentFrame();
  const currentPct = Math.round(interpolate(frame, [0, 90], [startPercent, endPercent], clamp));

  // SVG Line Chart coordinates
  const p1 = {x: 20, y: 130};
  const p2 = {x: 100, y: 110 - (startPercent * 0.4)};
  const p3 = {x: 220, y: 120 - (currentPct * 0.9)};

  const isCritical = currentPct >= 90;
  const accentColor = isCritical ? PRESSURE_PALETTE.hyperOrange : PRESSURE_PALETTE.acidYellow;

  return (
    <div style={{
      position: 'absolute',
      right: 70,
      bottom: 70,
      width: 360,
      padding: '22px 28px',
      background: 'rgba(13,14,21,0.92)',
      border: `1px solid ${PRESSURE_PALETTE.border}`,
      backdropFilter: 'blur(16px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
      fontFamily: FONT_SANS
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <div style={{color: PRESSURE_PALETTE.muted, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.1em'}}>
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

      {/* Mini Telemetry Graph */}
      <svg width="300" height="80" style={{marginTop: 12, overflow: 'visible'}}>
        <path
          d={`M ${p1.x} ${p1.y} Q ${p2.x} ${p2.y} ${p3.x} ${p3.y}`}
          fill="none"
          stroke={accentColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Glowing Head Point */}
        <circle cx={p3.x} cy={p3.y} r="5" fill={accentColor} />
        <circle cx={p3.x} cy={p3.y} r="12" fill={accentColor} opacity="0.3" />
      </svg>
    </div>
  );
};

// ------------------------------------------------------------------------------
// 2. System Flow Graph (A -> B -> C -> D -> E)
// ------------------------------------------------------------------------------
export const SystemFlowGraph: React.FC<{
  highlightNode?: string;
  dValue?: string;
}> = ({highlightNode = 'D', dValue = '???'}) => {
  const frame = useCurrentFrame();

  const nodes = [
    {id: 'A', rate: '110 /min', x: 260, y: 540},
    {id: 'B', rate: '108 /min', x: 580, y: 540},
    {id: 'C', rate: '105 /min', x: 900, y: 540},
    {id: 'D', rate: `${dValue} ${dValue !== '???' ? '/min' : ''}`, x: 1220, y: 540},
    {id: 'E', rate: '112 /min', x: 1540, y: 540}
  ];

  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {/* Top Section Header */}
      <div style={{position: 'absolute', left: 70, top: 110}}>
        <div style={{color: PRESSURE_PALETTE.acidYellow, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.12em'}}>
          SYSTEM THROUGHPUT
        </div>
        <div style={{color: PRESSURE_PALETTE.text, fontSize: 40, fontFamily: FONT_HEAVY, marginTop: 4, letterSpacing: '0.04em'}}>
          MULTI-STAGE FLOW ARCHITECTURE
        </div>
      </div>

      {/* Connecting Flow Lines */}
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        {nodes.slice(0, -1).map((n, i) => {
          const next = nodes[i + 1];
          const lineAnim = interpolate(frame, [i * 8, i * 8 + 18], [0, 1], clamp);
          return (
            <line
              key={n.id}
              x1={n.x}
              y1={n.y}
              x2={n.x + (next.x - n.x) * lineAnim}
              y2={n.y}
              stroke={PRESSURE_PALETTE.border}
              strokeWidth="4"
              strokeDasharray="8 6"
            />
          );
        })}
      </svg>

      {/* Render Stage Nodes */}
      {nodes.map((node, i) => {
        const isHighlight = node.id === highlightNode;
        const nodeAnim = spring({frame: frame - i * 6, fps: 30, config: {damping: 14}});
        const nodeColor = isHighlight ? PRESSURE_PALETTE.hyperOrange : PRESSURE_PALETTE.acidYellow;

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
              alignItems: 'center',
              fontFamily: FONT_SANS
            }}
          >
            {/* Node Circle */}
            <div style={{
              width: 82,
              height: 82,
              borderRadius: '50%',
              background: isHighlight ? 'rgba(255,46,0,0.2)' : PRESSURE_PALETTE.surface2,
              border: `3px solid ${nodeColor}`,
              boxShadow: isHighlight ? `0 0 32px ${PRESSURE_PALETTE.hyperOrange}` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PRESSURE_PALETTE.text,
              fontSize: 32,
              fontFamily: FONT_HEAVY
            }}>
              {node.id}
            </div>

            {/* Throughput Metric Below */}
            <div style={{
              marginTop: 16,
              background: 'rgba(13,14,21,0.94)',
              border: `1px solid ${nodeColor}`,
              padding: '6px 14px',
              color: nodeColor,
              fontSize: 15,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              letterSpacing: '0.06em'
            }}>
              {node.rate}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------------------
// 3. Bottleneck Radar (Reticle isolation + D = 72/min in Hyper Orange)
// ------------------------------------------------------------------------------
export const BottleneckRadar: React.FC = () => {
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
      {/* Left Info Panel */}
      <div style={{position: 'absolute', left: 90, top: '38%', opacity: reveal}}>
        <div style={{color: PRESSURE_PALETTE.muted, fontSize: 14, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.12em'}}>
          MEASURED THROUGHPUT
        </div>
        <div style={{
          color: PRESSURE_PALETTE.acidYellow,
          fontSize: 76,
          fontFamily: FONT_HEAVY,
          lineHeight: 1,
          marginTop: 6
        }}>
          D = 72 <span style={{fontSize: 30, fontFamily: FONT_MONO}}>/min</span>
        </div>
        <div style={{
          color: PRESSURE_PALETTE.hyperOrange,
          fontSize: 32,
          fontFamily: FONT_HEAVY,
          letterSpacing: '0.08em',
          marginTop: 16
        }}>
          THE BOTTLENECK.
        </div>
      </div>

      {/* Center Radar / Reticle Target */}
      <div style={{
        position: 'relative',
        width: 420,
        height: 420,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Outer Ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `2px dashed ${PRESSURE_PALETTE.hyperOrange}`,
          transform: `scale(${pulse}) rotate(${frame * 1.5}deg)`,
          opacity: 0.8
        }} />

        {/* Middle Ring */}
        <div style={{
          position: 'absolute',
          inset: 36,
          borderRadius: '50%',
          border: `2px solid ${PRESSURE_PALETTE.acidYellow}`,
          opacity: 0.5
        }} />

        {/* Core Node D */}
        <div style={{
          width: 130,
          height: 130,
          borderRadius: '50%',
          background: 'rgba(255,46,0,0.25)',
          border: `4px solid ${PRESSURE_PALETTE.hyperOrange}`,
          boxShadow: `0 0 50px ${PRESSURE_PALETTE.hyperOrange}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFF',
          fontSize: 60,
          fontFamily: FONT_HEAVY
        }}>
          D
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------
// 4. Queue Build-up Card (23 Minutes + Trending Up)
// ------------------------------------------------------------------------------
export const QueueCard: React.FC<{minutes?: number}> = ({minutes = 23}) => {
  const frame = useCurrentFrame();
  const scale = spring({frame, fps: 30, config: {damping: 14}});

  return (
    <div style={{
      position: 'absolute',
      right: 90,
      top: '32%',
      width: 420,
      background: 'rgba(13,14,21,0.94)',
      border: `2px solid ${PRESSURE_PALETTE.hyperOrange}`,
      padding: '32px 36px',
      transform: `scale(${scale})`,
      fontFamily: FONT_SANS,
      boxShadow: '0 16px 50px rgba(0,0,0,0.9)'
    }}>
      <div style={{color: PRESSURE_PALETTE.hyperOrange, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.12em'}}>
        BUFFER COLLAPSE // QUEUE
      </div>
      <div style={{
        color: PRESSURE_PALETTE.text,
        fontSize: 64,
        fontFamily: FONT_HEAVY,
        lineHeight: 1,
        marginTop: 10
      }}>
        {minutes} <span style={{fontSize: 26, fontFamily: FONT_MONO, color: PRESSURE_PALETTE.hyperOrange}}>MINUTES</span>
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 20}}>
        <div style={{color: PRESSURE_PALETTE.muted, fontSize: 12, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.1em'}}>
          PRESSURE TREND:
        </div>
        <div style={{color: PRESSURE_PALETTE.hyperOrange, fontSize: 22, fontFamily: FONT_HEAVY, letterSpacing: '0.2em'}}>
          ↑ ↑ ↑
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------
// 5. Triple Buffer Drain Bars
// ------------------------------------------------------------------------------
export const BufferDrainBars: React.FC = () => {
  const frame = useCurrentFrame();

  const buffers = [
    {name: 'BUFFER CHECK-IN', pct: 12},
    {name: 'BUFFER SECURITY', pct: 7},
    {name: 'BUFFER BAGGAGE', pct: 3}
  ];

  return (
    <div style={{
      position: 'absolute',
      left: 80,
      bottom: 80,
      width: 560,
      background: 'rgba(13,14,21,0.94)',
      border: `1px solid ${PRESSURE_PALETTE.border}`,
      padding: '26px 32px',
      fontFamily: FONT_SANS
    }}>
      <div style={{color: PRESSURE_PALETTE.acidYellow, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 18}}>
        SAFETY BUFFERS // DEPLETION
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        {buffers.map((b) => {
          const current = Math.round(interpolate(frame, [0, 40], [50, b.pct], clamp));
          return (
            <div key={b.name}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
                <span style={{color: PRESSURE_PALETTE.text, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700}}>{b.name}</span>
                <span style={{color: PRESSURE_PALETTE.hyperOrange, fontSize: 14, fontFamily: FONT_MONO, fontWeight: 900}}>{current}%</span>
              </div>
              <div style={{width: '100%', height: 8, background: PRESSURE_PALETTE.surface2, overflow: 'hidden'}}>
                <div style={{
                  width: `${current}%`,
                  height: '100%',
                  background: PRESSURE_PALETTE.hyperOrange,
                  boxShadow: `0 0 12px ${PRESSURE_PALETTE.hyperOrange}`
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------
// 6. Workaround Panel (Green Recovery Route)
// ------------------------------------------------------------------------------
export const WorkaroundPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [5, 25], [0, 1], clamp);

  const items = [
    'ALTERNATIVE ROUTING ACTIVE',
    'CREW REALLOCATION (OVERTIME)',
    'DYNAMIC BAGGAGE BYPASS',
    'PRIORITY THROUGHPUT FILTER'
  ];

  return (
    <div style={{
      position: 'absolute',
      left: 80,
      top: '30%',
      width: 540,
      background: 'rgba(13,14,21,0.94)',
      border: `2px solid ${PRESSURE_PALETTE.recoveryGreen}`,
      padding: '32px 38px',
      opacity: reveal,
      fontFamily: FONT_SANS
    }}>
      <div style={{color: PRESSURE_PALETTE.recoveryGreen, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.12em'}}>
        MITIGATION // WORKAROUND
      </div>
      <div style={{color: PRESSURE_PALETTE.text, fontSize: 34, fontFamily: FONT_HEAVY, margin: '10px 0 20px', letterSpacing: '0.04em'}}>
        EMERGENCY PROTOCOLS
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        {items.map(item => (
          <div key={item} style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{width: 8, height: 8, background: PRESSURE_PALETTE.recoveryGreen}} />
            <div style={{color: PRESSURE_PALETTE.text, fontSize: 15, fontFamily: FONT_SANS, fontWeight: 700}}>{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------
// 7. Cost & System Consequences Grid
// ------------------------------------------------------------------------------
export const ConsequencesGrid: React.FC = () => {
  const frame = useCurrentFrame();

  const stats = [
    {label: 'PASSENGERS IMPACTED', value: '18,400', color: PRESSURE_PALETTE.text},
    {label: 'FLIGHTS DELAYED', value: '56', color: PRESSURE_PALETTE.hyperOrange},
    {label: 'MISSED CONNECTIONS', value: '1,240', color: PRESSURE_PALETTE.hyperOrange},
    {label: 'TOTAL ECONOMIC COST', value: '$2.7M', color: PRESSURE_PALETTE.acidYellow}
  ];

  return (
    <div style={{
      position: 'absolute',
      left: 80,
      right: 80,
      bottom: 100,
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 20,
      fontFamily: FONT_SANS
    }}>
      {stats.map((s, idx) => {
        const anim = spring({frame: frame - idx * 5, fps: 30, config: {damping: 14}});
        return (
          <div
            key={s.label}
            style={{
              background: 'rgba(13,14,21,0.94)',
              border: `1px solid ${PRESSURE_PALETTE.border}`,
              padding: '24px 20px',
              transform: `scale(${anim})`
            }}
          >
            <div style={{color: PRESSURE_PALETTE.muted, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: '0.1em'}}>
              {s.label}
            </div>
            <div style={{color: s.color, fontSize: 38, fontFamily: FONT_HEAVY, marginTop: 6}}>
              {s.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------------------
// 8. Master Complete Pressure Map
// ------------------------------------------------------------------------------
export const MasterPressureMap: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 20], [0, 1], clamp);

  return (
    <div style={{position: 'absolute', inset: 0, opacity: reveal, fontFamily: FONT_SANS}}>
      {/* Top Thesis Headline */}
      <div style={{position: 'absolute', left: 80, top: 100, maxWidth: 900}}>
        <div style={{color: PRESSURE_PALETTE.acidYellow, fontSize: 50, fontFamily: FONT_HEAVY, lineHeight: 1.05, letterSpacing: '0.04em'}}>
          HOW MUCH CAN THIS HOLD?
        </div>
        <div style={{color: PRESSURE_PALETTE.text, fontSize: 20, fontFamily: FONT_SANS, fontWeight: 700, marginTop: 12}}>
          THE SYSTEM IS ONLY AS STRONG AS ITS CONSTRAINT.
        </div>
      </div>

      {/* Master Architecture Pipeline */}
      <div style={{
        position: 'absolute',
        left: 80,
        right: 80,
        bottom: 140,
        background: 'rgba(20,22,34,0.96)',
        border: `2px solid ${PRESSURE_PALETTE.border}`,
        padding: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{color: PRESSURE_PALETTE.muted, fontSize: 16, fontFamily: FONT_MONO, fontWeight: 700}}>INPUT</div>
        <div style={{color: PRESSURE_PALETTE.muted}}>➔</div>
        <div style={{color: PRESSURE_PALETTE.acidYellow, fontSize: 22, fontFamily: FONT_HEAVY}}>A (110)</div>
        <div style={{color: PRESSURE_PALETTE.muted}}>➔</div>
        <div style={{color: PRESSURE_PALETTE.acidYellow, fontSize: 22, fontFamily: FONT_HEAVY}}>B (108)</div>
        <div style={{color: PRESSURE_PALETTE.muted}}>➔</div>
        <div style={{color: PRESSURE_PALETTE.acidYellow, fontSize: 22, fontFamily: FONT_HEAVY}}>C (105)</div>
        <div style={{color: PRESSURE_PALETTE.muted}}>➔</div>
        <div style={{
          color: '#FFF',
          background: PRESSURE_PALETTE.hyperOrange,
          padding: '8px 20px',
          borderRadius: 6,
          fontSize: 26,
          fontFamily: FONT_HEAVY,
          boxShadow: `0 0 30px ${PRESSURE_PALETTE.hyperOrange}`
        }}>
          D: 72 (BOTTLENECK)
        </div>
        <div style={{color: PRESSURE_PALETTE.muted}}>➔</div>
        <div style={{color: PRESSURE_PALETTE.acidYellow, fontSize: 22, fontFamily: FONT_HEAVY}}>E (112)</div>
        <div style={{color: PRESSURE_PALETTE.muted}}>➔</div>
        <div style={{color: PRESSURE_PALETTE.acidYellow, fontSize: 22, fontFamily: FONT_HEAVY}}>F (115)</div>
        <div style={{color: PRESSURE_PALETTE.muted}}>➔</div>
        <div style={{color: PRESSURE_PALETTE.muted, fontSize: 16, fontFamily: FONT_MONO, fontWeight: 700}}>OUTPUT</div>
      </div>
    </div>
  );
};
