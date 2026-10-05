export type FootageMode = 'off' | 'suggest' | 'auto';
export type FootageSource = 'pexels' | 'pixabay' | 'wikimedia' | 'nasa' | 'archive';

export interface FootageOptions {
  mode: FootageMode;
  sources: FootageSource[];
  maxTimelineShare: number;
  maxCandidatesPerBeat: number;
  maxQueryVariantsPerBeat: number;
  maxDownloadsPerBeat: number;
  downloadConcurrency: number;
  maxSearchRequestsPerEpisode: number;
  maxDownloadBytesPerEpisode: number;
  sourceAudio: 'mute';
  fallback: 'original-provider';
  targetVisualModes?: ('firefly_video' | 'generated_image_35mm')[];
}

export interface FootageBrief {
  schema: 'hsl-footage-brief/v1';
  episodeId: string;
  channelId: string;
  beatId: string;
  sourceBeatId: string;
  objective: string;
  narration: string;
  usage: 'illustrative_broll';
  queries: string[];
  exclusions: string[];
  durationFrames: number;
  durationSeconds: number;
  fallback: 'original-provider';
  hash: string;
}

export interface FootageCandidate {
  source: FootageSource;
  externalId: string;
  pageUrl: string;
  creator: string;
  creatorUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
  durationSeconds: number;
  query: string;
  licenseName: string;
  licenseUrl: string;
  commercialUse: boolean;
  modificationsAllowed: boolean;
  attributionRequired: boolean;
}

export interface FootageRightsReceipt {
  schema: 'hsl-footage-rights/v1';
  source: FootageSource;
  externalId: string;
  pageUrl: string;
  creator: string;
  creatorUrl: string;
  licenseName: string;
  licenseUrl: string;
  commercialUse: true;
  modificationsAllowed: true;
  attributionRequired: boolean;
  creditLine: string;
  checkedAt: string;
  policyVersion: 'hsl-footage-rights/1';
  decision: 'eligible';
}

export interface FootageArtifact {
  schema: 'hsl-footage-artifact/v1';
  beatId: string;
  sourceBeatId: string;
  provider: 'licensed-footage';
  source: FootageSource;
  externalId: string;
  sourcePageUrl: string;
  originalPath: string;
  originalSha256: string;
  videoPath: string;
  videoSha256: string;
  provenancePath: string;
  rightsReceiptPath: string;
  recipePath: string;
  durationFrames: number;
  durationSeconds: number;
  width: 1920;
  height: 1080;
  fps: 30;
  rightsStatus: 'approved';
  editorialStatus: 'pending' | 'approved' | 'rejected';
  technicalStatus: 'approved';
  creditLine: string;
  visualReviewPath?: string;
}

export interface FootageVisualReview {
  schema: 'hsl-footage-visual-review/v1';
  beatId: string;
  score: number;
  showsRealCameraFootage: boolean;
  semanticallyMatches: boolean;
  textOrWatermark: boolean;
  misleadingSpecificity: boolean;
  issues: string[];
  artifactSha256: string;
  briefHash: string;
  approved: boolean;
}

export interface FootageAcquisitionResult {
  artifacts: FootageArtifact[];
  failures: Array<{ beatId: string; reason: string }>;
  candidatesPath: string;
  manifestPath: string;
}
