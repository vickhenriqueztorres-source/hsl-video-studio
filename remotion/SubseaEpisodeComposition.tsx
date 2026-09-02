import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, Video, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {
  AnchorSeverRadar,
  BgpOverloadCard,
  HslSubseaHeader,
  MasterSubseaPressureMap,
  OpticalRepeaterGrid,
  RepairShipPanel,
  SUBSEA_PALETTE,
  SubseaBandwidthOverlay
} from './motion/SubseaFiberComponents';
import {RemotionCinematicAudioBed} from './TestVideo1MinAudio';

const SCENES = [
  {id: 'BEAT_01', type: 'image', media: 'images/scenes/scene_03_optical_fiber.png', stage: 'THE BEACH LANDING'},
  {id: 'BEAT_02', type: 'video', media: 'videos/scenes/scene_01_tarmac.mp4', stage: 'PETABIT LASER FLOW'},
  {id: 'BEAT_03', type: 'image', media: 'images/scenes/scene_02_server_vault.png', stage: 'SIGNAL DISPERSION'},
  {id: 'BEAT_04', type: 'video', media: 'videos/scenes/scene_03_terminal.mp4', stage: '10,000-VOLT FEED'},
  {id: 'BEAT_05', type: 'vector', stage: 'OPTICAL REPEATERS'},
  {id: 'BEAT_06', type: 'vector', stage: 'ANCHOR SEVER AT 4,000M'},
  {id: 'BEAT_07', type: 'video', media: 'videos/scenes/scene_07_queue.mp4', stage: 'BGP OVERLOAD'},
  {id: 'BEAT_08', type: 'image', media: 'images/scenes/scene_04_control_room.png', stage: 'BANDWIDTH SATURATION'},
  {id: 'BEAT_09', type: 'video', media: 'videos/scenes/scene_09_control_room.mp4', stage: 'REPAIR SHIP SPLICING'},
  {id: 'BEAT_10', type: 'image', media: 'images/scenes/scene_01_macro_glow.png', stage: 'GLOBAL LATENCY SPIKE'},
  {id: 'BEAT_11', type: 'video', media: 'videos/scenes/scene_11_city_aerial.mp4', stage: 'SYSTEM CONSEQUENCES'},
  {id: 'BEAT_12', type: 'vector', stage: 'THE ARCHITECTURE OF GLASS'}
];

const BackgroundMediaLayer: React.FC<{
  type: 'video' | 'image';
  media: string;
  duration: number;
  index: number;
}> = ({type, media, duration, index}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, duration], [1.02, 1.08], {extrapolateRight: 'clamp'});
  const translateY = interpolate(frame, [0, duration], [0, index % 2 === 0 ? -10 : 10], {extrapolateRight: 'clamp'});

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
        <AbsoluteFill style={{
          background: 'radial-gradient(circle at center, rgba(13,14,21,0.25) 0%, rgba(13,14,21,0.85) 100%)'
        }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SubseaEpisodeComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: SUBSEA_PALETTE.obsidian, color: SUBSEA_PALETTE.text}}>
      {/* 1. SCENE 01 - THE BEACH LANDING (Image 35mm) */}
      <Sequence from={0} durationInFrames={150}>
        <BackgroundMediaLayer type="image" media={SCENES[0].media!} duration={150} index={0} />
        <HslSubseaHeader stageTitle={SCENES[0].stage} />
        <SubseaBandwidthOverlay startPercent={55} endPercent={64} label="GLOBAL INTERNET LOAD" />
      </Sequence>

      {/* 2. SCENE 02 - PETABIT LASER FLOW (Video) */}
      <Sequence from={150} durationInFrames={150}>
        <BackgroundMediaLayer type="video" media={SCENES[1].media!} duration={150} index={1} />
        <HslSubseaHeader stageTitle={SCENES[1].stage} />
        <SubseaBandwidthOverlay startPercent={64} endPercent={72} label="LASER THROUGHPUT" />
      </Sequence>

      {/* 3. SCENE 03 - SIGNAL DISPERSION (Image 35mm) */}
      <Sequence from={300} durationInFrames={150}>
        <BackgroundMediaLayer type="image" media={SCENES[2].media!} duration={150} index={2} />
        <HslSubseaHeader stageTitle={SCENES[2].stage} />
        <SubseaBandwidthOverlay startPercent={72} endPercent={81} label="ATTENUATION RATE" />
      </Sequence>

      {/* 4. SCENE 04 - 10,000-VOLT FEED (Video) */}
      <Sequence from={450} durationInFrames={150}>
        <BackgroundMediaLayer type="video" media={SCENES[3].media!} duration={150} index={3} />
        <HslSubseaHeader stageTitle={SCENES[3].stage} />
        <SubseaBandwidthOverlay startPercent={81} endPercent={89} label="VOLTAGE LOAD" />
      </Sequence>

      {/* 5. SCENE 05 - OPTICAL REPEATERS (Pure Vector) */}
      <Sequence from={600} durationInFrames={150}>
        <HslSubseaHeader stageTitle={SCENES[4].stage} />
        <OpticalRepeaterGrid />
      </Sequence>

      {/* 6. SCENE 06 - ANCHOR SEVER AT 4,000M (Pure Vector) */}
      <Sequence from={750} durationInFrames={150}>
        <HslSubseaHeader stageTitle={SCENES[5].stage} />
        <AnchorSeverRadar />
      </Sequence>

      {/* 7. SCENE 07 - BGP OVERLOAD (Video) */}
      <Sequence from={900} durationInFrames={150}>
        <BackgroundMediaLayer type="video" media={SCENES[6].media!} duration={150} index={6} />
        <HslSubseaHeader stageTitle={SCENES[6].stage} />
        <BgpOverloadCard />
      </Sequence>

      {/* 8. SCENE 08 - BANDWIDTH SATURATION (Image 35mm) */}
      <Sequence from={1050} durationInFrames={150}>
        <BackgroundMediaLayer type="image" media={SCENES[7].media!} duration={150} index={7} />
        <HslSubseaHeader stageTitle={SCENES[7].stage} />
        <SubseaBandwidthOverlay startPercent={89} endPercent={94} label="CRITICAL SATURATION" />
      </Sequence>

      {/* 9. SCENE 09 - REPAIR SHIP SPLICING (Video) */}
      <Sequence from={1200} durationInFrames={150}>
        <BackgroundMediaLayer type="video" media={SCENES[8].media!} duration={150} index={8} />
        <HslSubseaHeader stageTitle={SCENES[8].stage} />
        <RepairShipPanel />
      </Sequence>

      {/* 10. SCENE 10 - GLOBAL LATENCY SPIKE (Image 35mm) */}
      <Sequence from={1350} durationInFrames={150}>
        <BackgroundMediaLayer type="image" media={SCENES[9].media!} duration={150} index={9} />
        <HslSubseaHeader stageTitle={SCENES[9].stage} />
        <div style={{
          position: 'absolute',
          left: 80,
          top: '35%',
          background: 'rgba(13,14,21,0.94)',
          border: `2px solid ${SUBSEA_PALETTE.hyperOrange}`,
          padding: '32px 38px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{color: SUBSEA_PALETTE.muted, fontSize: 13, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, letterSpacing: '0.12em'}}>
            NETWORK DEGRADATION // IMPACT
          </div>
          <div style={{color: SUBSEA_PALETTE.acidYellow, fontSize: 56, fontFamily: 'system-ui, "Arial Black", sans-serif', fontWeight: 900, marginTop: 8}}>
            PACKET LOSS +42%
          </div>
          <div style={{color: SUBSEA_PALETTE.hyperOrange, fontSize: 38, fontFamily: 'system-ui, "Arial Black", sans-serif', fontWeight: 900, marginTop: 8}}>
            FINANCIAL LATENCY +85MS
          </div>
        </div>
      </Sequence>

      {/* 11. SCENE 11 - SYSTEM CONSEQUENCES (Video) */}
      <Sequence from={1500} durationInFrames={150}>
        <BackgroundMediaLayer type="video" media={SCENES[10].media!} duration={150} index={10} />
        <HslSubseaHeader stageTitle={SCENES[10].stage} />
        <div style={{
          position: 'absolute',
          left: 80,
          right: 80,
          bottom: 100,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          fontFamily: 'system-ui, sans-serif'
        }}>
          {[
            {label: 'TOTAL DATA TRANSFERRED', value: '4.8 PB/s', color: SUBSEA_PALETTE.text},
            {label: 'ACTIVE SUBSEA CABLES', value: '552', color: SUBSEA_PALETTE.kleinBlue},
            {label: 'REPAIR TIME AT SEA', value: '14 DAYS', color: SUBSEA_PALETTE.hyperOrange},
            {label: 'ESTIMATED IMPACT', value: '$1.4B/HR', color: SUBSEA_PALETTE.acidYellow}
          ].map(stat => (
            <div key={stat.label} style={{background: 'rgba(13,14,21,0.94)', border: `1px solid ${SUBSEA_PALETTE.border}`, padding: '24px 20px'}}>
              <div style={{color: SUBSEA_PALETTE.muted, fontSize: 11, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700}}>{stat.label}</div>
              <div style={{color: stat.color, fontSize: 36, fontFamily: 'system-ui, "Arial Black", sans-serif', fontWeight: 900, marginTop: 6}}>{stat.value}</div>
            </div>
          ))}
        </div>
      </Sequence>

      {/* 12. SCENE 12 - THE ARCHITECTURE OF GLASS (Pure Vector) */}
      <Sequence from={1650} durationInFrames={150}>
        <HslSubseaHeader stageTitle={SCENES[11].stage} />
        <MasterSubseaPressureMap />
      </Sequence>

      {/* 🎙️ HERO NARRATION: CHRIS VOICE (0 dB Nominal Master) */}
      <Audio src={staticFile('audio/subsea_narration_chris_en.mp3')} volume={1.0} />

      {/* 🎼 BACKGROUND TENSION SCORE (Subtle -26 dB with Ducking) */}
      <Audio
        src={staticFile('audio/music/cinematic/suspense/suspense_oppressive_gloom.mp3')}
        volume={(f) => 0.045}
      />

      {/* 🔊 REBALANCED SOUND DESIGN BED */}
      <RemotionCinematicAudioBed />
    </AbsoluteFill>
  );
};
