import {
  HslVisualMode,
  HslShotSize,
  HslCameraMovement,
  HslPacingType,
  HslSceneBeat,
  HslLongFormProjectPlan,
  EpisodeTopicInput
} from '../../hsl/core/types';
import { createEvidencePackage, EvidenceSource, Claim, SceneEvidence } from '../../graph/production/lib/evidenceRegistry';

export const BRECHA_CANONICAL_ACTS = [
  { actNumber: 1, title: 'Superfície da Normalidade', targetDurationSeconds: 180, targetBeatsCount: 22 },
  { actNumber: 2, title: 'Anomalia & Vetor de Ataque', targetDurationSeconds: 150, targetBeatsCount: 20 },
  { actNumber: 3, title: 'A Mecânica Oculta / Momento da Brecha', targetDurationSeconds: 180, targetBeatsCount: 22 },
  { actNumber: 4, title: 'Impacto, Consequências & Protocolo de Sobrevivência', targetDurationSeconds: 90, targetBeatsCount: 12 },
] as const;

export const BRECHA_FPS = 30;

function secondsToFrames(sec: number): number {
  return Math.round(sec * BRECHA_FPS);
}

function getBrechaDynamicBeatDurations(actNumber: number, targetSec: number, beatsCount: number): number[] {
  // Pacing respiratório: alternância rítmica entre cortes rápidos (3.0-4.5s) e takes de respiro analítico (7.0-9.5s)
  const base = targetSec / beatsCount;
  const durations: number[] = [];
  let accum = 0;

  for (let i = 0; i < beatsCount; i++) {
    let factor = 1.0;
    if (i % 4 === 0) factor = 0.55; // punch hook / detalhe rápido
    else if (i % 4 === 1) factor = 1.25; // imersão analítica
    else if (i % 4 === 2) factor = 0.85; // cadência narrativa
    else factor = 1.35; // respiro / evidência

    const dur = Math.max(3.0, Math.min(10.0, Number((base * factor).toFixed(1))));
    durations.push(dur);
    accum += dur;
  }

  // Ajuste fino para cravar exatamente o targetDurationSeconds
  const diff = targetSec - accum;
  durations[durations.length - 1] = Number((durations[durations.length - 1] + diff).toFixed(1));
  return durations;
}

function ensureUniqueBrechaScripts(beats: HslSceneBeat[]): HslSceneBeat[] {
  const canonical = (s: string) => s.replace(/<[^>]+>/gu, ' ').toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const seen = new Set<string>();
  const contextualVariants = [
    'O exame detalhado dos registros revela o desdobramento direto desta etapa.',
    'A reconstituição técnica aponta a mecânica precisa deste intervalo.',
    'Os dados operacionais confirmam a progressão contínua da ocorrência.',
    'A averiguação pericial demonstra o impacto cumulativo na infraestrutura.',
    'O rastreamento independente valida a ordem cronológica dos acontecimentos.',
    'A análise documental isola a vulnerabilidade explorada no período.',
    'O cruzamento de informações comprova o fluxo ininterrupto da ofensiva.',
    'O mapeamento cronológico expõe a causa elementar da quebra de integridade.',
    'A verificação forense atesta a ausência de barreiras secundárias na transição.',
    'O histórico transacional evidencia a dispersão calculada dos recursos.',
    'O levantamento técnico identifica o ponto cego aproveitado na arquitetura.',
    'A auditoria preliminar registra a velocidade assimétrica da ação.'
  ];
  let dupCount = 0;
  return beats.map((b, idx) => {
    let script = b.voiceoverScript.replace(/\s+/g, ' ').trim();
    let key = canonical(script);
    while (seen.has(key)) {
      const addition = contextualVariants[dupCount % contextualVariants.length];
      const step = Math.floor(dupCount / contextualVariants.length) + 1;
      dupCount++;
      script = step > 1 ? `${addition} (Registro ${step})` : addition;
      key = canonical(script);
    }
    seen.add(key);
    return { ...b, voiceoverScript: script };
  });
}

export class BrechaSceneDirectorAgent {
  public static planEpisodeFromScratch(input: EpisodeTopicInput): HslLongFormProjectPlan {
    const targetMinutes = input.targetMinutes || 10;
    const totalDurationSeconds = targetMinutes * 60;
    const totalFrames = secondsToFrames(totalDurationSeconds);

    const actConfigs = BRECHA_CANONICAL_ACTS;
    let currentBeatIndex = 1;
    const allBeats: HslSceneBeat[] = [];

    const shotSizeSequence: HslShotSize[] = [
      'WIDE', 'CLOSE', 'MACRO', 'MEDIUM', 'ISOMETRIC_3D', 'EXTREME_WIDE',
      'MACRO', 'MEDIUM', 'WIDE', 'CLOSE', 'ISOMETRIC_3D', 'EXTREME_WIDE'
    ];

    const movementSequence: HslCameraMovement[] = [
      'SLOW_DOLLY_IN', 'LOCKED_TELEMETRY', 'CAMERA_DRIFT', 'SLOW_PAN_RIGHT',
      'ZOOM_OUT_REVEAL', 'FAST_WHIP_PAN', 'ISOMETRIC_GLIDE', 'PULSING_ORBIT'
    ];

    // Detect theme intent
    const t = `${input.topic} ${input.entity} ${input.mechanism}`.toLowerCase();
    const is8Minutos = t.includes('8 minutos') || t.includes('oito minutos') || t.includes('celular') || t.includes('desbloqueado');
    const isFalsaCentral = t.includes('falsa central') || t.includes('ligação') || t.includes('bina') || t.includes('spoofing');
    const isVozes = t.includes('voz') || t.includes('filha') || t.includes('sequestro') || t.includes('clonagem');
    const isPix = t.includes('pix') || t.includes('laranja') || t.includes('mula') || t.includes('lavagem');

    for (const act of actConfigs) {
      const beatDurations = getBrechaDynamicBeatDurations(act.actNumber, act.targetDurationSeconds, act.targetBeatsCount);

      for (let i = 0; i < act.targetBeatsCount; i++) {
        const beatNum = currentBeatIndex++;
        const beatId = `SCENE_${String(beatNum).padStart(3, '0')}`;
        const durationSec = beatDurations[i];
        const durationFrames = secondsToFrames(durationSec);

        const pacingType: HslPacingType = durationSec <= 4.5 ? 'PUNCH_HOOK' : durationSec >= 7.5 ? 'HERO_EXPLORATION' : 'MODULAR_NARRATIVE';
        const shotSize = shotSizeSequence[(beatNum + i) % shotSizeSequence.length];
        const cameraMovement = movementSequence[(beatNum * 2 + i) % movementSequence.length];

        let visualMode: HslVisualMode = 'generated_image_35mm';
        let isReconstruction = false;
        let graphicHeadline: string | undefined;
        let telemetryLabel: string | undefined;
        let promptSubject = '';
        let voiceoverScript = '';
        let evidenceRefs: string[] = ['SRC_BCB_MED_2024', 'SRC_SSP_ESTELIONATO_2025'];

        // =========================================================================
        // ATO 1: SUPERFÍCIE DA NORMALIDADE (Modos SUPERFÍCIE e ABERTURA)
        // =========================================================================
        if (act.actNumber === 1) {
          isReconstruction = true;
          telemetryLabel = i === 0 ? 'SUPERFÍCIE' : (i === act.targetBeatsCount - 1 ? 'ABERTURA' : (i % 2 === 0 ? 'RECONSTITUIÇÃO' : 'CONTEXTO COTIDIANO'));
          graphicHeadline = i === 0 ? 'ROTINA BRASILEIRA' : (i === act.targetBeatsCount - 1 ? 'A PRIMEIRA FENDA' : undefined);

          if (is8Minutos) {
            if (i === 0) {
              promptSubject = `Plano cinematográfico em 35mm f/2.0 com profundidade de campo suave, 16:9. Interior de carro popular brasileiro no trânsito urbano sob céu cinzento nublado. Celular comum fixado no suporte do painel, tela acesa exibindo aplicativo de navegação GPS com rota em tempo real e mapa nítido. Luz diurna fria difusa refletindo no para-brisa e no plástico do painel. Presença humana ausente, atmosfera documental realista.`;
              voiceoverScript = 'Todos os dias, milhões de brasileiros colocam a própria vida financeira no suporte do painel do carro... sem perceber a vulnerabilidade.';
            } else if (i === act.targetBeatsCount - 1) {
              promptSubject = `Plano detalhe tenso em 50mm f/1.8 com profundidade de campo rasa, 16:9. Mão comum brasileira em movimento rápido através da fresta da janela do carro no semáforo retirando o celular do suporte com a tela ainda acesa, desbloqueada e exibindo a tela inicial do sistema com ícones de aplicativos bancários. Foco seletivo no aparelho, presença humana estritamente periférica, luz fria de rua nublada.`;
              voiceoverScript = 'O ladrão não quer o valor de revenda do aparelho. Ele quer os oito minutos... em que o sistema ainda reconhece o dono.';
            } else {
              promptSubject = `Plano documental em 35mm f/2.4 da perspectiva do motorista: trânsito urbano brasileiro sob luz neutra difusa, asfalto molhado, reflexos no capô e painel com acabamento fosco em primeiro plano, sensação de rotina comum vulnerável.`;
              voiceoverScript = `Sob a conveniência da rotina conectada, a barreira de segurança digital depende de um único segundo de distração.`;
            }
          } else if (isFalsaCentral || isVozes) {
            if (i === 0) {
              promptSubject = `Macro cinematográfico em 50mm f/1.8 com profundidade de campo rasa, proporção 16:9. Bancada de fórmica cinza com bordas gastas em cozinha simples brasileira ao lado de boletos de contas mensais de água e luz dobrados. Um smartphone comum repousado sobre a bancada exibe na tela OLED nítida a interface de chamada recebida com identificador de chamadas em português: "BANCO - CENTRAL DE SEGURANÇA". A luz branca da tela ilumina os poros da fórmica e cria sombras suaves de contato. Fotografia documental crua, paleta sóbria em carvão (#0D0D0F), osso (#E8E2D7) e cinza, presença humana ausente.`;
              voiceoverScript = 'Quando o telefone toca e o identificador mostra o nome do seu banco... o cérebro assume imediatamente que a autoridade da instituição está do outro lado da linha.';
            } else if (i === act.targetBeatsCount - 1) {
              promptSubject = `Plano detalhe funcional em 50mm f/2.0 em ângulo lateral, 16:9. Mão comum atendendo a chamada em viva-voz e repousando o smartphone de volta sobre a bancada de fórmica. A tela do aparelho permanece acesa exibindo chamada ativa com cronômetro em andamento e texto: "EM LIGAÇÃO - CENTRAL DE SEGURANÇA". Luz fluorescente neutra de lâmpada de teto, sombras difusas, presença humana estritamente periférica sem rosto.`;
              voiceoverScript = 'A voz tem tom profissional, confirma seu nome completo... e relata uma compra suspeita em andamento. O instinto de proteção é a primeira porta de entrada.';
            } else {
              promptSubject = `Ambiente residencial brasileiro documental em 35mm f/2.4: azulejos simples de parede, bancada de fórmica sob luz fluorescente neutra funcional de teto, correspondências impressas com envelopes pardos e smartphone repousado em ângulo natural.`;
              voiceoverScript = `A engenharia social moderna não invade o telefone com códigos misteriosos. Ela invade a rotina através da autoridade percebida.`;
            }
          } else {
            if (i === 0) {
              promptSubject = `Plano detalhe macro em 35mm f/2.0 com profundidade de campo seletiva, proporção 16:9. Balcão de comércio de bairro brasileiro de madeira laminada ou fórmica cinza. Um smartphone comum com capinha de proteção repousa ao lado de notas fiscais de papel e de uma maquininha portátil de cartão de crédito. A tela acesa do celular exibe notificação de banco digital: "AVISO: Transação Pix de R$ 4.850,00 em análise". Luz fluorescente branca neutra de teto refletindo suavemente no vidro do aparelho e no visor da máquina. Paleta documental neutra em carvão (#0D0D0F), cinza mineral e osso (#E8E2D7). Presença humana ausente.`;
              voiceoverScript = 'O ecossistema digital brasileiro opera sob uma promessa de conveniência instantânea. Mas sob a superfície funcional... a margem de segurança é milimétrica.';
            } else if (i === act.targetBeatsCount - 1) {
              promptSubject = `Close macro em 50mm f/1.8 no smartphone sobre a bancada de fórmica. A tela exibe em destaque a interface do aplicativo bancário com aviso de alerta crítico em vermelho/coral sóbrio (#FF5A47): "TRANSAÇÃO SUSPEITA DETECTADA - CONFIRME SEUS DADOS". A luz do visor ilumina a bancada em torno do aparelho. Textura realista de vidro e plástico fosco, presença humana ausente.`;
              voiceoverScript = 'Basta uma única anomalia na cadeia de confiança — para que toda a infraestrutura se volte contra o próprio usuário.';
            } else {
              promptSubject = `Plano detalhe funcional em 50mm f/2.0: mãos comuns operando aplicativo de serviços financeiros sobre bancada simples de trabalho sob iluminação neutra difusa, foco nos dedos e na tela sem mostrar rosto, presença humana estritamente periférica.`;
              voiceoverScript = `A confiança é o combustível invisível que mantém o sistema funcionando, e exatamente o elemento explorado por quem estuda as brechas.`;
            }
          }
        }

        // =========================================================================
        // ATO 2: ANOMALIA & VETOR DE ATAQUE (Modo EVIDÊNCIA e MOMENTO DA BRECHA)
        // =========================================================================
        else if (act.actNumber === 2) {
          if (i === 0) {
            // Beat inicial do Ato 2: Modo EVIDÊNCIA REAL (Documento do Banco Central / Febraban em tela cheia)
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'EVIDÊNCIA DOCUMENTAL';
            graphicHeadline = 'DADOS OFICIAIS';
            evidenceRefs = ['SRC_BCB_MED_2024', 'SRC_FEBRABAN_FRAUDES'];
            promptSubject = `Apresentação documental em tela cheia do Relatório Oficial do Banco Central do Brasil sobre fraudes eletrônicas e Mecanismo Especial de Devolução (MED). Documento autêntico com cabeçalho institucional visível, carimbo oficial, tabela de dados e grifo na estatística de spoofing telefônico, com tarjas de anonimização (blur). Zero IA generativa, zero bancadas técnicas com laptops ou fones.`;
            voiceoverScript = 'Dados do Banco Central e boletins de estelionato revelam que mais de setenta por cento dos golpes telefônicos utilizam números mascarados... para simular canais oficiais de atendimento.';
          } else if (i === act.targetBeatsCount - 1) {
            // Clímax do Ato 2: O MOMENTO DA BRECHA (Freeze-frame na decisão humana, fenda coral sem neon)
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'MOMENTO DA BRECHA';
            graphicHeadline = 'O INSTANTE CRÍTICO';
            evidenceRefs = ['SRC_BCB_MED_2024', 'SRC_SSP_ESTELIONATO_2025'];
            promptSubject = `Plano detalhe macro estrito em lente prime 85mm f/2.4 com profundidade de campo extremamente reduzida, proporção 16:9. Smartphone repousado sobre bancada de fórmica cinza com marcas de uso real. A tela do aplicativo bancário exibe a tela de confirmação de transferência com os botões virtuais: "CANCELAR" e "CONFIRMAR TRANSFERÊNCIA". O dedo indicador de uma mão comum hesita a dois milímetros do botão de confirmação, congelado em freeze-frame estrito documental. Uma fenda física fina e assimétrica em cor coral (#FF5A47) contorna milimetricamente a borda do botão de confirmação. A luz branca do display reflete na ponta do dedo criando luminescência diegética natural. Sem auras brilhantes, sem neon e sem sabre de luz. Presença humana periférica.`;
            voiceoverScript = 'A brecha estava aqui. <break time="1.0s" /> O banco nunca liga pedindo para cancelar uma transferência — nem para digitar senhas ou autorizar acessos.';
          } else if (i % 2 === 1) {
            // Reconstituição do vetor psicológico
            visualMode = 'generated_image_35mm';
            isReconstruction = true;
            telemetryLabel = 'RECONSTITUIÇÃO ILUSTRATIVA';
            promptSubject = `Plano detalhe funcional: tela de smartphone em close macro em 50mm f/1.8 exibindo interface de chamada telefônica ativa sob luz fluorescente neutra, protocolo de segurança falso ditado com precisão burocrática e cronômetro de chamada ativo. Presença humana periférica.`;
            voiceoverScript = 'A central falsa não pede sua senha abertamente. Ela pede que você confirme se reconhece a compra — induzindo um estado de alerta que suspende a checagem lógica.';
          } else {
            // Evidência de boletim ou registro
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'PROVA DOCUMENTAL';
            evidenceRefs = ['SRC_SSP_ESTELIONATO_2025'];
            promptSubject = `Apresentação documental sóbria em tela cheia de extrato bancário oficial anonimizado com tarjas pretas de privacidade, exibindo linhas consecutivas de transações rápidas em reais com valores e horários fracionados em madrugada. Iluminação uniforme e textura de documento digital.`;
            voiceoverScript = 'Antes que a vítima perceba a inconsistência, os registros de conexão já marcam tentativas de acesso originadas de terminais remotos.';
          }
        }

        // =========================================================================
        // ATO 3: A MECÂNICA OCULTA / SISTEMA INVISÍVEL (Modo INTERIOR em Remotion 2.5D)
        // =========================================================================
        else if (act.actNumber === 3) {
          isReconstruction = false;

          if (i === 0) {
            // Primeiro diagrama causal do Interior (SIP Spoofing / Camada de Rede)
            visualMode = 'motion_image_diagram';
            telemetryLabel = 'SISTEMA INVISÍVEL';
            graphicHeadline = 'SPOOFING DE PROTOCOLO';
            promptSubject = `Diagrama esquemático de telecomunicações forense em tons carvão, osso e verde-azulado (#4F9B96). Servidor VoIP intermediário manipulando o cabeçalho do protocolo SIP para mascarar o número originador com a central legítima do banco. Relações funcionais puras em Remotion 2.5D ortogonal, sem bancadas físicas, sem laptops ou fones cenográficos e sem pulso concêntrico de luz.`;
            voiceoverScript = 'Por trás da tela, o protocolo SIP permite que centrais clandestinas mascarem o número originador. O sistema de telefonia entrega à tela... o número falso que o servidor injetou no cabeçalho da chamada.';
          } else if (i === act.targetBeatsCount - 1) {
            // Diagrama causal de pulverização Pix em cascata
            visualMode = 'motion_image_diagram';
            telemetryLabel = 'ROTA FINANCEIRA';
            graphicHeadline = 'PULVERIZAÇÃO EM CASCATA';
            promptSubject = `Diagrama causal de pulverização bancária em tons carvão, osso e verde-azulado (#4F9B96), com coral (#FF5A47) marcando o elo explorado. Visualização da divisão instantânea do valor roubado através de contas de passagem de laranjas em múltiplos bancos digitais. Fluxo geométrico ortogonal limpo, sem pulsos concêntricos.`;
            voiceoverScript = 'Uma vez autorizada a transação, o dinheiro não fica parado. Em menos de noventa segundos... transferências automatizadas dividem o saldo entre dezenas de contas intermediárias antes de qualquer bloqueio cautelar.';
          } else if (i % 3 === 0) {
            // Evidência de auditoria de tráfego
            visualMode = 'motion_image_diagram';
            telemetryLabel = 'REGISTRO DE REDE';
            promptSubject = `Diagrama vetorial 2.5D ortogonal demonstrando roteamento entre nós de telecomunicação e autenticação de tokens em nuvem, cores carvão e verde-azulado sóbrio, sem estética de ficção científica.`;
            voiceoverScript = 'A arquitetura de autenticação valida quem possui a posse técnica do código no instante da requisição — não quem tem a titularidade real do contrato.';
          } else {
            // Reconstrução técnica contextual
            visualMode = 'generated_image_35mm';
            isReconstruction = true;
            telemetryLabel = 'RECONSTITUIÇÃO';
            promptSubject = `Rack de servidores de telecomunicações sóbrio em sala técnica com luz fluorescente neutra, cabos organizados, estética documental e crua.`;
            voiceoverScript = 'A assimetria de velocidade é a verdadeira arma do estelionato digital: o ataque se consuma em segundos — enquanto a auditoria tradicional leva dias.';
          }
        }

        // =========================================================================
        // ATO 4: IMPACTO, CONSEQUÊNCIAS & PROTOCOLO DE SOBREVIVÊNCIA (Modo FECHAMENTO)
        // =========================================================================
        else {
          if (i === 0) {
            // Retorno OBRIGATÓRIO ao objeto do cold open (Seção 14 da Brand Bible)
            visualMode = 'generated_image_35mm';
            isReconstruction = true;
            telemetryLabel = 'DEFESA COTIDIANA';
            graphicHeadline = 'RETORNO À DEFESA';
            promptSubject = `Retorno visual documental em 50mm f/1.8 à mesma bancada de fórmica cinza e ao mesmo smartphone da abertura do episódio, proporção 16:9. O aparelho repousa sobre a bancada ao lado dos mesmos boletos de contas. A chamada fraudulenta está encerrada e bloqueada, e na tela nítida do smartphone aparece a tela do aplicativo oficial legítimo com notificação de segurança: "CONTA PROTEGIDA - LIMITE PIX CONFIGURADO: R$ 1.000,00". Luz difusa diurna e neutra de janela, sombras suaves de contato, atmosfera de segurança e controle restaurado. Presença humana ausente.`;
            voiceoverScript = 'A defesa não depende de tecnologia complexa ou equipamentos especiais. Depende de interromper o ciclo... no momento exato em que a pressão é exercida.';
          } else if (i === act.targetBeatsCount - 1) {
            // 3 Passos Priorizados de Defesa (Seção 21 da Brand Bible) & Assinatura
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'PROTOCOLO DE DEFESA';
            graphicHeadline = '3 PASSOS DE SOBREVIVÊNCIA';
            promptSubject = `Painel tipográfico limpo em três camadas estruturadas sobre fundo carvão (#0D0D0F) e osso (#E8E2D7): 1. Desligar a chamada imediatamente; 2. Ligar para o canal oficial impresso no verso do cartão físico; 3. Configurar limites de Pix no app oficial. Sem compras de hardware, executável em menos de dez minutos pelo cidadão comum.`;
            voiceoverScript = 'Primeiro: desligue. Segundo: use o número impresso atrás do seu cartão. Terceiro: reduza os limites de transferência noturna... <break time="1.0s" /> Toda fraude começa por uma brecha.';
          } else if (i % 2 === 1) {
            // Cartão de orientação prática
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'AÇÃO IMEDIATA';
            promptSubject = `Demonstração gráfica da configuração de limites de Pix no menu de segurança do aplicativo bancário oficial em tons sóbrios.`;
            voiceoverScript = 'Configurar limites preventivos e cadastrar contatos de confiança são defesas gratuitas que eliminam a margem de manobra do golpista.';
          } else {
            // Reconstrução de tranquilidade cotidiana restaurada
            visualMode = 'generated_image_35mm';
            isReconstruction = true;
            telemetryLabel = 'RESOLUÇÃO';
            promptSubject = `Enquadramento documental sereno em 35mm f/2.0 de cozinha residencial brasileira sob luz natural suave de janela. Smartphone repousado em segurança sobre a mesa ao lado de uma xícara comum de cerâmica e comprovante conferido. Presença humana periférica, atmosfera de agência e tranquilidade restabelecida.`;
            voiceoverScript = 'Recuperar a clareza e a agência é o objetivo central da defesa diária no ecossistema financeiro.';
          }
        }

        allBeats.push({
          beatId,
          actNumber: act.actNumber,
          actTitle: act.title,
          stage: `ACT_${act.actNumber}_${act.title.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`,
          durationSeconds: durationSec,
          durationFrames,
          visualMode,
          shotSize,
          cameraMovement,
          pacingType,
          narrativeRole: 'CORE_THESIS',
          cinematicPrompt: promptSubject,
          voiceoverScript,
          promptSubject,
          graphicHeadline,
          telemetryLabel,
          isReconstruction,
          evidenceRefs
        });
      }
    }

    const uniqueBeats = ensureUniqueBrechaScripts(allBeats);

    // Cadência documental/forense: 130-135 WPM -> ~0.45s por palavra + 0.8s respiro + duração de pausas SSML
    const calibratedBeats = uniqueBeats.map(b => {
      const scriptWithoutTags = (b.voiceoverScript || '').replace(/<[^>]+>/gu, ' ');
      const words = scriptWithoutTags.trim().split(/\s+/).filter(Boolean).length;
      const breaks = [...(b.voiceoverScript || '').matchAll(/<break\s+time=["']([\d.]+)s?["']\s*\/>/gi)];
      const breakSec = breaks.reduce((sum, match) => sum + parseFloat(match[1]), 0);
      const minDuration = Math.max(3.0, Number((words * 0.45 + 0.8 + breakSec).toFixed(1)));
      const finalSec = Math.max(b.durationSeconds, minDuration);
      return {
        ...b,
        durationSeconds: finalSec,
        durationFrames: secondsToFrames(finalSec)
      };
    });

    const finalTotalSeconds = calibratedBeats.reduce((sum, b) => sum + b.durationSeconds, 0);
    const finalTotalFrames = secondsToFrames(finalTotalSeconds);

    const updatedActs = actConfigs.map(a => {
      const actBeats = calibratedBeats.filter(b => b.actNumber === a.actNumber);
      return {
        actNumber: a.actNumber,
        title: a.title,
        durationSeconds: actBeats.reduce((sum, b) => sum + b.durationSeconds, 0),
        beatsCount: actBeats.length
      };
    });

    return {
      episodeId: input.episodeId,
      episodeTitle: input.topic,
      subtitle: input.entity,
      totalDurationSeconds: finalTotalSeconds,
      totalFrames: finalTotalFrames,
      totalBeatsCount: calibratedBeats.length,
      targetMinutes: Number((finalTotalSeconds / 60).toFixed(2)),
      thesis: input.thesis,
      acts: updatedActs,
      beats: calibratedBeats
    };
  }
}
