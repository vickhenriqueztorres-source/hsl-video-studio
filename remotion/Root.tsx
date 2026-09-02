import React from 'react';
import {Composition} from 'remotion';
import {HslEpisode} from './HslEpisode';
import {HslThumbnail, HslThumbnailProps} from './HslThumbnail';
import {TestVideo1Min} from './TestVideo1Min';
import {SubseaEpisodeComposition} from './SubseaEpisodeComposition';
import {HslLongFormComposition} from './HslLongFormComposition';
import {CinematicInfographicsShowcase} from './CinematicInfographicsShowcase';
import {HslEpisodeRenderProps} from './types';
import {
  HSL_FPS,
  HSL_VIDEO_WIDTH,
  HSL_VIDEO_HEIGHT,
  HSL_EPISODE_TARGET_DURATION_SECONDS,
  secondsToFrames
} from '../spec/hsl-spec';

const defaults: HslEpisodeRenderProps = {
  title: 'Hidden Systems Lab', fps: HSL_FPS, width: HSL_VIDEO_WIDTH, height: HSL_VIDEO_HEIGHT, totalDurationInFrames: 30,
  scenes: [{sceneId: 'HSL_DEFAULT', shotId: 'HSL_DEFAULT_V01', variant: 'ESTABLISH', chapterTitle: 'Hidden Systems Lab', narrativeFunction: 'title', visualMode: 'typography', visualSubject: 'Hidden Systems Lab', durationInFrames: 30, aiDisclosureRequired: false, transition: 'CUT'}]
};

const thumbnailDefaults: HslThumbnailProps = {
  baseImageSrc: 'identity/logo.png',
  headlineLines: ['HIDDEN', 'SYSTEM'],
  textSide: 'LEFT',
  role: 'MECHANISM'
};

import { HslSceneDirectorAgent } from '../hsl/core/hslSceneDirectorAgent';

const defaultTopicInput = {
  episodeId: 'HSL_EPISODE_004_JET_FUEL',
  topic: 'Why Airports Cannot Run Out of Fuel',
  entity: 'Airport Subterranean Pressurized Hydrant System & Jet A-1 Pipeline Grid',
  mechanism: 'High-Pressure Recirculating Ring Mains (150 PSI) & 52M-Gallon Continuous Buffer Farms',
  constraint: 'Hydraulic Surge Transients (Water Hammer), Micro-Particulate Filtration Thresholds & Zero-Tolerance Water Contamination',
  consequence: 'Immediate ground stop of 1,200 commercial airliners, international flight cancellations across 4 continents & $18.4M hourly airline disruption',
  thesis: 'Commercial aviation does not simply buy fuel—it relies on an extreme, synchronized subterranean pressure grid moving 52 million gallons without a single above-ground tanker truck.'
};

const defaultPlan = HslSceneDirectorAgent.planEpisodeFromScratch(defaultTopicInput);

export const RemotionRoot: React.FC = () => <>
  <Composition
    id="CinematicInfographicsShowcase"
    component={CinematicInfographicsShowcase}
    durationInFrames={750}
    fps={HSL_FPS}
    width={HSL_VIDEO_WIDTH}
    height={HSL_VIDEO_HEIGHT}
  />
  <Composition
    id="TestVideo1Min"
    component={TestVideo1Min}
    durationInFrames={1800}
    fps={HSL_FPS}
    width={HSL_VIDEO_WIDTH}
    height={HSL_VIDEO_HEIGHT}
  />
  <Composition
    id="SubseaEpisodeComposition"
    component={SubseaEpisodeComposition}
    durationInFrames={1800}
    fps={HSL_FPS}
    width={HSL_VIDEO_WIDTH}
    height={HSL_VIDEO_HEIGHT}
  />
  <Composition
    id="HslLongFormComposition"
    component={HslLongFormComposition}
    durationInFrames={secondsToFrames(HSL_EPISODE_TARGET_DURATION_SECONDS)}
    fps={HSL_FPS}
    width={HSL_VIDEO_WIDTH}
    height={HSL_VIDEO_HEIGHT}
    defaultProps={defaultPlan}
  />
  <Composition
    id="HslEpisode"
    component={HslEpisode}
    durationInFrames={defaults.totalDurationInFrames}
    fps={defaults.fps}
    width={defaults.width}
    height={defaults.height}
    defaultProps={defaults}
  />
  <Composition
    id="HslThumbnail"
    component={HslThumbnail}
    durationInFrames={1}
    fps={HSL_FPS}
    width={HSL_VIDEO_WIDTH}
    height={HSL_VIDEO_HEIGHT}
    defaultProps={thumbnailDefaults}
  />
</>;
