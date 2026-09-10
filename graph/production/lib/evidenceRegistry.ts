import fs from 'node:fs';
import path from 'node:path';

export type EvidenceConfidenceTier = 'primary' | 'secondary' | 'reconstruction';
export type EvidenceSourceType =
  | 'police_report'
  | 'court_record'
  | 'central_bank'
  | 'telecom_log'
  | 'academic_study'
  | 'press'
  | 'expert_testimony'
  | 'demonstration';

export interface EvidenceSource {
  id: string;
  title: string;
  type: EvidenceSourceType;
  publisher?: string;
  url?: string;
  doi?: string;
  accessedAt: string;
  confidenceTier: EvidenceConfidenceTier;
  notes?: string;
}

export interface Claim {
  id: string;
  statement: string;
  sources: string[]; // EvidenceSource ids
  confidenceTier: EvidenceConfidenceTier;
  status: 'verified' | 'disputed' | 'illustrative';
  verificationNotes?: string;
}

export interface SceneEvidence {
  sceneId: string;
  beatId: string;
  claims: string[];
  reconstructionDisclaimerRequired: boolean;
  displayLabel?: string;
  evidenceSummary?: string;
}

export interface EvidencePackage {
  episodeId: string;
  channelId: string;
  createdAt: string;
  sources: EvidenceSource[];
  claims: Claim[];
  sceneMap: Record<string, SceneEvidence>;
}

export function createEvidencePackage(
  episodeId: string,
  channelId: string,
  sources: EvidenceSource[] = [],
  claims: Claim[] = [],
  sceneMap: Record<string, SceneEvidence> = {}
): EvidencePackage {
  return {
    episodeId,
    channelId,
    createdAt: new Date().toISOString(),
    sources,
    claims,
    sceneMap,
  };
}

export function validateEvidencePackage(pkg: EvidencePackage): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const sourceIds = new Set(pkg.sources.map(s => s.id));

  for (const claim of pkg.claims) {
    for (const sourceId of claim.sources) {
      if (!sourceIds.has(sourceId)) {
        errors.push(`Claim "${claim.id}" references non-existent source "${sourceId}".`);
      }
    }
  }

  const claimIds = new Set(pkg.claims.map(c => c.id));
  for (const [beatId, sceneEv] of Object.entries(pkg.sceneMap)) {
    for (const claimId of sceneEv.claims) {
      if (!claimIds.has(claimId)) {
        errors.push(`Scene "${beatId}" references non-existent claim "${claimId}".`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function saveEvidencePackage(runDir: string, pkg: EvidencePackage): string {
  const target = path.join(runDir, 'evidence-package.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(pkg, null, 2) + '\n');
  return target;
}

export function loadEvidencePackage(runDir: string): EvidencePackage | null {
  const target = path.join(runDir, 'evidence-package.json');
  if (!fs.existsSync(target)) return null;
  try {
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch {
    return null;
  }
}
