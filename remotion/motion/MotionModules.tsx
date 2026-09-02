import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import {HslMotionAccent, HslMotionDesign} from '../../hsl/motion/motionDesign';

const palette = {
  background: '#0D0E15', surface: '#161824', surface2: '#202332', border: '#34384F',
  yellow: '#FFE500', blue: '#2463FF', orange: '#FF3B19', text: '#F4F4F0', muted: '#9A9EB2'
};

const accentColor = (accent: HslMotionAccent): string => palette[accent];
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const MotionDurationContext = React.createContext(150);
const useMotionDuration = (): number => React.useContext(MotionDurationContext);

function reveal(frame: number, start: number, length = 18): number {
  return interpolate(frame, [start, start + length], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
}

function itemReveal(frame: number, duration: number, index: number, count: number): number {
  const start = Math.round(duration * (.18 + index * (.44 / Math.max(1, count - 1))));
  return reveal(frame, start, Math.min(20, Math.max(10, Math.round(duration * .08))));
}

const MotionFrame: React.FC<{design: HslMotionDesign; children: React.ReactNode}> = ({design, children}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  const intro = spring({frame, fps: 30, config: {damping: 18, stiffness: 120, mass: .8}});
  const takeaway = reveal(frame, Math.round(durationInFrames * .68), 18);
  return <AbsoluteFill style={{padding: '128px 82px 112px', fontFamily: 'Arial, sans-serif', color: palette.text}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: intro}}>
      <div style={{width: 42, height: 8, background: accent}} />
      <div style={{fontSize: 18, fontWeight: 800, color: accent}}>{design.eyebrow}</div>
    </div>
    <div style={{fontSize: design.headline.length > 54 ? 43 : 50, lineHeight: 1.06, fontWeight: 900, marginTop: 18, maxWidth: 1460, transform: `translateY(${(1 - intro) * 18}px)`, opacity: intro}}>
      {design.headline}
    </div>
    <div style={{position: 'absolute', left: 82, right: 82, top: 292, bottom: 190}}>{children}</div>
    <div style={{position: 'absolute', left: 82, bottom: 92, display: 'flex', alignItems: 'center', gap: 18, opacity: takeaway, transform: `translateY(${(1 - takeaway) * 16}px)`}}>
      <div style={{width: 14, height: 14, background: accent, transform: `rotate(${45 * takeaway}deg)`}} />
      <div style={{fontSize: 25, fontWeight: 900}}>{design.takeaway}</div>
    </div>
  </AbsoluteFill>;
};

const StageCard: React.FC<{label: string; active: number; accent: string; index?: string}> = ({label, active, accent, index}) => <div style={{
  height: 126, minWidth: 0, background: active > .2 ? palette.surface2 : palette.surface,
  border: `2px solid ${active > .2 ? accent : palette.border}`, display: 'flex', alignItems: 'center',
  justifyContent: 'center', position: 'relative', padding: '16px 18px', color: active > .2 ? palette.text : palette.muted,
  transform: `translateY(${(1 - active) * 18}px)`, opacity: .34 + active * .66
}}>
  {index ? <div style={{position: 'absolute', left: 12, top: 10, color: accent, fontSize: 14, fontWeight: 900}}>{index}</div> : null}
  <div style={{fontSize: label.length > 18 ? 20 : 25, fontWeight: 900, textAlign: 'center'}}>{label}</div>
  <div style={{position: 'absolute', height: 7, left: 0, bottom: 0, width: `${active * 100}%`, background: accent}} />
</div>;

export const FlowMap: React.FC<{design: HslMotionDesign}> = ({design}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  const stages = design.stages.slice(0, 4);
  const flow = reveal(frame, Math.round(durationInFrames * .2), Math.round(durationInFrames * .54));
  const ordered = design.direction === 'REVERSE' ? [...stages].reverse() : stages;
  return <MotionFrame design={design}>
    <div style={{height: '100%', display: 'flex', alignItems: 'center'}}>
      {ordered.map((stage, index) => {
        const active = itemReveal(frame, durationInFrames, index, ordered.length);
        return <React.Fragment key={stage}>
          <div style={{flex: 1}}><StageCard label={stage} active={active} accent={accent} index={String(index + 1).padStart(2, '0')} /></div>
          {index < ordered.length - 1 ? <div style={{width: 100, height: 6, background: palette.border, position: 'relative', overflow: 'visible'}}>
            <div style={{height: '100%', background: accent, transformOrigin: design.direction === 'REVERSE' ? 'right' : 'left', transform: `scaleX(${flow})`}} />
            <div style={{position: 'absolute', top: -8, left: `${Math.max(0, Math.min(92, flow * 100))}%`, width: 22, height: 22, borderRadius: '50%', background: accent, boxShadow: `0 0 24px ${accent}`}} />
          </div> : null}
        </React.Fragment>;
      })}
    </div>
  </MotionFrame>;
};

export const BranchingRoutes: React.FC<{design: HslMotionDesign}> = ({design}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  const stages = design.stages.slice(0, 4);
  const line = reveal(frame, Math.round(durationInFrames * .2), Math.round(durationInFrames * .3));
  const converge = design.direction === 'CONVERGE';
  const source = converge ? 'ONE RECEIPT' : 'SOURCE';
  return <MotionFrame design={design}>
    <div style={{height: '100%', display: 'grid', gridTemplateColumns: converge ? '1fr 300px' : '300px 1fr', alignItems: 'center', gap: 80}}>
      {!converge ? <StageCard label={source} active={reveal(frame, 8)} accent={accent} /> : null}
      <div style={{height: '100%', display: 'grid', gridTemplateRows: `repeat(${stages.length}, 1fr)`, gap: 14}}>
        {stages.map((stage, index) => {
          const active = itemReveal(frame, durationInFrames, index, stages.length);
          return <div key={stage} style={{display: 'flex', flexDirection: converge ? 'row' : 'row-reverse', alignItems: 'center'}}>
            <div style={{width: 370}}><StageCard label={stage} active={active} accent={accent} /></div>
            <div style={{height: 4, flex: 1, background: palette.border, transform: `scaleX(${line})`, transformOrigin: converge ? 'right' : 'left'}} />
          </div>;
        })}
      </div>
      {converge ? <StageCard label={source} active={reveal(frame, Math.round(durationInFrames * .5))} accent={accent} /> : null}
    </div>
  </MotionFrame>;
};

export const ProcessCutaway: React.FC<{design: HslMotionDesign}> = ({design}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  const flow = reveal(frame, Math.round(durationInFrames * .18), Math.round(durationInFrames * .58));
  const filter = itemReveal(frame, durationInFrames, 1, 3);
  return <MotionFrame design={design}>
    <div style={{height: '100%', display: 'flex', alignItems: 'center', position: 'relative'}}>
      <div style={{position: 'absolute', left: 40, right: 40, height: 150, border: `3px solid ${palette.border}`, background: palette.surface, overflow: 'hidden'}}>
        <div style={{height: '100%', width: `${flow * 100}%`, background: `linear-gradient(90deg, ${accent}22, ${accent}aa)`, position: 'relative'}}>
          {Array.from({length: 7}, (_, index) => <div key={index} style={{position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: accent, top: 25 + (index % 3) * 38, left: `${(frame * .7 + index * 17) % 100}%`, opacity: .75}} />)}
        </div>
      </div>
      <div style={{position: 'absolute', left: '44%', width: 170, height: 300, border: `3px solid ${accent}`, background: palette.background, opacity: filter, transform: `scaleY(${.72 + filter * .28})`}}>
        {Array.from({length: 6}, (_, index) => <div key={index} style={{height: 3, background: index % 2 ? palette.border : accent, margin: '34px 22px'}} />)}
      </div>
      <div style={{position: 'absolute', left: 18, right: 18, top: 32, display: 'flex', justifyContent: 'space-between'}}>
        {design.stages.slice(0, 3).map((stage, index) => <div key={stage} style={{fontSize: 19, fontWeight: 900, color: index === 1 ? accent : palette.muted, opacity: itemReveal(frame, durationInFrames, index, 3)}}>{stage}</div>)}
      </div>
    </div>
  </MotionFrame>;
};

export const StateTransition: React.FC<{design: HslMotionDesign}> = ({design}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  return <MotionFrame design={design}>
    <div style={{height: '100%', display: 'flex', alignItems: 'center', gap: 20}}>
      {design.stages.slice(0, 4).map((stage, index, all) => {
        const active = itemReveal(frame, durationInFrames, index, all.length);
        const blocked = design.accent === 'orange' && index === all.length - 1;
        return <React.Fragment key={stage}>
          <div style={{flex: 1, position: 'relative'}}>
            <StageCard label={stage} active={active} accent={blocked ? palette.orange : accent} index={`${index + 1}`} />
            <div style={{height: 42, marginTop: 14, color: blocked ? palette.orange : accent, fontWeight: 900, fontSize: 17, opacity: active}}>{blocked ? 'HOLD' : active > .8 ? 'CONFIRMED' : 'PENDING'}</div>
          </div>
          {index < all.length - 1 ? <div style={{fontSize: 34, color: active > .7 ? accent : palette.border, transform: `translateX(${(1 - active) * -12}px)`}}>→</div> : null}
        </React.Fragment>;
      })}
    </div>
  </MotionFrame>;
};

export const CapacityVsAvailability: React.FC<{design: HslMotionDesign}> = ({design}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  return <MotionFrame design={design}>
    <div style={{height: '100%', display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, design.stages.length)}, 1fr)`, gap: 34, alignItems: 'end'}}>
      {design.stages.slice(0, 3).map((stage, index, all) => {
        const active = itemReveal(frame, durationInFrames, index, all.length);
        const fill = [88, 62, 36][index] || 50;
        return <div key={stage} style={{height: '90%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}}>
          <div style={{fontSize: 18, fontWeight: 900, color: index === all.length - 1 ? accent : palette.muted, marginBottom: 12}}>{stage}</div>
          <div style={{height: 300, border: `3px solid ${index === all.length - 1 ? accent : palette.border}`, background: palette.surface, position: 'relative', overflow: 'hidden'}}>
            <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: `${fill * active}%`, background: index === all.length - 1 ? accent : palette.surface2}} />
            <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 54, fontWeight: 900}}>{Math.round(fill * active)}%</div>
          </div>
        </div>;
      })}
    </div>
  </MotionFrame>;
};

export const Bottleneck: React.FC<{design: HslMotionDesign}> = ({design}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  const progress = reveal(frame, Math.round(durationInFrames * .14), Math.round(durationInFrames * .7));
  return <MotionFrame design={design}>
    <div style={{height: '100%', display: 'grid', gridTemplateColumns: '1fr 170px 1fr', alignItems: 'center'}}>
      <div style={{height: 300, display: 'grid', gridTemplateRows: 'repeat(5, 1fr)', gap: 12}}>
        {Array.from({length: 5}, (_, row) => <div key={row} style={{height: 30, background: palette.surface2, position: 'relative', overflow: 'hidden'}}>
          {Array.from({length: 4}, (_, dot) => <div key={dot} style={{position: 'absolute', width: 24, height: 24, borderRadius: '50%', background: accent, left: `${Math.min(88, progress * 105 - dot * 22)}%`, top: 3, opacity: progress > dot * .08 ? 1 : 0}} />)}
        </div>)}
      </div>
      <div style={{height: 118, border: `4px solid ${accent}`, background: palette.background, display: 'grid', placeItems: 'center', zIndex: 2}}>
        <div style={{fontSize: 17, fontWeight: 900, color: accent, textAlign: 'center'}}>{design.stages[1] || 'CONSTRAINT'}</div>
      </div>
      <div style={{height: 68, background: palette.surface2, position: 'relative', overflow: 'hidden'}}>
        <div style={{height: '100%', width: `${Math.max(0, progress * 64)}%`, background: accent}} />
      </div>
      <div style={{position: 'absolute', left: 0, top: 15, fontSize: 19, fontWeight: 900}}>{design.stages[0] || 'SUPPLY'}</div>
      <div style={{position: 'absolute', right: 0, top: 15, fontSize: 19, fontWeight: 900}}>{design.stages[2] || 'DEMAND'}</div>
      {design.metric ? <div style={{position: 'absolute', right: 0, bottom: 8, textAlign: 'right'}}><div style={{fontSize: 58, fontWeight: 900, color: accent}}>{design.metric.value}</div><div style={{fontSize: 16, fontWeight: 800, color: palette.muted}}>{design.metric.label}</div></div> : null}
    </div>
  </MotionFrame>;
};

export const ParallelTurnaround: React.FC<{design: HslMotionDesign}> = ({design}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  const stages = design.stages.slice(0, 4);
  return <MotionFrame design={design}>
    <div style={{height: '100%', display: 'grid', gridTemplateRows: `repeat(${stages.length}, 1fr)`, gap: 18, alignContent: 'center'}}>
      {stages.map((stage, index) => {
        const active = reveal(frame, Math.round(durationInFrames * (.14 + index * .055)), Math.round(durationInFrames * (.48 + index * .035)));
        return <div key={stage} style={{display: 'grid', gridTemplateColumns: '220px 1fr 90px', gap: 20, alignItems: 'center'}}>
          <div style={{fontSize: 22, fontWeight: 900}}>{stage}</div>
          <div style={{height: 34, background: palette.surface2, overflow: 'hidden'}}><div style={{height: '100%', width: `${active * 100}%`, background: index === stages.length - 1 ? palette.orange : accent}} /></div>
          <div style={{fontSize: 18, fontWeight: 900, color: active > .95 ? accent : palette.muted}}>{active > .95 ? 'READY' : 'ACTIVE'}</div>
        </div>;
      })}
      <div style={{position: 'absolute', right: 90, top: 2, bottom: 2, width: 4, background: palette.orange, opacity: reveal(frame, Math.round(durationInFrames * .62))}} />
    </div>
  </MotionFrame>;
};

export const DelayPropagation: React.FC<{design: HslMotionDesign}> = ({design}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  const stages = design.stages.slice(0, 4);
  return <MotionFrame design={design}>
    <div style={{height: '100%', display: 'flex', alignItems: 'center', position: 'relative'}}>
      <div style={{position: 'absolute', left: 80, right: 80, height: 5, background: palette.border}} />
      {stages.map((stage, index) => {
        const active = itemReveal(frame, durationInFrames, index, stages.length);
        const ring = 1 + ((frame + index * 12) % 45) / 45;
        return <div key={stage} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, opacity: .3 + active * .7}}>
          <div style={{height: 150, display: 'flex', alignItems: 'flex-end', fontSize: 20, fontWeight: 900, textAlign: 'center', padding: 14}}>{stage}</div>
          <div style={{width: 54, height: 54, borderRadius: '50%', background: active > .5 ? accent : palette.surface2, border: `4px solid ${active > .5 ? accent : palette.border}`, position: 'relative'}}>
            {active > .85 ? <div style={{position: 'absolute', inset: -22 * ring, borderRadius: '50%', border: `2px solid ${accent}`, opacity: Math.max(0, 1.6 - ring)}} /> : null}
          </div>
          <div style={{height: 150, paddingTop: 22, color: accent, fontSize: 18, fontWeight: 900}}>{active > .88 ? `+${index * 4} MIN` : ''}</div>
        </div>;
      })}
    </div>
  </MotionFrame>;
};

export const BeforeAfter: React.FC<{design: HslMotionDesign}> = ({design}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  const split = reveal(frame, Math.round(durationInFrames * .2), 18);
  const left = design.stages[0] || 'VISIBLE EVENT';
  const right = design.stages[design.stages.length - 1] || 'SYSTEM RESULT';
  return <MotionFrame design={design}>
    <div style={{height: '100%', display: 'grid', gridTemplateColumns: '1fr 110px 1fr', gap: 20, alignItems: 'center'}}>
      <div style={{height: 270, background: palette.surface, border: `2px solid ${palette.border}`, display: 'grid', placeItems: 'center', transform: `translateX(${(1 - split) * -80}px)`, opacity: split}}>
        <div style={{textAlign: 'center'}}><div style={{fontSize: 17, color: palette.muted, fontWeight: 800, marginBottom: 24}}>VISIBLE</div><div style={{fontSize: 34, fontWeight: 900}}>{left}</div></div>
      </div>
      <div style={{fontSize: 52, color: accent, fontWeight: 900, textAlign: 'center', transform: `rotate(${(1 - split) * -90}deg)`}}>≠</div>
      <div style={{height: 270, background: palette.surface2, border: `3px solid ${accent}`, display: 'grid', placeItems: 'center', transform: `translateX(${(1 - split) * 80}px)`, opacity: split}}>
        <div style={{textAlign: 'center'}}><div style={{fontSize: 17, color: accent, fontWeight: 800, marginBottom: 24}}>OPERATIONAL REALITY</div><div style={{fontSize: 34, fontWeight: 900}}>{right}</div></div>
      </div>
    </div>
  </MotionFrame>;
};

export const EvidenceCard: React.FC<{design: HslMotionDesign}> = ({design}) => {
  const frame = useCurrentFrame();
  const durationInFrames = useMotionDuration();
  const accent = accentColor(design.accent);
  const stages = design.stages.slice(0, 4);
  return <MotionFrame design={design}>
    <div style={{height: '100%', display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, stages.length)}, 1fr)`, gap: 24, alignItems: 'center'}}>
      {stages.map((stage, index) => {
        const active = itemReveal(frame, durationInFrames, index, stages.length);
        return <div key={stage} style={{height: 280, background: palette.surface, border: `2px solid ${active > .5 ? accent : palette.border}`, padding: 24, transform: `translateY(${(1 - active) * (index % 2 ? 42 : -42)}px)`, opacity: active, position: 'relative'}}>
          <div style={{fontSize: 15, color: palette.muted, fontWeight: 900}}>LAYER {String(index + 1).padStart(2, '0')}</div>
          <div style={{fontSize: stage.length > 18 ? 25 : 31, lineHeight: 1.08, fontWeight: 900, marginTop: 70}}>{stage}</div>
          <div style={{position: 'absolute', right: 22, bottom: 20, width: 34, height: 34, display: 'grid', placeItems: 'center', background: active > .82 ? accent : palette.surface2, color: palette.background, fontSize: 22, fontWeight: 900}}>✓</div>
        </div>;
      })}
    </div>
  </MotionFrame>;
};

export const MotionModule: React.FC<{design: HslMotionDesign; durationInFrames: number}> = ({design, durationInFrames}) => {
  let content: React.ReactNode = <FlowMap design={design} />;
  if (design.template === 'BRANCHING_ROUTES') content = <BranchingRoutes design={design} />;
  if (design.template === 'PROCESS_CUTAWAY') content = <ProcessCutaway design={design} />;
  if (design.template === 'STATE_TRANSITION') content = <StateTransition design={design} />;
  if (design.template === 'CAPACITY_VS_AVAILABILITY') content = <CapacityVsAvailability design={design} />;
  if (design.template === 'BOTTLENECK') content = <Bottleneck design={design} />;
  if (design.template === 'PARALLEL_TURNAROUND') content = <ParallelTurnaround design={design} />;
  if (design.template === 'DELAY_PROPAGATION') content = <DelayPropagation design={design} />;
  if (design.template === 'BEFORE_AFTER') content = <BeforeAfter design={design} />;
  if (design.template === 'EVIDENCE_CARD') content = <EvidenceCard design={design} />;
  if (design.template === 'PRESSURE_TEST') content = <Bottleneck design={design} />;
  if (design.template === 'PRESSURE_MAP') content = <FlowMap design={design} />;
  return <MotionDurationContext.Provider value={durationInFrames}>{content}</MotionDurationContext.Provider>;
};

// -----------------------------------------------------------------------------
// 🚀 NOVOS MÓDULOS DE MOTION GRAPHICS AVANÇADOS (POPDOC EXPERT)
// -----------------------------------------------------------------------------

/**
 * Medidor Comparativo Cinético com contagem elástica (Ex: Vazão Nominal vs Vazão em Colapso)
 */
export const KineticComparisonGauge: React.FC<{
  labelA: string;
  valueA: number;
  unitA: string;
  labelB: string;
  valueB: number;
  unitB: string;
  accentColor?: string;
}> = ({
  labelA = 'NOMINAL FLOW',
  valueA = 1800,
  unitA = 'GPM',
  labelB = 'COLLAPSE RATE',
  valueB = 750,
  unitB = 'GPM',
  accentColor = palette.yellow
}) => {
  const frame = useCurrentFrame();
  const progressA = interpolate(frame, [10, 45], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const progressB = interpolate(frame, [25, 60], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

  const displayValA = Math.round(progressA * valueA);
  const displayValB = Math.round(progressB * valueB);

  return (
    <div style={{
      position: 'absolute',
      right: 90,
      bottom: 120,
      width: 480,
      padding: '24px 28px',
      backgroundColor: 'rgba(13,14,21,0.92)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 4,
      boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
      zIndex: 15,
      pointerEvents: 'none'
    }}>
      <div style={{ fontSize: 13, fontFamily: '"JetBrains Mono", monospace', color: palette.muted, letterSpacing: 2, marginBottom: 14 }}>
        DYNAMIC THROUGHPUT COMPARISON
      </div>

      {/* Barra A: Nominal */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: palette.text, marginBottom: 6 }}>
          <span>{labelA}</span>
          <span style={{ color: accentColor, fontFamily: '"JetBrains Mono", monospace' }}>{displayValA} {unitA}</span>
        </div>
        <div style={{ width: '100%', height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${progressA * 100}%`, height: '100%', backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}` }} />
        </div>
      </div>

      {/* Barra B: Strain / Collapse */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: palette.text, marginBottom: 6 }}>
          <span>{labelB}</span>
          <span style={{ color: palette.orange, fontFamily: '"JetBrains Mono", monospace' }}>{displayValB} {unitB}</span>
        </div>
        <div style={{ width: '100%', height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${progressB * (valueB / valueA) * 100}%`, height: '100%', backgroundColor: palette.orange, boxShadow: `0 0 12px ${palette.orange}` }} />
        </div>
      </div>
    </div>
  );
};

/**
 * Oscilador de Onda de Pressão Hidráulica / Sinal em Tempo Real
 */
export const HydraulicWaveformOscillator: React.FC<{
  frequency?: number;
  amplitude?: number;
  label?: string;
  pressurePsi?: number;
  accentColor?: string;
}> = ({
  frequency = 0.08,
  amplitude = 22,
  label = '150 PSI HYDROSTATIC WAVE',
  pressurePsi = 150,
  accentColor = palette.yellow
}) => {
  const frame = useCurrentFrame();

  const points: string[] = [];
  for (let x = 0; x <= 400; x += 10) {
    const y = 40 + Math.sin(x * frequency + frame * 0.15) * amplitude;
    points.push(`${x},${y}`);
  }

  return (
    <div style={{
      position: 'absolute',
      left: 80,
      top: 140,
      padding: '16px 20px',
      backgroundColor: 'rgba(13,14,21,0.85)',
      border: '1px solid rgba(255,229,0,0.3)',
      borderRadius: 4,
      zIndex: 15,
      pointerEvents: 'none'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 20 }}>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: 1.5 }}>
          {label}
        </span>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 900, color: palette.text }}>
          {pressurePsi} PSI
        </span>
      </div>
      <svg width="400" height="80" style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(' ')}
          style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }}
        />
      </svg>
    </div>
  );
};

/**
 * Brackets Industriais com Foco em Elemento Crítico
 */
export const TechnicalBracketsOverlay: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  tag: string;
  subTag?: string;
  accentColor?: string;
}> = ({
  x,
  y,
  width,
  height,
  tag,
  subTag,
  accentColor = palette.yellow
}) => {
  const frame = useCurrentFrame();
  const intro = spring({ frame, fps: 30, config: { damping: 14, stiffness: 140 } });

  const bracketSize = 18;

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      opacity: intro,
      transform: `scale(${0.9 + intro * 0.1})`,
      pointerEvents: 'none',
      zIndex: 15
    }}>
      {/* Top Left */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: bracketSize, height: 3, backgroundColor: accentColor }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: bracketSize, backgroundColor: accentColor }} />

      {/* Top Right */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: bracketSize, height: 3, backgroundColor: accentColor }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: bracketSize, backgroundColor: accentColor }} />

      {/* Bottom Left */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: bracketSize, height: 3, backgroundColor: accentColor }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 3, height: bracketSize, backgroundColor: accentColor }} />

      {/* Bottom Right */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: bracketSize, height: 3, backgroundColor: accentColor }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 3, height: bracketSize, backgroundColor: accentColor }} />

      {/* Tag Box */}
      <div style={{
        position: 'absolute',
        bottom: -28,
        left: 0,
        backgroundColor: 'rgba(13,14,21,0.9)',
        padding: '3px 8px',
        border: `1px solid ${accentColor}`,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
        fontWeight: 800,
        color: accentColor,
        letterSpacing: 1.5,
        display: 'flex',
        gap: 8
      }}>
        <span>{tag}</span>
        {subTag && <span style={{ color: palette.muted }}>// {subTag}</span>}
      </div>
    </div>
  );
};

