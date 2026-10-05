import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from '../checkpointer';
import { prepareAndRunIdeTaskWithFailover } from '../ide/ideRunner';
import { IdeTask } from '../ide/types';
import type { ChannelId } from '../../channels/types';
import {
  ThemeIdea,
  findDuplicate,
  saveDynamicThemes,
  themeRecords,
  HSL_CATALOG,
  BRECHA_CATALOG
} from './themeRegistry';

/** Curated emergency viral pool if offline or IDE headless is not authenticated */
const FALLBACK_VIRAL_THEMES: Record<ChannelId, ThemeIdea[]> = {
  hsl: [
    {
      theme: 'A inércia rotativa oculta que impede a rede elétrica continental de colapsar',
      title: 'Why the Entire Power Grid Will Collapse if It Drops by 0.5 Hertz',
      entity: 'Grid Synchronous Inertia & Turbine Mechanical Mass',
      mechanism: 'Massive rotating steel turbines providing kinetic frequency buffering during generator trips',
      constraint: 'Only 4 seconds of mechanical inertia before catastrophic frequency cascade',
      consequence: 'Automatic under-frequency relays trip cities offline to save turbines from self-destruction',
      thesis: 'The electrical grid cannot store electricity directly; it is balanced by pure physical inertia of rotating steel.'
    },
    {
      theme: 'A rede de tubos e bombas que impede navios de 200 mil toneladas de tombarem',
      title: 'The Invisible Fluid Network That Stops 200,000-Ton Ships From Flipping Over',
      entity: 'Dynamic Anti-Heeling Ballast System',
      mechanism: 'Reversible high-capacity pumps transferring seawater across double hulls in seconds',
      constraint: 'Metacentric height reduction and free surface effect during high-speed loading',
      consequence: 'A single valve failure can capsize a 24,000-TEU container ship at the berth',
      thesis: 'Mega container ships violate gravitational intuition through continuous, automated fluid displacement beneath the waterline.'
    },
    {
      theme: 'A máquina mais fria da Terra: por que o hélio líquido nunca pode parar',
      title: 'The Coldest Machine on Earth: Why Liquid Helium Can Never Stop Flowing',
      entity: 'Superconducting Cryogenic Infrastructure & Quench Protection',
      mechanism: 'Superconducting magnets operating at 1.9 Kelvin with automated pyrotechnic quench relief',
      constraint: 'Fractional temperature rise triggering instantaneous thermal expansion of liquid gas',
      consequence: 'A localized quench turns zero-resistance coils into massive resistive heaters with explosive pressure',
      thesis: 'Superconducting physics is preserved entirely by a continuous industrial cryogenic pipeline colder than deep space.'
    },
    {
      theme: 'A malha pneumática subterrânea que dispara sangue a 40 km/h em megahospitais',
      title: 'The 100-Mile Vacuum Pipeline Running Inside Hospital Walls',
      entity: 'Automated Hospital Pneumatic Tube Transit System',
      mechanism: 'Multi-directional pneumatic diverters and vacuum pressure zones routing biological payloads',
      constraint: 'Excessive G-force ruptures red blood cells while transport delay threatens patient survival',
      consequence: 'Critical surgical transfusions stall if pneumatic pressure differentials fail',
      thesis: 'The survival of critical surgery depends less on elevators than on an automated vacuum subway inside the walls.'
    },
    {
      theme: 'O relógio de 1 nanossegundo que impede o colapso das bolsas globais',
      title: 'The Invisible 1-Nanosecond System Holding Global Finance Together',
      entity: 'Atomic Clock Infrastructure & Precision Time Protocol (IEEE 1588)',
      mechanism: 'Cesium atomic clocks and thermally compensated optical fibers timestamping trades to the nanosecond',
      constraint: 'Relativistic time dilation and leap second reconciliation across continents',
      consequence: 'A microsecond drift causes conflicting order arbitration and global market paralysis',
      thesis: 'Modern financial execution is fundamentally a physical battle of atomic time transfer across synchronized optical glass.'
    }
  ],
  brecha: [
    {
      theme: 'A central que compra números 0800 legítimos para dar golpes bancários',
      title: 'O Golpe do 0800 Falso: A Central Telefônica Mascarada na Anatel',
      entity: 'Entroncamentos SIP e Fraude em Canais Gratuitos 0800',
      mechanism: 'Contratação de faixas 0800 com dados de empresas inativas para desviar chamadas de vítimas aflitas',
      constraint: 'A autoridade percebida de um número 0800 oficial impede qualquer suspeita da vítima',
      consequence: 'Vítimas ligam por vontade própria e fornecem tokens sem desconfiar',
      thesis: 'O golpe mais letal não é o que liga para você, mas o que faz você ligar voluntariamente para uma central criminosa acreditando ser o banco.'
    },
    {
      theme: 'Como quadrilhas limpam o IMEI de celulares roubados em menos de 40 minutos',
      title: 'A Máfia do IMEI: Como Aparelhos Bloqueados Voltam à Rede em Minutos',
      entity: 'Mercado Clandestino de Reprogramação de IMEI e Evasão da Base CEMI',
      mechanism: 'Boxes de desbloqueio físico, regravação de baseband e exportação de carcaças para o exterior',
      constraint: 'Sincronização assimétrica entre operadoras e sistemas de segurança estaduais',
      consequence: 'O bloqueio oficial por operadora torna-se inócuo contra técnicas de clonagem de chip baseband',
      thesis: 'A ilusão do bloqueio de IMEI esconde uma indústria bilionária de hardware clandestino que opera mais rápido que as regulações estatais.'
    },
    {
      theme: 'O novo golpe do boleto adulterado por extensão de navegador',
      title: 'A Fatura Fantasma: O Malware Silencioso que Altera a Linha Digitável',
      entity: 'Injeção de Código em Navegadores e Fraude de Boletos Digitais',
      mechanism: 'Extensões maliciosas que identificam códigos de barras no DOM e substituem o banco recebedor no ato da visualização',
      constraint: 'A vítima confere o nome da empresa e o valor na tela, sem notar a mudança do código bancário',
      consequence: 'Pagamentos vultosos de contas e fornecedores são desviados para contas de passagem sem alertas do antivírus',
      thesis: 'O cibercrime moderno não precisa roubar senhas; basta adulterar um único caractere da interface antes que ela seja renderizada aos seus olhos.'
    },
    {
      theme: 'Como golpistas usam biometria facial vazada para abrir contas em segundos',
      title: 'Biometria Sequestrada: A Fraude do Liveness Detection com Fotos Reais',
      entity: 'Bypass de Prova de Vida e Vazamento de Bases Biométricas',
      mechanism: 'Uso de máscaras de silicone, deepfakes 3D de alta precisão e injeção de vídeo em webcams virtuais para burlar o liveness test',
      constraint: 'A confiança cega das instituições em sistemas biométricos automatizados',
      consequence: 'Abertura de contas correntes e concessão de empréstimos em nome de vítimas sem seu conhecimento',
      thesis: 'Quando seu rosto se torna uma senha digital imutável, um único vazamento biométrico compromete sua soberania financeira para sempre.'
    }
  ]
};

export interface ThemeGenerationResult {
  themes: ThemeIdea[];
  source: 'antigravity' | 'codex' | 'curated-fallback';
  savedCount: number;
}

export async function generateThemesWithIde(
  channel: ChannelId = 'hsl',
  count = 5,
  root = REPO_ROOT
): Promise<ThemeGenerationResult> {
  const records = themeRecords(root).filter(r => !r.channelId || r.channelId === channel);
  const staticCatalog = channel === 'brecha' ? BRECHA_CATALOG : HSL_CATALOG;
  
  const existingList = [
    ...records.map(r => r.theme),
    ...staticCatalog.map(c => `${c.title} // ${c.theme}`)
  ];
  
  const uniqueExisting = [...new Set(existingList)].slice(0, 50);
  const existingThemesText = uniqueExisting.length
    ? uniqueExisting.map((t, i) => `${i + 1}. ${t}`).join('\n')
    : 'Nenhum tema anterior.';

  const task: IdeTask = {
    threadId: `THEME_GEN_${channel.toUpperCase()}_${Date.now()}`,
    node: 'suggest_themes',
    attempt: 1,
    provider: 'antigravity',
    promptTemplate: 'graph/prompts/viral-themes.md',
    schemaPath: 'graph/prompts/viral-themes.schema.json',
    vars: {
      channel: channel.toUpperCase(),
      count: String(count),
      existingThemes: existingThemesText
    },
    ioMode: 'stdout',
    timeoutMs: 120_000
  };

  try {
    const result = await prepareAndRunIdeTaskWithFailover(task, { repoRoot: root });
    const output = result.headlessResult?.output as { themes?: ThemeIdea[] } | undefined;
    
    if (result.headlessResult?.ok && output?.themes && Array.isArray(output.themes) && output.themes.length > 0) {
      const deduplicated = output.themes.filter(
        t => !findDuplicate(`${t.title} · ${t.theme} · ${t.entity}`, channel, root)
      );
      
      if (deduplicated.length > 0) {
        const saved = saveDynamicThemes(deduplicated, channel, root);
        return {
          themes: deduplicated,
          source: result.headlessResult.provider as 'antigravity' | 'codex',
          savedCount: saved
        };
      }
    }
  } catch {
    // Failover silencioso para o pool curado
  }

  // Fallback garantido: pool emergencial curado de alta viralidade
  const pool = FALLBACK_VIRAL_THEMES[channel] || FALLBACK_VIRAL_THEMES.hsl;
  const availablePool = pool.filter(
    t => !findDuplicate(`${t.title} · ${t.theme} · ${t.entity}`, channel, root)
  );

  const saved = saveDynamicThemes(availablePool, channel, root);
  return {
    themes: availablePool.slice(0, count),
    source: 'curated-fallback',
    savedCount: saved
  };
}
