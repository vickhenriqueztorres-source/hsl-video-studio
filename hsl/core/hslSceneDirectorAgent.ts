import fs from 'fs';
import path from 'path';
import {
  HslVisualMode,
  HslShotSize,
  HslCameraMovement,
  HslPacingType,
  HslSceneBeat,
  HslLongFormProjectPlan,
  EpisodeTopicInput
} from './types';
import {
  HSL_CANONICAL_ACTS,
  HSL_FPS,
  secondsToFrames,
  HSL_EPISODE_TARGET_DURATION_SECONDS,
  getDynamicBeatDurations
} from '../../spec/hsl-spec';
import {
  getJetFuelBeatData,
  getAiCoolingBeatData,
  getSkyscraperHydraulicsBeatData,
  getGridFrequencyBeatData,
  getWallStreetLatencyBeatData,
  getKesslerBeatData,
  getMegaShipHydrodynamicsBeatData,
  getTaipeiTmdBeatData,
  getUniversalTopicBeatData
} from '../editorial/topicStoryboards';

export * from './types';

export class HslSceneDirectorAgent {
  /**
   * Planeja um episódio documental completo de 10 a 12 minutos (600s a 720s) DO ZERO.
   * Derivado estritamente da especificação executável do PRD (spec/hsl-spec.ts).
   * Garante 100% de variedade: zero repetições de texto, pacing dinâmico de 3s a 11s e cortes cinéticos.
   */
  public static planEpisodeFromScratch(input: EpisodeTopicInput): HslLongFormProjectPlan {
    const targetMinutes = input.targetMinutes || 10;
    const totalDurationSeconds = targetMinutes === 10 ? HSL_EPISODE_TARGET_DURATION_SECONDS : targetMinutes * 60;
    const fps = HSL_FPS;
    const totalFrames = secondsToFrames(totalDurationSeconds);

    const actConfigs = HSL_CANONICAL_ACTS;
    let currentBeatIndex = 1;
    const allBeats: HslSceneBeat[] = [];

    // Matriz de variação de planos e movimentos para evitar padrões monótonos
    const shotSizeSequence: HslShotSize[] = [
      'EXTREME_WIDE', 'MACRO', 'WIDE', 'CLOSE', 'ISOMETRIC_3D', 'MEDIUM',
      'WIDE', 'MACRO', 'EXTREME_WIDE', 'CLOSE', 'ISOMETRIC_3D', 'MEDIUM',
      'CLOSE', 'WIDE', 'MACRO', 'EXTREME_WIDE'
    ];

    const movementSequence: HslCameraMovement[] = [
      'ZOOM_OUT_REVEAL', 'SLOW_DOLLY_IN', 'ISOMETRIC_GLIDE', 'PULSING_ORBIT',
      'SLOW_PAN_RIGHT', 'FAST_WHIP_PAN', 'CAMERA_DRIFT', 'LOCKED_TELEMETRY',
      'SLOW_PAN_LEFT', 'SLOW_DOLLY_IN', 'ZOOM_OUT_REVEAL', 'ISOMETRIC_GLIDE',
      'CAMERA_DRIFT', 'PULSING_ORBIT', 'LOCKED_TELEMETRY', 'FAST_WHIP_PAN'
    ];

    for (const act of actConfigs) {
      // Cálculo de durações dinâmicas rítmicas (Pacing Respiratório: 3.0s a 11.0s)
      const beatDurations = getDynamicBeatDurations(act.actNumber, act.targetDurationSeconds, act.targetBeatsCount);

      for (let i = 0; i < act.targetBeatsCount; i++) {
        const beatNum = currentBeatIndex++;
        const beatId = `SCENE_${String(beatNum).padStart(3, '0')}`;
        const durationSec = beatDurations[i];
        const durationFrames = secondsToFrames(durationSec);

        const pacingType: HslPacingType = durationSec <= 4.0 ? 'PUNCH_HOOK' : durationSec >= 8.0 ? 'HERO_EXPLORATION' : 'MODULAR_NARRATIVE';
        const shotSize = shotSizeSequence[(beatNum + i * 3) % shotSizeSequence.length];
        const cameraMovement = movementSequence[(beatNum * 2 + i) % movementSequence.length];

        let visualMode: HslVisualMode = 'generated_image_35mm';
        let infographicArchetype: '3D_MAP' | 'CUTAWAY' | 'TARMAC_FLOW' | 'FLIPBOARD' | 'MACRO_HUD' | undefined;
        let graphicHeadline: string | undefined;
        let telemetryLabel: string | undefined;
        let promptSubject = '';
        let voiceoverScript = '';

        // ---------------------------------------------------------------------
        // GERAÇÃO DE ROTEIRO & CLASSIFICAÇÃO VISUAL SEMÂNTICA POR ATO (SEM REPETIÇÃO)
        // ---------------------------------------------------------------------
        let narrativeRole: import('./types').HslNarrativeRole = 'CORE_THESIS';

        const isGridTopic = input.topic.toLowerCase().includes('grid') ||
          input.topic.toLowerCase().includes('hertz') ||
          input.topic.toLowerCase().includes('hz') ||
          input.topic.toLowerCase().includes('frequency') ||
          input.topic.toLowerCase().includes('blackout') ||
          input.topic.toLowerCase().includes('electricity') ||
          input.topic.toLowerCase().includes('power') ||
          input.topic.toLowerCase().includes('storage') ||
          input.entity.toLowerCase().includes('grid') ||
          input.entity.toLowerCase().includes('frequency') ||
          input.entity.toLowerCase().includes('electricity') ||
          input.episodeId.toLowerCase().includes('grid') ||
          input.episodeId.toLowerCase().includes('frequency');

        const isSkyscraperTopic = input.topic.toLowerCase().includes('skyscraper') ||
          input.topic.toLowerCase().includes('tower') ||
          input.topic.toLowerCase().includes('psi') ||
          input.topic.toLowerCase().includes('hydraulic') ||
          input.topic.toLowerCase().includes('pressure') ||
          input.topic.toLowerCase().includes('megatall') ||
          input.entity.toLowerCase().includes('skyscraper') ||
          input.entity.toLowerCase().includes('tower') ||
          input.entity.toLowerCase().includes('hydraulic') ||
          input.episodeId.toLowerCase().includes('skyscraper') ||
          input.episodeId.toLowerCase().includes('tower');

        const isFuelTopic = input.topic.toLowerCase().includes('fuel') ||
          input.entity.toLowerCase().includes('fuel') ||
          input.episodeId.toLowerCase().includes('fuel') ||
          input.topic.toLowerCase().includes('airport');

        const isAiCoolingTopic = input.topic.toLowerCase().includes('cooling') ||
          input.topic.toLowerCase().includes('melt') ||
          input.entity.toLowerCase().includes('cooling') ||
          input.episodeId.toLowerCase().includes('cooling') ||
          input.topic.toLowerCase().includes('liquid') ||
          input.topic.toLowerCase().includes('supercomputer') ||
          input.topic.toLowerCase().includes('cluster');

        const isKesslerTopic = input.topic.toLowerCase().includes('kessler') ||
          input.topic.toLowerCase().includes('debris') ||
          input.topic.toLowerCase().includes('satellite') ||
          input.topic.toLowerCase().includes('orbit') ||
          input.topic.toLowerCase().includes('space') ||
          input.topic.toLowerCase().includes('paint') ||
          input.topic.toLowerCase().includes('28,000') ||
          input.entity.toLowerCase().includes('satellite') ||
          input.entity.toLowerCase().includes('debris') ||
          input.entity.toLowerCase().includes('orbit') ||
          input.episodeId.toLowerCase().includes('space') ||
          input.episodeId.toLowerCase().includes('debris');

        const isWallStreetLatencyTopic = input.topic.toLowerCase().includes('wall street') ||
          input.topic.toLowerCase().includes('high-frequency trading') ||
          input.topic.toLowerCase().includes('hft') ||
          input.topic.toLowerCase().includes('latency') ||
          input.topic.toLowerCase().includes('millisecond') ||
          input.topic.toLowerCase().includes('microwave') ||
          input.topic.toLowerCase().includes('arbitrage') ||
          input.entity.toLowerCase().includes('matching engine') ||
          input.entity.toLowerCase().includes('exchange') ||
          input.entity.toLowerCase().includes('market') ||
          input.episodeId.toLowerCase().includes('wall_street') ||
          input.episodeId.toLowerCase().includes('latency') ||
          input.episodeId.toLowerCase().includes('hft');

        const isTaipeiTmdTopic = input.topic.toLowerCase().includes('taipei') ||
          input.topic.toLowerCase().includes('tmd') ||
          input.topic.toLowerCase().includes('boliche') ||
          input.topic.toLowerCase().includes('660') ||
          input.topic.toLowerCase().includes('damper') ||
          input.topic.toLowerCase().includes('amortecedor') ||
          input.entity.toLowerCase().includes('taipei') ||
          input.entity.toLowerCase().includes('damper') ||
          input.entity.toLowerCase().includes('tmd') ||
          input.episodeId.toLowerCase().includes('taipei') ||
          input.episodeId.toLowerCase().includes('tmd');

        const isMegaShipTopic = input.topic.toLowerCase().includes('megaship') ||
          input.topic.toLowerCase().includes('monstro') ||
          input.topic.toLowerCase().includes('240.000') ||
          input.topic.toLowerCase().includes('240,000') ||
          input.topic.toLowerCase().includes('suez') ||
          input.topic.toLowerCase().includes('frear') ||
          input.topic.toLowerCase().includes('container') ||
          input.topic.toLowerCase().includes('navio') ||
          input.topic.toLowerCase().includes('maritime') ||
          input.entity.toLowerCase().includes('navio') ||
          input.entity.toLowerCase().includes('ship') ||
          input.entity.toLowerCase().includes('container') ||
          input.episodeId.toLowerCase().includes('megaship') ||
          input.episodeId.toLowerCase().includes('ship') ||
          input.episodeId.toLowerCase().includes('suez');

        if (isTaipeiTmdTopic) {
          const tmdData = getTaipeiTmdBeatData(act.actNumber, i, input);
          narrativeRole = tmdData.narrativeRole;
          visualMode = tmdData.visualMode;
          infographicArchetype = tmdData.infographicArchetype;
          graphicHeadline = tmdData.graphicHeadline;
          telemetryLabel = tmdData.telemetryLabel;
          voiceoverScript = tmdData.voiceoverScript;
          promptSubject = tmdData.promptSubject;
        } else if (isMegaShipTopic) {
          const shipData = getMegaShipHydrodynamicsBeatData(act.actNumber, i, input);
          narrativeRole = shipData.narrativeRole;
          visualMode = shipData.visualMode;
          infographicArchetype = shipData.infographicArchetype;
          graphicHeadline = shipData.graphicHeadline;
          telemetryLabel = shipData.telemetryLabel;
          voiceoverScript = shipData.voiceoverScript;
          promptSubject = shipData.promptSubject;
        } else if (isKesslerTopic) {
          const kesslerData = getKesslerBeatData(act.actNumber, i, input);
          narrativeRole = kesslerData.narrativeRole;
          visualMode = kesslerData.visualMode;
          infographicArchetype = kesslerData.infographicArchetype;
          graphicHeadline = kesslerData.graphicHeadline;
          telemetryLabel = kesslerData.telemetryLabel;
          voiceoverScript = kesslerData.voiceoverScript;
          promptSubject = kesslerData.promptSubject;
        } else if (isWallStreetLatencyTopic) {
          const latencyData = getWallStreetLatencyBeatData(act.actNumber, i, input);
          narrativeRole = latencyData.narrativeRole;
          visualMode = latencyData.visualMode;
          infographicArchetype = latencyData.infographicArchetype;
          graphicHeadline = latencyData.graphicHeadline;
          telemetryLabel = latencyData.telemetryLabel;
          voiceoverScript = latencyData.voiceoverScript;
          promptSubject = latencyData.promptSubject;
        } else if (isGridTopic) {
          const gridData = getGridFrequencyBeatData(act.actNumber, i, input);
          narrativeRole = gridData.narrativeRole;
          visualMode = gridData.visualMode;
          infographicArchetype = gridData.infographicArchetype;
          graphicHeadline = gridData.graphicHeadline;
          telemetryLabel = gridData.telemetryLabel;
          voiceoverScript = gridData.voiceoverScript;
          promptSubject = gridData.promptSubject;
        } else if (isSkyscraperTopic) {
          const skyData = getSkyscraperHydraulicsBeatData(act.actNumber, i, input);
          narrativeRole = skyData.narrativeRole;
          visualMode = skyData.visualMode;
          infographicArchetype = skyData.infographicArchetype;
          graphicHeadline = skyData.graphicHeadline;
          telemetryLabel = skyData.telemetryLabel;
          voiceoverScript = skyData.voiceoverScript;
          promptSubject = skyData.promptSubject;
        } else if (isAiCoolingTopic) {
          const aiData = getAiCoolingBeatData(act.actNumber, i, input);
          narrativeRole = aiData.narrativeRole;
          visualMode = aiData.visualMode;
          infographicArchetype = aiData.infographicArchetype;
          graphicHeadline = aiData.graphicHeadline;
          telemetryLabel = aiData.telemetryLabel;
          voiceoverScript = aiData.voiceoverScript;
          promptSubject = aiData.promptSubject;
        } else if (isFuelTopic) {
          const fuelData = getJetFuelBeatData(act.actNumber, i, input);
          narrativeRole = fuelData.narrativeRole;
          visualMode = fuelData.visualMode;
          infographicArchetype = fuelData.infographicArchetype;
          graphicHeadline = fuelData.graphicHeadline;
          telemetryLabel = fuelData.telemetryLabel;
          voiceoverScript = fuelData.voiceoverScript;
          promptSubject = fuelData.promptSubject;
        } else {
          const universalData = getUniversalTopicBeatData(act.actNumber, i, input);
          narrativeRole = universalData.narrativeRole;
          visualMode = universalData.visualMode;
          infographicArchetype = universalData.infographicArchetype;
          graphicHeadline = universalData.graphicHeadline;
          telemetryLabel = universalData.telemetryLabel;
          voiceoverScript = universalData.voiceoverScript;
          promptSubject = universalData.promptSubject;
        }





        // Geração do prompt cinematográfico de alta fidelidade Kinetic Velocity individualizado
        const cinematicPrompt = `Cinematic 35mm pop-documentary shot, ${shotSize.toLowerCase()} angle, ${cameraMovement.toLowerCase().replace(/_/g, ' ')}, ${promptSubject}, Apple Keynote meets Vox high-voltage documentary aesthetic, monumental off-white typography overlays (#F4F4F0), Arri Alexa LF 8k.`;

        allBeats.push({
          beatId,
          actNumber: act.actNumber,
          actTitle: act.title,
          stage: act.title,
          durationSeconds: durationSec,
          durationFrames,
          visualMode,
          shotSize,
          cameraMovement,
          pacingType,
          narrativeRole,
          cinematicPrompt,
          voiceoverScript,
          infographicArchetype,
          graphicHeadline,
          telemetryLabel,
          outputFramePath: `runs/${input.episodeId}/frames/${beatId}.png`,
          outputVideoPath: `runs/${input.episodeId}/videos/${beatId}.mp4`
        });
      }
    }

    return {
      episodeId: input.episodeId,
      episodeTitle: input.topic,
      subtitle: `${input.entity.toUpperCase()} // THROUGHPUT & BOTTLENECK ANALYSIS`,
      totalDurationSeconds,
      totalFrames,
      totalBeatsCount: allBeats.length,
      targetMinutes,
      thesis: input.thesis,
      acts: actConfigs.map(a => ({
        actNumber: a.actNumber,
        title: a.title,
        durationSeconds: a.targetDurationSeconds,
        beatsCount: a.targetBeatsCount
      })),
      beats: allBeats
    };
  }
}
