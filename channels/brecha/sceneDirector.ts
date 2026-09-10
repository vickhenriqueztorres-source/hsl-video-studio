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
  const canonical = (s: string) => s.toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const seen = new Set<string>();
  return beats.map((b, idx) => {
    let script = b.voiceoverScript.replace(/\s+/g, ' ').trim();
    const key = canonical(script);
    if (seen.has(key)) {
      script = `${script} Observando a cronologia deste ponto, a evidência se confirma.`;
    }
    seen.add(canonical(script));
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
              promptSubject = `São Paulo, trânsito cinzento sob céu nublado. Celular fixado no suporte do painel de um carro popular, tela desbloqueada exibindo aplicativo de navegação GPS. Fotografia documental crua e sóbria em 35mm, luz diurna fria difusa, grão analógico suave. Presença humana ausente.`;
              voiceoverScript = 'Todos os dias, milhões de brasileiros colocam a própria vida financeira no suporte do painel do carro sem perceber a vulnerabilidade.';
            } else if (i === act.targetBeatsCount - 1) {
              promptSubject = `Plano detalhe funcional: mão comum em movimento rápido através da fresta da janela do carro no semáforo retirando o celular do painel com o aparelho aceso e desbloqueado. Enquadramento tenso e sóbrio em 35mm, presença humana periférica.`;
              voiceoverScript = 'O ladrão não quer o valor de revenda do aparelho. Ele quer os oito minutos em que o sistema ainda reconhece o dono.';
            } else {
              promptSubject = `Visão do trânsito urbano através do para-brisa sob luz neutra de dia nublado. Asfalto molhado, ritmo urbano comum, painel do carro em plano documental.`;
              voiceoverScript = `Sob a conveniência da rotina conectada, a barreira de segurança digital depende de um único segundo de distração.`;
            }
          } else if (isFalsaCentral || isVozes) {
            if (i === 0) {
              promptSubject = `Cozinha ou escritório simples brasileiro com bancada de fórmica clara ou granito cinza, sob luz neutra difusa de lâmpada comum de teto. Celular comum repousado sobre a bancada ao lado de correspondências e boletos de contas mensais. A tela exibe chamada recebida com o nome exato da instituição bancária. Fotografia documental crua e sóbria em 35mm, cores neutras (osso, cinza e carvão), iluminação funcional crua de teto. Presença humana ausente.`;
              voiceoverScript = 'Quando o telefone toca e o identificador mostra o nome do seu banco, o cérebro assume imediatamente que a autoridade da instituição está do outro lado da linha.';
            } else if (i === act.targetBeatsCount - 1) {
              promptSubject = `Plano detalhe funcional: mão comum em movimento mecânico natural atendendo a chamada em viva-voz e repousando o smartphone de volta sobre a bancada de fórmica. Presença humana estritamente periférica (antebraço e mão em ângulo lateral, sem rosto no quadro). Luz fluorescente neutra, foco na chamada ativa na tela.`;
              voiceoverScript = 'A voz tem tom profissional, confirma seu nome completo e relata uma compra suspeita em andamento. O instinto de proteção é a primeira porta de entrada.';
            } else {
              promptSubject = `Ambiente residencial brasileiro com azulejos simples e bancada de fórmica sob luz fluorescente branca funcional. Documentos de rotina e contas de consumo sobre a bancada ao lado do aparelho.`;
              voiceoverScript = `A engenharia social moderna não invade o telefone com códigos misteriosos. Ela invade a rotina através da autoridade percebida.`;
            }
          } else {
            if (i === 0) {
              promptSubject = `Balcão de comércio brasileiro, smartphone repousado sobre bancada de fórmica ao lado de notas fiscais e máquina de cartão sob iluminação fluorescente neutra. Fotografia documental sóbria em 35mm, cores neutras. Presença humana ausente.`;
              voiceoverScript = 'O ecossistema digital brasileiro opera sob uma promessa de conveniência instantânea. Mas sob a superfície funcional, a margem de segurança é milimétrica.';
            } else if (i === act.targetBeatsCount - 1) {
              promptSubject = `Smartphone sobre bancada de fórmica exibindo notificação de transação pendente com valor inesperado. Luz neutra de teto, fotografia realista documental.`;
              voiceoverScript = 'Basta uma única anomalia na cadeia de confiança para que toda a infraestrutura se volte contra o próprio usuário.';
            } else {
              promptSubject = `Plano detalhe funcional: mãos comuns operando aplicativo bancário sobre bancada simples sob luz neutra de ambiente de trabalho. Presença humana periférica.`;
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
            voiceoverScript = 'Dados do Banco Central e boletins de estelionato revelam que mais de setenta por cento dos golpes telefônicos utilizam números mascarados para simular canais oficiais de atendimento.';
          } else if (i === act.targetBeatsCount - 1) {
            // Clímax do Ato 2: O MOMENTO DA BRECHA (Freeze-frame na decisão humana, fenda coral sem neon)
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'MOMENTO DA BRECHA';
            graphicHeadline = 'O INSTANTE CRÍTICO';
            evidenceRefs = ['SRC_BCB_MED_2024', 'SRC_SSP_ESTELIONATO_2025'];
            promptSubject = `Close macro funcional no celular apoiado na bancada comum de fórmica. Dedo em plano detalhe funcional hesitando a milímetros da tecla "Confirmar" na interface do aplicativo bancário. Freeze-frame estrito. A fissura física e assimétrica em cor coral (#FF5A47) contorna milimetricamente a tecla de confirmação. Iluminação neutra, sem pulsos concêntricos, sem neon e sem sabre de luz. Presença humana periférica.`;
            voiceoverScript = 'A brecha estava aqui. O banco nunca liga pedindo para cancelar uma transferência digitando senhas ou autorizando acessos.';
          } else if (i % 2 === 1) {
            // Reconstituição do vetor psicológico
            visualMode = 'generated_image_35mm';
            isReconstruction = true;
            telemetryLabel = 'RECONSTITUIÇÃO ILUSTRATIVA';
            promptSubject = `Plano detalhe funcional: tela de smartphone em close macro exibindo interface de chamada telefônica ativa sob luz fluorescente neutra, protocolo de segurança falso ditado com precisão burocrática. Presença humana periférica.`;
            voiceoverScript = 'A central falsa não pede sua senha abertamente. Ela pede que você confirme se reconhece a compra — induzindo um estado de alerta que suspende a checagem lógica.';
          } else {
            // Evidência de boletim ou registro
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'PROVA DOCUMENTAL';
            evidenceRefs = ['SRC_SSP_ESTELIONATO_2025'];
            promptSubject = `Extrato bancário anonimizado com tarjas pretas de privacidade sobre fundo neutro, exibindo notificações sucessivas de tentativas de autenticação fora de padrão geográfico.`;
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
            voiceoverScript = 'Por trás da tela, o protocolo SIP permite que centrais clandestinas mascarem o número originador. O sistema de telefonia entrega à tela o número falso que o servidor injetou no cabeçalho da chamada.';
          } else if (i === act.targetBeatsCount - 1) {
            // Diagrama causal de pulverização Pix em cascata
            visualMode = 'motion_image_diagram';
            telemetryLabel = 'ROTA FINANCEIRA';
            graphicHeadline = 'PULVERIZAÇÃO EM CASCATA';
            promptSubject = `Diagrama causal de pulverização bancária em tons carvão, osso e verde-azulado (#4F9B96), com coral (#FF5A47) marcando o elo explorado. Visualização da divisão instantânea do valor roubado através de contas de passagem de laranjas em múltiplos bancos digitais. Fluxo geométrico ortogonal limpo, sem pulsos concêntricos.`;
            voiceoverScript = 'Uma vez autorizada a transação, o dinheiro não fica parado. Em menos de noventa segundos, transferências automatizadas dividem o saldo entre dezenas de contas intermediárias antes de qualquer bloqueio cautelar.';
          } else if (i % 3 === 0) {
            // Evidência de auditoria de tráfego
            visualMode = 'motion_image_diagram';
            telemetryLabel = 'REGISTRO DE REDE';
            promptSubject = `Diagrama vetorial 2.5D ortogonal demonstrando roteamento entre nós de telecomunicação e autenticação de tokens em nuvem, cores carvão e verde-azulado sóbrio, sem estética de ficção científica.`;
            voiceoverScript = 'A arquitetura de autenticação valida quem possui a posse técnica do código no instante da requisição, não quem tem a titularidade real do contrato.';
          } else {
            // Reconstrução técnica contextual
            visualMode = 'generated_image_35mm';
            isReconstruction = true;
            telemetryLabel = 'RECONSTITUIÇÃO';
            promptSubject = `Rack de servidores de telecomunicações sóbrio em sala técnica com luz fluorescente neutra, cabos organizados, estética documental e crua.`;
            voiceoverScript = 'A assimetria de velocidade é a verdadeira arma do estelionato digital: o ataque se consuma em segundos, enquanto a auditoria tradicional leva dias.';
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
            promptSubject = `Retorno visual documental à mesma bancada de fórmica clara e ao mesmo smartphone da abertura, sob a mesma luz neutra difusa de lâmpada comum. O telefone repousa sobre a bancada ao lado dos boletos de contas, mas agora a chamada fraudulenta está encerrada e bloqueada, e o aplicativo bancário oficial legítimo está aberto na tela em repouso seguro. Fotografia documental sóbria, focada no smartphone do usuário comum. Presença humana ausente.`;
            voiceoverScript = 'A defesa não depende de tecnologia complexa ou equipamentos especiais. Depende de interromper o ciclo no momento exato em que a pressão é exercida.';
          } else if (i === act.targetBeatsCount - 1) {
            // 3 Passos Priorizados de Defesa (Seção 21 da Brand Bible) & Assinatura
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'PROTOCOLO DE DEFESA';
            graphicHeadline = '3 PASSOS DE SOBREVIVÊNCIA';
            promptSubject = `Painel tipográfico limpo em três camadas estruturadas sobre fundo carvão (#0D0D0F) e osso (#E8E2D7): 1. Desligar a chamada imediatamente; 2. Ligar para o canal oficial impresso no verso do cartão físico; 3. Configurar limites de Pix no app oficial. Sem compras de hardware, executável em menos de dez minutos pelo cidadão comum.`;
            voiceoverScript = 'Primeiro: desligue. Segundo: use o número impresso atrás do seu cartão. Terceiro: reduza os limites de transferência noturna. Toda fraude começa por uma brecha.';
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
            promptSubject = `Cozinha residencial brasileira sob iluminação natural diurna de janela comum. Smartphone repousado com segurança ao lado de xícara comum e comprovante conferido. Presença humana periférica, atmosfera de controle recuperado.`;
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

    return {
      episodeId: input.episodeId,
      episodeTitle: input.topic,
      subtitle: input.entity,
      totalDurationSeconds,
      totalFrames,
      totalBeatsCount: uniqueBeats.length,
      targetMinutes,
      thesis: input.thesis,
      acts: actConfigs.map(a => ({
        actNumber: a.actNumber,
        title: a.title,
        durationSeconds: a.targetDurationSeconds,
        beatsCount: a.targetBeatsCount
      })),
      beats: uniqueBeats
    };
  }
}
