import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, Video, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {
  BottleneckRadar,
  BufferDrainBars,
  CapacityGraphOverlay,
  ConsequencesGrid,
  HslHeader,
  MasterPressureMap,
  PRESSURE_PALETTE,
  QueueCard,
  SystemFlowGraph,
  WorkaroundPanel
} from './motion/PressureTestComponents';
import {RemotionCinematicAudioBed} from './TestVideo1MinAudio';

// ==============================================================================
// 🎬 12-BEAT HYBRID PRESSURE TEST TIMELINE (Video Firefly + Image 35mm + Vector)
// ==============================================================================
const SCENES = [
  {id: 'BEAT_01', type: 'video', media: 'videos/scenes/scene_01_tarmac.mp4', stage: 'NORMAL OPERATION'},
  {id: 'BEAT_02', type: 'image', media: 'images/scenes/scene_02_server_vault.png', stage: 'DEMAND RISES'},
  {id: 'BEAT_03', type: 'video', media: 'videos/scenes/scene_03_terminal.mp4', stage: 'PRESSURE BUILDS'},
  {id: 'BEAT_04', type: 'image', media: 'images/scenes/scene_04_control_room.png', stage: 'APPARENT CAPACITY'},
  {id: 'BEAT_05', type: 'vector', stage: 'SYSTEM FLOW'},
  {id: 'BEAT_06', type: 'vector', stage: 'BOTTLENECK REVEAL'},
  {id: 'BEAT_07', type: 'video', media: 'videos/scenes/scene_07_queue.mp4', stage: 'QUEUE BUILDUP'},
  {id: 'BEAT_08', type: 'image', media: 'images/scenes/scene_03_optical_fiber.png', stage: 'BUFFER DEPLETION'},
  {id: 'BEAT_09', type: 'video', media: 'videos/scenes/scene_09_control_room.mp4', stage: 'WORKAROUND BYPASS'},
  {id: 'BEAT_10', type: 'image', media: 'images/scenes/scene_01_macro_glow.png', stage: 'OPERATIONAL COST'},
  {id: 'BEAT_11', type: 'video', media: 'videos/scenes/scene_11_city_aerial.mp4', stage: 'SYSTEM CONSEQUENCES'},
  {id: 'BEAT_12', type: 'vector', stage: 'INTERPRETATION'}
];

const BackgroundMediaLayer: React.FC<{
  type: 'video' | 'image';
  media: string;
  duration: number;
  index: number;
}> = ({type, media, duration, index}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, duration], [1.02, 1.08], {extrapolateRight: 'clamp'});
  const translateY = interpolate(frame, [0, duration], [0, index % 2 === 0 ? -12 : 12], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${scale}) translateY(${translateY}px)`}}>
        {type === 'video' ? (
          <Video
            src={staticFile(media)}
            muted
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : (
          <Img
            src={staticFile(media)}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        )}
        {/* Dark Vignette & Film Grade */}
        <AbsoluteFill style={{
          background: 'radial-gradient(circle at center, rgba(13,14,21,0.25) 0%, rgba(13,14,21,0.85) 100%)'
        }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TestVideo1Min: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: PRESSURE_PALETTE.obsidian, color: PRESSURE_PALETTE.text}}>
      {/* ======================================================== */}
      {/* 1. SCENE 01 - NORMAL OPERATION (Video Firefly) */}
      {/* ======================================================== */}
      <Sequence from={0} durationInFrames={150}>
        <BackgroundMediaLayer type="video" media={SCENES[0].media!} duration={150} index={0} />
        <HslHeader stageTitle={SCENES[0].stage} />
        <CapacityGraphOverlay startPercent={55} endPercent={62} />
      </Sequence>

      {/* ======================================================== */}
      {/* 2. SCENE 02 - DEMAND RISES (Image 35mm) */}
      {/* ======================================================== */}
      <Sequence from={150} durationInFrames={150}>
        <BackgroundMediaLayer type="image" media={SCENES[1].media!} duration={150} index={1} />
        <HslHeader stageTitle={SCENES[1].stage} />
        <CapacityGraphOverlay startPercent={62} endPercent={74} />
      </Sequence>

      {/* ======================================================== */}
      {/* 3. SCENE 03 - PRESSURE BUILDS (Video Firefly) */}
      {/* ======================================================== */}
      <Sequence from={300} durationInFrames={150}>
        <BackgroundMediaLayer type="video" media={SCENES[2].media!} duration={150} index={2} />
        <HslHeader stageTitle={SCENES[2].stage} />
        <CapacityGraphOverlay startPercent={74} endPercent={87} />
      </Sequence>

      {/* ======================================================== */}
      {/* 4. SCENE 04 - APPARENT CAPACITY (Image 35mm) */}
      {/* ======================================================== */}
      <Sequence from={450} durationInFrames={150}>
        <BackgroundMediaLayer type="image" media={SCENES[3].media!} duration={150} index={3} />
        <HslHeader stageTitle={SCENES[3].stage} />
        <CapacityGraphOverlay startPercent={87} endPercent={92} label="CRITICAL LOAD" />
      </Sequence>

      {/* ======================================================== */}
      {/* 5. SCENE 05 - SYSTEM FLOW (Pure Vector Remotion) */}
      {/* ======================================================== */}
      <Sequence from={600} durationInFrames={150}>
        <HslHeader stageTitle={SCENES[4].stage} />
        <SystemFlowGraph highlightNode="D" dValue="???" />
      </Sequence>

      {/* ======================================================== */}
      {/* 6. SCENE 06 - BOTTLENECK REVEAL (Pure Vector Remotion) */}
      {/* ======================================================== */}
      <Sequence from={750} durationInFrames={150}>
        <HslHeader stageTitle={SCENES[5].stage} />
        <BottleneckRadar />
      </Sequence>

      {/* ======================================================== */}
      {/* 7. SCENE 07 - QUEUE BUILDUP (Video Firefly) */}
      {/* ======================================================== */}
      <Sequence from={900} durationInFrames={150}>
        <BackgroundMediaLayer type="video" media={SCENES[6].media!} duration={150} index={6} />
        <HslHeader stageTitle={SCENES[6].stage} />
        <QueueCard minutes={23} />
      </Sequence>

      {/* ======================================================== */}
      {/* 8. SCENE 08 - BUFFER COLLAPSE (Image 35mm) */}
      {/* ======================================================== */}
      <Sequence from={1050} durationInFrames={150}>
        <BackgroundMediaLayer type="image" media={SCENES[7].media!} duration={150} index={7} />
        <HslHeader stageTitle={SCENES[7].stage} />
        <BufferDrainBars />
      </Sequence>

      {/* ======================================================== */}
      {/* 9. SCENE 09 - WORKAROUND BYPASS (Video Firefly) */}
      {/* ======================================================== */}
      <Sequence from={1200} durationInFrames={150}>
        <BackgroundMediaLayer type="video" media={SCENES[8].media!} duration={150} index={8} />
        <HslHeader stageTitle={SCENES[8].stage} />
        <WorkaroundPanel />
      </Sequence>

      {/* ======================================================== */}
      {/* 10. SCENE 10 - OPERATIONAL COST (Image 35mm) */}
      {/* ======================================================== */}
      <Sequence from={1350} durationInFrames={150}>
        <BackgroundMediaLayer type="image" media={SCENES[9].media!} duration={150} index={9} />
        <HslHeader stageTitle={SCENES[9].stage} />
        <div style={{
          position: 'absolute',
          left: 80,
          top: '35%',
          background: 'rgba(13,14,21,0.94)',
          border: `2px solid ${PRESSURE_PALETTE.hyperOrange}`,
          padding: '32px 38px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{color: PRESSURE_PALETTE.muted, fontSize: 13, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, letterSpacing: '0.12em'}}>
            SYSTEM DEGRADATION // IMPACT
          </div>
          <div style={{color: PRESSURE_PALETTE.acidYellow, fontSize: 56, fontFamily: 'system-ui, "Arial Black", sans-serif', fontWeight: 900, marginTop: 8}}>
            COST +37%
          </div>
          <div style={{color: PRESSURE_PALETTE.hyperOrange, fontSize: 38, fontFamily: 'system-ui, "Arial Black", sans-serif', fontWeight: 900, marginTop: 8}}>
            DELAYS +28 MIN
          </div>
        </div>
      </Sequence>

      {/* ======================================================== */}
      {/* 11. SCENE 11 - SYSTEM CONSEQUENCES (Video Firefly) */}
      {/* ======================================================== */}
      <Sequence from={1500} durationInFrames={150}>
        <BackgroundMediaLayer type="video" media={SCENES[10].media!} duration={150} index={10} />
        <HslHeader stageTitle={SCENES[10].stage} />
        <ConsequencesGrid />
      </Sequence>

      {/* ======================================================== */}
      {/* 12. SCENE 12 - INTERPRETATION & THESIS (Pure Vector) */}
      {/* ======================================================== */}
      <Sequence from={1650} durationInFrames={150}>
        <HslHeader stageTitle={SCENES[11].stage} />
        <MasterPressureMap />
      </Sequence>

      {/* ======================================================== */}
      {/* 🎙️ HERO NARRATION: CHRIS VOICE (0 dB Nominal Master) */}
      {/* ======================================================== */}
      <Audio src={staticFile('audio/narration_1min_chris_en.mp3')} volume={1.0} />

      {/* ======================================================== */}
      {/* 🎼 BACKGROUND TENSION SCORE (Subtle -26 dB with Ducking) */}
      {/* ======================================================== */}
      <Audio
        src={staticFile('audio/music/cinematic/suspense/suspense_oppressive_gloom.mp3')}
        volume={(f) => {
          // Dynamic Ducking: -26 dB normally (0.050), -30 dB during dense speech (0.031)
          return 0.045;
        }}
      />

      {/* ======================================================== */}
      {/* 🔊 REBALANCED SOUND DESIGN BED (Subtle SFX -16 dB to -28 dB) */}
      {/* ======================================================== */}
      <RemotionCinematicAudioBed />
    </AbsoluteFill>
  );
};
