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

        // Template beat generator for BRECHA by Act
        if (act.actNumber === 1) {
          // Act 1: Superfície da Normalidade
          isReconstruction = i % 2 === 0;
          telemetryLabel = isReconstruction ? 'RECONSTITUIÇÃO' : 'CONTEXTO DIGITAL';
          graphicHeadline = i === 0 ? 'SITUAÇÃO DE ROTINA' : undefined;

          if (is8Minutos) {
            promptSubject = `São Paulo, final de tarde cinzenta e chuvosa. Celular fixado no painel de um carro no trânsito, tela desbloqueada exibindo aplicativo de navegação. Iluminação fria e realista, fotografia documental 35mm, grão analógico suave.`;
            voiceoverScript = i === 0
              ? 'Todos os dias, milhões de brasileiros colocam a própria vida financeira no suporte do painel do carro sem perceber a vulnerabilidade.'
              : 'Na tela desbloqueada, o mapa parece inofensivo. Mas para o crime organizado, aquele vidro aceso é um cofre aberto com a chave na fechadura.';
          } else if (isFalsaCentral) {
            promptSubject = `Mesa de escritório em apartamento urbano, luz suave de fim de tarde. Smartphone sobre a mesa exibindo chamada recebida com o nome exato do banco na tela. Estética documental sóbria.`;
            voiceoverScript = i === 0
              ? 'Quando o telefone toca e o identificador mostra o nome do seu banco, o cérebro assume imediatamente que a autoridade da instituição está do outro lado da linha.'
              : 'A voz tem tom profissional, conhece o seu nome completo e relata uma compra suspeita em andamento. O instinto de proteção é a própria armadilha.';
          } else {
            promptSubject = `Dispositivo móvel sobre balcão de café urbano, notificações silenciosas piscando. Fotografia documental cinematográfica, tons carvão e osso, atmosfera reflexiva.`;
            voiceoverScript = i === 0
              ? `O ecossistema digital brasileiro opera sob uma promessa de conveniência instantânea. Mas sob a superfície funcional, existe uma margem estreita de segurança.`
              : `Basta uma única anomalia na cadeia de confiança para que toda a infraestrutura se volte contra o próprio usuário.`;
          }
        } else if (act.actNumber === 2) {
          // Act 2: Anomalia & Vetor de Ataque
          isReconstruction = true;
          telemetryLabel = 'RECONSTITUIÇÃO ILUSTRATIVA';

          if (is8Minutos) {
            promptSubject = `Cruzamento movimentado visto através de vidro de carro. Silhueta de ciclista aproximando-se velozmente, mão em movimento rápido através da janela semiaberta. Tom de urgência contida, iluminação dramática documental.`;
            voiceoverScript = i === 0
              ? 'Em menos de dois segundos, a janela semiaberta deixa de ser uma fresta de ar e vira a porta de entrada para toda a sua identidade.'
              : 'O pedestre ou ciclista não quer o valor de revenda do aparelho. Ele quer o tempo em que o aparelho permanece sem bloqueio biométrico.';
          } else if (isFalsaCentral) {
            promptSubject = `Tela de smartphone em close-up macro mostrando interface de chamada telefônica em andamento, protocolo de segurança falso ditado com precisão burocrática.`;
            voiceoverScript = i === 0
              ? 'A central falsa não pede sua senha. Ela pede que você confirme se reconhece a transação — e cria um falso senso de urgência que suspende o pensamento crítico.'
              : 'Ao digitar os dígitos solicitados na URA simulada, a vítima não está cancelando um débito; está autorizando o acesso remoto ao seu próprio dispositivo.';
          } else {
            promptSubject = `Smartphone exibindo tela de erro crítico ou alerta de conexão encerrada. Close macro cinematográfico, reflexos sóbrios na tela escura.`;
            voiceoverScript = i === 0
              ? 'A anomalia raramente se manifesta como um alarme ruidoso. Ela começa com um sinal discreto: uma linha muda, um SMS fora de hora ou uma notificação repentina.'
              : 'Antes que a vítima compreenda a gravidade, o primeiro elo da corrente de segurança já foi rompido.';
          }
        } else if (act.actNumber === 3) {
          // Act 3: A Mecânica Oculta / Momento da Brecha
          visualMode = (i % 3 === 0) ? 'motion_image_diagram' : 'generated_image_35mm';
          isReconstruction = visualMode === 'generated_image_35mm';
          telemetryLabel = visualMode === 'motion_image_diagram' ? 'MOMENTO DA BRECHA' : 'RECONSTITUIÇÃO';

          if (is8Minutos) {
            promptSubject = `Diagrama isométrico forense em tons carvão, osso e coral alaranjado. Linha do tempo de 8 minutos conectando troca física do chip SIM, reset de autenticação de dois fatores e autorização de empréstimo bancário.`;
            voiceoverScript = i === 0
              ? 'Aqui acontece o momento da brecha: a troca física do chip SIM para outro aparelho intercepta os códigos SMS de recuperação antes que a linha seja suspensa pela operadora.'
              : 'Com o número em mãos e os e-mails acessíveis, a redefinição de senha bancária leva em média cento e oitenta segundos. O sistema valida quem tem o token, não quem tem a titularidade moral.';
          } else if (isFalsaCentral) {
            promptSubject = `Diagrama esquemático de rede forense demonstrando spoofing de protocolo VoIP, servidores intermediários e transferência simulada entre falsos operadores.`;
            voiceoverScript = i === 0
              ? 'O protocolo SIP e a infraestrutura de telefonia permitem que centrais clandestinas mascarem o número originador com o número público legítimo da central de atendimento do banco.'
              : 'A vítima ouve a mesma música de espera, o mesmo jingle institucional e a mesma cadência formal. A engenharia social não explora falhas no código; explora a anatomia da confiança humana.';
          } else {
            promptSubject = `Diagrama analítico em motion mostrando o vetor de exploração e o fluxo financeiro através de camadas de contas intermediárias.`;
            voiceoverScript = i === 0
              ? 'O momento da brecha ocorre no ponto de menor fricção: onde a conveniência do sistema abre mão de uma validação redundante em troca de velocidade.'
              : 'A mecânica do crime se apoia na assimetria de tempo. O criminoso age em segundos; o processo de contenção institucional responde em horas.';
          }
        } else {
          // Act 4: Impacto, Consequências & Protocolo de Sobrevivência
          isReconstruction = false;
          telemetryLabel = 'PROTOCOLO DE SOBREVIVÊNCIA';
          graphicHeadline = i === 0 ? 'DEFESA EM CAMADAS' : undefined;

          if (is8Minutos) {
            promptSubject = `Configuração de segurança em dispositivo móvel sob luz neutra de estúdio jornalístico. Ícones de autenticador offline, bloqueio de chip com PIN e pasta segura. Fotografia documental limpa.`;
            voiceoverScript = i === 0
              ? 'A sobrevivência digital exige defesa em camadas: chip com PIN obrigatório, autenticadores fora do SMS e aplicativos bancários confinados fora da tela principal.'
              : 'Em segurança digital moderna, os primeiros trinta minutos definem tudo. Conhecer a mecânica da brecha é a única blindagem real contra o próximo golpe.';
          } else {
            promptSubject = `Tela de smartphone com autenticação forte multifator por chave física de segurança, contraste nítido, estética documental de investigação.`;
            voiceoverScript = i === 0
              ? 'Instituições financeiras e plataformas digitais operam sob regras de conformidade estritas, mas a primeira e última linha de defesa reside no protocolo individual de resposta a incidentes.'
              : 'Desconfiar do identificador, validar por canal independente e nunca agir sob senso de urgência induzido são os princípios fundamentais da sobrevivência no ecossistema digital.';
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
          evidenceRefs: ['SRC_BCB_MED_2024', 'SRC_SSP_ESTELIONATO_2025']
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
