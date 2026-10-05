import { HslNarrativeRole, HslVisualMode, EpisodeTopicInput, MotionIntent } from '../core/types';
import type { BeatStoryboardData } from './topicStoryboards';

/**
 * Canonical Storyboard for HSL Episode 029:
 * "BEHIND EVERY CLEAN AI PROMPT IS A SUBTERRANEAN BUNKER WITH ENOUGH DIESEL TO POWER A NAVAL DESTROYER"
 * Topic: Data Center Underground Diesel Storage & Continental Black Start
 * Rigorously 96 beats across 8 acts, 100% bespoke, zero repetitions, strictly en-US.
 * Conforms to HSL 0.2s HUD aesthetic: Obsidian (#07080B), Cyan (#00E5FF), Acid Yellow (#FFE500).
 */
export function getDataCenterDieselBeatData(actNumber: number, beatIndex: number, input: EpisodeTopicInput): BeatStoryboardData {
  const data = getDataCenterDieselStoryboardData(actNumber, beatIndex, input);

  const motion: Record<string, [MotionIntent, string]> = {
    '1:0': ['camera', 'Reveal the vast glowing AI server hall transitioning to the subterranean fuel bunker below.'],
    '1:1': ['physical', 'Show the massive 95-liter V16 turbodiesel generator block vibrating under preheated standby.'],
    '1:2': ['physical', 'Trace the high-pressure fuel manifold pulsating with pressurized diesel flow.'],
    '1:5': ['camera', 'Dolly through the soundproof bunker housing forty-eight emergency generator enclosures.'],
    '1:6': ['physical', 'Observe the kinetic energy storage flywheel spinning at 36,000 RPM in a magnetic vacuum.'],
    '1:7': ['camera', 'Pan across the medium-voltage paralleling switchgear control telemetry displays.'],
    '1:11': ['camera', 'Dramatic camera pullback from server racks through the floor slab into the buried fuel tanks.'],
    '2:2': ['physical', 'Follow pressurized diesel surging through double-walled carbon steel fuel transfer lines.'],
    '2:6': ['camera', 'Glide along the 100,000-gallon double-walled underground storage tank manifold.'],
    '2:7': ['physical', 'Observe pneumatic starter air receivers blasting 30-bar air into the engine starter turbines.'],
    '2:8': ['physical', 'Show the automated fuel polishing kidney-loop separators stripping microscopic water droplets.'],
    '2:13': ['physical', 'Watch vacuum circuit breakers snapping closed to synchronize generators onto the 13.8kV bus.'],
    '3:1': ['physical', 'Observe high-pressure common-rail fuel injectors atomizing diesel at 2,500 bar.'],
    '3:3': ['camera', 'Trace fuel consumption telemetry ramping to 11,600 gallons per hour across the cluster.'],
    '3:5': ['physical', 'Follow centrifugal pumps pushing 150 gallons per minute into elevated day tanks.'],
    '3:9': ['physical', 'Observe coalescing filter membranes extracting suspended water down to 50 parts per million.'],
    '3:10': ['camera', 'Follow fuel temperature conditioning circuits warming diesel to ASTM viscosity standards.'],
    '3:14': ['physical', 'Watch twin-turbochargers spooling to 100,000 RPM under sudden electrical load pickup.'],
    '5:0': ['camera', 'Zoom into external fuel suction lines frosting over in a sub-zero blizzard.'],
    '5:1': ['physical', 'Watch heavy paraffin wax molecules precipitating into cloudy gel inside cold fuel lines.'],
    '5:2': ['physical', 'Observe suction line differential pressure spiking as primary fuel strainers clog.'],
    '5:4': ['camera', 'Capture digital engine controller triggering under-frequency trip on starved generator.'],
    '5:6': ['physical', 'Show massive 3.5MW step load slamming across remaining synchronized generators.'],
    '5:8': ['physical', 'Watch bus frequency dipping through the 59.5 Hz emergency tolerance threshold.'],
    '5:10': ['camera', 'Observe thermal imaging cameras tracking rapid heat buildup in uncooled server racks.'],
    '5:13': ['physical', 'Watch AI processor nodes triggering emergency thermal shutdown to prevent silicon destruction.'],
    '6:0': ['camera', 'Track automated heat-tracing cables energizing along insulated fuel supply lines.'],
    '6:2': ['physical', 'Observe chemical anti-gel injection pumps dosing cold-flow improvers into day tanks.'],
    '6:5': ['physical', 'Watch pneumatic cross-tie valves actuating to reroute fuel from redundant reserve tanks.'],
    '6:7': ['physical', 'Follow isolated 250kW black-start generator powering auxiliary control switchboards.'],
    '7:0': ['camera', 'Reveal the dead continental grid transmission substation locked at zero electrical potential.'],
    '7:1': ['physical', 'Observe the black start synchronization sequence bootstrap from data center generation.'],
    '7:4': ['physical', 'Watch 500kV circuit breakers energizing long transmission lines without generator tripping.'],
    '7:5': ['camera', 'Survey the vast financial trading floor frozen in darkness during grid failure.'],
    '7:8': ['camera', 'Pan through the silent AI training cluster displaying lost checkpoint state loss.'],
    '7:9': ['camera', 'Track the economic ripple calculation quantifying the billion-dollar cost of a 10-second void.'],
    '8:0': ['camera', 'Drone glide over gleaming data center campus framed by high-voltage transmission pylons.'],
    '8:1': ['physical', 'Watch glowing server rack optical transceivers pulsating against heavy diesel exhaust stacks.'],
    '8:2': ['physical', 'Observe split-screen contrast: clean digital AI chat prompt on left, roaring V16 engine on right.'],
    '8:3': ['camera', 'Sweep across subterranean fuel manifold illuminated by amber engineering inspection lights.'],
    '8:4': ['physical', 'Macro camera glide along heavy stainless steel fuel injection rail under industrial spotlight.'],
    '8:5': ['camera', 'Silhouette of systems engineer monitoring SCADA grid telemetry inside blast-hardened NOC.'],
    '8:6': ['camera', 'Epic wide night shot of data center complex with diesel generator exhaust heat shimmer.'],
    '8:7': ['camera', 'Final resolving identity card: HIDDEN SYSTEMS LAB // AI RUNS ON DIESEL.'],
  };

  const selected = motion[`${actNumber}:${beatIndex}`];
  return {
    ...data,
    motionIntent: selected && !data.infographicArchetype ? selected[0] : 'none',
    motionReason: selected && !data.infographicArchetype ? selected[1] : 'Preserve technical precision of this infrastructure diagram or still frame.',
  };
}

function getDataCenterDieselStoryboardData(actNumber: number, beatIndex: number, _input: EpisodeTopicInput): BeatStoryboardData {
  if (actNumber === 1) {
    // ACT 1: THE HOOK & THE VISIBLE MIRACLE (12 beats)
    const roles: HslNarrativeRole[] = [
      'MONUMENTAL_HOOK', 'KINETIC_FLOW', 'KINETIC_FLOW', 'MATHEMATICAL_MODEL',
      'TECHNICAL_ANATOMY', 'KINETIC_FLOW', 'KINETIC_FLOW', 'EMERGENCY_DISPATCH',
      'BOUNDARY_LIMIT', 'MATHEMATICAL_MODEL', 'TECHNICAL_ANATOMY', 'CORE_THESIS'
    ];
    const role = roles[beatIndex % roles.length];
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 1 || beatIndex === 2 || beatIndex === 5 || beatIndex === 6 || beatIndex === 7 || beatIndex === 11)
      ? 'firefly_video'
      : 'generated_image_35mm';
    const archetype = (beatIndex === 3) ? 'CUTAWAY' : (beatIndex === 4 || beatIndex === 10) ? 'CUTAWAY' : (beatIndex === 9) ? '3D_MAP' : beatIndex === 8 ? 'MACRO_HUD' : undefined;

    const scripts = [
      'Behind every clean artificial intelligence prompt is a subterranean bunker with enough military-spec diesel fuel to power a naval destroyer for three days.',
      'When you ask an AI model to generate a line of code, the response appears in eight hundred milliseconds across a frictionless digital interface.',
      'Yet forty miles away, buried under five feet of blast-hardened concrete, sits an underground reserve of one million gallons of heavy diesel fuel.',
      'Modern artificial intelligence clusters require up to one hundred and fifty megawatts of continuous, uninterrupted electrical power.',
      'Forty-eight sixteen-cylinder turbodiesel engines, each displacing ninety-five liters, sit in permanent preheated standby.',
      'If the civilian transmission grid drops voltage for even sixteen milliseconds, the entire computational cluster would drop dead.',
      'Between complete digital blackout and continuous operation stands a ten-second gap bridged by kinetic flywheels spinning in magnetic vacuums.',
      'Before those ten seconds expire, dozens of massive diesel crankshafts must spin from zero to eighteen hundred RPM and lock frequency.',
      'How does a twenty-first-century neural network depend on nineteenth-century compression ignition engines to stay alive?',
      'The answer lies in energy density: neither batteries nor hydrogen can store seventy-two hours of autonomous gigawatt-scale islanding.',
      'Beneath the pristine server floors lies a high-pressure fuel manifold circulating hydrocarbons through secondary containment pipelines.',
      'This is the hidden subterranean architecture that keeps artificial intelligence from dying when the power grid collapses.'
    ];

    const prompts = [
      'Cinematic 35mm monumental split view: sleek glowing minimalist data center server aisle above ground, revealing subterranean concrete fuel vault below with massive steel pipes and cyan HUD vectors (#00E5FF), Arri Alexa LF 8k.',
      'Macro 35mm view of ultra-dense server rack packed with liquid-cooled AI processor blades, pulsing cyan fiber-optic cables and heat shimmer, authentic documentary lighting.',
      'High angle wide view inside a blast-hardened subterranean concrete fuel bunker, revealing ten massive cylindrical fuel storage tanks with yellow warning hazard stripes and industrial piping.',
      '3D architectural cutaway diagram of a 150-megawatt data center campus showing power distribution paths from high-voltage substation to underground generator yards, technical telemetry overlay.',
      'Dolly tracking shot alongside a row of Caterpillar C175-16 3.5MW industrial generator enclosures, heavy yellow steel machinery resting on vibration-isolation springs in deep shadows.',
      'SCADA electrical monitoring display flashing sudden GRID VOLTAGE DROP alert in red, oscilloscope wave showing grid frequency collapsing from 60.00 Hz to zero.',
      'Macro close-up of a high-speed kinetic energy storage flywheel spinning at 36,000 RPM inside an evacuated steel magnetic-levitation housing, glowing cyan sensor indicators.',
      'High-speed pneumatic starter turbine blasting compressed air into a 95-liter V16 engine block, blinding exhaust heat pulse and mechanical vibration, 35mm documentary still.',
      'Comparative volumetric energy density infographic HUD: battery array volume versus 1,000,000 gallons of diesel fuel on dark obsidian background (#07080B).',
      '3D isometric terrain map of continental power grid showing localized regional blackout spreading across transmission nodes, data center glowing as an isolated autonomous island.',
      'Macro technical cutaway of high-pressure carbon steel fuel manifold with automated solenoid valves, pressure transducers, and bright yellow telemetry line overlays.',
      'Epic cinematic dusk drone shot of massive hyperscale AI data center facility in Northern Virginia, exhaust stacks shimmering with heat against deep twilight sky, Arri Alexa 8k.'
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 3 ? 'POWER DENSITY' : beatIndex === 8 ? 'ENERGY DENSITY' : beatIndex === 9 ? 'AUTONOMOUS ISLAND' : undefined,
      telemetryLabel: beatIndex === 3 ? 'CLUSTER LOAD // 150 MW' : beatIndex === 8 ? 'FUEL RESERVE // 1M GAL' : beatIndex === 10 ? 'STANDBY BUS // 13.8 KV' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 2) {
    // ACT 2: THE PHYSICAL ANATOMY & LAYER BREAKDOWN (14 beats)
    const visualMode: HslVisualMode = (beatIndex === 2 || beatIndex === 6 || beatIndex === 7 || beatIndex === 8 || beatIndex === 13)
      ? 'firefly_video'
      : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 1 || beatIndex === 3 || beatIndex === 4 || beatIndex === 9 || beatIndex === 10 || beatIndex === 11 || beatIndex === 12)
      ? 'CUTAWAY'
      : (beatIndex === 5) ? 'MACRO_HUD' : undefined;

    const scripts = [
      'To understand how this mechanical fortress operates, we must dissect the multi-layered anatomy of an AI backup power plant.',
      'Above ground sits the computing cluster: hundreds of thousands of tensor processing units generating intense thermodynamic heat.',
      'Directly adjacent rests the generator compound: forty-eight custom acoustical enclosures housing sixteen-cylinder Cummins QSK95 engines.',
      'Each engine displaces ninety-five liters, breathes through four turbochargers, and produces four thousand continuous mechanical horsepower.',
      'Beneath the surface lies the primary fuel farm: ten double-walled steel storage tanks buried under reinforced concrete slabs.',
      'Each tank holds one hundred thousand gallons of military-specification ultra-low-sulfur diesel under inert nitrogen vapor padding.',
      'Secondary containment jackets ensure that even a catastrophic tank rupture cannot breach into surrounding groundwater aquifers.',
      'Dual-redundant positive displacement transfer pumps continuously circulate fuel through an underground loop at four bar of pressure.',
      'Beside each generator sits a five-hundred-gallon belly day tank providing four hours of gravity-assisted fuel flow.',
      'To crank these massive engines without relying on chemically fragile lead-acid batteries, engineers utilize pneumatic air-start systems.',
      'High-pressure air receivers store compressed air at thirty bar, driving pneumatic starter motors that spin the crankshaft instantaneously.',
      'Medium-voltage vacuum switchgear lineups synchronize all forty-eight generators onto a common thirteen-point-eight-kilovolt bus in under ten seconds.',
      'Automated fuel polishing loops run continuously twenty-four hours a day, circulating the entire reserve through three-stage filtration.',
      'This mechanical infrastructure ensures that an AI facility can withstand the total collapse of the surrounding civilian civilization.'
    ];

    const prompts = [
      'Exploded 3D architectural cutaway diagram of a hyperscale Tier IV AI data center, displaying server floor, generator yard, and subterranean fuel bunker in vertical strata.',
      'Wide angle 35mm view down a glowing server hall aisle with liquid-cooling distribution manifolds pumping dielectric coolant to processor racks, Arri Alexa LF.',
      'Cinematic tracking shot along a row of heavy acoustic generator enclosures in an industrial gravel compound, security fencing and overhead cable trays.',
      'Macro cutaway of a 95-liter quad-turbocharged V16 diesel engine block, showing polished forged crankshaft, pistons, and twin overhead camshafts in technical precision.',
      '3D underground visualization of ten 100,000-gallon double-walled steel fuel storage tanks resting in subterranean concrete vaults with leak detection sensors.',
      'Technical schematic HUD displaying interstitial vacuum monitoring between inner and outer tank walls, green integrity status indicators.',
      'Cutaway diagram of dual-walled schedule 40 carbon steel fuel piping with annular leak-detection cable and pneumatic isolation valves.',
      'Macro close-up of positive displacement dual-redundant fuel transfer pump with high-torque electric motor and polished stainless steel pressure gauges.',
      'Isometric view of an elevated 500-gallon generator day tank showing dual float switches, secondary containment basin, and overflow return lines.',
      'Pneumatic starter air tank bank rated at 30 bar with forged brass relief valves and braided stainless steel high-pressure hoses, 35mm industrial photo.',
      'Detailed mechanical diagram of a vane-type pneumatic starter motor engaging the massive engine flywheel ring gear with burst of compressed gas.',
      'Wide view inside medium-voltage switchgear gallery, floor-to-ceiling metal-clad cabinets with vacuum circuit breaker trucks and digital relay meters.',
      'High-tech fuel polishing filtration skid with three-stage coalescing canisters, magnetic separator tubes, and digital turbidity telemetry screens.',
      'Cinematic low-angle dusk shot of high-voltage generator bus ducts entering the data center electrical substation under security floodlights.'
    ];

    return {
      narrativeRole: 'TECHNICAL_ANATOMY',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'PHYSICAL ANATOMY' : beatIndex === 4 ? 'SUBTERRANEAN FARM' : undefined,
      telemetryLabel: beatIndex === 0 ? 'GENSETS // 48 UNITS' : beatIndex === 4 ? 'STORAGE // 1,000,000 GAL' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 3) {
    // ACT 3: THE FLOW DYNAMICS & THROUGHPUT MATH (16 beats)
    const visualMode: HslVisualMode = (beatIndex === 1 || beatIndex === 3 || beatIndex === 5 || beatIndex === 9 || beatIndex === 10 || beatIndex === 14)
      ? 'firefly_video'
      : 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 4 || beatIndex === 6 || beatIndex === 7 || beatIndex === 13 || beatIndex === 15)
      ? '3D_MAP'
      : (beatIndex === 2 || beatIndex === 8 || beatIndex === 11 || beatIndex === 12) ? 'MACRO_HUD' : undefined;

    const scripts = [
      'The thermodynamic math governing a hyperscale AI data center under emergency power is staggering.',
      'At full electrical load, a single 3.5-megawatt generator consumes two hundred and forty-two gallons of diesel fuel every sixty minutes.',
      'When forty-eight generators fire simultaneously to support a 150-megawatt cluster, fuel consumption reaches 11,616 gallons per hour.',
      'In a single twenty-four-hour period of grid collapse, the facility drinks nearly two hundred and eighty thousand gallons of diesel.',
      'Over the mandatory seventy-two-hour survival window, the engines consume eight hundred and thirty-six thousand gallons.',
      'That is equivalent to emptying eighty-four heavy commercial highway tanker trucks into the combustion chambers.',
      'Yet storing one million gallons of diesel fuel introduces a lethal chemical vulnerability: fuel stagnation and decay.',
      'Unlike crude oil, refined ultra-low-sulfur diesel begins degrading within six to twelve months of subterranean storage.',
      'Diurnal temperature cycles cause moisture in the air headspace to condense on tank walls and pool at the bottom.',
      'At the water-fuel interface, anaerobic bacteria and the fungus Hormoconis resinae proliferate, feeding on hydrocarbons.',
      'This microbial growth produces acidic metabolic sludge and particulate matter that suspends in the fuel column.',
      'Modern common-rail fuel injectors operate at tolerances of two microns under twenty-five hundred bar of hydrostatic pressure.',
      'If microscopic sludge particles bypass the fuel filters, injector nozzles erode and spray patterns collapse in milliseconds.',
      'A single malfunctioning fuel injector triggers cylinder exhaust temperature divergence, forcing the engine controller to trip.',
      'To prevent this catastrophe, automated kidney-loop polishing systems cycle the entire million-gallon reserve every twenty-eight days.',
      'Coalescing membranes strip emulsified water down to fifty parts per million, ensuring pure combustion during a grid emergency.'
    ];

    const prompts = [
      '3D dynamic energy throughput diagram: 11,616 gallons per hour fuel flow vector splitting into 48 parallel generator combustion paths.',
      'Cinematic close-up of heavy digital flowmeter showing 242.0 GPH fuel rate on industrial backlit liquid crystal display, 35mm documentary.',
      'Telemetry graph card comparing cluster load curve against hourly diesel burn rate: [48 ENGINES] ➔ [11,616 GPH] ➔ [150 MEGAWATTS].',
      'High angle visual of 84 commercial highway fuel tanker trucks parked in a vast grid, illustrating the physical volume of a 72-hour burn.',
      'Time-lapse volumetric bar graph showing million-gallon fuel reserve depleting hour by hour across a 72-hour blackout duration.',
      'Subterranean cutaway showing massive underground fuel ring main with high-speed fluid velocity streamlines highlighted in glowing cyan (#00E5FF).',
      'Macro scientific cross-section of diesel fuel layer inside dark steel tank, showing water droplets condensing and sinking to the floor.',
      'Microscopic optical visualization of Hormoconis resinae fungal mats and bacterial biofilm growing at the dark diesel-water interface.',
      'Technical HUD diagram showing acidic biomass and oxidized asphalthene particles suspended in degraded diesel fuel.',
      'Ultra-macro cutaway of common-rail fuel injector nozzle tip, showing micro-orifices spraying fuel mist at 2,500 bar pressure.',
      'CFD simulation of fuel spray atomization inside diesel combustion chamber, showing distorted flame pattern caused by microscopic injector wear.',
      'SCADA engine cylinder balance monitor showing temperature deviation alarm on cylinder seven exhaust thermocouple in red alert.',
      '3D architectural cutaway of automated fuel polishing filtration station with electric pumps and dual coalescer filter vessels.',
      'Macro slow-motion tracking shot of fuel passing through specialized water-separation membrane, water beads trapped while clean fuel flows.',
      'Chemical test vial of pristine clear amber diesel fuel illuminated by bright inspection spotlight, labeled ASTM D975 COMPLIANT.',
      'Kinetic Sankey diagram showing continuous kidney-loop recirculation: [1M GAL RESERVE] ➔ [COALESCERS] ➔ [POLISHED DIESEL <50 PPM H2O].'
    ];

    return {
      narrativeRole: 'MATHEMATICAL_MODEL',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'BURN RATE MATH' : beatIndex === 7 ? 'FUEL DEGRADATION' : undefined,
      telemetryLabel: beatIndex === 0 ? 'FLOW // 11,616 GPH' : beatIndex === 2 ? 'CLUSTER // 150 MW' : beatIndex === 7 ? 'WATER // <50 PPM' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 4) {
    // ACT 4: THE PHYSICAL LIMIT & BOUNDARY CONDITION (12 beats)
    const visualMode: HslVisualMode = 'generated_image_35mm';
    const archetype = (beatIndex === 0 || beatIndex === 1 || beatIndex === 4 || beatIndex === 5 || beatIndex === 8 || beatIndex === 9 || beatIndex === 11)
      ? 'MACRO_HUD'
      : (beatIndex === 2 || beatIndex === 3 || beatIndex === 7) ? 'CUTAWAY' : '3D_MAP';

    const scripts = [
      'The ultimate operational boundary of an AI data center is the ten-second transfer interval mandated by NFPA 110 Type 10 standards.',
      'Server power supplies maintain direct-current output for only sixteen to twenty milliseconds after AC voltage is lost.',
      'If the power transfer takes twenty-one milliseconds without battery support, hundreds of thousands of AI processors crash instantaneously.',
      'To bridge the gap between grid failure and generator full-load pickup, kinetic flywheels and battery banks supply instant synthetic inertia.',
      'These uninterrupted power systems carry the entire 150-megawatt computational load for up to thirty seconds.',
      'Within those first ten seconds, all forty-eight diesel generators must execute a synchronized emergency start sequence.',
      'Taking a cold thirty-ton engine block from standstill to eighteen hundred RPM in under eight seconds causes violent mechanical stress.',
      'To prevent catastrophic metal-on-metal seizure, electric immersion heaters maintain engine jacket water at forty-nine degrees Celsius permanently.',
      'Continuous pre-lubrication pumps circulate warm oil through engine crankshaft bearings day and night, year-round.',
      'A second boundary condition governs electrical frequency: AI server power supplies will trip if line frequency drifts by more than 0.5 Hertz.',
      'If generator frequency drops below 59.5 Hz or exceeds 60.5 Hz, protective relays disconnect the servers from the generator bus.',
      'Digital electronic governors must react within fifty milliseconds to throttle fuel racks and counter massive electrical load transients.'
    ];

    const prompts = [
      'NFPA 110 Type 10 emergency timing diagram: 10.00-second critical timeline split into grid loss, UPS takeover, diesel crank, and bus synchronization.',
      'Oscilloscope waveform telemetry showing 16-millisecond server power supply capacitor discharge curve in sharp red line decay.',
      '3D visualization of server hall during blackout, showing instant seamless power handoff to glowing underground kinetic flywheel bank.',
      'Cutaway diagram of high-density lithium-iron-phosphate (LFP) energy storage container delivering 150 megawatts of instant power.',
      'High-speed telemetry telemetry display of 48 generator engine RPM tachometers accelerating in unison from 0 to 1,800 RPM in 7.8 seconds.',
      'Thermal camera view of 30-ton industrial engine block during rapid start, showing uniform thermal distribution maintained by preheating heaters.',
      'Macro cutaway of engine cylinder wall showing electric immersion heater circulating 49°C jacket water through coolant jackets.',
      'Industrial electric oil pre-lube pump mounted to engine oil pan, continuous oil pressure gauge holding steady at 2.5 bar in standby.',
      'Electrical frequency stability envelope graph: strict tolerance band between 59.50 Hz and 60.50 Hz with transient excursion limits.',
      'Protective relay digital control screen displaying UNDER-FREQUENCY TRIP THRESHOLD at 59.45 Hz with 100ms timer countdown.',
      'Macro view of digital electronic engine governor actuator responding with high-speed micro-stepper motor adjusting fuel rack linkage.',
      'Composite telemetry HUD summarizing boundary tolerances: [TRANSFER: 10.0S] // [FREQ MARGIN: ±0.50 HZ] // [PRE-HEAT: 49°C].'
    ];

    return {
      narrativeRole: 'BOUNDARY_LIMIT',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'THE 10-SECOND VOID' : beatIndex === 9 ? 'FREQUENCY ENVELOPE' : undefined,
      telemetryLabel: beatIndex === 0 ? 'WINDOW // 10.0 SEC' : beatIndex === 7 ? 'PRE-HEAT // 49°C' : beatIndex === 9 ? 'TOLERANCE // ±0.50 HZ' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 5) {
    // ACT 5: THE BOTTLENECK & STRAIN BREAKDOWN (14 beats)
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 1 || beatIndex === 2 || beatIndex === 4 || beatIndex === 5 || beatIndex === 6 || beatIndex === 8 || beatIndex === 9 || beatIndex === 10 || beatIndex === 13)
      ? 'firefly_video'
      : 'generated_image_35mm';
    const archetype = (beatIndex === 3 || beatIndex === 7 || beatIndex === 11) ? 'MACRO_HUD' : undefined;

    const scripts = [
      'The nightmare scenario begins when an extreme winter vortex triggers cascading blackouts across the civilian high-voltage grid.',
      'Outside, ambient temperatures plummet to minus twenty-five degrees Celsius while heavy ice downs regional transmission towers.',
      'The data center transfers seamlessly to backup power: all forty-eight diesel generators roar to life and lock onto the bus.',
      'By hour eighteen of the blackout, highway closures and icy roads prevent commercial diesel tanker deliveries from reaching the site.',
      'Outside the bunker, sub-zero winds strike unheated exterior fuel suction lines and balance pipes.',
      'Diesel fuel contains heavy paraffin wax molecules that precipitate out of solution when temperatures cross the wax appearance point.',
      'At minus fifteen degrees, paraffin wax crystals agglomerate into a thick, cloudy gel that coats interior pipe walls.',
      'The waxy paraffin gel clogs primary suction strainers, causing fuel transfer pump inlet pressure to drop toward cavitation.',
      'Generator twelve experiences fuel starvation; its electronic control module detects lost common-rail pressure and trips the unit.',
      'The remaining forty-seven generators instantly absorb an unexpected 3.2-megawatt step load, causing bus frequency to dip.',
      'Bus frequency sags to 59.3 Hertz, crossing the emergency threshold and triggering automated load-shedding relays.',
      'To protect the core processors, building automation systems cut electrical power to secondary chiller cooling towers.',
      'Without mechanical chilled water, temperatures inside the high-density server halls climb at a rate of one degree every twelve seconds.',
      'Within four minutes, AI processor junction temperatures hit one hundred and five degrees, forcing emergency thermal throttling and shutdown.'
    ];

    const prompts = [
      'Cinematic wide shot of data center complex engulfed in a violent winter blizzard at night, snow drifting against concrete perimeter barriers, 35mm Arri.',
      'High-voltage transmission line collapsing under heavy ice load, brilliant blue electrical arc flash illuminating snow-covered landscape.',
      'Subterranean generator gallery with 48 heavy diesel engines operating at full load, exhaust manifolds glowing dull cherry red under industrial lighting.',
      'Aerial view of snowbound highway with commercial fuel tanker trucks stranded in massive snowdrifts, unable to navigate.',
      'Thermal imaging view of uninsulated external fuel pipe transitioning from green warmth to deep freezing blue and purple, ice forming on steel flanges.',
      'Microscopic laboratory visualization of paraffin wax molecules precipitating into sharp interlocking crystalline needles in cold diesel fuel.',
      'Macro cutaway of primary fuel basket strainer completely clogged with thick white waxy paraffin gel, blocking diesel flow.',
      'Suction pressure gauge needle plummeting into negative vacuum territory (-0.8 bar), flashing LOW SUCTION PRESSURE alert.',
      'Generator control panel displaying ENGINE 12 TRIP // LOSS OF FUEL RAIL PRESSURE in bright amber alarm box.',
      'Electrical bus telemetry graph displaying sudden step-load spike and frequency dip dropping sharply through 59.30 Hz.',
      'Automated switchgear load-shedding matrix illuminating, red breakers opening to disconnect building chiller circuits.',
      'Dolly shot down uncooled server aisle as red alert lights pulse, digital temperature display on rack door climbing from 24°C to 45°C.',
      'Infrared FLIR camera footage of Nvidia AI processor blades glowing white-hot as cooling fluid flow ceases, thermal gradient surging.',
      'Master NOC control room video wall showing cascading red server node offline alerts, cluster throughput flatlining to zero.'
    ];

    return {
      narrativeRole: 'EMERGENCY_DISPATCH',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 3 ? 'FUEL FREEZING' : beatIndex === 10 ? 'LOAD SHED' : undefined,
      telemetryLabel: beatIndex === 3 ? 'TEMP // -25°C' : beatIndex === 7 ? 'SUCTION // VACUUM' : beatIndex === 10 ? 'FREQ // 59.30 HZ' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 6) {
    // ACT 6: THE EMERGENCY WORKAROUND & HIDDEN MARGINS (10 beats)
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 2 || beatIndex === 5 || beatIndex === 7)
      ? 'firefly_video'
      : 'generated_image_35mm';
    const archetype = (beatIndex === 1 || beatIndex === 3 || beatIndex === 6 || beatIndex === 9)
      ? 'CUTAWAY'
      : (beatIndex === 4 || beatIndex === 8) ? 'MACRO_HUD' : undefined;

    const scripts = [
      'To survive catastrophic weather and mechanical failure, modern hyperscale facilities are fortified with multi-redundant engineering margins.',
      'All critical fuel transfer pipelines are equipped with electric self-regulating heat tracing cables beneath thick mineral wool insulation.',
      'Automated chemical dosing skids inject cold-flow improvers and de-icing additives directly into fuel headers when temperatures plunge.',
      'A cross-tie fuel manifold network enables operators to isolate any clogged supply line and draw fuel from any of the ten underground tanks.',
      'Every Tier IV installation is designed with N-plus-two generator redundancy, ensuring full power even if two entire units fail.',
      'Pneumatic cross-connect lines allow compressed air from any operational starting bank to recharge depleted receivers across the plant.',
      'Massive subterranean thermal energy storage tanks provide hundreds of thousands of gallons of chilled water buffer without chillers.',
      'Isolated black-start diesel generators can bootstrap the facility from absolute zero electrical potential without any grid reference.',
      'Automated secondary radiator loops reject waste heat back into subterranean fuel tanks, warming the diesel reserve naturally.',
      'Emergency defense logistics contracts pre-authorize National Guard escorts for commercial fuel convoys during civil blackout declarations.'
    ];

    const prompts = [
      'Technical cutaway of fuel pipe showing braided self-regulating electric heat-trace cable spiraled around steel pipe beneath silver jacket.',
      'Automatic chemical metering injection pump delivering blue anti-gel fluid into pressurized fuel manifold with digital ppm readout.',
      '3D architectural manifold diagram showing automated three-way motor-operated valves rerouting fuel flows around isolated pipeline section.',
      'Aerial diagram of generator compound showing N+2 redundancy configuration with two spare generators highlighted in green ready status.',
      'High-pressure stainless steel pneumatic cross-connect header linking air receivers, forged brass valves glowing under emergency lighting.',
      'Underground concrete chilled water thermal storage reservoir holding 500,000 gallons of 6°C water, high-volume turbine pumps circulating.',
      'Dedicated 250kW black-start generator set inside blast-proof annex, starting up from 24V battery bank to power auxiliary switchboards.',
      'Thermal reclamation schematic showing engine jacket water heat exchangers transferring waste heat to warm subterranean diesel tanks.',
      'FLIR thermal camera display showing underground fuel tanks maintaining uniform 20°C temperature despite surface blizzard.',
      'Military-spec emergency transport convoy: heavy Oshkosh tactical fuel tankers entering data center security gates under heavy snowfall.'
    ];

    return {
      narrativeRole: 'EMERGENCY_DISPATCH',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'HEAT TRACING' : beatIndex === 4 ? 'N+2 REDUNDANCY' : undefined,
      telemetryLabel: beatIndex === 1 ? 'TRACE POWER // 25 W/M' : beatIndex === 4 ? 'REDUNDANCY // N+2' : beatIndex === 7 ? 'BLACK START // READY' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  if (actNumber === 7) {
    // ACT 7: SYSTEMIC CONSEQUENCES & ECONOMIC RIPPLE (10 beats)
    const visualMode: HslVisualMode = (beatIndex === 0 || beatIndex === 1 || beatIndex === 4 || beatIndex === 5 || beatIndex === 8 || beatIndex === 9)
      ? 'firefly_video'
      : 'generated_image_35mm';
    const archetype = (beatIndex === 2 || beatIndex === 3 || beatIndex === 6 || beatIndex === 7) ? 'MACRO_HUD' : undefined;

    const scripts = [
      'The dependence of digital civilization on subterranean diesel fuel reveals a profound systemic paradox.',
      'When a continental power grid collapses to zero volts and zero Hertz, restarting it is an extraordinary physical challenge known as Black Start.',
      'Modern renewable grids dominated by wind and solar inverters cannot self-restart because they lack mechanical synchronous inertia.',
      'Conventional nuclear and thermal power stations cannot start without gigawatts of external electricity to drive auxiliary feedwater pumps.',
      'In this vacuum of electrical potential, the massive diesel generator farms of high-density data centers represent unintentional microgrids.',
      'Transmission system operators are now drafting emergency protocols to contract data center generator capacity to back-feed transmission lines.',
      'By energizing high-voltage substations from data center diesel farms, grid operators can bootstrap regional transmission corridors.',
      'The economic cost of this autonomy is staggering: building out 150 megawatts of emergency diesel infrastructure exceeds one hundred million dollars.',
      'Yet the cost of failure is vastly higher: an ungraceful shutdown of an AI training run destroys months of checkpoint weights and costs millions per hour.',
      'To protect immaterial mathematical algorithms, human civilization has constructed the largest decentralized hydrocarbon fortress in history.'
    ];

    const prompts = [
      'Monumental wide view of massive 765kV high-voltage substation standing dark and silent under an overcast stormy sky, zero voltage telemetry.',
      'Electrical physics diagram showing inverter-based renewable grid lacking physical rotating inertia, unable to establish voltage reference.',
      'Cutaway of massive nuclear power station turbine hall standing silent, auxiliary feed pumps locked in darkness waiting for outside power.',
      '3D continental grid map showing data center generator farms illuminating as islands of power, sending current outward into dead lines.',
      'Transmission substation switchyard with high-voltage disconnect switches closing, sending power from data center back into regional grid.',
      'Regional grid control room with transmission operators coordinating Black Start restoration sequence on illuminated continental map displays.',
      'Financial capital expenditure audit graphic: [DIESEL GENSETS: $72M] // [FUEL VAULTS: $28M] // [SWITCHGEAR: $22M] // [TOTAL: $122M].',
      'Data center NOC dashboard displaying financial risk calculation: [TRAINING INTERRUPTION COST: $15M/HR] // [CHECKPOINT DATA VALUE: $80M].',
      'Macro 35mm view of crystalline silicon AI chip wafer overlaid with transparent blueprint of a 16-cylinder diesel engine combustion chamber.',
      'Cinematic twilight drone shot of data center complex, generator exhaust plumes rising into sky as high-voltage lines stretch into the horizon.'
    ];

    return {
      narrativeRole: 'CORE_THESIS',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'BLACK START PARADOX' : beatIndex === 7 ? 'CAPITAL COST' : undefined,
      telemetryLabel: beatIndex === 0 ? 'GRID VOLTAGE // 0.00 V' : beatIndex === 4 ? 'ISLAND MICROGRID' : beatIndex === 7 ? 'INFRASTRUCTURE // $122M' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  // ACT 8: ORIGINAL THESIS & SYSTEM ARCHITECTURE (8 beats)
  const visualMode: HslVisualMode = 'firefly_video';
  const scripts = [
    'We imagine the digital world exists in a weightless cloud of pure mathematics and clean computation.',
    'The physical reality is that the entire digital frontier is anchored to heavy steel crankshafts and subterranean diesel fuel.',
    'Behind every artificial intelligence prompt, every automated trade, and every neural network model stands Rudolph Diesel’s compression cycle.',
    'Civilization has not transcended the laws of thermodynamics; it has merely concealed the mechanical brute force that sustains it.',
    'When the civilian electrical grid drops to zero, artificial intelligence does not run on algorithms. It runs on diesel.',
    'Separating the digital future from total thermodynamic collapse is an underground fuel manifold and ten seconds of mechanical inertia.',
    'The engineers who steward this buried hydrocarbon grid preserve the invisible foundation of the modern mind.',
    'This is the Hidden Systems Lab.'
  ];

  const headlines = [
    'THE DIGITAL ILLUSION', 'MECHANICAL ANCHOR', 'COMPRESSION IGNITION', 'THERMODYNAMIC REALITY',
    'AI RUNS ON DIESEL', 'THE 10-SECOND MARGIN', 'STEWARDS OF THE GRID', 'HIDDEN SYSTEMS LAB'
  ];

  const telemetry = [
    'CLOUD ILLUSION', 'STEEL & DIESEL // 1M GAL', 'CYCLE // 1,800 RPM', 'THERMODYNAMICS // ABSOLUTE',
    'FUEL BUFFER // 72 HOURS', 'WINDOW // 10.0 SECONDS', 'STEWARDSHIP // 24/7/365', 'HSL_EPISODE_029 // MASTER'
  ];

  const prompts = [
    'Cinematic wide tracking shot through glass data center conference room looking out at endless rows of gleaming server cabinets, Arri Alexa LF 8k.',
    '3D artistic visual blending: transparent glowing AI neural network lattice anchored directly into heavy cast-iron engine block below.',
    'Slow dolly shot alongside a polished chrome and yellow V16 industrial turbodiesel generator in museum-grade spotlighting.',
    'Hero panoramic montage linking modern digital devices: smartphones, server clusters, autonomous vehicles, linked to glowing underground fuel pipes.',
    'Monumental typography card on matte obsidian: AI RUNS ON DIESEL in high-contrast clean architectural font with cyan telemetry brackets.',
    'Macro 35mm view of industrial pressure transmitter and stainless steel fuel manifold bathed in warm amber inspection light.',
    'Silhouette of systems engineer in high-visibility protective gear standing before glowing SCADA monitoring wall in data center NOC.',
    'Final minimalist closing identity card: HIDDEN SYSTEMS LAB // EPISODE 029 // MASTER DOCUMENTARY.'
  ];

  return {
    narrativeRole: 'CORE_THESIS',
    visualMode,
    infographicArchetype: undefined,
    graphicHeadline: headlines[beatIndex % headlines.length],
    telemetryLabel: telemetry[beatIndex % telemetry.length],
    voiceoverScript: scripts[beatIndex % scripts.length],
    promptSubject: prompts[beatIndex % prompts.length]
  };
}
