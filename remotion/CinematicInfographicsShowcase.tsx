import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {CinematicInfographic, CinematicInfographicProps} from './motion/CinematicInfographic';

export const INFOGRAPHIC_SCENES: readonly CinematicInfographicProps[] = [
  {
    imageSrc: 'infographics/01_hero_systems_in_motion.jpg',
    headline: ['SYSTEMS', 'IN MOTION'],
    archetype: 'HERO_PIPELINE',
    cameraMotion: 'DOLLY_IN'
  },
  {
    imageSrc: 'infographics/02_bottleneck_delay_spreads.jpg',
    headline: ['DELAY', 'SPREADS'],
    archetype: 'BOTTLENECK_RADIAL',
    cameraMotion: 'SLOW_PAN'
  },
  {
    imageSrc: 'infographics/03_satellite_pipeline_map.jpg',
    headline: ['SYSTEM', 'NETWORK'],
    archetype: 'SATELLITE_MAP',
    cameraMotion: 'DOLLY_IN'
  },
  {
    imageSrc: 'infographics/04_cutaway_buffer_and_flow.jpg',
    headline: ['BUFFER', '& FLOW'],
    archetype: 'CUTAWAY_FLOW',
    cameraMotion: 'TILT_UP'
  },
  {
    imageSrc: 'infographics/05_macro_last_meters.jpg',
    headline: ['LAST', 'METERS'],
    archetype: 'MACRO_TELEMETRY',
    cameraMotion: 'DOLLY_IN',
    metricValue: 87
  }
];

export const CinematicInfographicsShowcase: React.FC = () => {
  const sceneDurationFrames = 150; // 5 segundos por cena (a 30 fps)

  return (
    <AbsoluteFill style={{backgroundColor: '#07080B'}}>
      {INFOGRAPHIC_SCENES.map((scene, index) => (
        <Sequence
          key={index}
          from={index * sceneDurationFrames}
          durationInFrames={sceneDurationFrames}
        >
          <CinematicInfographic {...scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
