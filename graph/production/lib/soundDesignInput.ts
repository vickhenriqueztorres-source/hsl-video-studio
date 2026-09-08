import { HslLongFormProjectPlan, HslSceneBeat } from '../../../hsl/core/types';
import { VideoAnalysisInput, VisualCue, SceneMood } from '../../../sound-agent/types/scene-analysis.types';

function detectEnvironment(text: string, title: string): string {
  const corpus = `${title} ${text}`.toLowerCase();

  if (/(chiller|compressor|compress[aã]o|evaporad|condensad|refrigerant|água gelada|chilled water)/.test(corpus)) {
    return 'datacenter_chiller_plant';
  }
  if (/(cooling tower|torre de resfriamento|evaporativ|pluma|outdoor heat)/.test(corpus)) {
    return 'cooling_tower_outdoor';
  }
  if (/(server rack|cold aisle|hot aisle|corredor frio|corredor quente|airflow|ventila[çc][ãa]o|ventilador|fan\b|blade server|datacenter|data center)/.test(corpus)) {
    return 'server_aisle_airflow';
  }
  if (/(subterranean|subsolo|bomba|pump|tubula[çc][ãa]o|pipe|pipeline|manifold|v[áa]lvula|valve|recircula[çc][ãa]o|circuito hidr[áa]ulico|hydraulic loop)/.test(corpus)) {
    return 'subterranean_pipe_gallery';
  }
  if (/(heat exchanger|troca t[é]rmica|thermal transfer|placas t[é]rmicas|radiator|dissipa[çc][ãa]o)/.test(corpus)) {
    return 'heat_exchanger_containment';
  }
  if (/(control room|sala de controle|scada|telemetria|telemetry|monitoramento|console|dashboard)/.test(corpus)) {
    return 'control_room_telemetry';
  }
  if (/(substation|subesta[çc][ãa]o|transformador|transformer|alta tens[ãa]o|high voltage|gerador|generator|grid frequency|frequ[êe]ncia)/.test(corpus)) {
    return 'high_voltage_substation';
  }
  if (/(tuned mass damper|damper|pendulum|amortecedor|arranha-c[é]u|skyscraper|vento|high altitude)/.test(corpus)) {
    return 'hydraulic_damper_bay';
  }
  if (/(aqueduct|aqueduto|barragem|dam|adutora|reservat[óo]rio|reservoir|canal)/.test(corpus)) {
    return 'aqueduct_pumping_station';
  }
  if (/(cooling|data center|datacenter|resfriamento)/.test(corpus)) {
    return 'datacenter_cooling_facility';
  }
  return 'industrial_technical_facility';
}

function detectMood(beat: HslSceneBeat, text: string): SceneMood {
  const role = (beat.narrativeRole ?? '').toUpperCase();
  const corpus = `${role} ${text}`.toLowerCase();

  if (/(crisis|bottleneck|failure|falha|colapso|gargalo|emergency|perigo|limite|boundary|strain|ruptura)/.test(corpus) ||
      ['BOTTLENECK_CRISIS', 'BOUNDARY_LIMIT', 'EMERGENCY_DISPATCH', 'THERMAL_LIMIT', 'CRITICAL_STRAIN', 'SEISMIC_CRISIS'].includes(role)) {
    return 'dark';
  }
  if (/(monumental|epic|imponente|escala monumental|monument)/.test(corpus) ||
      ['MONUMENTAL_HOOK', 'HERO_EXPLORATION', 'PHYSICAL_SCALE'].includes(role)) {
    return 'epic';
  }
  if (/(kinetic|whip|r[áa]pido|speed|flow|action|din[âa]mico)/.test(corpus) ||
      ['KINETIC_FLOW', 'FAST_WHIP_PAN'].includes(role) || beat.cameraMovement === 'FAST_WHIP_PAN') {
    return 'action';
  }
  if (/(blueprint|model|anatomy|architecture|thesis|sistema|telemetria)/.test(corpus) ||
      ['TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'SYSTEM_ARCHITECTURE', 'CORE_THESIS'].includes(role)) {
    return 'suspense';
  }
  if (role === 'FINAL_HANDOFF') {
    return 'calm';
  }
  return 'suspense';
}

function deriveVisualCues(beat: HslSceneBeat, startFrame: number, endFrame: number, env: string, mood: SceneMood, text: string): VisualCue[] {
  const cues: VisualCue[] = [{ frame: startFrame, type: 'environment', description: `${env}: ${beat.stage}`, mood }];
  const lower = text.toLowerCase();

  if (/(v[áa]lvula|valve|switch|chave|disjuntor)/.test(lower)) {
    cues.push({
      frame: startFrame + Math.min(15, Math.floor(beat.durationFrames * 0.3)),
      type: 'action',
      description: 'valve actuation / circuit switch',
      soundNeeded: 'valve_turn',
      intensity: 'medium'
    });
  }
  if (/(bomba|pump|compressor)/.test(lower)) {
    cues.push({
      frame: startFrame + Math.min(20, Math.floor(beat.durationFrames * 0.4)),
      type: 'action',
      description: 'pump engagement / mechanical compression',
      soundNeeded: 'pump_hum',
      intensity: 'high'
    });
  }
  if (/(fan\b|ventilador|ventila[çc][ãa]o|airflow|fluxo de ar)/.test(lower)) {
    cues.push({
      frame: startFrame + Math.min(10, Math.floor(beat.durationFrames * 0.2)),
      type: 'action',
      description: 'high velocity fan airflow',
      soundNeeded: 'airflow_whoosh',
      intensity: 'medium'
    });
  }
  if (/(recircula[çc][ãa]o|fluido|água|pipe|tubo|loop hidr[áa]ulico)/.test(lower)) {
    cues.push({
      frame: startFrame + Math.min(25, Math.floor(beat.durationFrames * 0.5)),
      type: 'action',
      description: 'recirculation fluid hydraulic loop',
      soundNeeded: 'fluid_flow',
      intensity: 'medium'
    });
  }
  if (beat.cameraMovement === 'FAST_WHIP_PAN' || beat.cameraMovement === 'ZOOM_OUT_REVEAL' || beat.pacingType === 'PUNCH_HOOK') {
    cues.push({
      frame: Math.max(startFrame, endFrame - 15),
      type: 'transition',
      description: 'rapid camera move or reveal',
      soundNeeded: 'whoosh_transition',
      intensity: 'high'
    });
  }
  if (mood === 'dark' || /(bottleneck|gargalo|falha|limite|colapso|alert)/.test(lower)) {
    cues.push({
      frame: startFrame + Math.floor(beat.durationFrames * 0.55),
      type: 'climax',
      description: 'system bottleneck alert / thermal barrier',
      soundNeeded: 'subtle_strike_impact',
      intensity: 'maximum'
    });
  }
  return cues;
}

export function soundDesignInput(episodeId: string, plan: HslLongFormProjectPlan): VideoAnalysisInput {
  let frameOffset = 0;
  return {
    videoId: episodeId,
    totalFrames: plan.totalFrames,
    fps: 30,
    globalMood: 'suspense',
    scenes: plan.beats.map((beat) => {
      const startFrame = frameOffset;
      const endFrame = frameOffset + beat.durationFrames;
      frameOffset = endFrame;

      const semanticText = [
        beat.narrativeRole ?? '',
        beat.promptSubject ?? '',
        beat.cinematicPrompt,
        beat.voiceoverScript,
        beat.stage,
        beat.actTitle
      ].join(' ');

      const detectedEnvironment = detectEnvironment(semanticText, plan.episodeTitle);
      const detectedMood = detectMood(beat, semanticText);
      const visualCues = deriveVisualCues(beat, startFrame, endFrame, detectedEnvironment, detectedMood, semanticText);
      const audioCues = [{ frame: startFrame, type: 'voice' as const, hasVoice: true, voiceType: 'narration' as const, targetDb: -12 }];

      const recommendedLayers = ['ambience', 'foley'];
      if (detectedMood === 'dark') recommendedLayers.push('tension_riser', 'impact');
      if (detectedMood === 'action') recommendedLayers.push('flow_accent');

      return {
        sceneId: beat.beatId.toLowerCase(),
        startFrame,
        endFrame,
        detectedMood,
        detectedEnvironment,
        visualCues,
        audioCues,
        recommendedLayers
      };
    })
  };
}
