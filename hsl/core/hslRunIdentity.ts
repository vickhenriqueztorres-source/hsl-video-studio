import path from 'path';

export interface HslRunIdComponents {
  readonly project: string;     // Ex: 'hsl', 'subsea'
  readonly episode: string;     // Ex: 'ep001', 'ep002'
  readonly version: number;     // Ex: 1, 2, 3
  readonly shortSuffix?: string; // Ex: 'a1b2'
}

export class HslRunIdentity {
  /**
   * Constrói o Run ID longo canônico imutável: <project>/<episode>/v<version>
   * Ex: "hsl/ep001/v1"
   */
  public static buildRunId(project: string, episode: string, version: number = 1): string {
    const cleanProject = project.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanEpisode = episode.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return `${cleanProject}/${cleanEpisode}/v${version}`;
  }

  /**
   * Constrói o handle curto colável para terminal e chat: <project>-<episode>-v<version>
   * Ex: "hsl-ep001-v1"
   */
  public static buildHandle(project: string, episode: string, version: number = 1, artifactSuffix?: string): string {
    const cleanProject = project.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanEpisode = episode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const base = `${cleanProject}-${cleanEpisode}-v${version}`;
    return artifactSuffix ? `${base}-${artifactSuffix}` : base;
  }

  /**
   * Faz o parse de uma string de Run ID ou Handle em seus componentes.
   */
  public static parse(input: string): HslRunIdComponents {
    const normalized = input.trim().replace(/\\/g, '/');

    // Caso 1: Formato hierárquico: "hsl/ep001/v1"
    const hierMatch = normalized.match(/^([a-z0-9_-]+)\/([a-z0-9_-]+)\/v(\d+)$/i);
    if (hierMatch) {
      return {
        project: hierMatch[1].toLowerCase(),
        episode: hierMatch[2].toLowerCase(),
        version: parseInt(hierMatch[3], 10)
      };
    }

    // Caso 2: Formato handle curto: "hsl-ep001-v1"
    const handleMatch = normalized.match(/^([a-z0-9]+)-([a-z0-9]+)-v(\d+)$/i);
    if (handleMatch) {
      return {
        project: handleMatch[1].toLowerCase(),
        episode: handleMatch[2].toLowerCase(),
        version: parseInt(handleMatch[3], 10)
      };
    }

    // Caso 3: Formato legado: "HSL_EPISODE_001" -> mapeia para project='hsl', episode='ep001', version=1
    const legacyMatch = normalized.match(/^HSL_EPISODE_(\d+)/i);
    if (legacyMatch) {
      const epNum = String(parseInt(legacyMatch[1], 10)).padStart(3, '0');
      return {
        project: 'hsl',
        episode: `ep${epNum}`,
        version: 1
      };
    }

    // Caso 4: Formato legado subsea: "HSL_SUBSEA_001"
    const legacySubsea = normalized.match(/^HSL_SUBSEA_(\d+)/i);
    if (legacySubsea) {
      const epNum = String(parseInt(legacySubsea[1], 10)).padStart(3, '0');
      return {
        project: 'subsea',
        episode: `ep${epNum}`,
        version: 1
      };
    }

    throw new Error(`INVALID_RUN_IDENTITY: Não foi possível identificar o formato da run em '${input}'. Formatos válidos: 'hsl/ep001/v1' ou 'hsl-ep001-v1'.`);
  }

  /**
   * Retorna o path do diretório da run no filesystem com isolamento de namespace.
   * Ex: "runs/hsl/ep001/v1"
   */
  public static getRunDirectory(components: HslRunIdComponents, rootDir: string = process.cwd()): string {
    return path.resolve(rootDir, 'runs', components.project, components.episode, `v${components.version}`);
  }

  /**
   * Retorna o path relativo de staticFile do Remotion para a run.
   * Ex: "runs/hsl/ep001/v1"
   */
  public static getPublicRunDirectory(components: HslRunIdComponents, rootDir: string = process.cwd()): string {
    return path.resolve(rootDir, 'public', 'runs', components.project, components.episode, `v${components.version}`);
  }

  /**
   * Valida o isolamento entre projetos (anti-cruzamento).
   */
  public static assertProjectNamespace(expectedProject: string, targetRunIdOrHandle: string): void {
    const target = this.parse(targetRunIdOrHandle);
    if (target.project !== expectedProject.toLowerCase()) {
      throw new Error(
        `CROSS_PROJECT_VIOLATION_FATAL: Tentativa de acessar artefato do projeto '${target.project}' dentro do namespace isolado do projeto '${expectedProject}'.`
      );
    }
  }
}
