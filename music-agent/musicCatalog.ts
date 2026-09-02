export type MusicMood = 'epic' | 'suspense' | 'emotional' | 'ambient' | 'action';

export interface MusicTrackSource {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly mood: MusicMood;
  readonly genre: string;
  readonly license: string;
  readonly licenseUrl: string;
  readonly downloadUrl: string;
  readonly attributionRequired: boolean;
  readonly attributionText: string;
}

export interface MusicCategoryRule {
  readonly targetSubdir: string;
  readonly prefix: string;
  readonly mood: MusicMood;
  readonly keywords: readonly string[];
}

export const MUSIC_CATEGORY_RULES: readonly MusicCategoryRule[] = [
  {
    targetSubdir: 'cinematic/epic',
    prefix: 'epic_orchestra',
    mood: 'epic',
    keywords: ['epic', 'orchestral', 'trailer', 'heroic', 'cinematic_epic', 'battle_theme', 'monumental', 'triumph']
  },
  {
    targetSubdir: 'cinematic/suspense',
    prefix: 'suspense_strings',
    mood: 'suspense',
    keywords: ['suspense', 'tension', 'mystery', 'thriller', 'dark', 'investigation', 'horror', 'danger', 'creepy']
  },
  {
    targetSubdir: 'cinematic/emotional',
    prefix: 'emotional_piano',
    mood: 'emotional',
    keywords: ['emotional', 'dramatic', 'piano', 'sad', 'heartbreaking', 'nostalgic', 'reflective', 'sorrow', 'hopeful']
  },
  {
    targetSubdir: 'cinematic/ambient',
    prefix: 'ambient_drone',
    mood: 'ambient',
    keywords: ['ambient', 'atmospheric', 'drone', 'pad', 'space', 'soundscape', 'calm', 'texture', 'minimalist']
  },
  {
    targetSubdir: 'cinematic/action',
    prefix: 'action_percussion',
    mood: 'action',
    keywords: ['action', 'percussion', 'rhythm', 'drums', 'taiko', 'fast', 'chase', 'combat', 'war', 'driving']
  }
];

export const DIRECT_MUSIC_TRACKS: readonly MusicTrackSource[] = [
  // Incompetech / Kevin MacLeod Classics (CC BY 4.0)
  {
    id: 'incompetech-impact-moderato',
    title: 'Impact Moderato',
    artist: 'Kevin MacLeod',
    mood: 'epic',
    genre: 'Cinematic Orchestral',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    downloadUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Impact%20Moderato.mp3',
    attributionRequired: true,
    attributionText: 'Impact Moderato by Kevin MacLeod (incompetech.com) Licensed under CC BY 4.0'
  },
  {
    id: 'incompetech-clash-defiant',
    title: 'Clash Defiant',
    artist: 'Kevin MacLeod',
    mood: 'epic',
    genre: 'Cinematic Orchestral',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    downloadUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Clash%20Defiant.mp3',
    attributionRequired: true,
    attributionText: 'Clash Defiant by Kevin MacLeod (incompetech.com) Licensed under CC BY 4.0'
  },
  {
    id: 'incompetech-prelude-and-action',
    title: 'Prelude and Action',
    artist: 'Kevin MacLeod',
    mood: 'action',
    genre: 'Action Percussion',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    downloadUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Prelude%20and%20Action.mp3',
    attributionRequired: true,
    attributionText: 'Prelude and Action by Kevin MacLeod (incompetech.com) Licensed under CC BY 4.0'
  },
  {
    id: 'incompetech-volatile-reaction',
    title: 'Volatile Reaction',
    artist: 'Kevin MacLeod',
    mood: 'action',
    genre: 'Action Percussion',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    downloadUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Volatile%20Reaction.mp3',
    attributionRequired: true,
    attributionText: 'Volatile Reaction by Kevin MacLeod (incompetech.com) Licensed under CC BY 4.0'
  },
  {
    id: 'incompetech-unseen-horrors',
    title: 'Unseen Horrors',
    artist: 'Kevin MacLeod',
    mood: 'suspense',
    genre: 'Suspense Thriller',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    downloadUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Unseen%20Horrors.mp3',
    attributionRequired: true,
    attributionText: 'Unseen Horrors by Kevin MacLeod (incompetech.com) Licensed under CC BY 4.0'
  },
  {
    id: 'incompetech-oppressive-gloom',
    title: 'Oppressive Gloom',
    artist: 'Kevin MacLeod',
    mood: 'suspense',
    genre: 'Dark Tension',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    downloadUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Oppressive%20Gloom.mp3',
    attributionRequired: true,
    attributionText: 'Oppressive Gloom by Kevin MacLeod (incompetech.com) Licensed under CC BY 4.0'
  },
  {
    id: 'incompetech-heartbreaking',
    title: 'Heartbreaking',
    artist: 'Kevin MacLeod',
    mood: 'emotional',
    genre: 'Dramatic Piano',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    downloadUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heartbreaking.mp3',
    attributionRequired: true,
    attributionText: 'Heartbreaking by Kevin MacLeod (incompetech.com) Licensed under CC BY 4.0'
  },
  {
    id: 'incompetech-decisions',
    title: 'Decisions',
    artist: 'Kevin MacLeod',
    mood: 'emotional',
    genre: 'Reflective Strings',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    downloadUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Decisions.mp3',
    attributionRequired: true,
    attributionText: 'Decisions by Kevin MacLeod (incompetech.com) Licensed under CC BY 4.0'
  },
  {
    id: 'incompetech-gloom-horizon',
    title: 'Gloom Horizon',
    artist: 'Kevin MacLeod',
    mood: 'ambient',
    genre: 'Atmospheric Drone',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    downloadUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gloom%20Horizon.mp3',
    attributionRequired: true,
    attributionText: 'Gloom Horizon by Kevin MacLeod (incompetech.com) Licensed under CC BY 4.0'
  },
  {
    id: 'incompetech-long-note-two',
    title: 'Long Note Two',
    artist: 'Kevin MacLeod',
    mood: 'ambient',
    genre: 'Deep Space Ambient',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    downloadUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Long%20Note%20Two.mp3',
    attributionRequired: true,
    attributionText: 'Long Note Two by Kevin MacLeod (incompetech.com) Licensed under CC BY 4.0'
  }
];
