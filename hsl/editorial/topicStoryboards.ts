import { HslNarrativeRole, HslVisualMode, EpisodeTopicInput } from '../core/types';
import { resolveCanonicalVisualMode } from '../../spec/hsl-spec';

export interface BeatStoryboardData {
  narrativeRole: HslNarrativeRole;
  visualMode: HslVisualMode;
  infographicArchetype?: '3D_MAP' | 'CUTAWAY' | 'TARMAC_FLOW' | 'FLIPBOARD' | 'MACRO_HUD';
  graphicHeadline?: string;
  telemetryLabel?: string;
  voiceoverScript: string;
  promptSubject: string;
}

/**
 * Storyboard canônico para o Episódio de Combustível de Aviação (Jet A-1):
 * "WHY AIRPORTS CANNOT RUN OUT OF FUEL" (100% livre de repetições, word-budget calibrado)
 */
export function getJetFuelBeatData(actNumber: number, beatIndex: number, input: EpisodeTopicInput): BeatStoryboardData {
  if (actNumber === 1) {
    // ATO 01: THE HOOK & THE VISIBLE MIRACLE (12 beats // 75s)
    const roles: HslNarrativeRole[] = [
      'MONUMENTAL_HOOK', 'KINETIC_FLOW', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH',
      'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'CORE_THESIS'
    ];
    const role = roles[beatIndex % roles.length];
    // 7 Vídeos de Ação Contínua no Ato 1
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 1 || beatIndex === 2 || beatIndex === 5 || beatIndex === 6 || beatIndex === 7 || beatIndex === 11) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 3) ? 'TARMAC_FLOW' : (beatIndex === 4 || beatIndex === 10) ? 'CUTAWAY' : (beatIndex === 9) ? '3D_MAP' : beatIndex === 8 ? 'MACRO_HUD' : undefined;

    const scripts = [
      `If an international airport runs out of fuel for just 120 seconds, global airspace freezes and 100,000 passengers are stranded.`,
      `Over 100,000 flights take off daily without delay.`,
      `A single wide-body jet drinks 5,000 gallons of fuel in under twenty minutes.`,
      `Yet you will never see a single tanker truck driving across the active international runway.`,
      `Fuel moves through an invisible pressurized labyrinth.`,
      `Pumping at 3,800 liters per minute directly beneath passenger gates.`,
      `The visible product is a plane taking off; the hidden product is continuous hydraulic buffer velocity.`,
      `A single pressure drop forces emergency flight diversions.`,
      `How do airports store 52 million gallons without catastrophic vapor ignition?`,
      `The answer lies in subterranean ring mains operating at 150 PSI of continuous hydrostatic pressure.`,
      `Hydrant pits connect directly to aircraft wings.`,
      `This is the pressurized engineering that keeps modern aviation in continuous flight.`
    ];

    const prompts = [
      `monumental night tarmac view of Boeing 777 being fueled, glowing electric acid yellow (#FFE500) trajectory curves leading to aircraft, numbered step badges 01 02 03 04 05, dark matte obsidian asphalt (#0D0E15)`,
      `wide panoramic long exposure of airport runways with crisscrossing aircraft takeoff light streaks in neon yellow and blue`,
      `macro 35mm view of heavy dual-hose hydrant servicer vehicle pumping under Boeing 777 wing at high flow rate`,
      `high-angle aerial shot of busy airport apron with 40 wide-body gates, completely empty tarmac free of tanker trucks`,
      `3D wireframe subterranean overlay showing massive steel pipes glowing under airport terminal concrete`,
      `continuous tracking shot following pressurized fuel flowing through underground stainless steel pipeline ring main`,
      `wide shot of Airbus A350 rotating into sunset sky above runway, glowing blue and yellow pipeline schematic overlaid beneath`,
      `cockpit master warning display flashing LOW FUEL PRESSURE ALERT with flashing red warning indicators`,
      `elevated dusk view of massive cylindrical storage tanks with floating aluminum roofs and perimeter nitrogen foam systems`,
      `3D isometric terrain map showing dedicated pipeline route connecting coastal refinery to airport tank farm`,
      `macro close-up of cast iron hydrant pit cover flush with tarmac, high-pressure quick-disconnect coupling`,
      `hero cinematic night drone sweep of global hub airport with glowing neon pipeline network pulsing below concrete`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 3 ? 'SYSTEMS IN MOTION' : beatIndex === 9 ? 'HYDRAULIC FLOW' : undefined,
      telemetryLabel: beatIndex === 3 ? 'FLOW RATE // 3,800 L/MIN' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 2) {
    // ATO 02: THE PHYSICAL ANATOMY & LAYER BREAKDOWN (14 beats // 90s)
    // 5 Vídeos de Ação Contínua no Ato 2
    const visualMode: HslVisualMode = (beatIndex === 2 || beatIndex === 6 || beatIndex === 7 || beatIndex === 8 || beatIndex === 13) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 1 || beatIndex === 3 || beatIndex === 4 || beatIndex === 9 || beatIndex === 10 || beatIndex === 11 || beatIndex === 12) ? 'CUTAWAY' : (beatIndex === 5) ? 'MACRO_HUD' : undefined;
    const scripts = [
      `To understand how this never fails, we must cut open the runway concrete.`,
      `Two miles from the terminal lies the bulk fuel farm storing 52 million gallons of Jet A-1.`,
      `Floating internal aluminum roofs eliminate vapor space, preventing explosion risk.`,
      `From these tanks, six 800-horsepower turbine pumps force fuel into 24-inch carbon steel ring mains.`,
      `The pipeline grid loops beneath every passenger concourse at a depth of eight feet.`,
      `Inside the subterranean pipeline, fuel recirculates constantly to prevent heat stagnation and microbial growth.`,
      `Every gate features cast-iron hydrant pits flush with the tarmac.`,
      `Hydrant servicer trucks connect directly between the pit and the aircraft wing receptacle.`,
      `Dual pneumatic deadman switches ensure flow stops within 0.8 seconds if an operator releases control.`,
      `Micro-filter coalescers strip away microscopic particulate down to 0.5 microns.`,
      `Water separation membranes ensure zero free water enters the fuel supply.`,
      `Cathodic protection systems charge the underground pipes with continuous electric current to prevent corrosion.`,
      `This multi-layer hydrostatic infrastructure delivers pure fuel without a single above-ground tanker truck.`,
      `Without this buried pressure grid, modern hub airports would collapse under logistical gridlock.`
    ];

    const prompts = [
      `cinematic cross-section cut into airport tarmac concrete, exposing subsurface gravel, reinforced rebar, and 24-inch fuel line`,
      `3D cutaway of 52-million-gallon fuel tank farm with glowing internal floating aluminum deck and underground supply conduits`,
      `macro close-up of high-pressure multi-stage centrifugal turbine pump spinning inside illuminated pump house`,
      `subterranean 24-inch epoxy-coated carbon steel pipeline manifold glowing in klein blue (#0038FF) under concrete foundations`,
      `3D isometric cutaway of airport terminal apron showing recirculating loop pipes distributing fuel to 60 gate pits`,
      `macro shot of internal pipe fluid dynamics showing turbulent laminar flow of clear straw-colored Jet A-1 aviation kerosene`,
      `ground-level macro of cast-iron hydrant pit valve opening, high-pressure coupler locking with metallic click`,
      `side profile of compact hydrant servicer truck with intake hose linked to ground pit and dual discharge hoses to Boeing 787 wing`,
      `close-up of operator hand holding pneumatic deadman trigger with illuminated status gauge showing 150 PSI`,
      `3D cutaway of vertical filter-separator vessel with fiberglass coalescer elements trapping microscopic contaminants`,
      `macro view of hydrophobic Teflon separator screen repelling tiny water droplets from kerosene stream`,
      `underground sacrificial zinc anode bed with electrical wiring running along pipe exterior for cathodic corrosion defense`,
      `3D structural diagram showing the complete fueling pathway: [01 REFINERY] ➔ [02 TANK FARM] ➔ [03 HYDRANT GRID] ➔ [04 WING]`,
      `dusk wide shot of busy international terminal with ten widebody jets refueling simultaneously from underground pits`
    ];

    return {
      narrativeRole: 'TECHNICAL_ANATOMY',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'BUFFER & FLOW' : beatIndex === 4 ? '150 PSI MAIN' : undefined,
      telemetryLabel: beatIndex === 1 ? 'CAPACITY // 52,000,000 GAL' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 3) {
    // ATO 03: THE FLOW DYNAMICS & THROUGHPUT MATH (16 beats // 105s)
    // 4 Vídeos de Ação Contínua no Ato 3
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 3 || beatIndex === 5 || beatIndex === 14) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 4 || beatIndex === 6 || beatIndex === 7 || beatIndex === 13) ? '3D_MAP' : (beatIndex === 2 || beatIndex === 8 || beatIndex === 11 || beatIndex === 12) ? 'MACRO_HUD' : (beatIndex === 9 || beatIndex === 10) ? 'TARMAC_FLOW' : undefined;
    const scripts = [
      `The engineering magic is the continuous mathematical pressure balancing.`,
      `A Boeing 777 requires 45,000 gallons of fuel to reach Tokyo from London.`,
      `Pumping at 1,000 gallons per minute, the pit valve delivers sixty gallons every single second.`,
      `If ten aircraft start fueling at the same moment, demand spikes by 10,000 gallons per minute.`,
      `Variable frequency pump drives instantly spin up to maintain steady 150 PSI pressure across the ring.`,
      `Engineers utilize the Darcy-Weisbach equation to calculate head loss across fifteen miles of pipe.`,
      `Closed-loop ring mains allow fuel to flow from two directions simultaneously to any single gate.`,
      `This redundant dual-feed topology prevents pressure drops at the farthest concourses.`,
      `Differential pressure sensors at every gate transmit real-time telemetry back to the control room.`,
      `The fuel velocity inside the mains is strictly governed between five and seven feet per second.`,
      `Too slow, and sediment settles; too fast, and static electricity builds dangerous electrostatic charges.`,
      `Anti-static additives are injected continuously at parts-per-million ratios.`,
      `Every drop of fuel is accounted for with volumetric meters accurate to 0.05 percent.`,
      `The automated system rebalances pump stages every 500 milliseconds as aircraft disconnect.`,
      `This hydraulic balance turns volatile fuel delivery into a continuous, safe utility stream.`,
      `Zero interruptions, zero pressure drops, zero room for calculation error.`
    ];

    const prompts = [
      `3D terrain map showing pressure gradient contours across airport apron, glowing yellow conduits (#FFE500) maintaining 150 PSI`,
      `cockpit fuel quantity indicator (FQIS) showing digital counter spinning rapidly upward from 10,000 to 145,000 KGS`,
      `macro 35mm view of digital turbine flow meter with digital readout displaying 1,000 GPM / 3,785 LPM`,
      `wide apron shot showing 12 long-haul jets fueling simultaneously across three satellite concourses`,
      `control room scada screen displaying real-time variable frequency drive (VFD) pump curve adjusting to flow surge`,
      `mathematical overlay of Darcy-Weisbach hydraulic friction equation projected over 3D rendered pipe mesh`,
      `3D schematic of dual-loop ring main showing bidirectional fuel vectors converging on single gate hydrant`,
      `isometric airport map highlighting high-pressure supply loop in klein blue (#0038FF) and return loop in yellow (#FFE500)`,
      `macro view of differential pressure transmitter mounted on pipe manifold with digital telemetry LED display`,
      `kinetic particle simulation showing fuel velocity vectors maintained at precise laminar speed inside pipe cross-section`,
      `scientific visualization of electrostatic charge dissipation along grounded conductive pipeline walls`,
      `close-up of automated chemical injection skid dosing Stadis-450 conductivity improver into pipeline`,
      `high-precision positive displacement custody transfer meter with calibrated optical encoder spinning smoothly`,
      `real-time 3D pressure heatmap of airport underground network adjusting dynamically to valve operations`,
      `wide dusk shot of airport fuel distribution building with exterior pressure vessels illuminated in cyan telemetry light`,
      `macro close-up of master digital chronometer measuring fuel delivery cycle completion at Gate B22`
    ];

    return {
      narrativeRole: 'MATHEMATICAL_MODEL',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'FLOW VELOCITY' : beatIndex === 6 ? '1,000 GPM RATE' : undefined,
      telemetryLabel: beatIndex === 0 ? 'RATE // 3,800 L/MIN' : beatIndex === 6 ? 'PRESSURE // 150 PSI' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 4) {
    // ATO 04: THE PHYSICAL LIMIT & BOUNDARY CONDITION (12 beats // 75s)
    // 3 Vídeos de Ação Contínua no Ato 4
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 4 || beatIndex === 11) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 2 || beatIndex === 5) ? 'CUTAWAY' : (beatIndex === 3 || beatIndex === 6 || beatIndex === 7 || beatIndex === 8 || beatIndex === 9 || beatIndex === 10) ? 'MACRO_HUD' : undefined;
    const scripts = [
      `Every high-pressure pipeline operates against a violent physical boundary: Water Hammer.`,
      `When an aircraft wing tank reaches full capacity, internal float valves slam shut in 0.3 seconds.`,
      `That sudden halt instantly converts kinetic flow into a massive 600 PSI shockwave traveling back through the pipe.`,
      `At sonic velocity in kerosene, this hydraulic hammer could rupture subterranean steel pipes beneath the tarmac.`,
      `To survive, engineers install nitrogen-charged surge suppressors at every gate pit.`,
      `Nitrogen bladders compress in milliseconds, absorbing the kinetic shock before pipes fracture.`,
      `The second boundary is contamination: zero tolerance for water.`,
      `At cruising altitude of minus 55 degrees Celsius, free water freezes into ice crystals that choke engine fuel nozzles.`,
      `The absolute limit is 15 parts per million of dissolved water.`,
      `If a single tank batch exceeds this boundary, the entire multi-million-gallon inventory is quarantined instantly.`,
      `Pressure gauges glow orange as temperature swings alter pipeline fluid density.`,
      `One single burst pipe would shut down the airport for weeks.`
    ];

    const prompts = [
      `high-contrast macro of pressure relief valve body with warning labels under dramatic industrial lighting`,
      `3D cutaway diagram of water hammer pressure wave traveling backward through pipe at 1,100 meters per second`,
      `macro view of mechanical surge suppressor vessel with cutaway showing nitrogen rubber bladder compressing under shock`,
      `telemetry gauge needle spiking abruptly into red hazard zone at 600 PSI before being dampened by surge vessel`,
      `aircraft wing fueling port showing automatic shutoff valve snapping shut as fuel level sensor triggers`,
      `slow-motion fluid cavitation simulation inside pipe elbow during extreme pressure spike event`,
      `macro 35mm laboratory view of clear glass sample beaker showing clear and bright visual inspection test of Jet A-1`,
      `microscopic visualization of ice crystal formation in sub-zero kerosene at -55C choking tiny fuel injector orifices`,
      `digital moisture sensor probe readout displaying 12 PPM WATER CONTENT against critical 15 PPM threshold line`,
      `warning telemetry card flashing in hyper orange (#FF2E00): BATCH QUARANTINE PROTOCOL READY // WATER BOUNDARY LIMIT`,
      `macro close-up of pressure transducer manifold with orange warning LEDs illuminated under high thermal expansion load`,
      `extreme wide shot of airport tarmac with aircraft lined up, under dramatic storm sky symbolizing physical limits`
    ];

    return {
      narrativeRole: 'BOUNDARY_LIMIT',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'LAST METERS' : beatIndex === 3 ? 'WATER HAMMER' : undefined,
      telemetryLabel: beatIndex === 1 ? 'PRESSURE // 87%' : beatIndex === 3 ? 'SURGE // 600 PSI' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 5) {
    // ATO 05: THE BOTTLENECK & STRAIN BREAKDOWN (14 beats // 90s)
    // 5 Vídeos de Ação Contínua no Ato 5
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 3 || beatIndex === 5 || beatIndex === 7 || beatIndex === 11) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 6 || beatIndex === 8 || beatIndex === 10) ? 'FLIPBOARD' : (beatIndex === 2 || beatIndex === 9) ? '3D_MAP' : (beatIndex === 4 || beatIndex === 12 || beatIndex === 13) ? 'MACRO_HUD' : undefined;
    const scripts = [
      `At 4:15 PM, the primary supply bottleneck strikes.`,
      `A main filter membrane ruptures on Sector 4, triggering automatic emergency pressure isolation.`,
      `Hydrant pressure drops from 150 PSI to 30 PSI across Concourse C.`,
      `Twenty-four long-haul departures stall simultaneously with passengers boarded.`,
      `Without hydrant pressure, planes cannot receive fuel for transatlantic crossings.`,
      `Aircraft cannot push back from gates without fuel load sheets calculated.`,
      `Inbound flights cannot access blocked gates, forcing planes to hold on active taxiways.`,
      `The airport split-flap departure board begins rolling in alarm.`,
      `Delays spike from plus twenty minutes to plus two hours across international departures.`,
      `The fuel crisis ripples outward, disrupting connecting hubs across three continents.`,
      `Every minute of gate paralysis costs airlines $300,000 in missed departure slots.`,
      `Manual fueling trucks cannot access congested gate alleys blocked by idling aircraft.`,
      `The entire hub airport faces total operational gridlock.`,
      `Automated isolation protocols must engage before the entire airport shuts down.`
    ];

    const prompts = [
      `dramatic ground shot of widebody aircraft stalled at gate with ground crew standing beside disconnected fueling hose`,
      `master pressure gauge dropping precipitously from 150 PSI to 30 PSI with red warning lights flashing`,
      `3D map showing Concourse C fuel pipeline loop isolated in dark gray with zero flow while surrounding terminals pulse`,
      `aerial view of airport gate alley jammed with four Boeing 777s unable to push back, blocking taxiway centerline`,
      `cockpit view showing FMC screen calculating weight and balance showing FUELING INCOMPLETE / NO DISPATCH`,
      `long line of 15 arriving aircraft queued up on taxiway with brake lights illuminated waiting for open gates`,
      `split-flap departure board spinning rapidly showing FLIGHT 402 TO LONDON // DELAYED +01:45 // FUEL HOLD`,
      `thermal infrared shot of congested tarmac showing hot jet engines idling fruitlessly burning reserve fuel on ground`,
      `control room SCADA terminal flashing full-screen HYPER ORANGE (#FF2E00) with audible alarm waveform readouts`,
      `global airspace tracking map showing transatlantic flight corridors turning red with departure holds across Europe and US`,
      `financial loss ticker calculating $300,000 per minute cost accumulation in bold monumental typography`,
      `narrow apron alley clogged with baggage tugs and catering trucks preventing backup tanker access`,
      `macro shot of central PLC safety controller running diagnostic routine to isolate damaged filter module`,
      `high-voltage kinetic graphic representing airport hub at maximum operational strain before failsafe bypass`
    ];

    return {
      narrativeRole: 'BOTTLENECK_CRISIS',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'DELAY SPREADS' : beatIndex === 6 ? 'STRAIN ALERT' : undefined,
      telemetryLabel: beatIndex === 1 ? 'BOTTLENECK // +01:15 DELAY' : beatIndex === 6 ? 'PRESSURE // 30 PSI' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 6) {
    // ATO 06: THE EMERGENCY WORKAROUND & HIDDEN MARGINS (10 beats // 60s)
    const roles: HslNarrativeRole[] = [
      'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH',
      'KINETIC_FLOW', 'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH',
      'KINETIC_FLOW', 'SYSTEMIC_IMPACT'
    ];
    const role = roles[beatIndex % roles.length];
    // 6 Vídeos de Ação Contínua no Ato 6
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 4 || beatIndex === 5 || beatIndex === 6 || beatIndex === 8 || beatIndex === 9) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 1) ? 'MACRO_HUD' : (beatIndex === 2 || beatIndex === 3) ? '3D_MAP' : (beatIndex === 7) ? 'TARMAC_FLOW' : undefined;

    const scripts = [
      `The supervisory SCADA system detects the ruptured element and commands automated bypass.`,
      `Motorized double-block-and-bleed valves isolate the damaged filter bank in under twelve seconds.`,
      `The northern ring main valve opens, back-feeding Concourse C from the opposite direction.`,
      `Secondary filtration skids come online automatically without human intervention.`,
      `Pressure in the hydrant ring recovers to 140 PSI within forty-five seconds.`,
      `Mobile hydrant servicers resume high-flow pumping into delayed widebody wings.`,
      `Emergency rapid-dispatch tankers provide supplemental flow to isolated remote stands.`,
      `In nine minutes, all twenty-four delayed flights resume simultaneous fueling.`,
      `Full departure flow is restored before international airspace slots expire.`,
      `The hidden redundancy of the ring loop saved the airport from complete shutdown.`
    ];

    const prompts = [
      `close-up of motorized heavy steel double block and bleed valve actuator rotating swiftly to seal off damaged section`,
      `SCADA screen graphic showing automated bypass line illuminating in electric green (#00FF85) as back-feed engages`,
      `3D animation showing fuel flow reversing direction through northern loop pipe to repressurize Concourse C`,
      `secondary filtration skid with fresh coalescer vessels coming online with pressure gauges rising back to 140 PSI`,
      `tracking shot along tarmac hydrant line showing fuel hoses stiffening under restored 140 PSI operating pressure`,
      `ground crew operator reconnecting dual fueling nozzles to Boeing 787 wing root receptacle with amber beacons flashing`,
      `convoy of high-capacity emergency hydrant servicers moving swiftly across ramp with illuminated hazard lighting`,
      `wide airport apron shot with 24 aircraft simultaneously resuming high-speed fueling under dramatic stadium floodlights`,
      `departure scoreboard flipping from DELAYED to BOARDING ON TIME across international concourse`,
      `aerial night drone shot of airport hub operating at full peak departure velocity with illuminated taxiway vectors`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'EMERGENCY REROUTE' : beatIndex === 7 ? 'PRESSURE RESTORED' : undefined,
      telemetryLabel: beatIndex === 1 ? 'FAILSAFE // ENGAGED' : beatIndex === 7 ? 'PRESSURE // 140 PSI' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 7) {
    // ATO 07: SYSTEMIC CONSEQUENCES & ECONOMIC RIPPLE (10 beats // 60s)
    // 3 Vídeos de Ação Contínua no Ato 7
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 5 || beatIndex === 9) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 4) ? '3D_MAP' : (beatIndex === 2 || beatIndex === 6 || beatIndex === 8) ? 'MACRO_HUD' : (beatIndex === 3 || beatIndex === 7) ? 'CUTAWAY' : undefined;
    const scripts = [
      `The global economy depends on this continuous invisible fuel flow.`,
      `Commercial aviation moves over six trillion dollars in high-value air cargo every year.`,
      `A single day of fuel disruption at a major hub costs airlines over 100 million dollars.`,
      `Global supply chains for pharmaceuticals and microchips rely on guaranteed departure windows.`,
      `Refineries, dedicated pipelines, and airport tank farms form an unbroken umbilical cord.`,
      `If this subterranean network fails, transcontinental commerce stops within hours.`,
      `Every PSI of pressure engineered into these pipes protects global GDP.`,
      `Airports are energy transformers: converting millions of gallons of fuel into global human mobility.`,
      `The precision of this hidden infrastructure is what makes modern flight ordinary.`,
      `Without pressurized hydrant engineering, global aviation cannot exist.`
    ];

    const prompts = [
      `global logistics map showing international air cargo corridors connecting Shanghai, Frankfurt, and Chicago in glowing blue vectors`,
      `air cargo freighter interior being loaded with temperature-controlled pharmaceutical containers in sterile lighting`,
      `financial data visualization: $100 MILLION DISRUPTION RISK PER 24 HOURS in monumental typography overlay`,
      `cleanroom semiconductor transport container being carefully hoisted into cargo hold of Boeing 777 freighter`,
      `3D cutaway showing unbroken pipeline connection from coastal refinery, across terrain, into airport underground buffer farm`,
      `dramatic dusk shot of global fleet of cargo freighters taking off in succession into deep twilight sky`,
      `macro close-up of industrial pressure monitoring sensor with telemetry overlay: PROTECTING GLOBAL TRANSIT`,
      `monumental aerial composition of airport terminal shaped like an arrow pointing into golden sunset`,
      `high-density industrial fiber optic telemetry rack processing pipeline integrity logs in dark matte chassis (#0D0E15)`,
      `panoramic wide shot of illuminated airport apron at night humming with uninterrupted global departures`
    ];

    return {
      narrativeRole: 'SYSTEMIC_IMPACT',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'GLOBAL LOGISTICS' : beatIndex === 2 ? 'CASCADING STRAIN' : undefined,
      telemetryLabel: beatIndex === 0 ? 'CARGO // $6T ANNUAL' : beatIndex === 2 ? 'ECONOMIC LOSS // $100M/DAY' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  // ATO 08: ORIGINAL THESIS & SYSTEM ARCHITECTURE (8 beats // 45s)
  // 3 Vídeos de Ação Contínua no Ato 8
  const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 2 || beatIndex === 4) ? 'firefly_video' : 'generated_image_35mm';
  const archetype = (beatIndex === 0 || beatIndex === 3 || beatIndex === 7) ? '3D_MAP' : (beatIndex === 5) ? 'MACRO_HUD' : (beatIndex === 6) ? 'TARMAC_FLOW' : undefined;
  const scripts = [
    `The visible miracle is a jet lifting into the sky.`,
    `The hidden miracle is fifty million gallons of kerosene moving under your feet at 150 PSI.`,
    `Next time you board a flight, look down at the tarmac below the wing.`,
    `Remember the cast-iron hydrant pits, the subterranean ring mains, and the surge suppressors holding back shockwaves.`,
    `Engineering at its highest level is completely invisible.`,
    `It only becomes noticeable when it fails.`,
    `Hidden systems rule the world, and the smartest systems are the ones you never see.`,
    `This is the Hidden Systems Lab.`
  ];

  const prompts = [
    `minimalist Apple Keynote slide: VISIBLE PRODUCT: JET TAKEOFF // HIDDEN PRODUCT: PRESSURIZED KEROSENE FLOW`,
    `dramatic cinematic shot of Boeing 787 wing slicing through cloud layer at sunset with golden light reflecting on polished aluminum`,
    `POV looking out aircraft cabin window down at tarmac below, seeing flush hydrant pit cover in morning light`,
    `3D master architectural blueprint of airport subterranean pipeline infrastructure rendered in obsidian matte (#0D0E15) and electric acid yellow (#FFE500)`,
    `high-angle slow drone pull-back revealing entire synchronized airport hub pulsing with illuminated taxiways and runways`,
    `macro 35mm view of single glowing pressure gauge resting at perfect 150 PSI nominal operating pressure`,
    `monumental typography card: HIDDEN SYSTEMS RULE THE WORLD in clean off-white (#F4F4F0) with acid yellow subtitle`,
    `final closing identity card: HIDDEN SYSTEMS LAB // EPISODE 004 // WHY AIRPORTS CANNOT RUN OUT OF FUEL with sleek kinetic spring`
  ];

  return {
    narrativeRole: 'CORE_THESIS',
    visualMode,
    infographicArchetype: archetype,
    graphicHeadline: beatIndex === 0 ? 'GLOBAL ARCHITECTURE' : beatIndex === 6 ? 'HIDDEN SYSTEMS LAB' : undefined,
    telemetryLabel: beatIndex === 0 ? 'NETWORK // SYNCHRONIZED' : beatIndex === 6 ? 'THESIS // PROVEN' : undefined,
    voiceoverScript: scripts[beatIndex % scripts.length],
    promptSubject: prompts[beatIndex % prompts.length]
  };
}

/**
 * Storyboard canônico para o Episódio de Supercomputação & Resfriamento de IA:
 * "HOW 45,000 LITERS OF LIQUID KEEP AI CLUSTERS FROM MELTING" (100% único, termodinâmica real)
 */
export function getAiCoolingBeatData(actNumber: number, beatIndex: number, input: EpisodeTopicInput): BeatStoryboardData {
  if (actNumber === 1) {
    // ATO 01: THE HOOK & THE VISIBLE MIRACLE (12 beats // 75s)
    const roles: HslNarrativeRole[] = [
      'MONUMENTAL_HOOK', 'KINETIC_FLOW', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH',
      'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'CORE_THESIS'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 3) ? 'TARMAC_FLOW' : (beatIndex === 4 || beatIndex === 10) ? 'CUTAWAY' : (beatIndex === 9) ? '3D_MAP' : beatIndex === 8 ? 'MACRO_HUD' : undefined;

    const scripts = [
      `If a frontier AI supercomputer loses coolant flow for just 180 seconds, 100,000 GPUs reach 105 degrees Celsius and vaporize half a billion dollars in silicon.`,
      `Over two billion prompts are processed every hour without a single server overheating.`,
      `A single high-density AI rack consumes 120 kilowatts and generates enough heat to boil a pool of water in minutes.`,
      `Yet you will never see industrial fan exhaust vents roaring behind these ultra-dense clusters.`,
      `Heat is extracted through an unseen continuous liquid labyrinth.`,
      `Recirculating 45,000 liters of dielectric coolant every minute across micron-thin copper channels.`,
      `The visible product is generative artificial intelligence; the hidden product is extreme closed-loop thermodynamics.`,
      `A single cavitation bubble inside a primary pump triggers emergency thermal trips across an entire data hall.`,
      `How do hyperscale facilities dissipate 1.2 gigawatts of thermal load without boiling their processors?`,
      `The answer lies in direct-to-chip micro-channel cold plates operating under continuous high-pressure differential.`,
      `Coolant distribution units interface directly with semiconductor silicon.`,
      `This is the high-velocity hydraulic engineering that keeps the global AI revolution from melting down.`
    ];

    const prompts = [
      `monumental macro shot of high-density AI server rack with glowing electric acid yellow (#FFE500) coolant tubes pulsing against dark matte obsidian server chassis (#0D0E15), Apple Keynote documentary aesthetic, 35mm Arri Alexa LF`,
      `wide panoramic interior of hyper-scale AI data center aisle illuminated with cold blue (#0038FF) and sharp yellow telemetry HUD overlays`,
      `macro close-up of machined pure copper cold plate with 0.2mm micro-channels, dielectric fluid flowing under clear acrylic manifold`,
      `isometric 3D cutaway diagram of 120kW AI server rack showing vertical liquid distribution manifolds and dripless quick-disconnect couplings`,
      `high-angle shot of industrial chilled water plant pumping room with massive dual-impeller centrifugal pumps and insulated steel pipes`,
      `continuous tracking shot along rack-level braided stainless steel coolant hoses carrying pressurized dielectric liquid at 45,000 L/min`,
      `wide aerial view of 1.2-gigawatt data center campus at dusk, illuminated cooling towers emitting faint translucent steam vapor into night sky`,
      `server management console flashing THERMAL TRIP WARNING with glowing hyper-orange (#FF2E00) junction temperature telemetry overlays`,
      `macro 35mm view of GPU die package with laser-etched silicon substrate and thermal interface material interface under precision clamping spring`,
      `3D topographic network flow map showing closed-loop primary chilled water circuit exchanging heat with secondary dielectric loop`,
      `close-up of Coolant Distribution Unit heat exchanger with digital flow meter displaying 1,800 GPM flow rate in bright LED numerals`,
      `hero cinematic slow-motion dolly through endless row of liquid-cooled AI supercomputing clusters with yellow status reticles`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'THERMAL CRISIS' : beatIndex === 5 ? '45,000 L/MIN FLOW' : undefined,
      telemetryLabel: beatIndex === 0 ? 'THRESHOLD // 105°C' : beatIndex === 5 ? 'COOLANT RECIRCULATION' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 2) {
    // ATO 02: THE PHYSICAL ANATOMY & LAYER BREAKDOWN (14 beats // 90s)
    const role: HslNarrativeRole = 'TECHNICAL_ANATOMY';
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 5 || beatIndex === 9 || beatIndex === 13) ? 'CUTAWAY' : undefined;

    const scripts = [
      `To understand how 1.2 gigawatts of heat vanish, we must dismantle the server chassis down to the bare silicon.`,
      `Bolted directly to the multi-chip module is an oxygen-free copper cold plate with micro-fins measuring just two hundred microns wide.`,
      `At this microscopic scale, the heat transfer surface area multiplies by fifteen hundred percent.`,
      `Dielectric coolant enters through an omni-directional jet manifold directly above the hottest compute cores.`,
      `The liquid absorbs two hundred watts per square centimeter before turbulent boundary layers can insulate the chip.`,
      `From the cold plate, coolant exits through flexible fluoro-elastomer tubing into vertical rack manifolds.`,
      `Each rack connects to the Coolant Distribution Unit via zero-drip dry-break hydraulic quick disconnects.`,
      `Inside the CDU, a brazed plate heat exchanger transfers heat from the secondary dielectric loop into the facility water loop.`,
      `The secondary loop operates at thirty-eight degrees Celsius supply temperature to prevent moisture condensation on motherboard traces.`,
      `The primary facility loop routes the absorbed thermal energy through eighteen-inch carbon steel pipes outside the building.`,
      `Massive dual-cell cooling towers and evaporative chillers reject the final BTU load into the atmosphere.`,
      `Every junction contains pressure transducers, ultrasonic flow meters, and redundant leak-detection sensor ropes.`,
      `A single droplet of fluid outside the sealed containment loop triggers instantaneous isolation valves in four milliseconds.`,
      `This multi-tier hydraulic hierarchy is what allows hundred-kilowatt server racks to operate in silent thermal equilibrium.`
    ];

    const prompts = [
      `exploded 3D technical diagram of GPU accelerator module, revealing copper micro-fin cold plate, thermal paste, and coolant manifold in high contrast`,
      `macro cross-section of 0.2mm copper micro-channels under microscopic illumination, showing turbulent dielectric coolant flow vectors`,
      `3D isometric cutaway of server blade motherboard showing parallel coolant distribution across 8 interconnected GPU sockets`,
      `close-up shot of anodized aluminum quick-disconnect hydraulic fitting with spring-loaded poppet valves and o-ring seals`,
      `medium shot of Coolant Distribution Unit cabinet interior, showing dual redundant canned-motor centrifugal pumps and stainless plate heat exchanger`,
      `wide shot of facility water piping gallery with insulated 18-inch chilled water headers and pneumatic butterfly control valves`,
      `macro 35mm view of ultrasonic transit-time flow sensor clamped on stainless coolant line with digital LCD display reading 450 L/min`,
      `top-down view of server rack floor showing continuous yellow optical leak-detection rope laid along cable channels with status LEDs`,
      `3D schematic diagram comparing traditional forced-air heatsink vs direct-to-chip liquid cooling thermal resistance curves`,
      `close-up of industrial variable frequency drive modulating pump motor speed at 3,600 RPM with digital frequency readout in neon yellow`,
      `wide night photograph of rooftop evaporative cooling towers with illuminated fan stacks and high-volume water spray distribution nozzles`,
      `macro shot of thermal interface material phase-change pad under high mounting pressure between silicon die and nickel-plated copper plate`,
      `3D cutaway of automated fast-closing ball valve with pneumatic actuator and microsecond emergency solenoid trip mechanism`,
      `hero perspective looking down long data center white room aisle with gleaming stainless steel overhead liquid distribution headers`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'MICRO-CHANNEL COLD PLATE' : beatIndex === 7 ? 'HEAT EXCHANGER' : undefined,
      telemetryLabel: beatIndex === 1 ? 'FIN WIDTH // 0.2 MM' : beatIndex === 7 ? 'CDU // DUAL LOOP' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 3) {
    // ATO 03: THE FLOW DYNAMICS & THROUGHPUT MATH (14 beats // 90s)
    const role: HslNarrativeRole = 'MATHEMATICAL_MODEL';
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 2 || beatIndex === 7 || beatIndex === 11) ? '3D_MAP' : undefined;

    const scripts = [
      `The mathematics of cooling one hundred thousand GPUs is governed by unforgiving fluid dynamics.`,
      `To extract one million BTUs per second, the system must pump seven hundred and fifty liters of liquid every second without interruption.`,
      `At four meters per second channel velocity, the Reynolds number inside the micro-fins transitions from laminar to turbulent flow.`,
      `This turbulence strips away the thermal boundary layer, boosting convective heat transfer coefficient past twelve thousand watts per square meter kelvin.`,
      `However, driving fluid through two hundred micron channels creates an intense hydraulic pressure drop of thirty-five PSI per server blade.`,
      `Multiplying this across one thousand two hundred server racks creates thirty-six thousand dynamic fluid resistance nodes.`,
      `The total pump work required to circulate this closed loop consumes over fifteen megawatts of pure mechanical pumping energy.`,
      `Fluid temperature rises by precisely eight point four degrees Celsius from the supply inlet to the return manifold.`,
      `If the return fluid exceeds sixty-five degrees Celsius, the chemical viscosity of the dielectric fluid drops, altering pump head curves.`,
      `Variable speed pumps continuously calculate mass flow rate using differential pressure sensors across every rack tier.`,
      `A change in computational workload shifts thermal output in four hundred milliseconds, requiring proactive flow modulation.`,
      `Predictive machine learning algorithms adjust pump impeller RPM seconds before a large matrix multiplication burst executes on the GPUs.`,
      `This dynamic flow balancing prevents localized hot spots that could trigger premature silicon degradation.`,
      `Every single second, four hundred gigabytes of thermal sensor telemetry are processed to keep the coolant wavefront perfectly synchronized.`
    ];

    const prompts = [
      `computational fluid dynamics (CFD) visualization of turbulent coolant streamlines passing through micro-channel array in bright yellow and electric blue`,
      `3D mathematical equation overlay showing Navier-Stokes equations and convective heat transfer coefficients over dark server interior`,
      `macro view of differential pressure gauge displaying delta-P across server cold plate with precision calibrated scale`,
      `3D holographic network map displaying 36,000 hydraulic nodes glowing across data center floor plan with real-time flow rate heatmaps`,
      `macro shot of industrial turbine flow meter impeller spinning inside transparent borosilicate glass testing section`,
      `close-up of multi-stage centrifugal pump impeller cast from marine-grade bronze with polished backward-curved vanes`,
      `digital telemetry dashboard displaying real-time mass flow rate, specific heat capacity, and thermal delta-T graphs in neon yellow (#FFE500)`,
      `macro 35mm view of fluid temperature sensor probe inserted into high-pressure coolant manifold with digital readout reading 38.4°C`,
      `3D isometric animation frame showing predictive AI workload forecast driving automated variable-frequency pump acceleration`,
      `wide interior view of pump vault with three 500-horsepower electric motors coupled to split-case horizontal centrifugal pumps`,
      `macro close-up of silicon junction temperature sensor circuit traces on printed circuit board under high magnification`,
      `3D fluid vector diagram showing thermal boundary layer thinning under high Reynolds number turbulence inside micro-channels`,
      `high-angle shot of operations control room video wall displaying global cooling plant hydraulic efficiency and PUE metrics`,
      `hero cinematic shot of coolant manifold glowing under ultraviolet inspection light, revealing perfect turbulent fluid circulation`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 2 ? 'TURBULENT BOUNDARY' : beatIndex === 7 ? 'DELTA-T // 8.4°C' : undefined,
      telemetryLabel: beatIndex === 2 ? 'REYNOLDS // >4,000' : beatIndex === 7 ? 'MASS FLOW // 750 L/S' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 4) {
    // ATO 04: THE PHYSICAL LIMIT & BOUNDARY CONDITION (12 beats // 75s)
    const role: HslNarrativeRole = 'BOUNDARY_LIMIT';
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 6 || beatIndex === 10) ? 'MACRO_HUD' : undefined;

    const scripts = [
      `Every cooling system is bounded by the rigid laws of semiconductor physics and phase-change thermodynamics.`,
      `Silicon semiconductors possess a hard physical limit: the maximum junction temperature of one hundred and five degrees Celsius.`,
      `Beyond one hundred and five degrees, thermal runaway causes electron leakage to spike exponentially, destroying transistor gates in microseconds.`,
      `At ninety-eight degrees Celsius, the GPU firmware initiates emergency clock throttling, slashing compute throughput by eighty percent.`,
      `The thermal resistance chain from the silicon die, through the thermal interface material, to the copper plate is just zero point zero four degrees per watt.`,
      `This means that even a two-second interruption in coolant velocity causes the die temperature to climb at thirty degrees per second.`,
      `In the coolant itself, a dangerous physical boundary exists: localized nucleate boiling.`,
      `If heat flux exceeds three hundred watts per square centimeter, microscopic vapor bubbles form on the copper micro-fins.`,
      `These vapor bubbles act as thermal insulators, causing critical heat flux crisis and instantaneous localized silicon melt.`,
      `To prevent boiling, the closed loop maintains a baseline pressure of twenty-five PSI, elevating the boiling point of the dielectric coolant.`,
      `Furthermore, dissolved air micro-bubbles must be continuously extracted by vacuum deaerators to prevent cavitation.`,
      `Operating within three degrees of the thermal trip threshold is the razor-thin margin where modern AI models are trained.`
    ];

    const prompts = [
      `macro thermographic infrared camera view of GPU compute die showing glowing 105°C hotspot in hyper-orange (#FF2E00) on dark silicon`,
      `3D molecular simulation diagram showing electron leakage and thermal runaway across nanoscale transistor gates under extreme heat`,
      `macro 35mm photograph of thermal interface material undergoing phase-change under high heat flux on polished copper cold plate`,
      `close-up of laboratory high-speed microscopic imaging capturing nucleate boiling vapor bubbles forming on 0.2mm copper fin edge`,
      `3D graphic visualization of Critical Heat Flux (CHF) curve with sharp warning boundary at 300 W/cm² in vibrant neon orange and yellow`,
      `macro shot of vacuum deaeration vessel extracting micro-bubbles from dielectric liquid through transparent sight glass`,
      `digital oscilloscope display showing instantaneous voltage drops and clock throttling pulses during thermal throttling event`,
      `macro close-up of laser pressure relief valve calibrated to 45 PSI with safety wire and tamper seal on stainless steel loop`,
      `3D cutaway showing localized dryout phenomenon on semiconductor die surface when coolant flow velocity drops below critical threshold`,
      `wide view of specialized data center test bench with high-pressure fluid loops and precision multichannel temperature loggers`,
      `macro shot of microscopic pitting corrosion on brass valve seat caused by pump cavitation shockwaves`,
      `hero graphic card showing 105°C SILICON VAPORIZATION THRESHOLD with red warning reticles and precision countdown timer`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? '105°C PHYSICAL LIMIT' : beatIndex === 7 ? 'CRITICAL HEAT FLUX' : undefined,
      telemetryLabel: beatIndex === 1 ? 'JUNCTION // 105°C' : beatIndex === 7 ? 'HEAT FLUX // 300 W/CM²' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 5) {
    // ATO 05: THE BOTTLENECK & STRAIN BREAKDOWN (12 beats // 75s)
    const role: HslNarrativeRole = 'BOTTLENECK_CRISIS';
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 2 || beatIndex === 7 || beatIndex === 11) ? 'FLIPBOARD' : undefined;

    const scripts = [
      `Where does a 1.2-gigawatt cooling system fail when pushed to maximum operational strain?`,
      `The primary vulnerability lies in the mechanical micro-filters protecting the two hundred micron cold plates.`,
      `Micro-particulates as small as fifty microns, shedding from pipe threads or pump seals, can lodge in the micro-fins.`,
      `A clogged cold plate causes flow starvation in a single accelerator, triggering an automated thermal shutdown of the entire node.`,
      `Because distributed AI training models shard gradients across all one hundred thousand GPUs, losing one node stalls the entire training cluster.`,
      `A second critical failure mode is cavitation transient shock in the primary recirculation pumps.`,
      `If suction pressure drops below fluid vapor pressure, imploding cavitation bubbles destroy pump impellers and create pressure surges.`,
      `These pressure waves, known as hydraulic water hammer, travel through the piping at twelve hundred meters per second.`,
      `A hydraulic surge can rupture elastomeric quick-disconnect seals, venting coolant across high-voltage busbars.`,
      `On the electrical side, a sudden loss of cooling plant power leaves only the thermal inertia of the closed loop buffer.`,
      `Without primary power, coolant inside the racks boils within two minutes, forcing an emergency hardware disconnect.`,
      `The financial cost of a single cooling failure is fifteen million dollars per hour in wasted GPU compute and checkpoint corruption.`
    ];

    const prompts = [
      `macro microscopic photograph of 50-micron particulate debris lodged between 0.2mm copper fins, blocking coolant fluid flow`,
      `3D structural animation of distributed neural network cluster with single red failing node halting entire synchronous gradient ring`,
      `close-up high-speed photograph of pump impeller showing erosion and pitting damage from severe fluid cavitation transients`,
      `3D pressure wave simulation showing hydraulic water hammer transient traveling through 18-inch chilled water header pipe in orange (#FF2E00)`,
      `macro shot of ruptured fluoro-elastomer o-ring seal on quick-disconnect fitting with glowing dielectric fluid droplet on dark metal`,
      `wide view of high-voltage 415V power distribution busway running above server racks with sealed drip trays installed beneath`,
      `macro 35mm view of differential pressure switch indicator needle crossing into RED DANGER zone at 45 PSI delta-P`,
      `digital countdown timer overlay showing 180 SECONDS TO THERMAL RUNAWAY with glowing orange HUD brackets and telemetry metrics`,
      `3D architectural cutaway of data center power substation showing dual 115kV utility feeds and backup diesel rotary UPS systems`,
      `close-up of high-precision basket strainer with stainless steel 25-micron mesh screen showing trapped particulate matter`,
      `macro shot of circuit breaker trip coils firing inside primary medium-voltage switchgear cabinet with arc-flash protection`,
      `hero dramatic perspective of emergency alarm beacon flashing amber and red across dark silent supercomputer server hall`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 2 ? '0.2MM CHANNEL FOULING' : beatIndex === 7 ? 'HYDRAULIC SURGE' : undefined,
      telemetryLabel: beatIndex === 2 ? 'PARTICULATE // 50 MICRON' : beatIndex === 7 ? 'SURGE // 1,200 M/S' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 6) {
    // ATO 06: THE EMERGENCY WORKAROUND & HIDDEN MARGINS (12 beats // 75s)
    const role: HslNarrativeRole = 'EMERGENCY_DISPATCH';
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 5 || beatIndex === 9) ? 'CUTAWAY' : undefined;

    const scripts = [
      `To ensure ninety-nine point nine nine nine percent uptime, engineers engineered multi-tier redundancy directly into the fluid physics.`,
      `Every Coolant Distribution Unit is equipped with N plus two redundant canned-motor pumps operating in active standby.`,
      `If a primary pump experiences seal degradation, an automated check valve seals the faulty branch while the standby pump reaches full speed in four hundred milliseconds.`,
      `Massive insulated thermal buffer tanks store one hundred and fifty thousand liters of sub-cooled water on site.`,
      `In the event of total chiller plant power loss, these buffer tanks provide twelve minutes of continuous gravity-assisted heat absorption.`,
      `Automated three-way modulating bypass valves can instantly reroute cold coolant around non-critical storage and networking racks directly to GPU cores.`,
      `Every server blade contains dual isolated power feeds and hot-swappable pump cartridges that can be serviced without interrupting liquid flow.`,
      `Smart acoustic monitoring microphones listen to pump bearing harmonics, detecting cavitation twenty-four hours before mechanical failure occurs.`,
      `If ambient humidity spikes outside, adiabatic cooling pads automatically saturate incoming airflow to maintain chiller efficiency.`,
      `Firmware-level power capping dynamically shifts GPU TDP from seven hundred watts down to three hundred watts in five milliseconds if cooling margins narrow.`,
      `This dynamic throttle preserves the training model state without causing an abrupt cluster crash.`,
      `These hidden thermodynamic safety buffers are the unsung guardians that keep modern artificial intelligence alive.`
    ];

    const prompts = [
      `3D technical diagram of N+2 redundant CDU pump configuration with automated check valves and fast-switching variable frequency drives`,
      `wide shot of subterranean thermal storage vault with four massive 150,000-liter insulated chilled water accumulator vessels`,
      `macro close-up of pneumatic 3-way modulating bypass valve shifting coolant flow direction in 400 milliseconds with visible stroke indicator`,
      `medium shot of data center technician hot-swapping a modular liquid cooling CDU pump module while status LEDs glow bright green`,
      `acoustic vibration sensor spectrum analyzer display showing bearing frequency harmonics and predictive cavitation detection curve`,
      `wide exterior view of evaporative adiabatic cooling pads with automated water misting nozzles spraying fine droplet fog into air intakes`,
      `macro 35mm view of dual dry-break quick-disconnect couplers disengaging cleanly with zero fluid leakage on server backplane`,
      `3D flow chart showing automated GPU power capping shedding 400W per chip to maintain safe junction temperatures during thermal events`,
      `close-up of high-speed industrial solenoid valve manifold actuated by dual redundant 24V DC battery backup circuits`,
      `macro view of magnetic particle separator extracting microscopic metallic scale from closed loop coolant flow`,
      `elevated wide shot of cleanroom maintenance workshop inside hyperscale facility with precision hydraulic pressure testing rigs`,
      `hero cinematic tracking shot along rows of active cooling distribution units with green operational status rings pulsing in rhythm`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'N+2 REDUNDANCY' : beatIndex === 5 ? 'THERMAL BUFFER' : undefined,
      telemetryLabel: beatIndex === 1 ? 'SWITCH TIME // 400MS' : beatIndex === 5 ? 'BUFFER // 150,000 L' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 7) {
    // ATO 07: SYSTEMIC CONSEQUENCES & ECONOMIC RIPPLE (10 beats // 60s)
    const role: HslNarrativeRole = 'SYSTEMIC_IMPACT';
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 5 || beatIndex === 8) ? '3D_MAP' : undefined;

    const scripts = [
      `The fragility of AI compute is not theoretical—it is an economic vulnerability with global ripple effects.`,
      `A multi-month training run for a frontier foundation model costs over one hundred million dollars in continuous electricity and hardware wear.`,
      `If a catastrophic thermal trip occurs mid-run, hours of distributed gradient calculations are lost due to checkpoint synchronization lag.`,
      `Beyond model training, hyperscale AI inference clusters power autonomous vehicles, automated medical diagnostics, and algorithmic trading systems.`,
      `A regional cooling failure taking down two hundred megawatts of compute cascades into global API latency spikes and cloud outages.`,
      `Water consumption for evaporative data center cooling has become a critical constraint, driving the transition to closed-loop direct-to-chip systems.`,
      `Modern data center sites are chosen not just for fiber proximity, but for access to gigawatt power grids and industrial chilled water infrastructure.`,
      `The global semiconductor supply chain is now constrained by the manufacturing capacity for precision copper cold plates and specialized dielectric coolants.`,
      `The race for Artificial General Intelligence is fundamentally a race for thermodynamic efficiency at industrial scale.`,
      `Whoever masters the fluid mechanics of liquid heat extraction controls the compute frontier of human civilization.`
    ];

    const prompts = [
      `3D world map showing interconnected global AI data center hubs pulsing with data flow lines and regional thermal capacity load indicators`,
      `macro photograph of financial trading floor monitor showing algorithmic trading freeze during major cloud API infrastructure outage`,
      `macro 35mm view of silicon wafer probe testing showing micro-channel cold plate bonding under cleanroom electron microscope`,
      `wide aerial view of remote gigawatt computing campus situated next to hydroelectric dam and massive closed-loop cooling towers`,
      `3D graphic visualization of global dielectric fluid supply chain connecting chemical synthesis plants to data center distribution hubs`,
      `close-up of automated robotic CNC machine milling ultra-dense 0.2mm micro-channels into solid electrolytic copper plates`,
      `medium shot of cleanroom technicians inspecting high-purity non-conductive dielectric liquid inside sealed glass delivery carboys`,
      `wide night panoramic shot of massive industrial substation delivering 1.2 gigawatts of high-voltage transmission power to data center`,
      `3D holographic economic diagram showing capital expenditure breakdown comparing silicon cost vs liquid cooling infrastructure`,
      `hero cinematic wide shot looking down endless corridor of liquid-cooled supercomputers glowing with triumphant green status lights`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'ECONOMIC CASCADE' : beatIndex === 5 ? 'CLOSED LOOP TRANSITION' : undefined,
      telemetryLabel: beatIndex === 1 ? 'TRAINING RUN // $100M' : beatIndex === 5 ? 'GRID LOAD // 1.2 GW' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  // ATO 08: ORIGINAL THESIS & SYSTEM ARCHITECTURE (10 beats // 60s)
  const visualMode: HslVisualMode = 'generated_image_35mm';
  const archetype = (beatIndex === 0 || beatIndex === 4 || beatIndex === 7) ? 'MACRO_HUD' : undefined;

  const scripts = [
    `We began with an astonishing reality: forty-five thousand liters of liquid circulating beneath acres of silicon to prevent thermal collapse.`,
    `The advancement of Artificial Intelligence is not just a software race—it is an extreme thermodynamic war.`,
    `Every token generated, every neural weight updated, is the physical byproduct of dissipating one million BTUs per second.`,
    `Behind the clean, abstract user interfaces of modern AI lies an unseen heavy industrial machine of titanium pumps, copper micro-channels, and pressurized water loops.`,
    `This invisible fluid grid operates in silent, perfect synchrony twenty-four hours a day, three hundred and sixty-five days a year.`,
    `Without these high-velocity micro-channels operating at the thermodynamic limit of physics, the digital minds of the future would literally melt.`,
    `The next time you generate an answer from an AI model in seconds, remember the forty-five thousand liters of liquid flowing beneath the silicon.`,
    `Hidden systems govern our digital world, operating unseen right at the threshold of physical impossibility.`,
    `Hidden systems rule the world.`,
    `This is Hidden Systems Lab.`
  ];

  const prompts = [
    `monumental 35mm shot looking directly down the central manifold of an AI supercomputer, glowing yellow dielectric tubes pulsing with light`,
    `3D master architectural cutaway combining the digital neural network layer with the underlying physical liquid cooling piping architecture`,
    `macro high-speed photograph of a single drop of dielectric coolant falling onto a hot GPU die, evaporating instantly into pure vapor`,
    `wide panoramic pull-back through data center white room showing miles of overhead stainless steel liquid distribution headers`,
    `macro 35mm view of single pressure gauge resting at perfect 35 PSI nominal operating pressure with glowing green backlight`,
    `hero perspective of cleanroom technician standing before massive wall of liquid-cooled computing racks in silent contemplation`,
    `POV looking through transparent CDU manifold cover at high-speed turbulent fluid vortex illuminated in acid yellow (#FFE500)`,
    `monumental typography card: HIDDEN SYSTEMS RULE THE WORLD in clean off-white (#F4F4F0) with acid yellow subtitle on matte obsidian (#0D0E15)`,
    `3D master blueprint of 1.2-gigawatt cooling plant infrastructure rendered in high-contrast technical lines and glowing nodes`,
    `final closing identity card: HIDDEN SYSTEMS LAB // EPISODE 005 // THE 1.2-GIGAWATT AI COOLING ENGINE with sleek kinetic spring`
  ];

  return {
    narrativeRole: 'CORE_THESIS',
    visualMode,
    infographicArchetype: archetype,
    graphicHeadline: beatIndex === 0 ? 'THERMODYNAMIC WAR' : beatIndex === 7 ? 'HIDDEN SYSTEMS LAB' : undefined,
    telemetryLabel: beatIndex === 0 ? 'SYSTEM // SYNCHRONIZED' : beatIndex === 7 ? 'EPISODE // COMPLETE' : undefined,
    voiceoverScript: scripts[beatIndex % scripts.length],
    promptSubject: prompts[beatIndex % prompts.length]
  };
}

/**
 * Storyboard canônico para o Episódio de Hidráulica de Megatall Skyscrapers:
 * "THE HIDDEN HYDRAULIC CITIES INSIDE MEGATALL SKYSCRAPERS" (100% livre de repetições, word-budget calibrado)
 */
export function getSkyscraperHydraulicsBeatData(actNumber: number, beatIndex: number, input: EpisodeTopicInput): BeatStoryboardData {
  if (actNumber === 1) {
    // ATO 01: THE HOOK & THE VISIBLE MIRACLE (12 beats)
    const roles: HslNarrativeRole[] = [
      'MONUMENTAL_HOOK', 'KINETIC_FLOW', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH',
      'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'CORE_THESIS'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 2 || beatIndex === 5 || beatIndex === 7 || beatIndex === 10) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 1) ? '3D_MAP' : (beatIndex === 4 || beatIndex === 8) ? 'CUTAWAY' : (beatIndex === 11) ? 'MACRO_HUD' : undefined;

    const scripts = [
      `Someone turns a faucet on floor one hundred and sixty-three of a five-hundred-meter megatall tower.`,
      `Water flows instantly, perfectly pressurized, hundreds of meters above the urban street level.`,
      `This everyday action defies extreme hydrostatic logic.`,
      `The paradox is simple: if you connected one continuous vertical pipe from floor one hundred and sixty-three straight to the ground, the consequences would be violent.`,
      `The water column would generate fifty bar of pressure at the base.`,
      `That is eight hundred pounds per square inch—enough concentrated force to instantly rupture standard concrete and steel plumbing.`,
      `Yet, drinking water travels vertically without shattering the building's core.`,
      `How does this liquid miracle operate at extreme altitude?`,
      `The answer lies in mechanical segmentation and localized pressure breaking.`,
      `A megatall skyscraper is not a single building with one plumbing system.`,
      `It is an astonishing stack of independent hydraulic cities built directly on top of each other.`,
      `This is the extreme vertical engineering that makes living in the clouds physically possible.`
    ];

    const prompts = [
      `cinematic macro 35mm shot of a modern chrome faucet opening on a luxury penthouse sink, crystal clear water flowing smoothly`,
      `wide 3D topographical map of a 500-meter skyscraper glowing in the night skyline, blue water vectors (#0038FF) rising up the central core`,
      `high-angle tracking shot over the edge of a supertall skyscraper looking straight down 500 meters to miniature city streets below`,
      `3D wireframe cutaway of a single continuous vertical pipe glowing neon orange (#FF2E00) showing extreme pressure buildup at the base`,
      `mathematical HUD overlay displaying P=ρgh calculation cascading down the screen, highlighting 50 BAR / 800 PSI at ground zero`,
      `kinetic simulation of extreme high-pressure water violently bursting through standard copper pipes inside a dark concrete shaft`,
      `hero cinematic pan across a pristine mechanical floor inside the tower, revealing gleaming blue stainless steel buffer tanks`,
      `macro close-up of a high-pressure motorized valve opening slowly, clear water rushing through the internal gate`,
      `isometric architectural cross-section revealing five distinct colored zones stacked vertically inside the supertall structure`,
      `wide shot of a massive subterranean municipal water main branching off and entering the skyscraper's fortified basement pump room`,
      `macro 35mm view of an industrial pressure gauge resting calmly at 45 PSI, bathed in warm electric yellow (#FFE500) light`,
      `monumental slow-motion shot of the skyscraper piercing through a low cloud deck at dawn, glowing with hidden internal infrastructure`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 4 ? '50 BAR BASE PRESSURE' : beatIndex === 10 ? 'VERTICAL STACK' : undefined,
      telemetryLabel: beatIndex === 4 ? 'PRESSURE // 800 PSI' : beatIndex === 10 ? 'ZONES // 5 INDEPENDENT' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 2) {
    // ATO 02: PHYSICAL ANATOMY (14 beats)
    const roles: HslNarrativeRole[] = [
      'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY',
      'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY',
      'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY',
      'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 4 || beatIndex === 8 || beatIndex === 11) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 3 || beatIndex === 7 || beatIndex === 12) ? 'CUTAWAY' : (beatIndex === 10) ? 'MACRO_HUD' : undefined;

    const scripts = [
      `To dissect the five-zone architecture, we begin at the municipal source.`,
      `City water mains push untreated flow into the basement reservoir at normal street pressure.`,
      `From the basement, Zone One serves only floors one through twenty-five.`,
      `But to reach Zone Two, the system employs high-voltage booster pumps driving flow straight up to floor twenty-five.`,
      `Here, the building features an invisible border wall: a dedicated mechanical floor.`,
      `Inside this intermediate technical level sit massive stainless steel transfer break tanks.`,
      `These tanks serve a singular critical purpose: they reset the hydrostatic pressure to absolute zero.`,
      `By dumping the pressurized flow into an open reservoir, the water column breaks.`,
      `From the floor twenty-five transfer tank, a new set of dedicated booster pumps takes over.`,
      `They draw from the zero-pressure buffer and force the water up to Zone Three at floor fifty.`,
      `This precise sequence repeats at floor fifty, floor seventy-five, and floor one hundred.`,
      `Each zone boundary acts as an independent water utility plant, fully decoupled from the pressures below.`,
      `The building is actually five separate municipal distribution networks stacked into a singular vertical column.`,
      `This tiered anatomy isolates gravitational force, ensuring no single pipe ever bears the full weight of the tower's water.`
    ];

    const prompts = [
      `3D architectural cutaway of the skyscraper basement showing massive municipal water mains entering through fortified concrete walls`,
      `cinematic low-angle tracking shot of giant dual-impeller booster pumps spinning up, painted in deep industrial blue (#0038FF)`,
      `isometric diagram highlighting Zone 1 (Floors 1-25) in vibrant yellow (#FFE500) while the rest of the tower remains dark silhouette`,
      `macro view of pressurized water rushing vertically up a massive stainless steel riser pipe enclosed in a dark central elevator core`,
      `wide 35mm photograph of a stark, windowless mechanical floor bathed in cool fluorescent light, filled with heavy steel infrastructure`,
      `3D cutaway of a massive stainless steel transfer break tank, showing turbulent water pouring in from the top and settling in the basin`,
      `mathematical overlay showing the pressure dropping instantly from 25 BAR down to 0 BAR as water enters the open-air transfer tank`,
      `macro slow-motion shot of water splashing perfectly into the calm reservoir of a transfer tank, resetting its kinetic energy to zero`,
      `cinematic tracking shot along a pristine manifold of secondary booster pumps resting on heavy vibration isolation springs`,
      `high-angle view looking down a narrow mechanical shaft as blue-painted pipes ascend vertically into the darkness above floor 25`,
      `digital HUD map displaying the full 5-zone vertical cascade: Z1 to Z2, Z2 to Z3, Z3 to Z4, ascending the tower in bright yellow steps`,
      `3D exploded view of the skyscraper showing the mechanical floors acting as solid structural bulkheads separating the living zones`,
      `macro 35mm view of a heavy cast-iron flange joint connecting two massive water risers, bolted with thick hexagonal steel nuts`,
      `wide cinematic shot of the entire skyscraper exterior at night, with the five mechanical floors glowing distinctly in cyan light`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 6 ? 'PRESSURE RESET' : beatIndex === 12 ? '5 TIER ANATOMY' : undefined,
      telemetryLabel: beatIndex === 6 ? 'HYDROSTATIC // 0 BAR' : beatIndex === 12 ? 'ZONES // ISOLATED' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 3) {
    // ATO 03: FLOW DYNAMICS (16 beats)
    const roles: HslNarrativeRole[] = [
      'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL',
      'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL',
      'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL',
      'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 2 || beatIndex === 5 || beatIndex === 10 || beatIndex === 14) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 4 || beatIndex === 8 || beatIndex === 13) ? 'MACRO_HUD' : (beatIndex === 2) ? '3D_MAP' : undefined;

    const scripts = [
      `The math governing vertical fluid dynamics is unforgiving and absolute.`,
      `Hydrostatic pressure is defined by density, gravity, and height.`,
      `For every ten meters of vertical elevation, the water column gains exactly one bar, or fourteen point five PSI, of static pressure.`,
      `At the five-hundred-meter pinnacle, the cumulative gravitational weight generates fifty bar at the lowest point of a theoretical unified pipe.`,
      `Even within a twenty-five-floor isolated zone, the pressure differential between the top and bottom floors is immense.`,
      `To prevent fixtures on the lowest floor of a zone from exploding under ten bar of local pressure, localized moderation is required.`,
      `Engineers deploy Pressure Reducing Valves, or PRVs, at every single floor branch off the main riser.`,
      `These mechanical spring-loaded gates step the main riser pressure down to a safe, constant three bar for tenant apartments.`,
      `A five-hundred-meter tower houses up to ten thousand occupants, requiring forty thousand liters of fresh water daily.`,
      `Moving this mass requires calculating precise pump curves and dynamic head pressure.`,
      `Pumps must overcome not just static gravity, but the dynamic friction loss of water scraping against internal pipe walls.`,
      `Turbulent flow at high velocity creates sheer resistance, stripping kinetic energy from the fluid stream.`,
      `Variable frequency drives spin the impeller motors precisely to match real-time tenant demand.`,
      `During the morning shower peak, flow rates spike by three hundred percent in under twenty minutes.`,
      `The transfer tanks dynamically buffer this demand, drawn down rapidly while basement pumps race to refill them.`,
      `This delicate mathematical equilibrium turns extreme vertical force into a gentle, controlled utility.`
    ];

    const prompts = [
      `3D mathematical overlay of the equation P=ρgh in glowing yellow (#FFE500) over a dark blue water column`,
      `macro 35mm view of a digital pressure transducer reading 14.5 PSI per 10m marker scaling up a vertical HUD`,
      `kinetic 3D simulation of a vertical water column stacking weight downwards, visualizing pressure buildup through color gradient to orange (#FF2E00)`,
      `wide architectural cross section showing the top and bottom of a single 25-floor zone, highlighting the internal pressure differential`,
      `macro close-up of a brass Pressure Reducing Valve (PRV) with internal spring mechanism exposed via 3D cutaway`,
      `firefly video of turbulent high-pressure water entering a PRV and exiting as a calm, smooth laminar stream`,
      `3D isometric map of a single residential floor showing the horizontal pipe branching off the vertical riser with a PRV node`,
      `macro photograph of a residential shower head delivering a perfect 3 BAR spray pattern in crisp cinematic lighting`,
      `data visualization graphic showing 40,000 liters daily demand distributed across thousands of glowing apartment nodes`,
      `engineering pump curve chart HUD displaying dynamic head vs flow rate, intersecting at the optimal high-efficiency operating point`,
      `macro inner-pipe simulation showing turbulent fluid boundary layers causing friction loss against rough internal steel walls`,
      `close-up of a massive industrial electric motor with variable frequency drive (VFD) LED readouts adjusting RPM rapidly`,
      `split-screen infographic showing morning peak demand surging while pump power dynamically scales to match the steep curve`,
      `wide low-angle shot of three massive transfer tanks side-by-side, their digital level indicators dropping rapidly as morning demand hits`,
      `cinematic shot of basement intake pumps engaging heavily, thick insulated pipes vibrating slightly under the immense torque`,
      `hero macro view of a perfect, undisturbed drop of water suspended in mid-air, symbolizing extreme mathematical control`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 2 ? '1 BAR PER 10 METERS' : beatIndex === 7 ? 'LOCAL MODERATION' : undefined,
      telemetryLabel: beatIndex === 2 ? 'GRADIENT // +14.5 PSI' : beatIndex === 7 ? 'OUTPUT // 3 BAR' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 4) {
    // ATO 04: PHYSICAL LIMIT (12 beats)
    const roles: HslNarrativeRole[] = [
      'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT',
      'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT',
      'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 4 || beatIndex === 8) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 6 || beatIndex === 10) ? 'MACRO_HUD' : undefined;

    const scripts = [
      `But mechanical engineering is strictly bounded by material science and physical limits.`,
      `Standard commercial plumbing pipe is rated for PN-sixteen, meaning it can safely handle sixteen bar of pressure.`,
      `If a zone height exceeds one hundred and sixty meters, the static pressure instantly breaches this material tolerance.`,
      `At excessive pressures, pipe fatigue initiates microscopic fractures at welded joints and cast flanges.`,
      `The most violent physical threat is hydraulic shock, known universally as water hammer.`,
      `When a large motorized valve closes suddenly, the momentum of thousands of liters of falling water slams into a dead end.`,
      `This kinetic halt converts instantly into a high-pressure shockwave that spikes up to three times the normal operating pressure.`,
      `A sixty-bar water hammer transient travels through the steel risers at over one thousand meters per second.`,
      `Without massive nitrogen-charged surge arrestors installed on the mechanical floors, these shockwaves would shear the pipe mounts right out of the concrete core.`,
      `Simultaneously, the high-speed booster pumps face the physical boundary of cavitation.`,
      `If intake pressure drops too low, the water literally boils at room temperature, forming microscopic vapor cavities.`,
      `When these bubbles collapse against the spinning bronze impellers, they blast microscopic craters into the metal, destroying the pump in weeks.`
    ];

    const prompts = [
      `macro 35mm laboratory view of standard copper pipe stamped with PN16 pressure rating under dramatic lighting`,
      `3D structural simulation of a pipe joint undergoing severe mechanical fatigue, microscopic fractures glowing in bright orange (#FF2E00)`,
      `wide shot of a dark utility shaft where a heavy steel pipe vibrates violently against its mounting brackets`,
      `high-speed macro visualization of a large internal gate valve slamming shut, stopping a massive column of rushing water`,
      `3D fluid dynamics graphic showing a violent water hammer shockwave rebounding upwards through a vertical riser pipe`,
      `macro view of a heavy industrial pressure gauge needle pinning violently past the red line during a shockwave event`,
      `close-up of a nitrogen-charged hydraulic surge arrestor, a thick steel cylinder absorbing the kinetic impact with a heavy internal spring`,
      `cinematic shot of heavy-duty seismically rated pipe hangers anchored deep into the structural concrete core of the skyscraper`,
      `macro high-speed photograph of fluid cavitation inside a pump, thousands of microscopic vapor bubbles forming in the low-pressure zone`,
      `3D microscopic view of a vapor bubble violently imploding against a solid bronze surface, generating a micro-shockwave`,
      `stark 35mm photograph of a destroyed pump impeller, its thick bronze blades pitted and eroded by severe cavitation damage`,
      `wide dramatic view of the massive skyscraper wrapped in stormy clouds, symbolizing the violent internal physical forces at play`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'MATERIAL LIMITS' : beatIndex === 6 ? 'WATER HAMMER' : undefined,
      telemetryLabel: beatIndex === 1 ? 'RATING // PN16' : beatIndex === 6 ? 'SHOCKWAVE // 60 BAR' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 5) {
    // ATO 05: THE BOTTLENECK (14 beats)
    const roles: HslNarrativeRole[] = [
      'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS',
      'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS',
      'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS',
      'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 3 || beatIndex === 7 || beatIndex === 10) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 2 || beatIndex === 6 || beatIndex === 9 || beatIndex === 13) ? 'FLIPBOARD' : (beatIndex === 0) ? '3D_MAP' : undefined;

    const scripts = [
      `At seven thirty AM on a Tuesday, the primary supply bottleneck is violently exposed.`,
      `A master variable frequency drive in the Zone Three booster room on floor fifty suffers a catastrophic logic board burnout.`,
      `The primary pump suite instantly shuts down during peak morning shower demand.`,
      `Above floor fifty, two thousand residents are simultaneously drawing heavy water loads.`,
      `Without the booster pumps pushing new supply upward, the building's vertical logistics chain breaks instantly.`,
      `The massive transfer tank on floor fifty becomes the sole remaining source of water for the upper half of the tower.`,
      `Draining at two thousand liters per minute, the reserve drops precipitously.`,
      `Within exactly twelve minutes, the transfer tank hits critical low level, triggering dry-run protection.`,
      `The secondary pumps above it must automatically cut off to prevent sucking air and destroying their bearings.`,
      `Cascading pressure loss sweeps upwards through Zone Four and Zone Five.`,
      `Showers in the premium penthouses on floor one hundred and fifty abruptly slow to a drip, then stop completely.`,
      `The physical disconnect is absolute: thousands of tons of water sit fully pressurized in the basement, but cannot jump the dead zone.`,
      `The fifty-story air gap paralyzes the supertall structure, rendering the multi-million-dollar apartments temporarily uninhabitable.`,
      `A skyscraper without vertical hydraulic transport immediately ceases to be a living building.`
    ];

    const prompts = [
      `digital clock overlay flashing 07:30 AM against a dark blue blueprint of the skyscraper, a red warning node appearing at Floor 50`,
      `macro close-up of a massive industrial VFD control board violently sparking and releasing a puff of acrid white smoke`,
      `3D isometric map of the 5-zone tower, showing Zone 3 abruptly turning from active blue to dead gray as pumps fail`,
      `split-screen showing multiple high-end residential showers running simultaneously, representing massive peak morning demand`,
      `cinematic shot of the massive transfer tank on floor 50, its digital level indicator plummeting rapidly in glowing orange numerals`,
      `macro view of the tank's water level physically dropping past the optical low-level sensor, triggering flashing red alarms`,
      `digital countdown timer HUD showing 12 MINUTES REMAINING overlaid on turbulent water draining from a massive holding tank`,
      `control room SCADA display flashing DRY RUN PROTECTION ENGAGED in bold hyper-orange (#FF2E00) across the screen`,
      `3D graphic showing the cascading pressure loss moving upwards like a dark wave, extinguishing the blue water vectors in the upper zones`,
      `macro 35mm view of a luxury chrome showerhead sputtering, coughing air, and finally dripping to a complete halt`,
      `wide cross-section diagram showing massive blue water reserves trapped in the basement, blocked by a dead red gap at Floor 50`,
      `stark interior shot of an ultra-luxury penthouse bathroom, completely silent and dry, bathed in cold morning light`,
      `monumental exterior shot of the skyscraper, the upper half shadowed in dark gray to symbolize the complete loss of utility`,
      `hyper-orange (#FF2E00) telemetry alert card reading: VERTICAL LOGISTICS CHAIN FAILURE // CASCADING PRESSURE LOSS`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'DRIVE FAILURE' : beatIndex === 7 ? 'RESERVE DEPLETED' : undefined,
      telemetryLabel: beatIndex === 1 ? 'SYSTEM // OFFLINE' : beatIndex === 7 ? 'TIME // 12 MINUTES' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 6) {
    // ATO 06: EMERGENCY WORKAROUND (10 beats)
    const roles: HslNarrativeRole[] = [
      'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH',
      'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH',
      'EMERGENCY_DISPATCH', 'EMERGENCY_DISPATCH'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 4 || beatIndex === 6) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 5 || beatIndex === 8) ? 'CUTAWAY' : undefined;

    const scripts = [
      `Before total tenant panic sets in, the building's hidden safety margins automatically engage.`,
      `Redundant parallel booster pumps on a separate power circuit instantly detect the primary failure and spin up to maximum RPM.`,
      `Simultaneously, emergency gravity tanks hidden inside the tower's architectural roof spire release their payload.`,
      `These top-tier reserves dump thirty minutes of emergency domestic supply downward through dedicated bypass risers.`,
      `Motorized cross-connect valves on the mechanical floors open, allowing adjacent independent zones to temporarily share water pressure.`,
      `As a last resort, building engineers can manually bleed pressure from the massive high-pressure fire suppression loop into the domestic system.`,
      `Maintenance crews rush into the floor fifty mechanical level, bypassing the burned-out variable drives with manual mechanical overrides.`,
      `Within four minutes, the upper zones begin to repressurize, the water column slowly fighting its way back up the risers.`,
      `Showers resume, faucets flow, and the two thousand residents remain entirely unaware of the catastrophic failure beneath them.`,
      `These massive, over-engineered hidden redundancies are the only reason vertical megacities do not collapse under their own fragility.`
    ];

    const prompts = [
      `macro 35mm view of secondary standby booster pumps violently engaging, their heavy steel casings vibrating under sudden load`,
      `3D architectural cutaway of the skyscraper's decorative roof spire, revealing massive hidden emergency gravity tanks full of water`,
      `firefly video of heavy mechanical bypass valves rotating open, redirecting high-pressure blue water through emergency piping loops`,
      `isometric map showing cross-connect valves opening between zones, allowing blue water vectors to bleed horizontally across the core`,
      `macro shot of a heavy red fire-suppression pipe connecting to a blue domestic water line via a heavily locked manual bypass valve`,
      `cinematic tracking shot of maintenance engineers in hardhats sprinting down a dark mechanical corridor with heavy flashlights`,
      `close-up of an engineer's gloved hand slamming a heavy mechanical bypass lever, manually overriding the electronic safety lockouts`,
      `digital SCADA screen showing system pressure slowly climbing back up from 0 to 45 PSI in the upper penthouse zones`,
      `35mm shot of water surging powerfully back out of the penthouse showerhead, restoring the invisible luxury experience`,
      `wide drone shot of the skyscraper at dawn, standing resilient and fully operational against the waking city skyline`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 2 ? 'GRAVITY RESERVES' : beatIndex === 7 ? 'REPRESSURIZATION' : undefined,
      telemetryLabel: beatIndex === 2 ? 'SUPPLY // 30 MIN' : beatIndex === 7 ? 'STATUS // RECOVERING' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 7) {
    // ATO 07: SYSTEMIC CONSEQUENCES (10 beats)
    const roles: HslNarrativeRole[] = [
      'SYSTEMIC_IMPACT', 'SYSTEMIC_IMPACT', 'SYSTEMIC_IMPACT', 'SYSTEMIC_IMPACT',
      'SYSTEMIC_IMPACT', 'SYSTEMIC_IMPACT', 'SYSTEMIC_IMPACT', 'SYSTEMIC_IMPACT',
      'SYSTEMIC_IMPACT', 'SYSTEMIC_IMPACT'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 4 || beatIndex === 7) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 3 || beatIndex === 8) ? 'MACRO_HUD' : undefined;

    const scripts = [
      `A true hydraulic failure in a supertall structure is an economic disaster disguised as a plumbing issue.`,
      `If the fifty-bar base pressure were ever allowed to rupture the lower risers, the cascading flood would be catastrophic.`,
      `Thousands of liters of water per minute would cascade down elevator shafts, wiping out high-voltage busbars and server floors.`,
      `A full day of hydraulic downtime in a premium commercial megatall costs over two million dollars in tenant disruption and hotel relocations.`,
      `Insurance premiums for supertall structures are dictated heavily by the audited redundancy of these invisible water systems.`,
      `This extreme financial risk is exactly why developers willingly sink fifteen million dollars into pure plumbing infrastructure on a billion-dollar tower.`,
      `The cost of over-engineering the pipe thickness, the titanium pumps, and the transfer tanks is microscopic compared to the cost of a single rupture.`,
      `Skyscrapers are widely celebrated for their exterior architectural glass and structural steel frames.`,
      `But the true economic architecture lies entirely within the pressurized, hidden veins running through the dark concrete core.`,
      `Without perfect mastery of hydrostatic force, vertical density is economically and physically impossible.`
    ];

    const prompts = [
      `macro 35mm photograph of a massive corporate lease contract with a watermark reading $2,000,000 PER DAY DISRUPTION PENALTY`,
      `3D simulation of catastrophic flooding inside a skyscraper core, water violently cascading down dark elevator shafts`,
      `cinematic shot of a high-voltage electrical substation in the basement completely ruined by extreme water ingress`,
      `financial data visualization showing $15 MILLION PLUMBING CAPEX balancing against $1 BILLION TOWER VALUATION on a sleek HUD`,
      `macro view of an insurance auditor's digital tablet displaying a glowing green PASS status on the building's hydrostatic redundancy checks`,
      `heavy industrial shot of ultra-thick Schedule 80 steel pipe welded seamlessly, symbolizing the massive upfront material investment`,
      `wide architectural shot of a sleek glass skyscraper reflecting the sunset, contrasted with a transparent overlay of its complex internal plumbing`,
      `kinetic typographic animation: ARCHITECTURAL BEAUTY IS VISIBLE // ECONOMIC SURVIVAL IS HIDDEN`,
      `3D cutaway of the solid concrete central core of the tower, revealing the densely packed, highly pressurized veins of water, power, and air`,
      `hero cinematic pull-back of a hyper-dense global megacity, glowing at night, entirely dependent on pressurized vertical logistics`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'CATASTROPHIC FLOOD' : beatIndex === 5 ? '$15M INFRASTRUCTURE' : undefined,
      telemetryLabel: beatIndex === 1 ? 'RISK // SEVERE' : beatIndex === 5 ? 'INVESTMENT // SECURED' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  // ATO 08: ORIGINAL THESIS (8 beats)
  const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 4) ? 'firefly_video' : 'generated_image_35mm';
  const archetype = (beatIndex === 2 || beatIndex === 5) ? '3D_MAP' : undefined;

  const scripts = [
    `The illusion of the skyscraper is that it functions as a single, unified obelisk.`,
    `The physical reality is that the building is not one building at all—it is five distinct hydraulic cities stacked vertically in the sky.`,
    `Each zone is an independent municipal district, strictly isolated by physical gravity.`,
    `The heavy transfer tank on the mechanical floor is the absolute border crossing.`,
    `The windowless mechanical floor itself serves as the invisible, fortified city wall.`,
    `To live in the clouds requires an absolute, unyielding mastery over extreme hydrostatic violence.`,
    `Hidden systems rule the world, and the smartest systems are the ones silently managing the extremes.`,
    `This is Hidden Systems Lab.`
  ];

  const prompts = [
    `wide monumental shot of a supertall skyscraper standing alone against a dark, stormy sky, appearing as a single monolithic structure`,
    `3D isometric exploded view of the skyscraper splitting into five distinct, floating zones glowing in separate neon colors`,
    `macro 35mm view of a massive stainless steel transfer tank, calm water resting perfectly inside the fortified reservoir`,
    `cinematic shot looking down a dark, windowless mechanical corridor filled with heavy pipes, glowing valves, and thick concrete bulkheads`,
    `high-angle slow drone pull-back revealing the immense vertical scale of the megatall tower towering over a dense urban grid`,
    `macro high-speed photograph of a single perfect drop of water hitting a calm pool, ripples expanding under cinematic lighting`,
    `monumental typography card: HIDDEN SYSTEMS RULE THE WORLD in clean off-white (#F4F4F0) with acid yellow subtitle on matte obsidian (#0D0E15)`,
    `final closing identity card: HIDDEN SYSTEMS LAB // EPISODE 006 // HYDRAULIC CITIES IN THE SKY with sleek kinetic spring`
  ];

  return {
    narrativeRole: 'CORE_THESIS',
    visualMode,
    infographicArchetype: archetype,
    graphicHeadline: beatIndex === 1 ? '5 HYDRAULIC CITIES' : beatIndex === 7 ? 'HIDDEN SYSTEMS LAB' : undefined,
    telemetryLabel: beatIndex === 1 ? 'ARCHITECTURE // STACKED' : beatIndex === 7 ? 'EPISODE // COMPLETE' : undefined,
    voiceoverScript: scripts[beatIndex % scripts.length],
    promptSubject: prompts[beatIndex % prompts.length]
  };
}

/**
 * Storyboard canônico para o Episódio da Frequência da Rede Elétrica (Grid Frequency / 60 Hz):
 * "THE 0.5 HERTZ PROBLEM THAT CAUSES TOTAL BLACKOUTS" (100% livre de repetições, word-budget calibrado)
 */
export function getGridFrequencyBeatData(actNumber: number, beatIndex: number, input: EpisodeTopicInput): BeatStoryboardData {
  if (actNumber === 1) {
    // ATO 01: THE HOOK & THE VISIBLE MIRACLE (12 beats // 75s)
    const roles: HslNarrativeRole[] = [
      'MONUMENTAL_HOOK', 'KINETIC_FLOW', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH',
      'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'CORE_THESIS'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 1 || beatIndex === 2 || beatIndex === 5 || beatIndex === 6 || beatIndex === 7 || beatIndex === 11) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 3) ? 'MACRO_HUD' : (beatIndex === 4 || beatIndex === 10) ? 'CUTAWAY' : (beatIndex === 9) ? '3D_MAP' : beatIndex === 8 ? 'FLIPBOARD' : undefined;

    const scripts = [
      `Right now, the entire electric grid of North America has zero seconds of stored electricity.`,
      `Every single watt consumed this millisecond is being generated by a spinning turbine this exact millisecond.`,
      `Flip a light switch, turn on an air conditioner, or charge a vehicle, and a generator miles away instantly feels the mechanical drag.`,
      `Over four hundred million people rely on a continuous electromagnetic humming wave locked at sixty point zero zero Hertz.`,
      `If generation and consumption diverge by just zero point five Hertz, catastrophic physical breakdown begins in eight seconds.`,
      `Steam turbines weighing hundreds of tons begin to violently vibrate against their magnetic bearings.`,
      `The visible product is constant power at the wall outlet; the hidden product is continuous, continent-wide rotational kinetic synchrony.`,
      `A sudden loss of two gigawatts triggers automated emergency relays across thousands of miles.`,
      `How does a machine spanning three thousand miles balance gigawatts with zero battery storage?`,
      `The answer lies in the rotational inertia of millions of tons of synchronized spinning steel rotors.`,
      `Massive high-voltage switchyards link power plants into a single continental organism.`,
      `This is the razor-thin sixty-Hertz tightrope that keeps modern civilization from plunging into total darkness.`
    ];

    const prompts = [
      `monumental night aerial view of a sprawling illuminated metropolis, glowing electric acid yellow (#FFE500) transmission lines connecting the city, telemetry overlays 60.000 HZ, matte obsidian background (#0D0E15)`,
      `macro 35mm view of massive 3600 RPM steam turbine rotor spinning inside dark industrial power plant with magnetic stator glowing electric Klein Blue (#002FA7)`,
      `cinematic close-up of domestic wall switch being flipped, revealing wireframe schematic showing instantaneous load pull transmitting across miles of high-voltage wire`,
      `wide shot of high-tech regional transmission control room with wall-sized multi-monitor arrays tracking continental 60.000 Hz frequency waveform in real time`,
      `split composition showing serene 60.00 Hz green sine wave vs violent 59.42 Hz red waveform with flashing alarm telemetry overlays: FREQUENCY TRIP IMMINENT`,
      `macro high-speed photograph of heavy industrial turbine shaft vibrating under mechanical strain, microscopic clearance between spinning blades and casing`,
      `monumental typography card: ZERO STORAGE // LIVE STANDING WAVE in clean off-white (#F4F4F0) with acid yellow subtitle on matte obsidian (#0D0E15)`,
      `dramatic night shot of high-voltage 765kV substation with giant circuit breakers glowing under volumetric atmospheric haze and electric corona discharge`,
      `3D wireframe continental map of North America showing interconnected electrical grid pulsating in synchronized 60 Hz waves`,
      `macro industrial cutaway of giant multi-pole generator rotor, copper windings locked under heavy steel retaining rings spinning at 3600 RPM`,
      `cinematic wide shot of colossal high-voltage transmission towers marching across mountain ranges at dusk, mist rolling through valleys`,
      `dramatic closing hero card for Act 1: 60.00 HZ SYNCHRONOUS CONTINENT with sleek kinetic HUD overlays and telemetry reticles`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'ZERO STORAGE' : beatIndex === 4 ? '60.00 HZ SYNC' : undefined,
      telemetryLabel: beatIndex === 0 ? 'SYSTEM // LIVE WAVE' : beatIndex === 4 ? 'GRID // ZERO TOLERANCE' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 2) {
    // ATO 02: THE PHYSICAL ANATOMY & LAYER BREAKDOWN (14 beats // 90s)
    const roles: HslNarrativeRole[] = [
      'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY',
      'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY',
      'KINETIC_FLOW', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY',
      'TECHNICAL_ANATOMY', 'BOUNDARY_LIMIT'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 2 || beatIndex === 5 || beatIndex === 8 || beatIndex === 12) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 7) ? 'CUTAWAY' : (beatIndex === 3 || beatIndex === 10) ? '3D_MAP' : beatIndex === 6 ? 'MACRO_HUD' : undefined;

    const scripts = [
      `To understand how the grid functions without storage, we must dissect its physical anatomy.`,
      `At the foundation are baseload synchronous generators driven by nuclear reactors, natural gas, and hydroelectric dams.`,
      `These heavy machines do not generate wild alternating current; their rotors are physically locked to the frequency of the grid.`,
      `A two-pole generator must spin at exactly thirty-six hundred revolutions per minute to produce sixty cycles per second.`,
      `The formula is uncompromising: frequency equals shaft speed times magnetic poles divided by one hundred and twenty.`,
      `Across North America, thousands of these multi-ton rotors spin in absolute mechanical phase.`,
      `Combined, they represent millions of gigajoules of rotating kinetic inertia.`,
      `Step-up transformers elevate voltage to seven hundred and sixty-five kilovolts to push current over thousands of miles.`,
      `High-voltage transmission corridors act as continental arteries, linking generation hubs directly to cities.`,
      `The continent is divided into three massive synchronized machines: the Eastern Interconnection, the Western Interconnection, and ERCOT in Texas.`,
      `Within each interconnection, every single generator turns at the exact same synchronized electrical angle.`,
      `Primary frequency response governors on turbine steam valves detect speed deviations in less than five hundred milliseconds.`,
      `Secondary automatic generation control centers adjust dispatch every four seconds across entire states.`,
      `Together, these physical layers form the largest synchronized mechanical system ever constructed on Earth.`
    ];

    const prompts = [
      `3D isometric exploded view of a massive 1200 MW thermal power plant showing boiler, steam turbine, generator, and switchyard`,
      `macro 35mm cutaway of a 4-pole synchronous generator showing massive copper stator windings and magnetic field coils glowing in Klein Blue`,
      `cinematic shot of multiple turbine rotors aligned along power station hall, spinning in perfect 3600 RPM phase alignment`,
      `technical HUD diagram illustrating frequency formula: F = (N x P) / 120 with glowing gold telemetry markers`,
      `high-speed macro shot of turbine shaft coupling with laser tachometer measuring exact 3600.0 RPM rotational speed`,
      `wide angle view of nuclear power station turbine hall with twin low-pressure steam turbines enclosed in heavy yellow casings`,
      `3D visualization of invisible magnetic flux lines linking generator rotor to continental grid transmission network`,
      `monumental shot of 765kV step-up transformer bank with giant porcelain bushings glowing in dusk lighting`,
      `cinematic aerial tracking shot over massive extra-high-voltage transmission lines spanning across forested mountain peaks`,
      `3D continental topology map showing the three North American interconnections: Eastern, Western, and Texas ERCOT`,
      `macro view of computerized governor control panel showing high-speed actuator valves adjusting high-pressure steam flow`,
      `digital HUD dashboard displaying Automatic Generation Control (AGC) area control error correcting in 4-second cycles`,
      `cinematic medium shot of regional power grid dispatcher analyzing multi-screen system frequency telemetry at control console`,
      `hero shot of interconnected substation lattice towers against a vibrant twilight sky with electric acid yellow data lines`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 3 ? '3,600 RPM ROTORS' : beatIndex === 9 ? '3 INTERCONNECTIONS' : undefined,
      telemetryLabel: beatIndex === 3 ? 'SPEED // 60.00 HZ' : beatIndex === 9 ? 'SYNCHRONY // CONTINENTAL' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 3) {
    // ATO 03: THE FLOW DYNAMICS & THROUGHPUT MATH (16 beats // 105s)
    const roles: HslNarrativeRole[] = [
      'MATHEMATICAL_MODEL', 'MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'BOUNDARY_LIMIT'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 2 || beatIndex === 6 || beatIndex === 10 || beatIndex === 14) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 8) ? 'MACRO_HUD' : (beatIndex === 4 || beatIndex === 12) ? 'CUTAWAY' : beatIndex === 7 ? 'FLIPBOARD' : undefined;

    const scripts = [
      `The mathematics of frequency stability is governed by the rotational kinetic energy of the grid.`,
      `When electrical demand perfectly matches mechanical generation, the grid hums at exactly sixty point zero zero Hertz.`,
      `The fundamental equation dictates that frequency deviation equals the power imbalance divided by twice the system inertia constant.`,
      `When a million people turn on air conditioners simultaneously, total electrical demand surges instantly.`,
      `Because there is no battery storage between the generator and the wall plug, that extra energy is extracted directly from the spinning rotors.`,
      `The magnetic field in the generator stator increases its counter-torque, physically braking the thousands of tons of spinning steel.`,
      `As the rotors slow down from thirty-six hundred RPM, the electrical frequency of the entire continent drops below sixty Hertz.`,
      `Conversely, if a massive factory suddenly disconnects, mechanical power exceeds electrical load.`,
      `The turbines accelerate, and frequency rises above sixty point zero zero Hertz.`,
      `The speed at which frequency drops is defined as the Rate of Change of Frequency, or RoCoF.`,
      `RoCoF is measured in Hertz per second, determining how many seconds operators have before protective relays trigger.`,
      `The system inertia constant, designated as H, represents the number of seconds the grid could supply full load purely from stored kinetic energy.`,
      `In a traditional thermal grid, H ranges between three and five seconds.`,
      `That means grid operators have less than four seconds of physical inertia buffer before mechanical destruction begins.`,
      `Modern renewable inverters generate zero physical spinning inertia, cutting this buffer in half.`,
      `This makes the modern grid faster, lighter, and far more volatile under sudden load shocks.`
    ];

    const prompts = [
      `engineering chalkboard HUD overlay showing the swing equation: J * domega/dt = Tm - Te in glowing neon yellow typography`,
      `oscilloscope display showing a perfect 60.000 Hz sine wave with high-precision digital frequency meter ticking in real time`,
      `3D cutaway of generator stator core showing intense electromagnetic counter-torque resisting rotor rotation during sudden demand surge`,
      `cinematic macro view of turbine shaft tachometer showing rotational speed dipping from 3600.0 to 3594.0 RPM`,
      `split screen HUD showing power generation bar vs load demand bar with dynamic red imbalance indicator: DELTA P = -1800 MW`,
      `macro high-speed photograph of rotating generator field coils under magnetic strain, magnetic flux lines visualized in electric blue`,
      `graphical HUD chart plotting frequency drop curve: 60.00 Hz decaying to 59.70 Hz under sudden 2 GW generation trip`,
      `telemetry dashboard showing Rate of Change of Frequency (RoCoF) meter accelerating into the amber caution zone at -0.15 Hz/s`,
      `monumental typography card: INERTIA CONSTANT // 3.8 SECONDS in clean off-white (#F4F4F0) with acid yellow subtitle on matte obsidian (#0D0E15)`,
      `3D visualization comparing heavy spinning steam turbine mass (400 tons) vs static solar inverter solid-state circuitry`,
      `cinematic shot of high-voltage transmission substation busbars vibrating under severe low-frequency power oscillations`,
      `macro technical view of digital protection relay sampling frequency 4800 times per second with high-speed DSP processor`,
      `high-angle view of massive hydro power plant generator hall with 10 vertical Francis turbines spinning in synchronized water vortex`,
      `digital telemetry overlay displaying grid inertia degradation curve as solar penetration increases from 10% to 50%`,
      `dramatic split composition: massive mechanical spinning turbine in Klein Blue vs solid-state battery inverter bank in Acid Yellow`,
      `hero frame closing Act 3: 4 SECONDS OF INERTIA BUFFER with bold mathematical HUD framing and warning reticles`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 2 ? 'SWING EQUATION' : beatIndex === 8 ? 'ROCOF: -0.15 HZ/S' : undefined,
      telemetryLabel: beatIndex === 2 ? 'MATH // DELTA P' : beatIndex === 8 ? 'BUFFER // 3.8 SECONDS' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 4) {
    // ATO 04: THE PHYSICAL LIMIT & BOUNDARY CONDITION (12 beats // 75s)
    const roles: HslNarrativeRole[] = [
      'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'KINETIC_FLOW', 'BOUNDARY_LIMIT',
      'TECHNICAL_ANATOMY', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'BOUNDARY_LIMIT',
      'TECHNICAL_ANATOMY', 'BOUNDARY_LIMIT', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 5 || beatIndex === 9) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 3) ? 'CUTAWAY' : (beatIndex === 7) ? 'MACRO_HUD' : undefined;

    const scripts = [
      `Why is a zero point five Hertz deviation so dangerous? The answer is mechanical resonance.`,
      `The low-pressure turbine blades in a nuclear or coal power plant are titanium airfoils up to four feet long.`,
      `These blades are engineered to avoid mechanical resonant frequencies at precisely sixty Hertz.`,
      `When frequency drops to fifty-nine point five Hertz, the blade vibration matches its natural harmonic frequency.`,
      `Microscopic standing waves ripple through the titanium, inducing extreme cyclic fatigue stress in seconds.`,
      `If operated at fifty-nine point five Hertz for more than sixty seconds, turbine blades crack and shear off catastrophically.`,
      `At the same time, electrical transformers experience catastrophic magnetic over-fluxing.`,
      `The volts-per-Hertz ratio exceeds design limits, forcing magnetic flux outside the laminated steel core into structural bolts.`,
      `Core temperatures skyrocket past two hundred degrees Celsius, boiling transformer dielectric oil in seconds.`,
      `To prevent multimillion-dollar generators and transformers from exploding, automatic trip relays are armed with zero tolerance.`,
      `At fifty-nine point five Hertz, power plants disconnect themselves from the grid to save their own machinery.`,
      `This protective self-preservation creates the exact mechanism for continental collapse.`
    ];

    const prompts = [
      `macro 35mm view of massive 48-inch titanium low-pressure turbine blade showing harmonic resonance vibration stress test with laser interferometer`,
      `3D cutaway of nuclear steam turbine casing showing microscopic crack propagating across root of vibrating titanium blade`,
      `finite element analysis (FEA) HUD visualization showing harmonic stress concentrations glowing in violent Hyper Orange (#FF2E00) on turbine rotor`,
      `high-speed photograph of turbine blade tips spinning near sound speed with acoustic shockwaves rippling through low-pressure steam`,
      `macro industrial view of giant 500kV transformer core showing magnetic flux saturation heating structural clamping bolts to glowing red`,
      `thermal infrared imaging of power substation transformer showing internal temperature exceeding 200°C under 59.4 Hz over-fluxing condition`,
      `split screen: cracked turbine blade metal fatigue cross-section vs boiled transformer insulating oil dielectric breakdown`,
      `macro close-up of digital under-frequency trip relay displaying 59.50 HZ TRIP THRESHOLD armed with red LED indicator`,
      `cinematic shot of high-voltage generator circuit breaker preparing to trip with spring-charged mechanical actuator primed`,
      `3D schematic showing generator disconnecting from 765kV busbar as protective relay activates in 0.08 seconds`,
      `dramatic view of power plant control room annunciator panel with multiple yellow and red TRIP ALARMS lighting up simultaneously`,
      `hero card for Act 4: 59.50 HZ MECHANICAL LIMIT with high-voltage warning symbols and technical border telemetry`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? '59.50 HZ LIMIT' : beatIndex === 6 ? 'BLADE RESONANCE' : undefined,
      telemetryLabel: beatIndex === 0 ? 'PHYSICS // HARMONIC TRIP' : beatIndex === 6 ? 'STRESS // 200°C OVERFLUX' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 5) {
    // ATO 05: THE BOTTLENECK & STRAIN BREAKDOWN (14 beats // 90s)
    const roles: HslNarrativeRole[] = [
      'BOTTLENECK_CRISIS', 'BOTTLENECK_CRISIS', 'KINETIC_FLOW', 'BOTTLENECK_CRISIS',
      'TECHNICAL_ANATOMY', 'BOTTLENECK_CRISIS', 'KINETIC_FLOW', 'BOTTLENECK_CRISIS',
      'MATHEMATICAL_MODEL', 'BOTTLENECK_CRISIS', 'KINETIC_FLOW', 'BOTTLENECK_CRISIS',
      'EMERGENCY_DISPATCH', 'SYSTEMIC_IMPACT'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 4 || beatIndex === 7 || beatIndex === 11) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 2 || beatIndex === 9) ? '3D_MAP' : (beatIndex === 5 || beatIndex === 12) ? 'CUTAWAY' : beatIndex === 8 ? 'MACRO_HUD' : undefined;

    const scripts = [
      `This is how a continental blackout happens in less than ten seconds.`,
      `It begins with a severe transmission corridor fault: lightning strikes a major seven hundred and sixty-five kilovolt line during peak summer demand.`,
      `Two twin nuclear reactors, generating twenty-four hundred megawatts, trip offline in seventy milliseconds to protect their cores.`,
      `Instantly, a massive twenty-four hundred megawatt generation deficit opens across the interconnection.`,
      `The Rate of Change of Frequency spikes to a terrifying negative zero point two five Hertz per second.`,
      `Frequency plunges through fifty-nine point eight... fifty-nine point six... fifty-nine point five Hertz in three point two seconds.`,
      `Now, the self-preservation trap springs shut.`,
      `Protective relays at neighboring thermal power plants detect the fifty-nine point five Hertz boundary and disconnect another twelve hundred megawatts.`,
      `With more generation lost, the frequency crash accelerates even faster.`,
      `Overloaded transmission lines sag under extreme thermal current, contacting trees and tripping circuit breakers.`,
      `The continental grid fractures into isolated, unsynchronized electrical islands.`,
      `Within each island, generation and load are violently mismatched, crashing local frequency to zero in seconds.`,
      `Substations trip in cascading domino sequence across fifteen states.`,
      `Fifty million people are plunged into total electrical blackout in less than sixty seconds.`
    ];

    const prompts = [
      `cinematic dramatic shot of massive lightning bolt striking 765kV transmission tower, blinding electric arc exploding across ceramic insulator strings`,
      `high-angle view of twin nuclear reactor containment domes at night with emergency bypass steam venting in massive white plumes`,
      `3D continental grid map showing sudden 2400 MW power void opening in the Eastern Interconnection in glowing red telemetry`,
      `macro view of control room master frequency needle crashing downward through 59.8... 59.6... 59.4 Hz in rapid motion`,
      `digital HUD telemetry overlay flashing red alert: ROCOF = -0.25 HZ/S // GENERATION DEFICIT CRITICAL`,
      `cinematic shot of high-voltage circuit breakers exploding open at power plant switchyard under massive arc flash`,
      `3D visualization showing adjacent power plants tripping offline in rapid cascade, transmission grid fracturing into isolated islands`,
      `macro 35mm view of high-voltage aluminum transmission conductor sagging into tree branches under extreme thermal current overload`,
      `split screen: transmission line flashover arc in Hyper Orange (#FF2E00) vs regional control room screens turning black in Obsidian Deep (#07080B)`,
      `3D map showing continental transmission grid separating along regional boundaries, power flow arrows reversing violently`,
      `cinematic aerial view of major metropolitan skyline experiencing sudden rolling blackout, lights extinguishing section by section`,
      `wide view of completely dark city skyline under starry night sky with emergency vehicle flashing lights reflecting off buildings`,
      `macro close-up of master transmission breaker lock-out relay displaying TRIP LOCKOUT across 15 utility sectors`,
      `monumental closing frame for Act 5: CONTINENTAL CASCADE // 50 MILLION IN DARKNESS with stark black and red HUD graphics`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 3 ? '59.42 HZ TRIP' : beatIndex === 12 ? 'CASCADING BLACKOUT' : undefined,
      telemetryLabel: beatIndex === 3 ? 'ALERT // ROCOF: -0.25 HZ/S' : beatIndex === 12 ? 'GRID // COLLAPSED' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 6) {
    // ATO 06: THE EMERGENCY WORKAROUND & HIDDEN MARGINS (10 beats // 60s)
    const roles: HslNarrativeRole[] = [
      'EMERGENCY_DISPATCH', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL',
      'TECHNICAL_ANATOMY', 'CORE_THESIS'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 4 || beatIndex === 8) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 2) ? 'CUTAWAY' : (beatIndex === 6) ? 'MACRO_HUD' : undefined;

    const scripts = [
      `To prevent total continental collapse, grid operators rely on automated, brute-force defense systems.`,
      `The first line of defense is Under-Frequency Load Shedding, or UFLS.`,
      `If frequency breaches fifty-nine point three Hertz, automated relays intentionally cut power to ten percent of the continent in one hundred milliseconds.`,
      `By instantly dumping millions of customers, load is forced back down to match remaining generation, arresting the frequency dive.`,
      `Simultaneously, utility-scale Battery Energy Storage Systems inject hundreds of megawatts of synthetic inertia in sixteen milliseconds.`,
      `These grid-forming inverters do not spin, but their silicon switches mimic the electromagnetic response of synchronous rotors.`,
      `Hydroelectric dams slam open turbine gates, surging thousands of tons of pressurized water into runners within ten seconds.`,
      `Fast-start aeroderivative gas turbines fire up to full output in less than five minutes.`,
      `These multi-layered defenses create an automated safety net designed to arrest the frequency decline before the fifty-nine point zero Hertz catastrophic floor.`,
      `It is an extreme, synchronized high-speed triage that sacrifices individual cities to save the continent.`
    ];

    const prompts = [
      `cinematic shot of high-voltage substation control building interior with banks of microprocessor-based UFLS load shedding relays`,
      `macro view of high-speed vacuum circuit breaker tripping open in 100 milliseconds with brilliant blue spark discharge`,
      `3D continental grid map showing 10% load shed zones disconnecting sequentially to stabilize frequency waveform at 59.5 Hz`,
      `cinematic wide shot of utility-scale Tesla Megapack battery storage facility with thousands of battery cabinets glowing under night lighting`,
      `macro 35mm cutaway of grid-forming silicon carbide inverter module switching at 10 kHz to inject synthetic rotational inertia`,
      `dramatic shot of massive hydroelectric dam spillway and penstock valve opening rapidly with violent pressurized water roar`,
      `high-angle view of aeroderivative gas turbine peaking plant with twin exhaust stacks glowing orange as engines spool to full power in 5 minutes`,
      `digital HUD dashboard showing frequency recovery curve arresting at 59.32 Hz and climbing back toward 60.00 Hz`,
      `3D visualization showing multi-layered defense response: UFLS (100ms), Batteries (16ms), Hydro (10s), Gas Peakers (5min)`,
      `hero card for Act 6: 100 MILLISECOND TRIAGE with high-speed response telemetry in Acid Yellow (#FFE500)`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 2 ? 'UFLS: 100MS LOAD SHED' : beatIndex === 7 ? 'SYNTHETIC INERTIA' : undefined,
      telemetryLabel: beatIndex === 2 ? 'DEFENSE // TIER 1' : beatIndex === 7 ? 'RESPONSE // 16 MILLISECONDS' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 7) {
    // ATO 07: SYSTEMIC CONSEQUENCES & ECONOMIC RIPPLE (10 beats // 60s)
    const roles: HslNarrativeRole[] = [
      'SYSTEMIC_IMPACT', 'SYSTEMIC_IMPACT', 'TECHNICAL_ANATOMY', 'SYSTEMIC_IMPACT',
      'MATHEMATICAL_MODEL', 'SYSTEMIC_IMPACT', 'TECHNICAL_ANATOMY', 'SYSTEMIC_IMPACT',
      'MATHEMATICAL_MODEL', 'CORE_THESIS'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 3 || beatIndex === 7) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 2 || beatIndex === 6) ? '3D_MAP' : undefined;

    const scripts = [
      `When the zero point five Hertz boundary is breached and a blackout occurs, getting power back is an agonizing engineering challenge.`,
      `This is the Black Start problem: a modern thermal power plant cannot start itself from a dead stop.`,
      `It requires dozens of megawatts of external electricity just to run its boiler feed pumps, lubrication systems, and draft fans.`,
      `Grid restoration must begin with small, isolated Black Start diesel generators or dedicated hydroelectric units.`,
      `Transmission lines must be energized section by section, carefully matching load in micro-increments to prevent frequency oscillation.`,
      `A single inadvertent switch flip can collapse the fragile newly-formed electrical island back to zero.`,
      `A continental blackout costs the global economy upwards of ten billion dollars every single day in halted logistics, spoiled goods, and refinery shutdowns.`,
      `Municipal water treatment plants lose pressure within hours; cellular base stations exhaust backup batteries in six hours.`,
      `As the world transitions toward inverter-based renewables with zero inherent physical inertia, frequency management becomes the primary bottleneck of modern energy.`,
      `Without massive investments in grid-forming inverters and synchronous condensers, the grid becomes lighter, faster, and far more fragile.`
    ];

    const prompts = [
      `cinematic shot of darkened metropolitan transit hub with stalled electric subway trains on empty elevated tracks under moonlight`,
      `macro 35mm view of massive emergency Black Start diesel generator coughing to life inside cold, dark basement of shut-down power station`,
      `3D map showing step-by-step restoration islands slowly expanding across state territory with critical transmission corridors re-energizing`,
      `high-angle view of massive chemical refinery complex in total dark flaring off excess gases against pitch black sky`,
      `digital HUD counter tracking economic damage metric climbing: $10.4 BILLION / DAY // INFRASTRUCTURE CRIPPLED`,
      `cinematic shot of municipal water pumping station standing idle with dry outflow channels and pressure gauge at zero PSI`,
      `macro view of synchronous condenser unit—a giant free-spinning rotor providing pure mechanical inertia to a solar-heavy substation`,
      `3D graphic visualization comparing heavy inertia grid (1990) vs low-inertia inverter grid (2026) under identical load shock`,
      `dramatic view of power system engineering control center with engineers carefully coordinating black start synchronization procedures`,
      `hero card for Act 7: $10B/DAY BLACK START with high-contrast obsidian and acid yellow typography`
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'BLACK START DILEMMA' : beatIndex === 6 ? '$10B DAILY IMPACT' : undefined,
      telemetryLabel: beatIndex === 1 ? 'RESTORATION // COMPLEX' : beatIndex === 6 ? 'ECONOMY // PARALYZED' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  // ATO 08: ORIGINAL THESIS & SYSTEM ARCHITECTURE (8 beats // 45s)
  const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 4) ? 'firefly_video' : 'generated_image_35mm';
  const archetype = (beatIndex === 2 || beatIndex === 5) ? '3D_MAP' : undefined;

  const scripts = [
    `The illusion of the modern power grid is that electricity is an on-demand commodity sitting in an invisible reservoir.`,
    `The physical reality is that the grid has zero storage—it is not a pipeline of fuel, but a live, continent-wide standing wave.`,
    `Every generator, turbine, and appliance across thousands of miles is tethered to a single synchronized rotational dance.`,
    `The sixty point zero zero Hertz hum in your wall is the pulse of the largest mechanical machine in human history.`,
    `A razor-thin margin of zero point five Hertz is all that stands between modern civilization and total, immediate darkness.`,
    `To power our future, we must master the unseen physics of inertia and frequency balance.`,
    `Hidden systems rule the world, and the smartest systems are the ones silently balancing the impossible in every single millisecond.`,
    `This is Hidden Systems Lab.`
  ];

  const prompts = [
    `monumental shot of Planet Earth at night seen from orbit, continents glowing with intricate web of synchronized electric light grids`,
    `3D wireframe visualization of continental power grid showing a single glowing 60.00 Hz sine wave pulsing across the landmass`,
    `macro 35mm view of heavy turbine rotor turning in smooth, luminous motion inside power plant with magnetic aura in Klein Blue`,
    `cinematic close-up of household wall outlet with subtle glowing electric aura and mono-spaced frequency overlay: 60.000 HZ`,
    `split composition: glowing vibrant modern city at night vs deep matte obsidian darkness separated by razor-thin gold line`,
    `macro high-speed photograph of electrical arc terminating smoothly as high-voltage switch achieves perfect phase synchronization`,
    `monumental typography card: HIDDEN SYSTEMS RULE THE WORLD in clean off-white (#F4F4F0) with acid yellow subtitle on matte obsidian (#0D0E15)`,
    `final closing identity card: HIDDEN SYSTEMS LAB // EPISODE 007 // THE 0.5 HERTZ PROBLEM with sleek kinetic spring`
  ];

  return {
    narrativeRole: 'CORE_THESIS',
    visualMode,
    infographicArchetype: archetype,
    graphicHeadline: beatIndex === 1 ? 'ZERO STORAGE MACHINE' : beatIndex === 7 ? 'HIDDEN SYSTEMS LAB' : undefined,
    telemetryLabel: beatIndex === 1 ? 'GRID // STANDING WAVE' : beatIndex === 7 ? 'EPISODE // COMPLETE' : undefined,
    voiceoverScript: scripts[beatIndex % scripts.length],
    promptSubject: prompts[beatIndex % prompts.length]
  };
}

/**
 * Storyboard canonico para o episodio de baixa latencia em Wall Street:
 * "Why Wall Street Drilled Mountains to Save 3 Milliseconds" (96 beats unicos, fisica de propagacao real)
 */
export function getWallStreetLatencyBeatData(actNumber: number, beatIndex: number, input: EpisodeTopicInput): BeatStoryboardData {
  const actRoles: Record<number, HslNarrativeRole[]> = {
    1: ['MONUMENTAL_HOOK', 'KINETIC_FLOW', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'SYSTEMIC_IMPACT', 'CORE_THESIS'],
    2: ['TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'BOUNDARY_LIMIT', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'BOUNDARY_LIMIT', 'CORE_THESIS'],
    3: ['MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'BOUNDARY_LIMIT', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'SYSTEMIC_IMPACT', 'CORE_THESIS'],
    4: ['BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'BOUNDARY_LIMIT', 'TECHNICAL_ANATOMY', 'BOUNDARY_LIMIT', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'SYSTEMIC_IMPACT', 'CORE_THESIS'],
    5: ['BOTTLENECK_CRISIS', 'MATHEMATICAL_MODEL', 'BOUNDARY_LIMIT', 'TECHNICAL_ANATOMY', 'BOTTLENECK_CRISIS', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'BOUNDARY_LIMIT', 'TECHNICAL_ANATOMY', 'BOTTLENECK_CRISIS', 'SYSTEMIC_IMPACT', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'CORE_THESIS'],
    6: ['EMERGENCY_DISPATCH', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'EMERGENCY_DISPATCH', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'SYSTEMIC_IMPACT', 'CORE_THESIS'],
    7: ['SYSTEMIC_IMPACT', 'MATHEMATICAL_MODEL', 'SYSTEMIC_IMPACT', 'TECHNICAL_ANATOMY', 'BOUNDARY_LIMIT', 'SYSTEMIC_IMPACT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'SYSTEMIC_IMPACT', 'CORE_THESIS'],
    8: ['CORE_THESIS', 'MATHEMATICAL_MODEL', 'BOUNDARY_LIMIT', 'TECHNICAL_ANATOMY', 'SYSTEMIC_IMPACT', 'KINETIC_FLOW', 'CORE_THESIS', 'CORE_THESIS']
  };

  const visualModeMap: Record<number, number[]> = {
    1: [0, 1, 5, 9],
    2: [3, 9, 13],
    3: [1, 4, 9, 13],
    4: [0, 5, 10],
    5: [0, 4, 9, 11],
    6: [0, 2, 5, 7],
    7: [0, 5, 8],
    8: [1, 5]
  };

  const archetypeMap: Record<number, Array<BeatStoryboardData['infographicArchetype']>> = {
    1: [undefined, undefined, 'MACRO_HUD', '3D_MAP', 'CUTAWAY', undefined, 'MACRO_HUD', '3D_MAP', 'CUTAWAY', undefined, 'FLIPBOARD', '3D_MAP'],
    2: ['CUTAWAY', '3D_MAP', 'MACRO_HUD', undefined, 'CUTAWAY', '3D_MAP', 'MACRO_HUD', 'MACRO_HUD', 'CUTAWAY', undefined, 'CUTAWAY', '3D_MAP', 'MACRO_HUD', undefined],
    3: ['3D_MAP', undefined, 'MACRO_HUD', 'CUTAWAY', undefined, '3D_MAP', 'MACRO_HUD', 'CUTAWAY', 'MACRO_HUD', undefined, 'CUTAWAY', 'MACRO_HUD', '3D_MAP', undefined, 'FLIPBOARD', '3D_MAP'],
    4: ['MACRO_HUD', '3D_MAP', 'MACRO_HUD', 'CUTAWAY', 'MACRO_HUD', undefined, 'CUTAWAY', 'MACRO_HUD', '3D_MAP', 'CUTAWAY', undefined, 'MACRO_HUD'],
    5: ['FLIPBOARD', '3D_MAP', 'MACRO_HUD', 'CUTAWAY', 'FLIPBOARD', undefined, '3D_MAP', 'MACRO_HUD', 'CUTAWAY', 'FLIPBOARD', 'MACRO_HUD', undefined, '3D_MAP', 'MACRO_HUD'],
    6: [undefined, 'CUTAWAY', undefined, 'MACRO_HUD', '3D_MAP', undefined, 'CUTAWAY', undefined, 'MACRO_HUD', '3D_MAP'],
    7: [undefined, 'FLIPBOARD', 'MACRO_HUD', 'CUTAWAY', 'MACRO_HUD', undefined, '3D_MAP', 'CUTAWAY', undefined, '3D_MAP'],
    8: ['3D_MAP', undefined, 'MACRO_HUD', 'CUTAWAY', 'FLIPBOARD', undefined, '3D_MAP', 'MACRO_HUD']
  };

  const scripts: Record<number, string[]> = {
    1: [
      `To win trades three milliseconds faster, Wall Street financed an eight hundred twenty five mile fiber line cut almost straight through mountains between Chicago and New Jersey.`,
      `The prize was not a better forecast, a smarter analyst, or a secret balance sheet.`,
      `It was a packet arriving before another packet in the matching engine queue.`,
      `At this speed, distance becomes an accounting item measured in meters, microseconds, and lost queue position.`,
      `Chicago futures and New Jersey equities form one invisible machine separated by physical geography.`,
      `A price changes in one data center, and the other market is stale for only a few thousandths of a second.`,
      `That tiny window is large enough for algorithms to see, route, cancel, and reprice before humans perceive anything.`,
      `The old fiber routes followed railroads and roads; the new route obeyed geometry instead.`,
      `Crews bored, trenched, permitted, and blasted because curves in the ground became delays in capital allocation.`,
      `Then microwave towers and atmospheric laser links attacked the cable itself.`,
      `The central question is brutal: when money travels at light speed, who owns the first nanosecond?`,
      `This is the hidden physics engine underneath modern financial markets.`
    ],
    2: [
      `The system begins inside the exchange data center, where trading firms rent racks as close as possible to the matching engine.`,
      `A server cabinet only ten meters nearer to the exchange switch can remove tens of nanoseconds from an order path.`,
      `The matching engine does not ask who understood the market first; it records which message arrived first.`,
      `From there, cross-connect fiber leaves the cage and enters carrier equipment built for minimum hop count.`,
      `Every connector, transceiver, switch, and patch panel adds deterministic latency measured in nanoseconds.`,
      `The Chicago-New Jersey route became a physical arbitrage corridor between futures and cash equities.`,
      `Spread Networks advertised a near-straight dark fiber path to shave roughly one hundred route miles.`,
      `The cable still carried light through glass, and glass slows photons by its refractive index.`,
      `That is why the next generation moved the path into air, using microwave relays on towers.`,
      `Line-of-sight radios turn the landscape into a chain of invisible electromagnetic handoffs.`,
      `Each hop must hit a dish miles away with enough signal-to-noise ratio to survive weather and terrain.`,
      `A perfect route is no longer a telecom map; it is a physics diagram drawn over the curvature of Earth.`,
      `The anatomy is brutally simple: servers, fiber, towers, clocks, and queues.`,
      `The market interface is financial, but the machine itself is electromagnetic.`
    ],
    3: [
      `The math starts with the speed of light: two hundred ninety nine million seven hundred ninety two thousand four hundred fifty eight meters per second in vacuum.`,
      `Inside optical fiber, the signal travels closer to two thirds of that speed because the glass has a higher refractive index.`,
      `In air, microwaves propagate far closer to vacuum speed, losing only a thin atmospheric fraction.`,
      `That difference turns the same geographic route into two different clocks.`,
      `Over eight hundred miles, glass can add milliseconds that the air path does not pay.`,
      `A radio path also avoids the hidden length of roads, rights-of-way, and railroad curves.`,
      `The theoretical minimum is not negotiated by traders; it is set by distance divided by propagation velocity.`,
      `Repeaters, routers, and serialization add delay after physics has already charged the first bill.`,
      `Engineers model every hop as a latency stack: propagation, processing, coding, and switching.`,
      `Microwave towers win when fewer meters and faster medium beat the reliability of buried fiber.`,
      `But radio bandwidth is narrower, alignment is harder, and packets can be damaged by rain fade.`,
      `The fastest path is rarely the safest path; it is the path willing to live closest to failure.`,
      `At nanosecond scale, the length of a single rack cable becomes visible in a trading strategy.`,
      `A signal moves about thirty centimeters per nanosecond in vacuum, less inside real materials.`,
      `This turns finance into relativistic plumbing for prices.`,
      `The invisible product is not information; it is arrival priority.`
    ],
    4: [
      `The hard boundary is that no network can outrun light.`,
      `You can shorten the path, remove equipment, and choose air over glass, but you cannot beat causality.`,
      `Earth curvature forces microwave routes into relay towers rather than one impossible straight beam.`,
      `Each tower must see the next tower across hills, buildings, forests, and changing weather.`,
      `Rain scatters energy, heat bends the refractive layer, and humidity shifts the radio path.`,
      `A route that is fastest on a clear morning can degrade during a storm front.`,
      `Fiber has the opposite personality: slower propagation but enormous bandwidth and weather immunity underground.`,
      `This creates the central engineering tradeoff: fastest possible tick data or most reliable market access.`,
      `When the margin is three milliseconds, a one-millisecond fade event is not noise; it is a strategy failure.`,
      `Precision time protocol, GPS clocks, and packet capture appliances become forensic instruments.`,
      `The boundary condition is not financial regulation; it is the atmosphere.`,
      `Wall Street discovered that weather is a market participant.`
    ],
    5: [
      `The bottleneck is the queue inside the exchange.`,
      `When two identical orders target the same price, price-time priority awards the first arrival.`,
      `If your market data update is late, your quote is now an artifact from the past.`,
      `A faster firm sees the futures move in Chicago and races to update stale quotes in New Jersey.`,
      `The slower firm is not wrong on analysis; it is wrong on time.`,
      `In continuous trading, the market does not clear once per second; it clears every time a message arrives.`,
      `That creates a race condition where identical intelligence produces unequal outcomes.`,
      `Academic work on frequent batch auctions argues the arms race is baked into continuous limit order books.`,
      `The loss can hide in tiny spreads repeated across millions of attempts.`,
      `A few nanoseconds can decide whether an order rests, cancels, or becomes adverse selection.`,
      `The machine rewards the trader who pays for geography, optics, radios, and colocation.`,
      `Capital follows the shortest path like current through copper.`,
      `When the fastest signal wins, mountain permits become trading infrastructure.`,
      `This is the three millisecond problem.`
    ],
    6: [
      `The workaround was to rebuild the map from scratch.`,
      `Fiber builders took the straightest route they could buy, blasting rock where legacy telecom followed easier corridors.`,
      `Microwave builders climbed higher, placing dishes on towers, rooftops, and ridgelines along the great-circle path.`,
      `Some networks explored millimeter wave and free-space optical links for even thinner latency margins.`,
      `Backup routes run in parallel because the fastest path is too fragile to be the only path.`,
      `Systems continuously compare path health, packet loss, round trip time, and jitter.`,
      `If a radio hop fades, traffic fails over to a slower but more stable fiber leg.`,
      `The best network is not one line; it is a portfolio of physical media ranked by time.`,
      `Every cable, antenna, and amplifier becomes a hedge against atmospheric randomness.`,
      `The emergency protocol is simple: sacrifice nanoseconds before you sacrifice market access.`
    ],
    7: [
      `The economic consequence is a market where infrastructure becomes alpha.`,
      `The latest BIS survey measured foreign exchange turnover at nine point six trillion dollars per day in April twenty twenty five.`,
      `Across equities, futures, options, and currencies, tiny timing edges are multiplied by enormous notional flow.`,
      `That does not mean every microsecond creates profit; it means latency becomes a cost input like rent or capital.`,
      `Exchanges monetize proximity through colocation, premium connectivity, and carefully engineered order gateways.`,
      `Firms spend not because cables are beautiful, but because queue position can change expected value.`,
      `Regulators face a paradox: speed can tighten spreads while also creating expensive arms races.`,
      `Investors see one price on a screen, but underneath it are antennas racing across terrain.`,
      `The market looks digital only because the physical layer is hidden.`,
      `Modern finance is a planetary timing system disguised as a price system.`
    ],
    8: [
      `The popular myth is that Wall Street is ruled by insight.`,
      `The hidden system shows something colder: at the frontier, markets are also ruled by propagation delay.`,
      `A trade can fail because a photon crossed glass instead of air.`,
      `A mountain can matter because it adds meters to a fiber route.`,
      `A storm can matter because it bends a microwave path by just enough to move a message behind another message.`,
      `The fastest analyst in the room is irrelevant if the packet arrives late.`,
      `Hidden systems rule the world, and in finance, the hidden system is the geometry of light.`,
      `This is Hidden Systems Lab.`
    ]
  };

  const prompts: Record<number, string[]> = {
    1: [
      `night aerial view of Wall Street trading corridor transformed into glowing acid yellow latency beam stretching toward Chicago, dense financial skyline, obsidian matte atmosphere`,
      `macro cinematic shot of silent algorithmic trading server rack with fiber jumpers glowing blue and yellow, no humans visible`,
      `exchange matching engine queue visualized as nanoscale packets entering a luminous gate in exact timestamp order`,
      `3D map from Chicago to Carteret New Jersey with two routes, legacy curved railroad path versus near-straight tunnel route`,
      `underground mountain boring machine cutting a clean straight fiber trench through Appalachian rock, laser survey line glowing acid yellow`,
      `futures price tick erupting in Chicago data center while New Jersey quote board remains stale for three milliseconds`,
      `macro stopwatch HUD measuring 3.000 milliseconds beside packet traces and nanosecond timestamp stamps`,
      `isometric terrain model showing old telecom rights-of-way bending around hills while straight dark fiber slices across them`,
      `construction crew pulling armored fiber conduit through blasted rock trench under cold industrial lighting`,
      `microwave relay towers in morning fog, narrow yellow beam crossing ridgelines toward the camera`,
      `financial heatmap collapsing from green to hyper orange as stale quotes are lifted across venues`,
      `hero architecture diagram showing finance, fiber, microwave, atmosphere, and light speed as one hidden machine`
    ],
    2: [
      `exchange colocation hall with numbered cages, one rack highlighted closest to matching engine cabinet, dark documentary lighting`,
      `macro measuring tape stretched between server racks with nanosecond distance markers over fiber patch cords`,
      `close view of matching engine timestamp ledger awarding first queue position to one luminous packet`,
      `low-angle shot of cross-connect fiber leaving a trader cage toward carrier meet-me room`,
      `exploded diagram of SFP transceiver, switch ASIC, fiber connector, and patch panel with nanosecond latency labels`,
      `3D corridor map linking Chicago futures exchange to Nasdaq-style New Jersey data center with price arrows`,
      `documentary map of near-straight dark fiber route shaving one hundred miles from older paths`,
      `physics cutaway of photons slowing inside glass core with refractive index overlay n equals 1.5`,
      `rooftop microwave dish aligned toward distant horizon with tiny packet trail crossing open air`,
      `chain of relay towers stepping across rural hills under cold dawn haze`,
      `close-up of parabolic dish bolts, waveguide flange, and low-noise amplifier under rain droplets`,
      `curved Earth line-of-sight diagram with relay towers and Fresnel zone clearance in yellow`,
      `technical still life of GPS disciplined clock, packet capture appliance, and time sync oscillator`,
      `wide shot of empty trading floor reflected in glass while server LEDs do all the work`
    ],
    3: [
      `monumental physics card showing c = 299792458 m/s with laser line crossing black background`,
      `fiber optic glass core macro with photons dragging through blue medium at roughly two thirds light speed`,
      `microwave beam traveling through open air above farmland with speed label near vacuum propagation`,
      `split comparison clock showing same distance through fiber and air arriving milliseconds apart`,
      `long continental route diagram where extra buried cable length accumulates into latency debt`,
      `aerial view of railroad corridor curving around mountains while yellow great-circle line cuts straight`,
      `minimal equation board latency equals distance divided by velocity plus equipment delay`,
      `router pipeline cutaway showing serialization, switching, and processing nanosecond stages`,
      `stacked latency waterfall chart: propagation, radio hop, switch, codec, exchange gateway`,
      `microwave tower pair across valley with narrow high-frequency link and visible Fresnel clearance bubble`,
      `storm rain fade simulation scattering radio signal into hyper orange warning particles`,
      `fragile fastest path diagram beside robust buried fiber backup lane`,
      `macro patch cable coiled on server tray with length converted into nanosecond delay labels`,
      `30 centimeter ruler glowing beside packet waveform to show one nanosecond of vacuum travel`,
      `financial price packets moving like liquid through transparent relativistic pipe`,
      `arrival priority scoreboard where earlier packet locks the quote before slower packets appear`
    ],
    4: [
      `hard physical wall labeled SPEED OF LIGHT with trading packets striking an invisible boundary`,
      `network engineer removing every extra hop from route diagram while causality line remains fixed`,
      `Earth curvature visualization preventing one straight microwave beam across the continent`,
      `tower line-of-sight survey over mountains, forests, and city rooftops with yellow Fresnel tunnel`,
      `rain, heat shimmer, and humidity layers bending radio path above rural relay site`,
      `clear morning microwave alignment changing into storm front degradation with telemetry overlay`,
      `buried fiber conduit glowing slower but stable under highway while storm rages above`,
      `split screen fastest tick data path versus reliable backup market access path`,
      `latency monitor flashing one millisecond jitter spike beside failed arbitrage order`,
      `PTP grandmaster clock, GPS antenna, and packet forensic display timestamping every order`,
      `storm radar overlay merged with market data latency map across the Chicago-New Jersey corridor`,
      `dramatic Wall Street skyline under rain with invisible wireless routes glowing above buildings`
    ],
    5: [
      `macro exchange queue gate where two identical orders race toward same price level`,
      `limit order book depth ladder with one packet highlighted as first by nanoseconds`,
      `stale market data pane freezing while newer Chicago futures price flashes ahead`,
      `fast algorithm routing cancel replace message from Chicago signal to New Jersey equity quote`,
      `slow firm console showing correct model but late timestamp in red`,
      `continuous limit order book visualized as endless stream of arriving messages rather than periodic auction`,
      `race condition diagram with identical forecasts but unequal physical arrival times`,
      `batch auction concept card freezing orders into discrete time slices against continuous race background`,
      `micro spread accumulation meter multiplying tiny losses across millions of events`,
      `order lifecycle dashboard: rest, cancel, adverse selection, fill, all separated by nanoseconds`,
      `capital expense board listing colocation, microwave, dark fiber, and exchange gateway fees`,
      `electric current style animation showing capital flowing down shortest latency path`,
      `mountain permit document stamped APPROVED beside fiber route engineering drawings`,
      `hero title frame reading THE 3 MILLISECOND PROBLEM over glowing market infrastructure`
    ],
    6: [
      `engineers rebuilding route map from blank black screen using straight yellow geodesic line`,
      `rock blasting and trenching operation beside fiber conduit reel, survey laser perfectly straight`,
      `crew installing microwave dish on high tower at sunrise with distant ridgeline target`,
      `free-space optical laser terminal on rooftop sending narrow yellow beam through cold night air`,
      `network operations dashboard showing fastest path and backup path running in parallel`,
      `telemetry panel comparing packet loss, RTT, jitter, and signal-to-noise ratio in real time`,
      `automatic failover animation moving traffic from fading radio hop to buried fiber line`,
      `portfolio of physical media: fiber, microwave, millimeter wave, and laser ranked by latency`,
      `antenna amplifier cabinet with redundant power supplies and environmental sensors`,
      `emergency rule card: lose nanoseconds, keep market access, restore route health`
    ],
    7: [
      `global financial infrastructure map where latency routes glow like arterial circuits between exchanges`,
      `BIS style turnover counter showing $9.6 TRILLION PER DAY in precise monospaced typography`,
      `multi-asset market screens for FX, futures, options, and equities pulsing with enormous notional flow`,
      `latency cost ledger treating microseconds like rent, capital, and exchange fees`,
      `exchange colocation product board with premium cross-connects and order gateway tiers`,
      `firm budget room showing microwave tower leases and fiber contracts replacing analyst headcount`,
      `regulatory scale balancing tighter spreads against costly infrastructure arms race`,
      `consumer price chart floating above hidden antennas racing across rural terrain`,
      `physical layer reveal peeling back digital price screen to expose fiber and microwave infrastructure`,
      `planetary timing system diagram disguised as a clean market price display`
    ],
    8: [
      `classic analyst desk dissolving into server room full of synchronized lights`,
      `propagation delay diagram ruling over market map with packets arranged by arrival time`,
      `photon choosing glass path versus air path, slower route highlighted in hyper orange`,
      `mountain cross-section adding physical meters to buried fiber path and timestamp penalty`,
      `storm cell bending microwave link just enough to reorder packets`,
      `empty boardroom with fastest human analyst silhouetted behind late packet trace`,
      `global geometry of light diagram connecting exchanges, towers, fiber, atmosphere, and capital`,
      `final Hidden Systems Lab identity card over acid yellow beam entering obsidian vanishing point`
    ]
  };

  const headlines: Record<number, string[]> = {
    1: ['3 MILLISECONDS', 'NO ANALYSTS', 'QUEUE WINS', 'STRAIGHT LINE', 'DRILLED ROCK', 'STALE PRICE', 'NANOSECOND WINDOW', 'GEOMETRY TRADE', 'DARK FIBER', 'AIR BEATS GLASS', '$50M DELAY', 'LIGHT SPEED MARKET'],
    2: ['COLOCATION', '10 METERS', 'FIRST PACKET', 'CROSS CONNECT', 'LATENCY STACK', 'CHICAGO TO JERSEY', '825 MILES', 'GLASS SLOWS LIGHT', 'MICROWAVE ROUTE', 'LINE OF SIGHT', 'RAIN FADE', 'EARTH CURVATURE', 'CLOCK TRACE', 'ELECTROMAGNETIC MARKET'],
    3: ['SPEED OF LIGHT', 'C/1.5', 'AIR PATH', 'TWO CLOCKS', 'LATENCY DEBT', 'SHORTEST PATH', 'D/V LIMIT', 'EQUIPMENT TAX', 'HOP STACK', 'TOWER WINS', 'WEATHER LOSS', 'EDGE OF FAILURE', 'CABLE LENGTH', '1 NANOSECOND', 'PRICE PLUMBING', 'ARRIVAL PRIORITY'],
    4: ['LIGHT LIMIT', 'NO OUTRUNNING', 'CURVED EARTH', 'FRESNEL ZONE', 'ATMOSPHERE TAX', 'STORM FRONT', 'FIBER BACKUP', 'FAST VS SAFE', 'JITTER KILLS', 'TIME FORENSICS', 'WEATHER TRADER', 'PHYSICAL BOUNDARY'],
    5: ['THE QUEUE', 'PRICE TIME', 'STALE QUOTE', 'CANCEL RACE', 'RIGHT BUT LATE', 'CONTINUOUS MARKET', 'RACE CONDITION', 'BATCH AUCTION', 'TINY SPREADS', 'ADVERSE SELECTION', 'INFRASTRUCTURE ALPHA', 'CAPITAL FOLLOWS TIME', 'PERMIT ALPHA', '3MS PROBLEM'],
    6: ['REBUILD THE MAP', 'BLAST ROCK', 'CLIMB HIGHER', 'LASER AIR PATH', 'PARALLEL ROUTES', 'PATH HEALTH', 'FAILOVER', 'MEDIA PORTFOLIO', 'REDUNDANT EDGE', 'SACRIFICE NANOSECONDS'],
    7: ['INFRASTRUCTURE ALPHA', '$9.6T/DAY', 'NOTIONAL FLOW', 'LATENCY COST', 'PROXIMITY RENT', 'QUEUE VALUE', 'REGULATORY PARADOX', 'HIDDEN ANTENNAS', 'PHYSICAL LAYER', 'TIMING SYSTEM'],
    8: ['INSIGHT MYTH', 'PROPAGATION DELAY', 'GLASS VS AIR', 'MOUNTAIN METERS', 'STORM JITTER', 'HUMAN TOO SLOW', 'GEOMETRY OF LIGHT', 'HIDDEN SYSTEMS LAB']
  };

  const telemetry: Record<number, string[]> = {
    1: ['ROUTE // 825 MILES', 'EDGE // ZERO HUMANS', 'QUEUE // FIRST ARRIVAL', 'DELTA // 3.0 MS', 'CAPEX // $300M', 'WINDOW // STALE MARKET', 'LATENCY // NS SCALE', 'PATH // NEAR STRAIGHT', 'MEDIUM // FIBER', 'MEDIUM // AIR', 'LOSS // TENS OF MILLIONS', 'THESIS // PHYSICS OF CAPITAL'],
    2: ['RACK // COLOCATED', 'DISTANCE // 10M MATTERS', 'MATCH // PRICE TIME', 'PATCH // CROSS CONNECT', 'ASIC // NANOSECONDS', 'ARBITRAGE // CME-NJ', 'SAVINGS // 100 MILES', 'INDEX // N=1.5', 'RADIO // LINE OF SIGHT', 'HOPS // RELAY CHAIN', 'SNR // WEATHER LIMITED', 'EARTH // CURVED', 'CLOCK // PTP/GPS', 'SYSTEM // ELECTROMAGNETIC'],
    3: ['C // 299792458 M/S', 'FIBER // ~67% C', 'AIR // ~99.97% C', 'DELTA // MILLISECONDS', 'ROUTE // LENGTH TAX', 'GEOMETRY // GREAT CIRCLE', 'FORMULA // D/V', 'STACK // DEVICE DELAY', 'WATERFALL // HOPS', 'RADIO // LOW LATENCY', 'RAIN // FADE RISK', 'RISK // FASTEST PATH', 'CABLE // NS/METER', 'SCALE // 30CM/NS', 'FLOW // PRICE PACKETS', 'PRODUCT // PRIORITY'],
    4: ['BOUNDARY // CAUSALITY', 'OPTIMIZE // NOT ESCAPE', 'HORIZON // RELAY REQUIRED', 'CLEARANCE // FRESNEL', 'REFRACTION // ATMOSPHERE', 'WEATHER // VARIABLE', 'FIBER // STABLE', 'TRADEOFF // SPEED/RELIABILITY', 'JITTER // 1MS', 'FORENSICS // TIMESTAMPED', 'MARKET // WEATHER COUPLED', 'LIMIT // PHYSICAL'],
    5: ['BOOK // FIFO', 'PRIORITY // TIME', 'DATA // STALE', 'ORDER // CANCEL/REPLACE', 'MODEL // LATE', 'MARKET // CONTINUOUS', 'OUTCOME // UNEQUAL', 'DESIGN // BATCHED TIME', 'SPREAD // MULTIPLIED', 'FILL // ADVERSE', 'ALPHA // INFRASTRUCTURE', 'CAPITAL // SHORTEST PATH', 'PERMITS // TRADING EDGE', 'PROBLEM // 3MS'],
    6: ['PLAN // CLEAN ROUTE', 'FIBER // STRAIGHTENED', 'TOWER // RIDGELINE', 'OPTICAL // FREE SPACE', 'ROUTES // PARALLEL', 'METRICS // LOSS/JITTER', 'BACKUP // FIBER LEG', 'MEDIA // RANKED', 'EDGE // REDUNDANT', 'POLICY // STAY CONNECTED'],
    7: ['ALPHA // PHYSICAL', 'FX // APRIL 2025', 'FLOW // MULTI-ASSET', 'COST // MICROSECONDS', 'EXCHANGE // PREMIUM ACCESS', 'VALUE // QUEUE POSITION', 'POLICY // PARADOX', 'SCREEN // ONLY SURFACE', 'LAYER // EXPOSED', 'SYSTEM // TIMING'],
    8: ['MYTH // INSIGHT', 'REALITY // DELAY', 'MEDIUM // MATTERS', 'DISTANCE // MATTERS', 'WEATHER // MATTERS', 'HUMAN // OUTRUN', 'THESIS // GEOMETRY', 'EPISODE // COMPLETE']
  };

  const roles = actRoles[actNumber] || actRoles[8];
  const scriptList = scripts[actNumber] || scripts[8];
  const promptList = prompts[actNumber] || prompts[8];
  const headlineList = headlines[actNumber] || headlines[8];
  const telemetryList = telemetry[actNumber] || telemetry[8];

  return {
    narrativeRole: roles[beatIndex % roles.length],
    visualMode: (visualModeMap[actNumber] || []).includes(beatIndex) ? 'firefly_video' : 'generated_image_35mm',
    infographicArchetype: (archetypeMap[actNumber] || [])[beatIndex],
    graphicHeadline: headlineList[beatIndex % headlineList.length],
    telemetryLabel: telemetryList[beatIndex % telemetryList.length],
    voiceoverScript: scriptList[beatIndex % scriptList.length],
    promptSubject: promptList[beatIndex % promptList.length]
  };
}

/**
 * Storyboard canônico para o Episódio 010: Síndrome de Kessler e Lixo Espacial:
 * "THE 28,000 KM/H PAINT FLECK THAT CAN DESTROY THE INTERNET IN 72 HOURS" (100% inaudito, 96 beats calibrados)
 */
export function getKesslerBeatData(actNumber: number, beatIndex: number, input: EpisodeTopicInput): BeatStoryboardData {
  if (actNumber === 1) {
    // ATO 01: THE HOOK & THE VISIBLE MIRACLE (12 beats // 75s)
    const roles: HslNarrativeRole[] = [
      'MONUMENTAL_HOOK', 'KINETIC_FLOW', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH',
      'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'CORE_THESIS'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 1 || beatIndex === 2 || beatIndex === 5 || beatIndex === 6 || beatIndex === 7 || beatIndex === 11) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 3) ? 'MACRO_HUD' : (beatIndex === 4 || beatIndex === 10) ? 'CUTAWAY' : (beatIndex === 9) ? '3D_MAP' : beatIndex === 8 ? 'FLIPBOARD' : undefined;

    const scripts = [
      `At seven point eight kilometers per second, the quietest place on Earth is also the most violent firing range in human history.`,
      `Over ten thousand active satellites orbit Earth, powering global finance, flight navigation, and instant communication.`,
      `Yet flying among them are over thirty-five thousand tracked fragments of space debris travelling ten times faster than a sniper bullet.`,
      `A single one-centimeter fleck of peeled paint carries the kinetic energy of an exploding military hand grenade.`,
      `In the hard vacuum of low Earth orbit, there is no atmospheric drag to slow debris down; momentum is preserved for centuries.`,
      `Every single day, active communication satellites must perform autonomous thruster burns to dodge high-velocity debris.`,
      `The visible miracle is instant high-speed internet anywhere on Earth; the hidden reality is a congested supersonic minefield.`,
      `A single unpredicted collision between two dead satellites can trigger an unstoppable cascade of kinetic shrapnel.`,
      `This is the Kessler Syndrome: the mathematical tipping point where orbital debris multiplies exponentially on its own.`,
      `If critical spatial density is crossed, low Earth orbit becomes an impenetrable shield of shrapnel for hundreds of years.`,
      `Modern civilization would instantly lose global GPS synchronization, maritime tracking, and weather forecasting.`,
      `This is the physics of hypervelocity orbital mechanics and the invisible threshold that protects our digital world.`
    ];

    const prompts = [
      `cinematic 35mm wide shot of Earth curve from low orbit with glowing acid yellow (#FFE500) satellite trajectories and fast moving debris particles, dark matte obsidian cosmos`,
      `photorealistic view of high-tech solar paneled communication satellite gliding smoothly over illuminated continents at night`,
      `macro 35mm view of a jagged metallic space debris fragment spinning through black space with glowing sunlight reflection`,
      `3D HUD graphic showing 1cm paint fleck with kinetic energy vector calculation E=1/2mv^2 and red warning telemetry`,
      `extreme wide orbital perspective showing thin blue atmospheric glow and hundreds of satellite orbital plane rings around Earth`,
      `close-up of satellite chemical thruster nozzle firing a short blue plasma pulse in zero gravity to alter trajectory`,
      `dramatic split view: glowing digital cities below connected by invisible data beams vs congested orbital swarm above`,
      `cinematic recreation of two satellite orbital paths intersecting at 90 degrees with glowing orange proximity warning bubbles`,
      `3D exponential curve diagram showing Kessler debris density runaway formula over dark starry space background`,
      `high-angle shot of space debris swarm forming a dense glowing shell around low Earth orbit altitude zones`,
      `conceptual view of Earth globe going dark as communications links and GPS vectors dissolve into red alert lines`,
      `hero cinematic shot of satellite solar array reflecting bright sunlight against deep black space with Hidden Systems Lab telemetry`
    ];

    const headlines = [
      '28,000 KM/H', '10,000 SATELLITES', '35,000 DEBRIS', '1CM GRENADE',
      'ZERO DRAG', 'DAILY DODGE', 'VISIBLE MIRACLE', 'CASCADE RISK',
      'KESSLER LIMIT', 'IMPOSSIBLE ORBIT', 'GLOBAL BLACKOUT', 'ORBITAL PHYSICS'
    ];

    const telemetry = [
      'VELOCITY // 7.8 KM/S', 'CONSTELLATION // LEO', 'TRACKED // SSN RADAR', 'ENERGY // 1/2 MV^2',
      'ALTITUDE // 550 KM', 'BURN // 4.2 CM/S DV', 'FLOW // 100 PB/DAY', 'PROBABILITY // 1E-4',
      'DENSITY // CRITICAL', 'DEBRIS // RUNAWAY', 'GPS // 31 SATELLITES', 'THESIS // VACUUM COMMONS'
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 2) {
    // ATO 02: THE PHYSICAL ANATOMY & LAYER BREAKDOWN (14 beats // 90s)
    const roles: HslNarrativeRole[] = [
      'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY',
      'KINETIC_FLOW', 'BOUNDARY_LIMIT', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW',
      'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'BOUNDARY_LIMIT',
      'TECHNICAL_ANATOMY', 'CORE_THESIS'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 4 || beatIndex === 7 || beatIndex === 10) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 6 || beatIndex === 12) ? 'CUTAWAY' : (beatIndex === 2 || beatIndex === 8) ? '3D_MAP' : undefined;

    const scripts = [
      `Low Earth orbit is not an empty expanse; it is a structured shell divided into critical altitude bands from three hundred to one thousand two hundred kilometers.`,
      `At five hundred and fifty kilometers, commercial mega-constellations operate in tightly spaced orbital planes.`,
      `Satellites complete one full revolution around the planet every ninety minutes, crossing the equator at twenty-eight thousand kilometers per hour.`,
      `Because orbital planes are inclined at different angles—some polar, some equatorial—trajectories intersect at near-right angles.`,
      `At ninety degrees inclination difference, the relative closing velocity between two intersecting objects reaches eleven point three kilometers per second.`,
      `At this speed, human reaction time is completely useless; two objects close a ten-kilometer gap in under eight hundred milliseconds.`,
      `The United States Space Surveillance Network uses ground-based phased-array radar and optical telescopes to track thirty-five thousand objects larger than ten centimeters.`,
      `Radar pulses from sites like Eglin Air Force Base bounce off tumbling rocket bodies and abandoned cold-war satellites.`,
      `However, over one million lethal fragments between one and ten centimeters remain completely untrackable by terrestrial radar.`,
      `These dark projectiles drift silently through the orbital corridors, invisible to satellite navigation systems until impact.`,
      `A modern satellite consists of thin aluminum honeycomb panels, delicate solar cells, and high-pressure hydrazine fuel tanks.`,
      `Against a hypervelocity projectile, the aerospace-grade hull offers no more resistance than paper.`,
      `Propellant tanks under three hundred PSI represent stored chemical and pneumatic potential energy waiting for a kinetic trigger.`,
      `When an orbital shell is populated with ten thousand active nodes, the probability of spatial conjunction grows with the square of the satellite count.`
    ];

    const prompts = [
      `3D isometric cutaway of Earth atmosphere and low Earth orbit showing altitude bands from 300km to 1200km with glowing color tiers`,
      `orbital perspective view of Starlink-style satellite train moving in precise geometric line across dawn twilight horizon`,
      `digital chronometer diagram showing 90-minute orbital period clock with Earth rotating underneath`,
      `3D vector map of intersecting orbital planes showing polar and sun-synchronous orbits crossing like woven cage wires`,
      `high-speed physics diagram of two vector arrows closing at 11.3 km/s with kinetic shockcone overlay`,
      `macro digital stopwatch frozen at 800 milliseconds with collision distance counter reaching zero`,
      `wide view of massive ground-based phased-array radar installation pointing into starry night sky with glowing radio beam`,
      `radar screen telemetry display with 35,000 tracked orbital object dots rendered in acid yellow (#FFE500) and cyan`,
      `macro dark shot of space showing tiny invisible 2cm sharp metal shrapnel tumbling past camera with Earth blurred in background`,
      `3D visualization of one million untracked micro-debris cloud orbiting Earth as faint glowing mist`,
      `detailed structural cutaway of communication satellite showing honeycomb composite bus, momentum wheels, and central propellant tank`,
      `macro laboratory ballistic test shot of satellite aluminum panel pierced by hypervelocity projectile with petaled exit hole`,
      `macro cutaway of titanium propellant tank with pressure transducer reading 300 PSI under zero gravity`,
      `3D network graph showing quadratic growth of intersection nodes as satellite population scales from 1,000 to 10,000`
    ];

    const headlines = [
      'LEO SHELL', '550 KM BELT', '90 MIN REVOLUTION', 'CROSSING PLANES',
      '11.3 KM/S CLOSING', '800MS WINDOW', 'RADAR NETWORK', '35,000 OBJECTS',
      '1,000,000 UNTRACKED', 'DARK PROJECTILES', 'HONEYCOMB HULL', 'ZERO DEFENSE',
      '300 PSI POTENTIAL', 'QUADRATIC RISK'
    ];

    const telemetry = [
      'ALTITUDE // 300-1200KM', 'PLANE // INCLINATION 53°', 'PERIOD // 5400 SECONDS', 'VEC // 90° INTERSECT',
      'V-REL // 11,300 M/S', 'TIME // 0.8 SECONDS', 'SENSOR // SPACE FENCE', 'CATALOG // SSN DB',
      'SIZE // 1-10 CM', 'STEALTH // UNCATALOGED', 'MASS // 800 KG BUS', 'LIMIT // 0.5MM SKIN',
      'TANK // 300 PSI TITANIUM', 'SCALING // N*(N-1)/2 NODES'
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 3) {
    // ATO 03: THE FLOW DYNAMICS & THROUGHPUT MATH (16 beats // 105s)
    const role: HslNarrativeRole = 'MATHEMATICAL_MODEL';
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 2 || beatIndex === 7 || beatIndex === 11 || beatIndex === 14) ? '3D_MAP' : undefined;

    const scripts = [
      `The physics of hypervelocity collisions obeys laws fundamentally different from everyday mechanics.`,
      `Kinetic energy scales with the square of velocity: E sub k equals one half m v squared.`,
      `Because orbital velocity is ten times greater than rifle muzzle speed, the kinetic energy multiplier is one hundred times higher.`,
      `A one-gram aluminum sphere travelling at ten kilometers per second carries fifty kilojoules of pure kinetic energy.`,
      `Upon impact, the material compressive stress exceeds the ultimate tensile strength of any known solid material by three orders of magnitude.`,
      `Under gigapascal shock pressures, the projectile and the target wall immediately undergo hydrodynamic phase change.`,
      `The solid aluminum projectile does not merely punch a hole; it vaporizes into an expanding cone of liquid metal droplets and ionized plasma.`,
      `This high-temperature plasma jet expands at three kilometers per second inside the satellite interior.`,
      `The internal blast wave pulverizes circuit boards, severs wire harnesses, and ruptures pressurized propellant lines.`,
      `If a titanium propellant tank containing hydrazine at three hundred PSI is struck, catastrophic explosive overpressure disintegrates the entire spacecraft.`,
      `A single eight-hundred-kilogram satellite is instantly converted into over four thousand trackable fragments and three hundred thousand lethal micro-shrapnel.`,
      `Each of these newborn fragments inherits the parent satellite velocity plus the explosive blast delta-v.`,
      `This spreads the new debris across dozens of distinct orbital planes within a few weeks.`,
      `Every single collision multiplies the total cross-sectional hazard area of low Earth orbit by hundreds of square meters.`,
      `Shock pressures reaching one hundred and twenty Gigapascals instantly overcome atomic binding lattices, turning crystalline metals into amorphous fluid jets.`,
      `This transformation happens in less than three microseconds, far too rapid for mechanical stress relief to take place.`
    ];

    const prompts = [
      `3D mathematical equation board showing E=1/2mv^2 and Hugoniot jump equations glowing over dark orbital simulation`,
      `velocity vector comparison diagram showing rifle bullet (800 m/s) vs orbital debris (8,000 m/s) with 100x kinetic scale`,
      `macro high-speed flash photograph of 1-gram metal sphere entering frame at hypervelocity`,
      `finite element simulation of shock wave propagating through aluminum plate under 100 Gigapascals pressure`,
      `3D visualization of hydrodynamic phase change: solid metal projectile turning into glowing molten liquid droplets upon impact`,
      `extreme close-up of conical plasma spray expanding at 3 km/s through interior structural bulkhead`,
      `macro cross-section of satellite electronics bay shattered by shock wave and molten metal debris spray`,
      `high-speed simulation of pressurized titanium hydrazine tank bursting under hypervelocity penetration with fiery rupture`,
      `explosive fragmentation visualization showing 800kg satellite bursting into thousands of glowing trajectory particles`,
      `3D orbital propagation map showing debris cloud stretching from tight sphere into long elliptical ribbon along orbit`,
      `wide orbital view of Earth with debris ribbon spreading into a complete spherical shell over 30 days`,
      `telemetry chart measuring total cross-sectional area growth in square meters following a major orbital fragmentation event`,
      `macro view of scarred multi-layer insulation blanket peppered with micro-meteoroid and debris craters`,
      `hero shot of glowing debris cloud drifting past Earth terminator line with analytical trajectory lines`,
      `molecular dynamics simulation showing aluminum crystal lattice collapsing into molten fluid state under 120 GPa shock`,
      `high-speed digital oscilloscope trace capturing 3-microsecond shock wave duration across satellite bulkhead`
    ];

    const headlines = [
      'HYPERVELOCITY', 'V^2 MULTIPLIER', '100X ENERGY', '50 KILOJOULES',
      'GIGAPASCAL SHOCK', 'PLASMA JET', 'HYDRODYNAMIC', 'INTERNAL BLAST',
      'TANK RUPTURE', '4,000 FRAGMENTS', 'CLOUD EXPANSION', 'ORBITAL SPREAD',
      'CROSS SECTION', 'HAZARD GROWTH', 'LATTICE COLLAPSE', '3 MICROSECONDS'
    ];

    const telemetry = [
      'PHYSICS // HUGONIOT', 'VELOCITY // 8,000 M/S', 'RATIO // 100:1 ENERGETIC', 'MASS // 1.0 GRAM',
      'PRESSURE // 120 GPA', 'PHASE // LIQUID-PLASMA', 'SPEED // 3,000 M/S JET', 'DAMAGE // TOTAL COMPONENT',
      'PROPELLANT // 300 PSI N2H4', 'COUNT // 4,200 PIECES', 'TIME // 30 DAYS ORBIT', 'SPAN // 45° INCLINATION',
      'AREA // +850 M^2', 'METRIC // COLLISION RISK', 'LATTICE // 120 GPA COLLAPSE', 'TIME // 3.0 MICROSECONDS'
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 4) {
    // ATO 04: THE PHYSICAL LIMIT & BOUNDARY CONDITION (12 beats // 75s)
    const role: HslNarrativeRole = 'BOUNDARY_LIMIT';
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 6) ? 'FLIPBOARD' : (beatIndex === 4 || beatIndex === 8 || beatIndex === 11) ? 'MACRO_HUD' : undefined;

    const scripts = [
      `In 1978, NASA astrophysicist Donald J. Kessler published a mathematical proof that shocked the aerospace industry.`,
      `He demonstrated that as the number of artificial satellites increases, collision rates will eventually exceed natural atmospheric cleansing.`,
      `In orbits below four hundred kilometers, residual atmospheric molecules exert aerodynamic drag, pulling debris down to burn up in twenty-four months.`,
      `Above seven hundred kilometers, the atmosphere is virtually non-existent; orbital decay takes over one thousand years.`,
      `Kessler calculated the Critical Spatial Density threshold: the exact number of objects per cubic kilometer where collisions generate more debris than drag removes.`,
      `Once this critical threshold is breached, collisions become self-sustaining.`,
      `Even if humanity ceases all rocket launches permanently, the debris population will continue to grow exponentially on its own through random impacts.`,
      `Every collision creates thousands of new bullets, which hit other satellites, creating millions of secondary projectiles.`,
      `This positive feedback loop accelerates until the entire altitude band reaches collisional saturation.`,
      `The boundary condition of space exploration is not rocket thrust; it is the mathematical carrying capacity of orbital geometry.`,
      `Even solar activity cycles, which temporarily heat and expand the upper thermosphere, provide only temporary cleansing relief for orbits below six hundred kilometers.`,
      `Once the generation rate outpaces the atmospheric removal rate at eight hundred kilometers, the orbital equilibrium is broken permanently.`
    ];

    const prompts = [
      `archival style portrait overlay of Donald Kessler beside 1978 NASA technical memorandum equations and satellite diagrams`,
      `3D Earth atmosphere cross-section showing aerodynamic drag line at 400km vs zero drag decay zone at 800km`,
      `visualization of atmospheric burnup streak glowing yellow and orange as debris re-enters upper thermosphere`,
      `orbital lifetime graph comparing altitude vs decay years: 400km (2 years) vs 800km (1,200 years) on dark graph`,
      `3D critical spatial density formula card showing Dc threshold with red alert zone indicator`,
      `abstract kinetic physics visualization of positive feedback loop where one particle creates four, four create sixteen`,
      `simulation timeline showing orbital debris population curve rising exponentially from year 2025 to 2100 with zero new launches`,
      `chaotic orbital simulation showing multiple intersecting collisions happening simultaneously in a dense altitude shell`,
      `panoramic view of Earth surrounded by a thick shimmering cloud of gray debris particles blocking orbital escape routes`,
      `hero conceptual graphic: Earth encased inside a metallic birdcage representing the geometric boundary limit of orbital flight`,
      `3D solar flare coronal mass ejection visualization heating Earth thermosphere and expanding upper atmospheric density layer`,
      `split chart showing solar maximum atmospheric drag expansion vs irreversible debris generation rate at 800km`
    ];

    const headlines = [
      'KESSLER 1978', 'CLEANSING LIMIT', 'ATMOSPHERIC DRAG', '1,000 YEAR DECAY',
      'CRITICAL DENSITY', 'SELF SUSTAINING', 'ZERO LAUNCHES', 'EXPONENTIAL LOOP',
      'SATURATION', 'GEOMETRY LIMIT', 'SOLAR MAXIMUM', 'BROKEN EQUILIBRIUM'
    ];

    const telemetry = [
      'PAPER // NASA TM-78152', 'RATE // GENERATION > DECAY', 'DRAG // 400 KM ACTIVE', 'TAU // 1200 YEARS',
      'DENSITY // D_CRIT EXCEEDED', 'MODE // AUTOCATALYTIC', 'SCENARIO // ZERO INJECTION', 'GROWTH // EXPONENTIAL',
      'SHELL // 700-900 KM', 'BOUNDARY // ORBITAL CAPACITY', 'SOLAR // UV EXPANSION', 'EQUILIBRIUM // BROKEN AT 800KM'
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 5) {
    // ATO 05: THE BOTTLENECK & STRAIN BREAKDOWN (14 beats // 90s)
    const role: HslNarrativeRole = 'EMERGENCY_DISPATCH';
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 6 || beatIndex === 10) ? '3D_MAP' : undefined;

    const scripts = [
      `On February 10, 2009, at precisely 16:56 Universal Time, theoretical mathematics became physical catastrophe.`,
      `Seven hundred and ninety kilometers above northern Siberia, active commercial satellite Iridium 33 intersected the dead military satellite Cosmos 2251.`,
      `Cosmos 2251 was a nine-hundred-kilogram derelict Russian Strela satellite launched in 1993, completely powerless and unguided.`,
      `Iridium 33 was a six-hundred-kilogram operational relay providing satellite phone and data coverage.`,
      `The two spacecraft approached each other at a relative velocity of eleven point seven kilometers per second—over forty-two thousand kilometers per hour.`,
      `There was no warning; neither satellite carried proximity collision radar capable of triggering an autonomous evasion burn.`,
      `The physical impact occurred in less than one millisecond, releasing kinetic energy equivalent to four tons of TNT.`,
      `Both spacecraft were instantly obliterated, shattering into more than two thousand trackable metal chunks larger than ten centimeters.`,
      `Hundreds of thousands of smaller, untrackable razor-sharp shards sprayed across the seven-hundred-to-nine-hundred kilometer altitude band.`,
      `Within six months, the debris cloud formed an elliptical belt that intersected the orbital altitude of the International Space Station.`,
      `Astronauts aboard the Space Station have been forced into emergency Soyuz capsules five times to prepare for evacuation when fragments passed within meters.`,
      `Today, over fifteen years later, more than one thousand four hundred tracked fragments from the Iridium-Cosmos collision are still in orbit.`,
      `Every single modern low Earth orbit satellite must continuously expend fuel maneuvering around fragments created on that single afternoon in 2009.`,
      `The 2009 collision proved that a single failure in orbital traffic control has permanence that outlasts human generations.`
    ];

    const prompts = [
      `dramatic space clock ticking down to 16:56:00 UTC with digital red numerals against dark starry background`,
      `3D orbital trajectory simulation showing Iridium 33 and Cosmos 2251 paths crossing over northern Siberian snowscape`,
      `close-up of defunct Russian Cosmos 2251 satellite covered in peeling thermal blankets drifting dead in space`,
      `photorealistic 35mm view of operational Iridium 33 satellite with gleaming phased array antennas reflecting sunlight`,
      `high-speed collision reconstruction showing the two satellites striking at 11.7 km/s with brilliant white flash of kinetic impact`,
      `macro frame of impact flash freezing two spacecraft structures disintegrating into expanding web of torn metal struts`,
      `energy gauge overlay showing kinetic energy release equivalent to 4 tons of TNT in bright yellow (#FFE500)`,
      `3D particle simulation of 2,000 tracked metal fragments scattering into expanding dual cone geometries in space`,
      `macro shot of sharp jagged aluminum shard with serial numbers spinning rapidly in zero gravity`,
      `3D global map showing Iridium-Cosmos debris cloud spreading into a wide belt intersecting the International Space Station orbit`,
      `interior view of ISS Cupola module with astronaut peering through window as red proximity alarm flashes on control panel`,
      `historical timeline graph showing 1,400 fragments still cataloged and tracked by NORAD 15 years after collision`,
      `telemetry screen displaying satellite automated maneuver fuel budget consumed by debris avoidance burns`,
      `hero documentary shot of orbital space above Earth filled with glowing trackable debris markers highlighting the 2009 collision remnants`
    ];

    const headlines = [
      'FEB 10, 2009', 'SIBERIA 790KM', 'COSMOS 2251', 'IRIDIUM 33',
      '11.7 KM/S STRIKE', 'ZERO WARNING', '4 TONS TNT', '2,000 FRAGMENTS',
      'RAZOR SHARDS', 'ISS THREAT', 'EVACUATION ALERTS', '15 YEARS LATER',
      'FUEL TAX', 'PERMANENT DEBRIS'
    ];

    const telemetry = [
      'TIME // 16:56:00 UTC', 'ALTITUDE // 789 KM', 'TARGET // 900 KG DEAD', 'ACTIVE // 560 KG RELAY',
      'CLOSING // 42,120 KM/H', 'SENSORS // NO RADAR', 'ENERGY // 16.7 GJ', 'PIECES // >10 CM: 2,296',
      'SHARDS // ESTIMATED 300K', 'ISS // ALTITUDE 420 KM', 'SHELTER // 5 SHELTER EVENTS', 'RESIDUAL // 1,420 TRACKED',
      'PENALTY // 12% PROPELLANT', 'LESSON // KINETIC PERMANENCE'
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 6) {
    // ATO 06: THE EMERGENCY WORKAROUND & HIDDEN MARGINS (12 beats // 75s)
    const roles: HslNarrativeRole[] = [
      'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY',
      'KINETIC_FLOW', 'BOUNDARY_LIMIT', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW',
      'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'CORE_THESIS'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 4 || beatIndex === 7 || beatIndex === 10) ? 'firefly_video' : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 6) ? 'CUTAWAY' : (beatIndex === 2 || beatIndex === 8) ? '3D_MAP' : undefined;

    const scripts = [
      `To survive inside this kinetic minefield, aerospace engineers rely on extreme shielding and automated orbital maneuvering.`,
      `In 1947, astronomer Fred Whipple invented the sacrificial bumper shield, a revolutionary design used on modern space stations.`,
      `A Whipple shield consists of an outer sacrificial thin aluminum foil placed ten centimeters in front of the main spacecraft pressure wall.`,
      `When a hypervelocity projectile strikes the thin outer bumper, the shock wave vaporizes the solid projectile into an expanding cloud of fine gas and liquid droplets.`,
      `By the time this cloud travels ten centimeters across the vacuum gap, its kinetic energy is distributed across a hundred times larger surface area.`,
      `The inner pressure hull easily absorbs the dispersed gas momentum without suffering a fatal puncture.`,
      `For larger, trackable debris greater than ten centimeters, passive shielding is useless; satellites must actively evade.`,
      `Space surveillance radars continuously compute probability of collision for every satellite pass across the globe.`,
      `If the Probability of Collision exceeds one in ten thousand, mission control systems automatically calculate an optimal Collision Avoidance Maneuver.`,
      `High-efficiency krypton or xenon electric ion thrusters fire for twenty minutes, applying tiny millinewtons of thrust.`,
      `This shifts the satellite orbital altitude by just eight hundred meters, converting a direct impact into a safe pass.`,
      `Modern mega-constellations now execute over fifty thousand automated collision avoidance burns every single year.`
    ];

    const prompts = [
      `detailed 35mm cutaway diagram of a multi-layer Whipple shield showing outer sacrificial bumper, vacuum stand-off gap, and rear pressure hull`,
      `high-speed laboratory impact footage reconstruction showing hypervelocity pellet vaporizing upon striking outer bumper foil`,
      `3D isometric engineering drawing showing kinetic energy dispersion cone across 10cm vacuum gap with shock pressure labels`,
      `macro view of undamaged inner titanium hull showing smooth surface after absorbing dispersed gas cloud impact`,
      `space operations center terminal displaying conjunction assessment probability matrix in glowing acid yellow (#FFE500)`,
      `3D orbital trajectory simulation showing satellite executing automated evasion burn, shifting trajectory away from red debris path`,
      `macro close-up of high-efficiency Hall-effect ion thruster glowing with bright cyan xenon plasma plume in hard vacuum`,
      `digital navigation telemetry dashboard showing delta-v expenditure, miss distance 850m, and collision probability 0.0000`,
      `wide orbital view showing multiple satellites in constellation pulsing with tiny thruster firings across Earth horizon`,
      `3D chart showing annual collision avoidance maneuvers rising from 2,000 to over 50,000 per year across LEO fleets`,
      `macro shot of satellite autonomous flight computer processing conjunction data packets in high-tech cleanroom testing`,
      `hero cinematic shot of satellite safely passing through space debris orbital crossing zone with telemetry lock reticle`
    ];

    const headlines = [
      'DEFENSE SYSTEM', 'WHIPPLE BUMPER', 'SACRIFICIAL FOIL', 'PHASE DISPERSION',
      '100X AREA SPREAD', 'ZERO PUNCTURE', 'ACTIVE EVASION', '1 IN 10,000 RISK',
      'COLLISION AVOIDANCE', 'ION PROPULSION', '800M SAFE PASS', '50,000 BURNS/YEAR'
    ];

    const telemetry = [
      'SHIELD // WHIPPLE MULTI-WALL', 'BUMPER // 1.27MM AL-6061', 'GAP // 100MM STANDOFF', 'SHOCK // VAPOR TRANSITION',
      'AREA // 100:1 CONE', 'PRESSURE // 1 ATM SAFE', 'THRESHOLD // PC > 1E-4', 'SURVEILLANCE // RADAR FUSION',
      'MANEUVER // CAM EXECUTION', 'THRUST // 85 MN XENON', 'MISS DISTANCE // 850 METERS', 'VOLUME // 50K BURNS/YR'
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 7) {
    // ATO 07: SYSTEMIC CONSEQUENCES & ECONOMIC RIPPLE (10 beats // 60s)
    const role: HslNarrativeRole = 'BOUNDARY_LIMIT';
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 5) ? '3D_MAP' : (beatIndex === 3 || beatIndex === 8) ? 'FLIPBOARD' : undefined;

    const scripts = [
      `If a cascading Kessler event occurs in low Earth orbit, the consequences on the ground are immediate, systemic, and devastating.`,
      `Modern society is entirely dependent on thirty-one GPS satellites operating in synchronization.`,
      `GPS does not merely provide turn-by-turn navigation; atomic clocks aboard GPS satellites provide nanosecond-level time stamping for all global financial transactions.`,
      `If GPS timing signals are lost, high-frequency trading algorithms fail, international interbank wire transfers freeze, and stock markets halt trading.`,
      `Continental power grids rely on GPS-synchronized phasor measurement units to balance 60-hertz frequency across thousands of generators.`,
      `Without satellite timing, electrical grid protection relays trip automatically, plunging entire nations into cascading blackouts.`,
      `Commercial aviation transoceanic routing collapses immediately, grounding ten thousand daily long-haul international flights.`,
      `Global maritime shipping lanes lose automated identification and weather routing, causing severe supply chain gridlock at every major port.`,
      `The direct economic loss of a full low Earth orbit cascade is estimated at over three point two trillion dollars in the first seventy-two hours.`,
      `More critically, low Earth orbit would remain an impassable wall of hypervelocity shrapnel for three centuries, locking humanity on Earth.`
    ];

    const prompts = [
      `conceptual 35mm view of modern city skyline with digital screens glitching and glowing red warning indicators`,
      `3D constellation map of 31 GPS satellites orbiting Earth with connecting yellow clock synchronization beams snapping`,
      `macro financial trading floor screen flashing CRITICAL TIMING ERROR and interbank settlement halted in red`,
      `power grid substation visualization with glowing frequency wave desynchronizing into blackout darkness`,
      `international airport departures board flipping entirely to CANCELLED in red neon letters across giant terminal hall`,
      `aerial view of massive container ship fleet idling dead in water outside congested port under cloudy sky`,
      `3D economic impact scoreboard showing $3.2 TRILLION IN 72 HOURS in precise monospaced typography`,
      `historical visualization of Earth surrounded by impenetrable dense ring of spinning debris blocking rocket launch trajectories`,
      `split view: Earth in 1960 with clean open space vs Earth in 2100 locked beneath a permanent debris cage`,
      `hero shot of empty mission control console reflecting silent starry sky with red status indicator: ORBITAL ACCESS SEVERED`
    ];

    const headlines = [
      'GROUND IMPACT', '31 ATOMIC CLOCKS', 'NANOSECOND SYNC', 'MARKET FREEZE',
      'GRID COLLAPSE', 'BLACKOUT CASCADE', 'FLIGHTS GROUNDED', 'MARITIME GRIDLOCK',
      '$3.2 TRILLION LOSS', '300-YEAR PRISON'
    ];

    const telemetry = [
      'SYSTEM // GPS CONSTELLATION', 'ACCURACY // 3.0 NANOSECONDS', 'FINANCE // SWIFT/FEDWIRE', 'TRIP // ALGO DESYNC',
      'FREQUENCY // 60.00 HZ LOST', 'OUTAGE // CONTINENTAL', 'AVIATION // TRANSOCEANIC STOP', 'SHIPPING // AIS LOST',
      'LOSS // $3.2T IN 72H', 'DURATION // 300 YEARS ORBIT'
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  // ATO 08: ORIGINAL THESIS & SYSTEM ARCHITECTURE (12 beats // 75s)
  const roles: HslNarrativeRole[] = [
    'CORE_THESIS', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY',
    'KINETIC_FLOW', 'BOUNDARY_LIMIT', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW',
    'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'CORE_THESIS'
  ];
  const role = roles[beatIndex % roles.length];
  const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 4 || beatIndex === 7 || beatIndex === 11) ? 'firefly_video' : 'generated_image_35mm';
  const archetype = (beatIndex === 0 || beatIndex === 6) ? 'MACRO_HUD' : (beatIndex === 2 || beatIndex === 8) ? '3D_MAP' : undefined;

  const scripts = [
    `The cloud is not in the sky; it is in orbit, travelling at twenty-eight thousand kilometers per hour through a vacuum firing range.`,
    `Every high-speed transaction, global video call, and real-time weather prediction depends on thousands of delicate aluminum satellites navigating a mathematical minefield.`,
    `We treat low Earth orbit as infinite void, forgetting that orbital mechanics is governed by strict geometric density limits.`,
    `A single paint fleck moving at eight kilometers per second possesses more destructive kinetic energy than an explosive shell.`,
    `The margin between continuous global connectivity and an irreversible three-hundred-year orbital collapse is measured in meters and milliseconds.`,
    `Active space traffic management, automated collision avoidance burns, and multi-layer Whipple shielding are the invisible engineering pillars keeping the vacuum open.`,
    `If we lose active orbital control for just seventy-two hours, the cascade becomes mathematically irreversible.`,
    `The technology that defines the twenty-first century is held aloft by the fragile kinetic equilibrium of thirty-five thousand tracked objects.`,
    `Hidden Systems Lab exists to reveal the physical mechanisms, the hidden bottlenecks, and the extreme margins that keep modern civilization alive.`,
    `Because the systems you never see are the only reason your world functions at all.`,
    `The orbit is not empty space; it is a shared kinetic highway that demands flawless engineering stewardship.`,
    `This is the Hidden Systems Lab.`
  ];

  const prompts = [
    `monumental space shot of Earth with glowing golden telemetry network wrapping around the globe, acid yellow and obsidian`,
    `panoramic view of satellite solar panel catching the golden glow of the sun above the dark ocean`,
    `3D orbital geometry grid showing satellite paths interwoven like silk threads across low Earth orbit`,
    `macro shot of a single 1cm metal fragment glowing under solar illumination against the deep black abyss`,
    `high-precision HUD display showing satellite collision avoidance miss distance holding green at 850 meters`,
    `close-up of satellite ion thruster firing a gentle glowing pulse into the vacuum of space`,
    `dramatic perspective of Earth horizon at sunrise with faint satellite constellations glowing like stars`,
    `3D analytical model of the global orbital commons with real-time tracking vectors and safety margins`,
    `cinematic laboratory environment with engineers studying real-time orbital trajectory telemetry on ultra-wide screens`,
    `dramatic high-contrast shot of satellite antenna transmitting clear signal beam toward illuminated Earth continent`,
    `hero title composition with acid yellow typography reading THE ORBIT IS A KINETIC HIGHWAY over dark obsidian space`,
    `final iconic Hidden Systems Lab brand signature card emerging from dark starfield with yellow laser reticles`
  ];

  const headlines = [
    'ORBITAL CLOUD', 'KINETIC MINEFIELD', 'GEOMETRY LIMIT', '1CM DESTROYER',
    'METERS & MILLISECONDS', 'INVISIBLE PILLARS', '72-HOUR HORIZON', 'FRAGILE BALANCE',
    'HIDDEN SYSTEMS LAB', 'SYSTEMS MOVE LIFE', 'KINETIC COMMONS', 'HIDDEN SYSTEMS LAB'
  ];

  const telemetry = [
    'INFRASTRUCTURE // ORBITAL', 'SPEED // 28,000 KM/H', 'CAPACITY // FINITE LEO', 'ENERGY // 1/2 MV^2',
    'MARGIN // 850M MISS', 'SHIELD // WHIPPLE ACTIVE', 'HORIZON // 72 HOURS', 'BALANCE // 35K TRACKED',
    'RESEARCH // HSL ARCHIVE', 'PRODUCT // GLOBAL SYNC', 'COMMONS // LEO HIGHWAY', 'EPISODE 010 // MASTER'
  ];

  return {
    narrativeRole: role,
    visualMode,
    infographicArchetype: archetype,
    graphicHeadline: headlines[beatIndex % headlines.length],
    telemetryLabel: telemetry[beatIndex % telemetry.length],
    voiceoverScript: scripts[beatIndex % scripts.length],
    promptSubject: prompts[beatIndex % prompts.length]
  };
}

/**
 * Storyboard Universal Dinâmico: Constrói roteiros 100% dedicados para qualquer tema solicitado pelo usuário
 * baseado nas entidades, mecanismos, restrições e consequências fornecidas.
 */
export function getUniversalTopicBeatData(actNumber: number, beatIndex: number, input: EpisodeTopicInput): BeatStoryboardData {
  const entity = input.entity || input.topic;
  const mechanism = input.mechanism || 'high-precision kinetic systems';
  const constraint = input.constraint || 'physical boundary limit';
  const consequence = input.consequence || 'systemic cascade failure';
  const thesis = input.thesis || 'Modern life depends on invisible engineering stewardship.';

  const isVideo = (actNumber === 1 && (beatIndex === 0 || beatIndex === 1 || beatIndex === 6 || beatIndex === 11)) ||
                  (actNumber === 2 && (beatIndex === 0 || beatIndex === 7)) ||
                  (actNumber === 3 && (beatIndex === 0 || beatIndex === 8)) ||
                  (actNumber === 5 && (beatIndex === 0 || beatIndex === 6)) ||
                  (actNumber === 7 && (beatIndex === 0 || beatIndex === 5)) ||
                  (actNumber === 8 && (beatIndex === 0 || beatIndex === 7));

  const visualMode: HslVisualMode = isVideo ? 'firefly_video' : 'generated_image_35mm';

  if (actNumber === 1) {
    const roles: HslNarrativeRole[] = ['MONUMENTAL_HOOK', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'CORE_THESIS'];
    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      graphicHeadline: beatIndex === 0 ? 'CRITICAL SYSTEM' : 'MASSIVE SCALE',
      telemetryLabel: `SYSTEM // ${actNumber}.0${beatIndex + 1}`,
      voiceoverScript: `Inside ${entity}, an invisible mechanical throughput moves modern civilization without pause.`,
      promptSubject: `Cinematic 35mm wide shot of ${entity}, glowing acid yellow telemetry lines, dark obsidian background, Arri Alexa LF 8k.`
    };
  } else if (actNumber === 2) {
    const roles: HslNarrativeRole[] = ['TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY'];
    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      graphicHeadline: 'ANATOMY LAYER',
      telemetryLabel: `LAYER // 0${beatIndex + 1}`,
      voiceoverScript: `The physical architecture of ${entity} operates through ${mechanism}.`,
      promptSubject: `Macro cutaway cross-section view of ${entity}, technical annotations in yellow and cyan, 35mm film still.`
    };
  } else if (actNumber === 3) {
    const roles: HslNarrativeRole[] = ['MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL'];
    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      graphicHeadline: 'THROUGHPUT MATH',
      telemetryLabel: `FLOW // RATE ${beatIndex + 1}`,
      voiceoverScript: `Governed by strict physical equations, the rate of transfer through ${mechanism} dictates overall capacity.`,
      promptSubject: `Analytical engineering telemetry visualization of ${mechanism}, glowing flow vectors, high-contrast dark room display.`
    };
  } else if (actNumber === 4) {
    const roles: HslNarrativeRole[] = ['BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'BOUNDARY_LIMIT'];
    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      graphicHeadline: 'CRITICAL LIMIT',
      telemetryLabel: `THRESHOLD // ${constraint.substring(0, 16).toUpperCase()}`,
      voiceoverScript: `Every physical system hits a hard boundary condition: ${constraint}.`,
      promptSubject: `Dramatic stress analysis graph showing exponential threshold breach of ${constraint}, flashing orange warning reticles.`
    };
  } else if (actNumber === 5) {
    const roles: HslNarrativeRole[] = ['EMERGENCY_DISPATCH', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH', 'BOUNDARY_LIMIT', 'EMERGENCY_DISPATCH', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH', 'BOUNDARY_LIMIT', 'EMERGENCY_DISPATCH', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH', 'BOUNDARY_LIMIT', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH'];
    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      graphicHeadline: 'STRAIN BOTTLENECK',
      telemetryLabel: 'FAILURE CASCADE // 99%',
      voiceoverScript: `When load exceeds structural capacity, localized failure rapidly triggers an uncontained cascade.`,
      promptSubject: `Cinematic high-contrast simulation of catastrophic bottleneck rupture in ${entity}, orange and yellow stress heatmaps.`
    };
  } else if (actNumber === 6) {
    const roles: HslNarrativeRole[] = ['EMERGENCY_DISPATCH', 'TECHNICAL_ANATOMY', 'EMERGENCY_DISPATCH', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'EMERGENCY_DISPATCH', 'TECHNICAL_ANATOMY', 'EMERGENCY_DISPATCH', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY'];
    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      graphicHeadline: 'HIDDEN MARGIN',
      telemetryLabel: 'ACTIVE DEFENSE // ENG',
      voiceoverScript: `Engineers embed sacrificial buffers and autonomous countermeasures to absorb unexpected shockwaves.`,
      promptSubject: `Cross-section diagram of multi-layer safety mechanisms protecting ${entity}, high-tech precision lab environment.`
    };
  } else if (actNumber === 7) {
    const roles: HslNarrativeRole[] = ['CORE_THESIS', 'EMERGENCY_DISPATCH', 'CORE_THESIS', 'BOUNDARY_LIMIT', 'CORE_THESIS', 'EMERGENCY_DISPATCH', 'CORE_THESIS', 'BOUNDARY_LIMIT', 'CORE_THESIS', 'CORE_THESIS'];
    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      graphicHeadline: 'SYSTEMIC RIPPLE',
      telemetryLabel: 'CONSEQUENCE // GLOBAL',
      voiceoverScript: `If this layer collapses: ${consequence}.`,
      promptSubject: `Atmospheric mission control room displaying global cascading impact maps, red telemetry alert overlays.`
    };
  } else {
    const roles: HslNarrativeRole[] = ['CORE_THESIS', 'CORE_THESIS', 'CORE_THESIS', 'CORE_THESIS', 'CORE_THESIS', 'CORE_THESIS', 'CORE_THESIS', 'CORE_THESIS'];
    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      graphicHeadline: 'ORIGINAL THESIS',
      telemetryLabel: 'HSL // CONCLUSION',
      voiceoverScript: thesis,
      promptSubject: `Monumental cinematic panoramic wide angle shot representing ${entity}, glowing golden horizon, iconic Hidden Systems Lab documentary style.`
    };
  }
}

/**
 * Storyboard Canônico Especializado para o Episódio 011:
 * "THE 240,000-TON MONSTER THAT NEEDS 5 KM TO BRAKE // MEGASHIP HYDRODYNAMICS"
 * Rigorosamente 96 beats, 0 repetições, matriz 40/30/15/15 de modos visuais.
 */
export function getMegaShipHydrodynamicsBeatData(actNumber: number, beatIndex: number, input: EpisodeTopicInput): BeatStoryboardData {
  const visualMode: HslVisualMode = resolveCanonicalVisualMode(actNumber, beatIndex);
  const isDiagram = visualMode === 'motion_image_diagram';

  if (actNumber === 1) {
    // ATO 01: THE HOOK & THE VISIBLE MIRACLE (12 beats // 75s)
    const roles: HslNarrativeRole[] = [
      'MONUMENTAL_HOOK', 'KINETIC_FLOW', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH',
      'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'CORE_THESIS'
    ];
    const archetype = isDiagram ? ((beatIndex === 3) ? 'TARMAC_FLOW' : 'CUTAWAY') : undefined;

    const scripts = [
      `A 400-meter container ship is not just a vessel; it is a 240,000-ton kinetic bullet gliding through water.`,
      `Stacked twenty-four containers wide and nine tiers high, it carries twenty-four thousand steel boxes across the ocean.`,
      `Cruising at twenty-two knots, its forward momentum exceeds eight billion joules of raw kinetic energy.`,
      `If the chief engineer cuts the engine and commands full astern, the ship will not stop for five point two kilometers.`,
      `Fourteen agonizing minutes of hydrodynamic drag before zero forward velocity is achieved.`,
      `Water provides virtually zero rolling friction compared to steel wheels on a rail track.`,
      `Yet eighty percent of global manufactured goods rely on these kinetic giants navigating narrow channels.`,
      `In the Suez Canal, a 400-meter vessel has less than sixty meters of lateral clearance from the sandbanks.`,
      `Under the keel, barely one point two meters of water separates two hundred thousand tons of steel from the canal bed.`,
      `A single steering lag of eight seconds can trigger an unrecoverable yawing momentum.`,
      `This is the violent fluid dynamics of modern global trade.`,
      `Welcome to the Hidden Systems Lab.`
    ];

    const headlines = [
      '240,000 TONS', '24,000 TEU', '8 BILLION JOULES', '5.2 KM BRAKE',
      '14 MINUTES DRAG', 'ZERO FRICTION', '80% WORLD TRADE', '60M CLEARANCE',
      '1.2M KEEL MARGIN', '8-SECOND LOCK', 'VIOLENT HYDRODYNAMICS', 'HIDDEN SYSTEMS LAB'
    ];

    const telemetry = [
      'DISPLACEMENT // 240,000T', 'PAYLOAD // 24,000 TEU', 'ENERGY // 8.2 GJ', 'STOP DIST // 5,200M',
      'TIME // 14:00 MIN', 'COEFFICIENT // 0.0028 CF', 'VOLUME // 80% GLOBAL', 'BEAM // 61.5 METERS',
      'UKC // 1.2 METERS', 'STEERING // 8.0 SEC', 'HYDRODYNAMICS // CRITICAL', 'EPISODE 011 // MASTER'
    ];

    const prompts = [
      `Cinematic 35mm film photograph of 400-meter mega-container ship slicing through open ocean at sunrise, massive foaming bow wave, Kodak Vision3 500T`,
      `Low-angle tracking shot of 24-container wide stack towering 60 meters above waterline against dramatic overcast sky`,
      `3D isometric engineering wireframe of 240,000t hull displacement with glowing yellow velocity vectors (#FFE500)`,
      `Technical schematic diagram showing kinetic stopping curve: 5,200 meters distance vs 14 minutes time delay`,
      `High-speed drone tracking shot alongside churning turquoise wake extending miles behind container giant`,
      `Macro cutaway of water boundary layer shearing along anti-fouling coated hull plate with micro-bubble streamlines`,
      `Panoramic satellite view of container armada waiting in queue at Suez Canal Mediterranean entrance`,
      `Low-angle bow perspective looking down narrow canal fairway with sandbanks only 60 meters on either side`,
      `Submerged sonar imaging view of 1.2m under-keel clearance above canal bottom sediment in Klein blue (#0038FF)`,
      `Cockpit bridge console shot of pilot wheel and rudder angle indicator jerking to maximum port limit`,
      `Split-screen visualization showing kinetic momentum vs hydrodynamic resistance in dark obsidian and acid yellow`,
      `Iconic hero shot of mega container ship filling entire horizon at dusk, industrial maritime majesty`
    ];

    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  } else if (actNumber === 2) {
    // ATO 02: THE PHYSICAL ANATOMY & LAYER BREAKDOWN (14 beats // 90s)
    const roles: HslNarrativeRole[] = [
      'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY',
      'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'TECHNICAL_ANATOMY',
      'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'TECHNICAL_ANATOMY',
      'KINETIC_FLOW', 'TECHNICAL_ANATOMY'
    ];
    const archetype = isDiagram ? ((beatIndex === 3) ? 'CUTAWAY' : '3D_MAP') : undefined;

    const scripts = [
      `To push a quarter of a million tons, the vessel houses the largest internal combustion machine ever forged.`,
      `An 11-cylinder two-stroke turbocharged diesel engine generating one hundred thousand continuous brake horsepower.`,
      `Each cylinder bore spans nearly one meter, burning three hundred tons of heavy fuel oil daily.`,
      `The crankshaft alone weighs four hundred and eighty tons of solid forged steel.`,
      `It directly couples to a ten-meter fixed-pitch bronze propeller turning at eighty-four revolutions per minute.`,
      `At maximum output, the propeller blades slice the water, generating violent cavitation vortices.`,
      `Behind the propeller hangs a hollow semi-balanced horn rudder weighing over two hundred tons.`,
      `At the bow, a massive bulbous bow modifies the hull wave system to cancel out hydrodynamic drag by fifteen percent.`,
      `Thirty-two segregated ballast water tanks continuously balance hull stress to prevent catastrophic structural snapping.`,
      `Triple redundant hydraulic steering gear pumps forty liters of pressurized fluid per second to swing the rudder.`,
      `Dynamic torsional strain gauges along the keel monitor hull flexing in real time.`,
      `A complex network of bow thrusters provides thirty-five tons of lateral maneuvering thrust at dockside.`,
      `Every cubic meter of hull displacement is precisely calculated to prevent grounding.`,
      `This multi-thousand-ton mechanical orchestra must operate in complete equilibrium.`
    ];

    const headlines = [
      'TITAN MACHINE', '100,000 HP', '300 TONS/DAY', '480T CRANKSHAFT',
      '10M PROPELLER', 'CAVITATION VORTEX', '200T RUDDER', 'BULBOUS BOW',
      '32 BALLAST TANKS', '40 L/S HYDRAULICS', 'KEEL STRAIN SENSOR', '35T THRUSTER',
      'DISPLACEMENT EQUILIBRIUM', 'MECHANICAL ORCHESTRA'
    ];

    const telemetry = [
      'ENGINE // MAN B&W 11G95ME', 'POWER // 75,000 KW', 'CONSUMPTION // 300 T/D', 'CRANKSHAFT // 480T',
      'PROPELLER // 10.2M BRONZE', 'CAVITATION // -1.2 BAR', 'RUDDER // 220T SEMI-BAL', 'BULB // -15% DRAG',
      'BALLAST // 65,000 M3', 'HYDRAULIC // 250 BAR', 'KEEL STRESS // 140 MPA', 'THRUSTER // 2,500 KW',
      'DRAFT // 16.5M LOADED', 'EQUILIBRIUM // 100% NOMINAL'
    ];

    const prompts = [
      `Interior cutaway 35mm view of 5-story tall 11-cylinder marine diesel engine inside mega-ship hull`,
      `Extreme close-up of 1-meter wide engine cylinder head with illuminated fuel injection rails and exhaust valves`,
      `3D mechanical cross-section showing 480-ton forged steel crankshaft rotating in oil bath`,
      `Technical schematic of propeller shaft line connecting engine output flywheel directly to bronze propeller`,
      `Underwater 35mm shot of massive 10-meter 6-blade bronze propeller turning in deep blue ocean water`,
      `Macro hydrodynamic shot of propeller blade tip trailing intense spiral cavitation bubbles and vortex vapor`,
      `Massive 200-ton steel semi-balanced rudder swinging behind propeller with high-pressure water wash`,
      `Cutaway of bulbous bow cutting through surface water, illustrating destructive wave interference pattern`,
      `3D structural diagram of 32 internal ballast water tanks with real-time level telemetry in acid yellow (#FFE500)`,
      `Heavy-duty hydraulic steering gear ram assembly in stern steering flat with 250-bar pressure gauges`,
      `Fiber-optic keel deflection sensor layout along bottom hull girder displaying micro-strain data`,
      `Bow thruster tunnel discharging powerful jet of water sideways during harbor maneuvering test`,
      `3D elevation cross-section showing hull displacement volume balancing container center of gravity`,
      `Dusk shot of ship engine exhaust stack glowing under heat signature against dark starry ocean sky`
    ];

    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  } else if (actNumber === 3) {
    // ATO 03: THE FLOW DYNAMICS & THROUGHPUT MATH (16 beats // 105s)
    const roles: HslNarrativeRole[] = [
      'MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY',
      'MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY',
      'MATHEMATICAL_MODEL', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY',
      'KINETIC_FLOW', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'MATHEMATICAL_MODEL'
    ];
    const archetype = isDiagram ? ((beatIndex === 3) ? 'TARMAC_FLOW' : (beatIndex === 8) ? 'MACRO_HUD' : '3D_MAP') : undefined;

    const scripts = [
      `When a mega-vessel enters a confined canal, fluid dynamics cease to be linear.`,
      `According to Bernoulli's principle, fluid velocity and pressure are inversely coupled.`,
      `As the 400-meter hull displaces water in a narrow fairway, water is forced to rush rapidly down the sides.`,
      `In the restricted channel cross-section, flow speed accelerates to triple its normal velocity.`,
      `This local acceleration causes a massive hydrostatic pressure drop along the hull.`,
      `This hydrodynamic phenomenon is known as the Bank Effect.`,
      `If the ship drifts slightly off the canal centerline, the water between the hull and the near bank accelerates violently.`,
      `The resultant low-pressure vacuum literally sucks the heavy stern directly toward the shallow bank.`,
      `Simultaneously, high pressure building at the bow pushes the ship's head violently toward the opposite bank.`,
      `The ship yaws uncontrollably into a perpendicular rotation across the fairway.`,
      `Compounding the crisis is the Squat Effect: the pressure drop sucks the entire hull downward into the seabed.`,
      `At eight knots, dynamic sinkage reduces under-keel clearance by over seventy centimeters.`,
      `The ship physically draws closer to the sand, increasing bottom boundary friction.`,
      `Rudder authority degrades exponentially as cross-flow overwhelms steering lift.`,
      `A quarter-million tons of steel becomes a captive prisoner of Bernoulli fluid suction.`,
      `No human muscle can overcome eight billion joules of rotational torque.`
    ];

    const headlines = [
      'NON-LINEAR HYDRODYNAMICS', 'BERNOULLI LAW', 'FAIRWAY CONSTRICTION', '3X FLOW VELOCITY',
      'HYDROSTATIC DROP', 'THE BANK EFFECT', 'ASYMMETRIC SUCTION', 'STERN SUCTION',
      'BOW CUSHION REPULSION', 'ROTATIONAL YAW', 'SQUAT SINKAGE', '-70CM CLEARANCE',
      'BOTTOM FRICTION', 'RUDDER BREAKDOWN', 'BERNOULLI TRAP', '8 BILLION JOULES'
    ];

    const telemetry = [
      'REGIME // CONFINED CHANNEL', 'EQUATION // P + 1/2 pv^2 = C', 'BLOCKAGE RATIO // 0.42', 'FLOW SPEED // 3.2 V0',
      'PRESSURE // -0.85 BAR', 'BANK EFFECT // ACTIVE', 'ASYMMETRY // +14 METERS', 'STERN FORCE // 450T SUCTION',
      'BOW MOMENT // 120,000 KN-M', 'YAW RATE // 2.4 DEG/S', 'SQUAT SINK // 0.72 METERS', 'NET UKC // 0.48 METERS',
      'BOUNDARY // FRICTION SURGE', 'LIFT COEFF // CL COLLAPSE', 'TRAPPED // FLUID MOMENTUM', 'TORQUE // 8.2 GJ LIMIT'
    ];

    const prompts = [
      `3D fluid dynamics simulation of water rushing past 400m hull in narrow canal, colored velocity streamlines in acid yellow (#FFE500)`,
      `Mathematical formula overlay: P + 1/2*rho*v^2 = Constant rendered in crisp white typography over dark canal water`,
      `Top-down view of canal cross-section showing restricted water volume between hull sides and sloping sandbanks`,
      `Visual demonstration of Venturi nozzle effect between ship side and canal bank with high-speed fluid vectors`,
      `Hydrostatic pressure drop heatmap along ship hull transitioning from neutral cyan to deep suction orange (#FF2E00)`,
      `3D anatomical cutaway of Bank Effect: blue vectors sucking stern toward right bank while red vectors push bow left`,
      `Aerial camera angle showing container ship drifting 15 meters off canal centerline with asymmetric wake waves`,
      `Underwater perspective of stern being pulled sideways toward shallow sand slope by invisible Bernoulli vacuum`,
      `High-pressure wave cushion building at bulbous bow, deflecting water mass violently toward western canal bank`,
      `Time-lapse vector overlay showing rapid 45-degree rotational yaw sequence in 12 seconds`,
      `Side elevation diagram of Squat Effect: water surface dropping beneath keel, hull sinking 70cm lower into canal bed`,
      `Macro telemetry gauge displaying under-keel clearance dropping from 1.20m to critical 0.48m in glowing red (#FF2E00)`,
      `Underwater view of ship flat bottom dragging inches above rippled seabed sand with sediment clouds rising`,
      `Hydrodynamic CFD chart showing complete separation of laminar flow across rudder surface and loss of steering lift`,
      `3D isometric model showing 240,000t ship rotating helplessly in fluid vortex without forward rudder control`,
      `Hero graphic composition: 8 BILLION JOULES OF ROTATIONAL TORQUE over dark obsidian maritime background`
    ];

    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  } else if (actNumber === 4) {
    // ATO 04: THE PHYSICAL LIMIT & BOUNDARY CONDITION (12 beats // 75s)
    const roles: HslNarrativeRole[] = [
      'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY',
      'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY',
      'BOUNDARY_LIMIT', 'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'BOUNDARY_LIMIT'
    ];
    const archetype = isDiagram ? ((beatIndex === 3) ? 'MACRO_HUD' : 'FLIPBOARD') : undefined;

    const scripts = [
      `Every maritime corridor is governed by an absolute geometric ceiling.`,
      `The Suez Canal fairway is only three hundred meters wide at the surface, narrowing to two hundred meters at depth.`,
      `A 400-meter mega-container ship is physically longer than the entire width of the canal.`,
      `The maximum allowable draft is twenty point one meters, leaving a razor-thin under-keel buffer.`,
      `The speed limit is strictly enforced at eight point six knots to minimize bank erosion and squat sinkage.`,
      `Above sixteen knots of wind, the vast stack of twenty-four thousand containers acts as a four-thousand-square-meter sail.`,
      `A thirty-knot lateral wind gust exerts over two hundred and fifty tons of broadside aerodynamic drag.`,
      `At this critical limit, the aerodynamic lateral force exceeds the maximum hydrodynamic lift generated by the rudder.`,
      `If the pilot increases engine RPM to regain steering flow, the Squat Effect instantly increases bottom suction.`,
      `If the pilot reduces engine RPM, aerodynamic drift blows the vessel into the bank within twelve seconds.`,
      `This hydrodynamic paradox is the knife-edge boundary condition of global mega-freight.`,
      `Cross the threshold, and total waterway blockage is mathematically guaranteed.`
    ];

    const headlines = [
      'GEOMETRIC CEILING', '300M CANAL WIDTH', '400M SHIP LENGTH', '20.1M MAX DRAFT',
      '8.6 KNOT SPEED LIMIT', '4,000M2 SAIL AREA', '250T WIND FORCE', 'AERODYNAMIC OVERLOAD',
      'SPEED TRAP PARADOX', '12-SECOND DRIFT', 'KNIFE-EDGE LIMIT', 'BLOCKAGE GUARANTEED'
    ];

    const telemetry = [
      'GEOMETRY // HARD LIMIT', 'CANAL BEAM // 300M SURFACE', 'SHIP LOA // 400.0 METERS', 'DRAFT // 20.1M MAX',
      'SPEED // 8.6 KTS CEILING', 'WINDAGE // 4,200 M2', 'LATERAL FORCE // 250T DRAG', 'RUDDER LIFT // 180T MAX',
      'RPM SURGE // SQUAT +30%', 'DRIFT TIME // 12.0 SECONDS', 'EQUILIBRIUM // BREAKDOWN', 'FAILSAFE // 0% MARGIN'
    ];

    const prompts = [
      `Architectural blueprint overlay comparing 400m ship length against 300m canal width, illustrating impossible turning circle`,
      `Aerial cross-section view of Suez Canal channel showing trapezoidal profile narrowing from 300m to 200m at seabed`,
      `Wide panoramic drone shot looking down canal corridor with mega-ship filling 80% of total fairway breadth`,
      `Technical bathymetric sonar map showing 20.1m dredged depth with razor-thin under-keel margin in cyan and red`,
      `Speed limit radar display on canal control gantry flashing 08.6 KTS MAXIMUM SPEED in amber LED matrix`,
      `Cinematic shot of 24,000 containers stacked 9 tiers high acting as massive aerodynamic wall against desert sandstorm`,
      `Aerodynamic airflow simulation showing 30-knot wind pressure lines striking container stack with 250-ton lateral force vector`,
      `Vector force comparison HUD: Aerodynamic Wind Force (250T) exceeding Hydrodynamic Rudder Lift (180T)`,
      `Split-screen demonstration: Speeding up causing bottom suction vs Slowing down causing wind drift`,
      `Cockpit bridge telemetry screen flashing red alert: CRITICAL AERODYNAMIC DRIFT // IMPENDING BANK CONTACT`,
      `Minimalist Apple Keynote slide: THE INVISIBLE CEILING // GEOMETRIC LENGTH > CANAL WIDTH`,
      `Dramatic sunset view of desert sand blowing across canal fairway as massive ship approaches critical narrows`
    ];

    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  } else if (actNumber === 5) {
    // ATO 05: THE BOTTLENECK & STRAIN BREAKDOWN (14 beats // 90s)
    const roles: HslNarrativeRole[] = [
      'EMERGENCY_DISPATCH', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH', 'BOUNDARY_LIMIT',
      'EMERGENCY_DISPATCH', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH', 'BOUNDARY_LIMIT',
      'EMERGENCY_DISPATCH', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH', 'BOUNDARY_LIMIT',
      'KINETIC_FLOW', 'EMERGENCY_DISPATCH'
    ];
    const archetype = isDiagram ? ((beatIndex === 4) ? 'FLIPBOARD' : '3D_MAP') : undefined;

    const scripts = [
      `March 23, 2021: The ultra-large container ship Ever Given enters the southern single-lane section of Suez.`,
      `A sudden sandstorm whips forty-knot lateral wind gusts across the container stack.`,
      `The ship begins to drift toward the western bank at eight point two knots.`,
      `The pilot applies hard port rudder to correct the drift, but Bank Effect suction grabs the starboard quarter.`,
      `A severe hydrostatic pressure drop pulls the stern into the shallow bank.`,
      `The bow swings violently sixty degrees to starboard across the navigation channel.`,
      `Within eight seconds, the bulbous bow plows five meters deep into the dense eastern sandbank.`,
      `The sheer momentum of two hundred and twenty thousand tons lifts the bow slightly onto the sediment.`,
      `The stern swings around and grounds firmly on the opposite western bank.`,
      `In less than twenty seconds, the world's most critical maritime artery is completely wedged shut.`,
      `Behind the grounded giant, fifty-four vessels in the northbound convoy are forced into emergency crash stops.`,
      `Three hundred and sixty-nine ships drop anchor in the Red Sea and Mediterranean waiting zones.`,
      `Ten percent of global commerce freezes instantaneously.`,
      `The primary circulatory valve of world trade has suffered a fatal kinetic thrombosis.`
    ];

    const headlines = [
      'MARCH 23 2021', '40-KNOT STORM', '8.2 KNOT DRIFT', 'BANK SUCTION LOCK',
      'STERN DROP', '60° BOW ROTATION', '5M GROUNDING', '220,000T MOMENTUM',
      'DIAGONAL WEDGED', 'CANAL BLOCKED', '54 CONVOY SHIPS', '369 ANCHORED',
      '10% GLOBAL FREEZE', 'KINETIC THROMBOSIS'
    ];

    const telemetry = [
      'INCIDENT // SUEZ KM 151', 'WIND // 40 KNOTS GUSTS', 'HEADING // 024 DEG DRIFT', 'RUDDER // 35 DEG PORT LOCK',
      'BANK SUCTION // 650T FORCE', 'ROTATION // 60 DEGREE YAW', 'IMPACT // 5.2M SAND PENETRATION', 'MOMENTUM // 220,000T',
      'STATUS // GROUNDED DIAGONAL', 'CANAL FAIRWAY // 100% BLOCKED', 'CONVOY // 54 SHIPS HALTED', 'WAITING QUEUE // 369 VESSELS',
      'TRADE IMPACT // 10% WORLD', 'SYSTEM // KINETIC THROMBOSIS'
    ];

    const prompts = [
      `Dramatic 35mm telephoto shot of Ever Given container ship entering dusty brown sandstorm in Suez Canal fairway`,
      `Aerial drone shot of blinding desert wind howling across 24,000 stacked containers with visible dust devils`,
      `Bridge camera recording showing ship bow veering off course toward canal shoreline at 8.2 knots`,
      `Underwater simulation showing starboard stern being sucked violently into shallow bank slope by low pressure`,
      `Bird's-eye perspective of massive 400m hull rotating diagonally across the narrow 300m blue waterway`,
      `Extreme close-up 35mm shot of massive red bulbous bow plowing into canal sandbank with massive spray of mud`,
      `Structural strain diagram of hull steel flexing under asymmetric grounding stress on sand embankment`,
      `Aerial panoramic view of Ever Given wedged completely diagonal from bank to bank, totally sealing the canal`,
      `Emergency dispatch radar screen showing 54 trailing cargo ships executing emergency crash stops in tight convoy`,
      `Satellite map of Red Sea and Mediterranean anchorages packed with 369 anchored container vessels in glowing orange (#FF2E00)`,
      `Global supply chain scoreboard ticker displaying $9.6 BILLION DAILY TRADE HALTED in bold Impact typography`,
      `Close-up of maritime pilot wiping sweat on ship bridge as alarm consoles flash full-screen emergency red`,
      `3D cross-section showing vessel wedged like a plug across canal with zero remaining water flow bypass`,
      `Hero wide shot of grounded container titan illuminated by floodlights in the desert night with tugboats surrounding`
    ];

    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  } else if (actNumber === 6) {
    // ATO 06: THE EMERGENCY WORKAROUND & HIDDEN MARGINS (10 beats // 60s)
    const roles: HslNarrativeRole[] = [
      'EMERGENCY_DISPATCH', 'TECHNICAL_ANATOMY', 'EMERGENCY_DISPATCH', 'TECHNICAL_ANATOMY',
      'MATHEMATICAL_MODEL', 'EMERGENCY_DISPATCH', 'TECHNICAL_ANATOMY', 'EMERGENCY_DISPATCH',
      'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY'
    ];
    const archetype = isDiagram ? ((beatIndex === 3) ? 'CUTAWAY' : 'TARMAC_FLOW') : undefined;

    const scripts = [
      `Freeing a grounded 240,000-ton colossus requires mobilising extreme naval salvage physics.`,
      `Step one: Specialized suction dredgers excavate thirty thousand cubic meters of packed sand from around the bulbous bow.`,
      `Step two: The vessel pumps out nine thousand tons of ballast water to reduce hull ground pressure.`,
      `Step three: Fourteen heavy ocean-going tugboats assemble, delivering over one thousand two hundred tons of combined bollard pull.`,
      `Step four: High-volume industrial water jetting clears compacted mud under the submerged stern.`,
      `Salvage engineers calculate the exact tidal peak: a spring high tide providing an extra forty-five centimeters of hydrostatic buoyancy.`,
      `At peak tide, twelve tugs pull full astern while two push the bow into the deep channel.`,
      `With a colossal shudder, the hull breaks free from the sandy suction grip.`,
      `Laminar canal flow rushes beneath the freed keel once again.`,
      `Six days of global paralysis end through calculated salvage engineering.`
    ];

    const headlines = [
      'SALVAGE PHYSICS', '30,000 M3 DREDGING', '-9,000T BALLAST', '1,200T BOLLARD PULL',
      'WATER JETTING', '+45CM SPRING TIDE', '14 TUGS PULLING', 'HULL UNLOCKED',
      'FLOW RESTORED', 'SALVAGE SUCCESS'
    ];

    const telemetry = [
      'OPERATION // SUEZ SALVAGE', 'DREDGE // 30,000 M3 SAND', 'DE-BALLAST // -9,000 TONS', 'PULL // 1,200T COMBINED',
      'PRESSURE JET // 150 BAR', 'TIDE LEVEL // +45CM BUOYANCY', 'TUGS ACTIVE // 14 UNITS', 'STATUS // KEEL REFRACTURED',
      'CANAL FLOW // LAMINAR RESUMED', 'RESTORATION // 100% COMPLETE'
    ];

    const prompts = [
      `High-voltage 35mm shot of massive industrial cutter suction dredger 'Mashhour' pumping sand from under grounded ship bow`,
      `Macro view of powerful water jets blasting compacted mud away from submerged rudder and propeller blades`,
      `3D cutaway showing internal ballast pumps discharging 9,000 tons of water into canal with hull floating higher`,
      `Dramatic telephoto shot of 14 heavy ocean tugboats churning foamy white water, thick steel towlines straining under 1,200 tons pull`,
      `High-precision tidal calculation chart showing spring full moon high tide curve peaking with +45cm buoyancy window`,
      `Continuous tracking shot alongside tugboat armada pulling with black diesel smoke rising under floodlit night sky`,
      `Close-up of bulbous bow slowly dislodging from canal sand wall, sediment cascading down as water rushes in`,
      `Wide aerial shot of container titan floating straight down center channel fairway, completely freed from sandbanks`,
      `HUD telemetry screen displaying CANAL CLEARANCE // LAMINAR VESSEL THROUGHPUT RESUMED in neon acid yellow (#FFE500)`,
      `Hero sunset composition of triumphant mega container ship sailing forward down canal under escort of blowing water cannons`
    ];

    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  } else if (actNumber === 7) {
    // ATO 07: SYSTEMIC CONSEQUENCES & ECONOMIC RIPPLE (10 beats // 60s)
    const roles: HslNarrativeRole[] = [
      'CORE_THESIS', 'EMERGENCY_DISPATCH', 'CORE_THESIS', 'BOUNDARY_LIMIT',
      'CORE_THESIS', 'EMERGENCY_DISPATCH', 'CORE_THESIS', 'BOUNDARY_LIMIT',
      'CORE_THESIS', 'CORE_THESIS'
    ];
    const archetype = isDiagram ? '3D_MAP' : undefined;

    const scripts = [
      `The economic ripple of a six-day canal blockage is catastrophic.`,
      `Lloyd's of London calculated the cost of the Suez blockage at nine point six billion dollars per day.`,
      `Over fifty-four billion dollars in containerized freight was physically trapped in transit.`,
      `European automotive assembly lines shut down as just-in-time microchip deliveries evaporated.`,
      `Oil and liquefied natural gas spot prices spiked fifteen percent in forty-eight hours.`,
      `Global container shipping rates tripled from four thousand to twelve thousand dollars per FEU.`,
      `Rerouting around the Cape of Good Hope added fourteen days and eight hundred tons of carbon emissions per ship.`,
      `Ports across Rotterdam, Antwerp, and Hamburg faced unmanageable congestion waves lasting four months.`,
      `The illusion of instant global inventory was shattered by a single canal bank.`,
      `Modern consumer abundance rests upon a fragile hydrodynamic equilibrium.`
    ];

    const headlines = [
      'ECONOMIC RIPPLE', '$9.6B PER DAY', '$54B TRAPPED', 'AUTO LINES HALTED',
      'ENERGY SPIKE +15%', 'RATES TRIPLED', '+14 DAYS CAPE ROUTE', 'PORT CONGESTION',
      'INVENTORY ILLUSION', 'FRAGILE EQUILIBRIUM'
    ];

    const telemetry = [
      'LOSS // $9.6B / 24 HOURS', 'TOTAL VALUE // $54 BILLION', 'SUPPLY CHAIN // JUST-IN-TIME HALT', 'LNG / OIL // +15.4% SPIKE',
      'FREIGHT RATE // $12,000 / FEU', 'REROUTE // +14 DAYS / 3,500 NM', 'EMISSIONS // +800T CO2 / SHIP', 'PORT BACKLOG // 4 MONTHS',
      'INVENTORY BUFFER // ZERO', 'GLOBAL COMMERCE // VULNERABLE'
    ];

    const prompts = [
      `Monumental 3D global trade map showing maritime choke-points: Suez, Malacca, Panama, Bab-el-Mandeb with red blockage halos`,
      `Financial data HUD ticker displaying $9,600,000,000 DAILY ECONOMIC LOSS in bold Impact font with acid yellow glow`,
      `Interior shot of European car manufacturing factory floor sitting idle with uncompleted car chassis on stationary conveyor lines`,
      `Oil refinery terminal at dusk with empty storage tanks and LNG price charts spiking in hyper orange (#FF2E00)`,
      `Shipping freight rate chart skyrocketing from $4k to $12k per container on high-tech trading terminal screen`,
      `3D nautical route comparison: Suez Canal shortcut (24 days) vs Cape of Good Hope detour (38 days) around Africa`,
      `Aerial shot of container terminal in Rotterdam with massive mountain of stacked containers and 40 stranded cargo ships anchored offshore`,
      `Supermarket and department store aisles with empty shelves illustrating just-in-time logistics failure`,
      `3D anatomical cross-section of modern civilization showing maritime transport as primary oxygen artery`,
      `Hero cinematic dusk shot of endless line of container ships waiting patiently on horizon under dramatic golden light`
    ];

    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  } else {
    // ATO 08: ORIGINAL THESIS & SYSTEM ARCHITECTURE (8 beats // 45s)
    const roles: HslNarrativeRole[] = [
      'CORE_THESIS', 'CORE_THESIS', 'CORE_THESIS', 'CORE_THESIS',
      'CORE_THESIS', 'CORE_THESIS', 'CORE_THESIS', 'CORE_THESIS'
    ];
    const archetype = isDiagram ? '3D_MAP' : undefined;

    const scripts = [
      `The fundamental thesis of Hidden Systems Lab is that modern life is sustained by invisible physical conduits.`,
      `We built a global economy dependent on moving 240,000 tons of steel through 300-meter canals.`,
      `It works through fluid dynamics math, 100,000-horsepower engines, and relentless pilot stewardship.`,
      `Engineering is invisible until it runs aground.`,
      `The megaship is not just a carrier; it is the physical heartbeat of global civilization.`,
      `Without continuous maritime throughput, modern prosperity cannot exist.`,
      `Hidden systems rule the world.`,
      `This is the Hidden Systems Lab.`
    ];

    const headlines = [
      'INVISIBLE CONDUITS', '240,000 TONS', 'FLUID MATHEMATICS', 'ENGINEERING STEWARDSHIP',
      'PHYSICAL HEARTBEAT', 'CONTINUOUS THROUGHPUT', 'HIDDEN SYSTEMS RULE', 'HIDDEN SYSTEMS LAB'
    ];

    const telemetry = [
      'INFRASTRUCTURE // MARITIME', 'SCALE // 240,000T VESSEL', 'HYDRODYNAMICS // MASTERED', 'STEWARDSHIP // 24/7/365',
      'HEARTBEAT // GLOBAL TRADE', 'THROUGHPUT // UNINTERRUPTED', 'GOVERNANCE // HIDDEN SYSTEMS', 'EPISODE 011 // MASTER'
    ];

    const prompts = [
      `Minimalist Apple Keynote slide: THE VISIBLE PRODUCT: CHEAP GOODS // THE HIDDEN PRODUCT: FLUID EQUILIBRIUM`,
      `Epic cinematic wide shot of 400m container ship cruising in open ocean under radiant golden hour sunset`,
      `Macro 35mm slow pan across ship bridge navigation console with green radar blips and compass gyro`,
      `3D schematic diagram showing edge hydrodynamics calculations balancing 240,000 tons in real time`,
      `Architectural master blueprint of world maritime shipping corridors in obsidian matte (#0D0E15) and electric acid yellow (#FFE500)`,
      `High-angle drone sweep revealing global port humming with synchronized crane movements and train logistics`,
      `Monumental typography card: HIDDEN SYSTEMS RULE THE WORLD in clean off-white (#F4F4F0) with acid yellow subtitle`,
      `Final closing identity card: HIDDEN SYSTEMS LAB // EPISODE MASTER 011 with sleek kinetic spring resolution`
    ];

    return {
      narrativeRole: roles[beatIndex % roles.length],
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: headlines[beatIndex % headlines.length],
      telemetryLabel: telemetry[beatIndex % telemetry.length],
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }
}



