import fs from 'fs';
import path from 'path';
import {RagQuery} from './query-builder';

export interface RagChunk {
  readonly id: string;
  readonly sourceFile: string;
  readonly title: string;
  readonly summary: string;
  readonly content: string;
  readonly knowledgeType: string;
  readonly tags: readonly string[];
  readonly confidence: string;
  readonly relatedConcepts: readonly string[];
}

export interface RagDecisionRule {
  readonly id: string;
  readonly category: string;
  readonly when: readonly string[];
  readonly recommend: readonly string[];
  readonly avoid: readonly string[];
  readonly reason: string;
  readonly sourceChunks: readonly string[];
  readonly confidence: string;
}

export interface RagMixGuidelines {
  readonly levels_heuristic_db: {
    readonly dialogue: { readonly target_db: number };
    readonly sound_effects_sfx: { readonly range_min_db: number; readonly range_max_db: number };
    readonly score_music: { readonly range_min_db: number; readonly range_max_db: number };
  };
  readonly master_bus: {
    readonly hard_limiter_ceiling_db: number;
  };
}

export class RagClient {
  private readonly rootDir: string;
  private chunks: RagChunk[] = [];
  private rules: RagDecisionRule[] = [];
  private mixGuidelines: RagMixGuidelines | null = null;

  constructor(baseDir = process.cwd()) {
    this.rootDir = path.resolve(baseDir);
    this.loadIndices();
  }

  private loadIndices(): void {
    const indexPath = path.join(this.rootDir, 'rag', 'index', 'knowledge-index.json');
    const rulesPath = path.join(this.rootDir, 'rag', 'index', 'decision-rules.json');
    const guidelinesPath = path.join(this.rootDir, 'rag', 'index', 'mix-guidelines.json');

    if (fs.existsSync(indexPath)) {
      const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      this.chunks = parsed.chunks || [];
    }
    if (fs.existsSync(rulesPath)) {
      this.rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    }
    if (fs.existsSync(guidelinesPath)) {
      this.mixGuidelines = JSON.parse(fs.readFileSync(guidelinesPath, 'utf8'));
    }
  }

  public getRulesByCategory(category: string): RagDecisionRule[] {
    return this.rules.filter(r => r.category === category);
  }

  public search(query: RagQuery): {
    chunks: RagChunk[];
    rules: RagDecisionRule[];
  } {
    const matchedChunks = new Set<RagChunk>();
    const matchedRules = new Set<RagDecisionRule>();

    const searchTags = query.tags || [];

    for (const chunk of this.chunks) {
      for (const tag of searchTags) {
        if (chunk.tags.includes(tag) || chunk.relatedConcepts.includes(tag)) {
          matchedChunks.add(chunk);
        }
      }
    }

    for (const rule of this.rules) {
      for (const tag of searchTags) {
        if (rule.category === tag) {
          matchedRules.add(rule);
        }
      }
    }

    return {
      chunks: Array.from(matchedChunks),
      rules: Array.from(matchedRules)
    };
  }

  public getMixGuidelines(): RagMixGuidelines {
    return this.mixGuidelines || {
      levels_heuristic_db: {
        dialogue: { target_db: -12.0 },
        sound_effects_sfx: { range_min_db: -30.0, range_max_db: -10.0 },
        score_music: { range_min_db: -30.0, range_max_db: -20.0 }
      },
      master_bus: {
        hard_limiter_ceiling_db: -2.5
      }
    };
  }
}
