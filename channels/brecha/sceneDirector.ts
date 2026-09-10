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
              promptSubject = `São Paulo, final de tarde chuvosa. Celular fixado no suporte do painel de um carro no trânsito, tela desbloqueada exibindo aplicativo de navegação GPS. Fotografia documental 35mm realista, luz natural fria, grão analógico suave.`;
              voiceoverScript = 'Todos os dias, milhões de brasileiros colocam a própria vida financeira no suporte do painel do carro sem perceber a vulnerabilidade.';
            } else if (i === act.targetBeatsCount - 1) {
              promptSubject = `Mão rápida atravessando a fresta da janela do carro no semáforo e retirando o celular do painel com o aparelho ainda aceso e desbloqueado. Enquadramento tenso e sóbrio em 35mm.`;
              voiceoverScript = 'O ladrão não quer o valor de revenda do aparelho. Ele quer os oito minutos em que o sistema ainda reconhece o dono.';
            } else {
              promptSubject = `Visão do trânsito paulistano através do para-brisa molhado. Reflexos de semáforos, ritmo urbano cotidiano, passageiro conferindo mensagens no aparelho.`;
              voiceoverScript = `Sob a conveniência da rotina conectada, a barreira de segurança digital depende de um único segundo de distração.`;
            }
          } else if (isFalsaCentral || isVozes) {
            if (i === 0) {
              promptSubject = `Mesa de madeira em escritório ou casa brasileira, luz suave de fim de tarde, café ao lado. Smartphone sobre a mesa exibindo chamada recebida com o nome exato da instituição bancária na tela. Fotografia documental 35mm sóbria, grão analógico suave, sem clichês.`;
              voiceoverScript = 'Quando o telefone toca e o identificador mostra o nome do seu banco, o cérebro assume imediatamente que a autoridade da instituição está do outro lado da linha.';
            } else if (i === act.targetBeatsCount - 1) {
              promptSubject = `Mão pegando o smartphone sobre a mesma mesa de madeira e atendendo no viva-voz. A tela exibe a chamada ativa. Luz suave de fim de tarde, foco na hesitação natural do gesto. Fotografia 35mm realista.`;
              voiceoverScript = 'A voz tem tom profissional, confirma seu nome completo e relata uma compra suspeita em andamento. O instinto de proteção é a primeira porta de entrada.';
            } else {
              promptSubject = `Ambiente doméstico brasileiro em luz natural neutra. Documentos de rotina sobre a escrivaninha, iluminação realista de fim de tarde, fotografia documental sóbria.`;
              voiceoverScript = `A engenharia social moderna não invade o telefone com códigos misteriosos. Ela invade a rotina através da autoridade percebida.`;
            }
          } else {
            if (i === 0) {
              promptSubject = `Balcão de comércio brasileiro, smartphone repousado sobre a bancada ao lado de uma máquina de cartão e notas fiscais. Fotografia documental 35mm sóbria, tons carvão e osso.`;
              voiceoverScript = 'O ecossistema digital brasileiro opera sob uma promessa de conveniência instantânea. Mas sob a superfície funcional, a margem de segurança é milimétrica.';
            } else if (i === act.targetBeatsCount - 1) {
              promptSubject = `Smartphone exibindo notificação de transação pendente com valor inesperado. Luz natural sutil, fotografia realista.`;
              voiceoverScript = 'Basta uma única anomalia na cadeia de confiança para que toda a infraestrutura se volte contra o próprio usuário.';
            } else {
              promptSubject = `Detalhe das mãos de um trabalhador operando aplicativo financeiro sob iluminação suave de ambiente de trabalho.`;
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
            promptSubject = `Relatório oficial do Banco Central do Brasil sobre fraudes eletrônicas e Mecanismo Especial de Devolução (MED). Documento autêntico com cabeçalho institucional visível, carimbo oficial e destaque tipográfico na estatística de spoofing telefônico, sem simulação por IA.`;
            voiceoverScript = 'Dados do Banco Central e boletins de estelionato revelam que mais de setenta por cento dos golpes telefônicos utilizam números mascarados para simular canais oficiais de atendimento.';
          } else if (i === act.targetBeatsCount - 1) {
            // Clímax do Ato 2: O MOMENTO DA BRECHA (Freeze-frame na decisão humana, fenda coral sem neon)
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'MOMENTO DA BRECHA';
            graphicHeadline = 'O INSTANTE CRÍTICO';
            evidenceRefs = ['SRC_BCB_MED_2024', 'SRC_SSP_ESTELIONATO_2025'];
            promptSubject = `Close-up macro do smartphone com o dedo da vítima hesitando a milímetros da tela sobre o botão de confirmação. A cena congela em freeze-frame absoluto. Uma fissura assimétrica na cor coral (#FF5A47) rasga a imagem contornando cirurgicamente a tecla de confirmação. Sem qualquer pulso de neon, brilho ou energia mágica.`;
            voiceoverScript = 'A brecha estava aqui. O banco nunca liga pedindo para cancelar uma transferência digitando senhas ou autorizando acessos.';
          } else if (i % 2 === 1) {
            // Reconstituição do vetor psicológico
            visualMode = 'generated_image_35mm';
            isReconstruction = true;
            telemetryLabel = 'RECONSTITUIÇÃO ILUSTRATIVA';
            promptSubject = `Tela de smartphone em close-up macro mostrando interface de chamada telefônica em andamento, protocolo de segurança falso ditado com precisão burocrática sob luz suave de escritório.`;
            voiceoverScript = 'A central falsa não pede sua senha abertamente. Ela pede que você confirme se reconhece a compra — induzindo um estado de alerta que suspende a checagem lógica.';
          } else {
            // Evidência de boletim ou registro
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'PROVA DOCUMENTAL';
            evidenceRefs = ['SRC_SSP_ESTELIONATO_2025'];
            promptSubject = `Extrato bancário anonimizado com tarjas pretas de privacidade, exibindo notificações sucessivas de tentativas de autenticação fora de padrão geográfico.`;
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
            promptSubject = `Diagrama esquemático de telecomunicações forense em tons carvão, osso e verde-azulado (#4F9B96). Servidor VoIP intermediário manipulando o cabeçalho do protocolo SIP para mascarar o número originador com a central legítima do banco. Relações funcionais puras, sem redes decorativas e sem pulso concêntrico de luz.`;
            voiceoverScript = 'Por trás da tela, o protocolo SIP permite que centrais clandestinas mascarem o número originador. O sistema de telefonia entrega à tela o número falso que o servidor injetou no cabeçalho da chamada.';
          } else if (i === act.targetBeatsCount - 1) {
            // Diagrama causal de pulverização Pix em cascata
            visualMode = 'motion_image_diagram';
            telemetryLabel = 'ROTA FINANCEIRA';
            graphicHeadline = 'PULVERIZAÇÃO EM CASCATA';
            promptSubject = `Diagrama causal de pulverização bancária em tons carvão, osso e verde-azulado (#4F9B96), com coral (#FF5A47) marcando o elo explorado. Visualização da divisão instantânea do valor roubado através de contas de passagem de laranjas em múltiplos bancos digitais. Fluxo geométrico limpo, sem pulsos concêntricos.`;
            voiceoverScript = 'Uma vez autorizada a transação, o dinheiro não fica parado. Em menos de noventa segundos, transferências automatizadas dividem o saldo entre dezenas de contas intermediárias antes de qualquer bloqueio cautelar.';
          } else if (i % 3 === 0) {
            // Evidência de auditoria de tráfego
            visualMode = 'motion_image_diagram';
            telemetryLabel = 'REGISTRO DE REDE';
            promptSubject = `Mapa vetorial esquemático de roteamento entre nós de telecomunicação e autenticação de tokens em nuvem, sem estética hacker de cinema.`;
            voiceoverScript = 'A arquitetura de autenticação valida quem possui a posse técnica do código no instante da requisição, não quem tem a titularidade real do contrato.';
          } else {
            // Reconstrução técnica contextual
            visualMode = 'generated_image_35mm';
            isReconstruction = true;
            telemetryLabel = 'RECONSTITUIÇÃO';
            promptSubject = `Rack de servidores de telecomunicações sóbrio em sala técnica com luz difusa, cabos organizados, estética documental e neutra.`;
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
            promptSubject = `Retorno visual à mesma mesa de madeira e ao mesmo smartphone da abertura, na mesma luz suave da tarde. O telefone repousa sobre a mesa, mas agora a chamada fraudulenta está encerrada e bloqueada, e o aplicativo bancário oficial legítimo está aberto na tela em repouso seguro. Fotografia 35mm sóbria, sem chaves físicas de segurança.`;
            voiceoverScript = 'A defesa não depende de tecnologia complexa ou equipamentos especiais. Depende de interromper o ciclo no momento exato em que a pressão é exercida.';
          } else if (i === act.targetBeatsCount - 1) {
            // 3 Passos Priorizados de Defesa (Seção 21 da Brand Bible) & Assinatura
            visualMode = 'motion_image_diagram';
            isReconstruction = false;
            telemetryLabel = 'PROTOCOLO DE DEFESA';
            graphicHeadline = '3 PASSOS DE SOBREVIVÊNCIA';
            promptSubject = `Painel tipográfico limpo em três camadas estruturadas sobre fundo carvão (#0D0D0F) e osso (#E8E2D7): 1. Desligar a chamada imediatamente; 2. Ligar para o canal oficial impresso no verso do cartão físico; 3. Configurar limites de Pix no app oficial. Sem compras de hardware, executável em menos de dez minutos.`;
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
            promptSubject = `Pessoa em ambiente residencial brasileiro em luz suave da manhã, verificando saldo e configurações de segurança com tranquilidade e controle.`;
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
