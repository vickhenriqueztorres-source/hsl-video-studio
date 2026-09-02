export interface HslChapterSpec {
  readonly chapterId: string;
  readonly chapterTitle: string;
  readonly durationSeconds: number;
  readonly totalFrames: number;
  readonly narrationScript: string;
  readonly visualMode: 'hybrid_35mm' | 'firefly_video' | 'vector_remotion';
  readonly stage: string;
  readonly videoSrc?: string;
  readonly backgroundImage?: string;
}

export interface HslEpisodeManifest {
  readonly episodeTitle: string;
  readonly subtitle: string;
  readonly format: string;
  readonly totalDurationSeconds: number;
  readonly totalFrames: number;
  readonly chapters: readonly HslChapterSpec[];
  readonly thesis: string;
}

/**
 * ==============================================================================
 * HIDDEN SYSTEMS LAB (HSL) - EPISODE 002 MANIFEST
 * "THE PHYSICAL INTERNET BENEATH THE OCEAN"
 * Reference: docs2/brifieng .md | CONT5_THUMBNAIL_SEO_PSYCHOLOGY.md
 * ==============================================================================
 */
export const SUBSEA_FIBER_EPISODE_MANIFEST: HslEpisodeManifest = {
  episodeTitle: 'THE PHYSICAL INTERNET BENEATH THE OCEAN',
  subtitle: 'SUBSEA FIBER LOGISTICS & THE 10,000-VOLT BOTTLENECK',
  format: 'SYSTEM_ANATOMY',
  totalDurationSeconds: 60,
  totalFrames: 1800,
  thesis: 'The "cloud" is not in the sky; it is a physical underwater grid of glass and copper operating at the absolute boundary of optical physics.',
  chapters: [
    {
      chapterId: 'ACT_01_THE_CLOUD_ILLUSION',
      chapterTitle: 'THE BEACH LANDING',
      durationSeconds: 10,
      totalFrames: 300,
      stage: 'NORMAL OPERATION',
      visualMode: 'firefly_video',
      videoSrc: 'videos/scenes/scene_01_tarmac.mp4',
      backgroundImage: 'images/scenes/scene_03_optical_fiber.png',
      narrationScript: 'We think of the internet as an invisible cloud floating in the sky. But ninety-nine percent of all intercontinental data travels through a seventeen-millimeter cable resting on the ocean floor.'
    },
    {
      chapterId: 'ACT_02_QUANTUM_LASER_FLOW',
      chapterTitle: 'THE PETABIT LASER PIPELINE',
      durationSeconds: 10,
      totalFrames: 300,
      stage: 'SYSTEM THROUGHPUT',
      visualMode: 'vector_remotion',
      narrationScript: 'Inside each strand of pure glass, infrared lasers pulse petabits of financial transactions, video streams, and communications across six thousand miles of dark oceanic abyss.'
    },
    {
      chapterId: 'ACT_03_VOLTAGE_REPEATERS',
      chapterTitle: 'THE 10,000-VOLT CURRENT LOOP',
      durationSeconds: 10,
      totalFrames: 300,
      stage: 'CAPACITY LIMIT',
      visualMode: 'firefly_video',
      videoSrc: 'videos/scenes/scene_03_terminal.mp4',
      backgroundImage: 'images/scenes/scene_02_server_vault.png',
      narrationScript: 'Light fades after fifty miles. To keep photons moving, continuous ten-thousand-volt direct current powers undersea optical repeaters, amplifying weakened laser pulses before dispersion destroys the signal.'
    },
    {
      chapterId: 'ACT_04_THE_ANCHOR_SEVER',
      chapterTitle: 'THE 4,000-METER SNAG',
      durationSeconds: 10,
      totalFrames: 300,
      stage: 'BOTTLENECK REVEAL',
      visualMode: 'vector_remotion',
      narrationScript: 'Then, at four thousand meters depth, a stray commercial anchor drags across the seabed. In two milliseconds, the physical glass snaps—and an entire transoceanic corridor goes dark.'
    },
    {
      chapterId: 'ACT_05_BGP_ROUTE_SURGE',
      chapterTitle: 'CASCADE SATURATION & BACKLOG',
      durationSeconds: 10,
      totalFrames: 300,
      stage: 'SYSTEM CONSEQUENCES',
      visualMode: 'firefly_video',
      videoSrc: 'videos/scenes/scene_09_control_room.mp4',
      backgroundImage: 'images/scenes/scene_04_control_room.png',
      narrationScript: 'Autonomous routing protocols instantly deflect traffic to surviving cables. But bandwidth surges to ninety-four percent capacity, spiking latency and creating global backlogs.'
    },
    {
      chapterId: 'ACT_06_OCEAN_REPAIR_THESIS',
      chapterTitle: 'THE ARCHITECTURE OF GLASS',
      durationSeconds: 10,
      totalFrames: 300,
      stage: 'INTERPRETATION',
      visualMode: 'vector_remotion',
      narrationScript: 'Global digital civilization does not live in ethereal space. It rests on fragile glass threads at the bottom of the sea. Welcome to Hidden Systems Lab.'
    }
  ]
};
