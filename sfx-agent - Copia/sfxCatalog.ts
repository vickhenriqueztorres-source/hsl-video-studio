export interface SfxSourcePack {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly license: string;
  readonly licenseUrl: string;
  readonly downloadUrl: string;
  readonly defaultCategory: string;
}

export const SFX_SOURCE_PACKS: readonly SfxSourcePack[] = [
  {
    id: 'kenney-impact-sounds',
    name: 'Kenney Impact Sounds Pack',
    provider: 'Kenney.nl',
    license: 'CC0-1.0 (Public Domain)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    downloadUrl: 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
    defaultCategory: 'cinematic/impacts'
  },
  {
    id: 'kenney-interface-sounds',
    name: 'Kenney Interface Sounds Pack',
    provider: 'Kenney.nl',
    license: 'CC0-1.0 (Public Domain)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    downloadUrl: 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip',
    defaultCategory: 'ui'
  },
  {
    id: 'kenney-digital-audio',
    name: 'Kenney Digital Audio Pack',
    provider: 'Kenney.nl',
    license: 'CC0-1.0 (Public Domain)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    downloadUrl: 'https://kenney.nl/media/pages/assets/digital-audio/f240714ae3-1677590256/kenney_digital-audio.zip',
    defaultCategory: 'ui'
  },
  {
    id: 'kenney-scifi-sounds',
    name: 'Kenney Sci-Fi Sounds Pack',
    provider: 'Kenney.nl',
    license: 'CC0-1.0 (Public Domain)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    downloadUrl: 'https://kenney.nl/media/pages/assets/sci-fi-sounds/8061e89ff5-1677589578/kenney_sci-fi-sounds.zip',
    defaultCategory: 'sci-fi'
  },
  {
    id: 'kenney-rpg-audio',
    name: 'Kenney RPG & Foley Audio Pack',
    provider: 'Kenney.nl',
    license: 'CC0-1.0 (Public Domain)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    downloadUrl: 'https://kenney.nl/media/pages/assets/rpg-audio/cc34adfa2f-1677589886/kenney_rpg-audio.zip',
    defaultCategory: 'foley'
  },
  {
    id: 'kenney-ui-audio',
    name: 'Kenney UI Audio Pack',
    provider: 'Kenney.nl',
    license: 'CC0-1.0 (Public Domain)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    downloadUrl: 'https://kenney.nl/media/pages/assets/ui-audio/b9a3dc5425-1677590059/kenney_ui-audio.zip',
    defaultCategory: 'ui'
  },
  {
    id: 'kenney-casino-audio',
    name: 'Kenney Foley & Mechanism Pack',
    provider: 'Kenney.nl',
    license: 'CC0-1.0 (Public Domain)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    downloadUrl: 'https://kenney.nl/media/pages/assets/casino-audio/fc93046f41-1677589973/kenney_casino-audio.zip',
    defaultCategory: 'foley/household'
  },
  {
    id: 'kenney-voiceover-pack',
    name: 'Kenney Voiceover & Cinematic Vocal Pack',
    provider: 'Kenney.nl',
    license: 'CC0-1.0 (Public Domain)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    downloadUrl: 'https://kenney.nl/media/pages/assets/voiceover-pack/3962ec3616-1677590150/kenney_voiceover-pack.zip',
    defaultCategory: 'cinematic/tension'
  }
];

export interface CategoryRule {
  readonly targetSubdir: string;
  readonly prefix: string;
  readonly keywords: readonly string[];
}

export const SFX_CATEGORY_RULES: readonly CategoryRule[] = [
  // Cinematic categories
  {
    targetSubdir: 'cinematic/braams',
    prefix: 'braam_hit',
    keywords: ['braam', 'brass', 'horn', 'heavy_bell', 'alarm', 'foghorn']
  },
  {
    targetSubdir: 'cinematic/booms',
    prefix: 'boom_explosion',
    keywords: ['boom', 'explosion', 'blast', 'sub_drop', 'deep_impact', 'thud', 'cannon', 'detonate']
  },
  {
    targetSubdir: 'cinematic/impacts',
    prefix: 'impact_strike',
    keywords: ['impact', 'strike', 'hit', 'slam', 'smash', 'punch', 'clang', 'metal_light', 'metal_heavy']
  },
  {
    targetSubdir: 'cinematic/whooshes',
    prefix: 'whoosh_swoosh',
    keywords: ['whoosh', 'swoosh', 'swish', 'passby', 'flyby', 'air', 'whip', 'transition']
  },
  {
    targetSubdir: 'cinematic/tension',
    prefix: 'tension_riser',
    keywords: ['tension', 'riser', 'drone', 'screech', 'creak', 'suspense', 'string_swell', 'charge']
  },
  {
    targetSubdir: 'cinematic/loops',
    prefix: 'loop_atmosphere',
    keywords: ['loop', 'atmosphere', 'ambient', 'hum', 'bg_bed', 'pad', 'drone_loop', 'texture']
  },

  // Horror
  {
    targetSubdir: 'horror',
    prefix: 'horror_dark',
    keywords: ['horror', 'ghost', 'spooky', 'scary', 'jumpscare', 'stinger', 'dark', 'screaming', 'creepy']
  },

  // Sci-Fi
  {
    targetSubdir: 'sci-fi',
    prefix: 'scifi_laser',
    keywords: ['sci-fi', 'scifi', 'laser', 'teleport', 'hologram', 'forcefield', 'plasma', 'space', 'thruster', 'warp', 'phaser']
  },

  // UI
  {
    targetSubdir: 'ui',
    prefix: 'ui_click',
    keywords: ['ui', 'click', 'hover', 'notification', 'beep', 'button', 'toggle', 'select', 'confirm', 'pluck', 'pop', 'tap']
  },

  // Foley
  {
    targetSubdir: 'foley/footsteps',
    prefix: 'foley_footstep',
    keywords: ['footstep', 'step', 'walk', 'boot', 'grass_step', 'stone_step', 'wood_step', 'shoe']
  },
  {
    targetSubdir: 'foley/doors',
    prefix: 'foley_door',
    keywords: ['door', 'gate', 'latch', 'handle', 'open_door', 'close_door', 'creak_door', 'hinge']
  },
  {
    targetSubdir: 'foley/vehicles',
    prefix: 'foley_vehicle',
    keywords: ['vehicle', 'car', 'engine', 'motor', 'tire', 'brake', 'gear', 'horn', 'train', 'plane']
  },
  {
    targetSubdir: 'foley/household',
    prefix: 'foley_household',
    keywords: ['household', 'glass', 'cup', 'switch', 'cloth', 'paper', 'card', 'coin', 'chip', 'cutlery', 'book', 'zipper', 'drawer']
  }
];
