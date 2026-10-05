import { HslNarrativeRole, HslVisualMode, EpisodeTopicInput, MotionIntent } from '../core/types';
import type { BeatStoryboardData } from './topicStoryboards';

/**
 * Canonical Storyboard for HSL Episode 020:
 * "THE 20-YEAR FLAME: WHY A BLAST FURNACE CAN NEVER BE SHUT DOWN"
 * Rigorously 96 beats across 8 acts, 100% bespoke, zero repetitions, strictly en-US.
 */
export function getBlastFurnaceBeatData(actNumber: number, beatIndex: number, input: EpisodeTopicInput): BeatStoryboardData {
  const data = getBlastFurnaceStoryboardData(actNumber, beatIndex, input);
  
  const motion: Record<string, [MotionIntent, string]> = {
    '1:0': ['camera', 'Reveal the 80-meter towering blast furnace superstructure in the night opening hook.'],
    '1:1': ['physical', 'Show the river of 1,500°C molten iron flowing through refractory runners.'],
    '1:2': ['physical', 'Observe the 60mm outer steel mantle resisting the internal inferno.'],
    '1:5': ['camera', 'Follow the revolving bell-less top chute charging ore and coke into the throat.'],
    '1:6': ['physical', 'Show high-pressure industrial pumps pulsating with cooling water flow.'],
    '1:7': ['camera', 'Pan across the blast furnace control room telemetry alert screens.'],
    '1:11': ['camera', 'Drone pullback from the glowing furnace top to resolve the unbroken 20-year flame.'],
    '2:2': ['physical', 'Follow descending burden layers expanding under rising thermal currents.'],
    '2:6': ['camera', 'Glide along the massive 3-meter refractory bustle pipe encircling the furnace.'],
    '2:7': ['physical', 'Observe supersonic 1,200°C blast air rushing through forged copper tuyeres.'],
    '2:8': ['physical', 'Show the three 50-meter Cowper regenerative stoves cycling hot blast gas.'],
    '2:13': ['physical', 'Observe the pneumatic drill opening the clay taphole plug under intense sparks.'],
    '3:1': ['physical', 'Watch the incandescent swirling coke combustion inside the tuyere raceway.'],
    '3:3': ['camera', 'Trace high-velocity carbon monoxide gas ascending through porous burden pellets.'],
    '3:5': ['physical', 'Track the slow downward crawl of burden materials moving under gravity.'],
    '3:9': ['physical', 'Observe turbulent cooling water stripping heat from internal stave channels.'],
    '3:10': ['camera', 'Follow water stream velocity vectors maintaining forced convection.'],
    '3:14': ['physical', 'Watch molten pig iron pouring into heavy 300-ton torpedo ladle railcars.'],
    '5:0': ['camera', 'Zoom into thermal stress microcracks spreading across fatigued copper stave.'],
    '5:1': ['physical', 'Watch high-pressure cooling water flashing into steam upon contacting liquid iron.'],
    '5:2': ['physical', 'Observe the steam and hydrogen gas explosion shockwave rippling through burden.'],
    '5:4': ['camera', 'Capture top explosion relief bleeder valves lifting with deafening roar.'],
    '5:6': ['physical', 'Show the 10,000-ton hanging burden slipping violently downward like a piston.'],
    '5:8': ['physical', 'Watch molten metal backdrafting into blowpipe goose-neck assembly.'],
    '5:10': ['camera', 'Observe operators desperately drilling tapholes against frozen iron crust.'],
    '5:13': ['physical', 'Watch the incandescent orange glow dying into sullen red ash and steam.'],
    '6:0': ['camera', 'Track automated emergency backup systems activating inside armored annex.'],
    '6:2': ['physical', 'Observe gravity water tower supply maintaining stave hydrostatic head.'],
    '6:5': ['physical', 'Watch snort valve venting thousands of cubic meters of compressed hot blast.'],
    '6:7': ['physical', 'Follow molten metal rushing through emergency sand runner channels.'],
    '7:0': ['camera', 'Reveal the frozen 2,000-ton salamander monolith locking the entire hearth.'],
    '7:1': ['physical', 'Observe the cold, impenetrable crystalline fracture of solid dead pig iron.'],
    '7:4': ['physical', 'Watch demolition crew drilling dynamite blast holes into the frozen bear.'],
    '7:5': ['camera', 'Survey heavy cranes dismantling the ruined structural shell in the aftermath.'],
    '7:8': ['camera', 'Pan through cold, idle automotive assembly line stalled by steel outage.'],
    '7:9': ['camera', 'Track financial commodity exchange ticker registering global steel price shock.'],
    '8:0': ['camera', 'Drone glide over gleaming modern suspension bridge and city skyscrapers.'],
    '8:1': ['physical', 'Watch glowing red-hot structural steel beam exiting continuous rolling stand.'],
    '8:2': ['physical', 'Observe split-screen balance of 2,200°C flame against high-velocity cooling water.'],
    '8:3': ['camera', 'Sweep across modern rail, bridge, and container ship network built of steel.'],
    '8:4': ['physical', 'Macro camera glide along chilled copper stave wall under industrial spotlight.'],
    '8:5': ['camera', 'Silhouette of blast furnace operator gazing up at the roaring 80-meter tower.'],
    '8:6': ['camera', 'Epic wide night shot of glowing blast furnace against obsidian industrial sky.'],
    '8:7': ['camera', 'Final resolving identity card: HIDDEN SYSTEMS LAB // THE 20-YEAR FLAME.'],
  };

  const selected = motion[`${actNumber}:${beatIndex}`];
  return {
    ...data,
    motionIntent: selected && !data.infographicArchetype ? selected[0] : 'none',
    motionReason: selected && !data.infographicArchetype ? selected[1] : 'Preserve the precision of this blast furnace engineering explanation as a still or technical diagram.',
  };
}

function getBlastFurnaceStoryboardData(actNumber: number, beatIndex: number, _input: EpisodeTopicInput): BeatStoryboardData {
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
      'Inside a 5,000-cubic-meter blast furnace, a 2,200-degree inferno has been burning continuously without stopping for over twenty years.',
      'Every single day, this single industrial reactor converts forty thousand tons of solid iron ore into twelve thousand tons of pure molten iron.',
      'Yet the outer steel shell containing this volcanic reaction is only sixty millimeters thick.',
      'Between the 2,200-degree core and catastrophic structural failure stands a closed loop of copper cooling staves circulating 30,000 cubic meters of water every hour.',
      'Thirty-six water-cooled forged copper tuyeres blast preheated air at supersonic velocities directly into the lower core.',
      'You cannot simply turn off a blast furnace for the weekend or idle it like a car engine.',
      'If electrical power to the cooling pumps fails for just ninety seconds, radiant heat melts the copper staves and triggers explosive steam detonations.',
      'The visible product is structural steel; the hidden product is continuous, unyielding thermodynamic containment.',
      'How does copper survive temperatures hundreds of degrees above its own melting point?',
      'The answer lies in an auto-regenerative skull: the intense cold of the copper freezes a thin layer of liquid slag against itself, creating a perpetual ceramic shield.',
      'Beneath this firestorm rests the carbon refractory hearth holding thousands of tons of liquid iron under four atmospheres of continuous gas pressure.',
      'This is the uninterrupted thermodynamic balance that has kept a single fire burning day and night for two decades.'
    ];

    const prompts = [
      'Cinematic 35mm monumental wide shot of integrated steel blast furnace illuminated at night, towering 80 meters tall with glowing molten orange cast house floor, Arri Alexa LF 8k, authentic physical textures.',
      'Slow tracking shot following glowing river of 1500°C liquid pig iron flowing through serpentine refractory floor troughs, incandescent bright sparks and heat shimmer, 35mm documentary.',
      'Macro cutaway detail of 60mm structural steel blast furnace mantle with glowing interior refractory brick, sharp technical engineering aesthetics, 35mm Arri Alexa LF.',
      '3D architectural cutaway diagram of copper cooling stave showing serpentine internal cooling channels with pressurized demineralized water flow, blue and yellow telemetry overlays.',
      'Macro technical cutaway of forged copper blast tuyere glowing red-hot while pressurized water channels chill its outer jacket, high velocity blast air rushing through nozzle.',
      'High angle shot of revolving chute bell-less top charging system dropping metric tons of iron ore pellets and metallurgical coke into smoking furnace mouth, 35mm documentary.',
      'High contrast slow dolly shot of massive industrial pumping station with heavy cast-iron dual centrifugal pumps pulsating with high pressure water lines, 35mm documentary.',
      'Blast furnace SCADA control room monitors showing flashing red high-temperature telemetry alarm grids across cooling stave zones, technical engineering aesthetic.',
      'Macro technical HUD visualization of microscopic slag skull layer frozen against copper stave, temperature gradient dropping from 2200°C to 60°C across 15 millimeters.',
      '3D volumetric thermal simulation cross-section of blast furnace belly showing frozen slag skull barrier separating incandescent flame from chilled copper wall.',
      'Cutaway engineering schematic of carbon micropore refractory hearth blocks containing molten metal pool at base of 80-meter tower, technical 35mm film.',
      'Epic cinematic drone pull-back from glowing blast furnace superstructure against industrial twilight sky, illuminated by orange cast-house emissions and steam clouds, 35mm Arri Alexa LF.'
    ];

    return {
      narrativeRole: role,
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 3 ? 'HEAT CONTAINMENT' : beatIndex === 8 ? 'THERMAL GRADIENT' : beatIndex === 9 ? 'SELF-HEALING SKULL' : undefined,
      telemetryLabel: beatIndex === 3 ? 'FLOW // 30,000 M³/H' : beatIndex === 8 ? 'DELTA T // 2,140°C' : beatIndex === 10 ? 'TOP PRESSURE // 4.0 BAR' : undefined,
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
      'To understand how this monster survives, we must deconstruct its eighty-meter vertical anatomy.',
      'At the summit, a bell-less top distributor uses a rotating chute to distribute alternating layers of iron ore and porous metallurgical coke.',
      'Below the throat, the shaft widens slightly to allow descending materials to expand as temperatures climb past 800 degrees.',
      'The belly and bosh represent the hottest structural transition, where solid ore softens into a semi-liquid cohesive mass.',
      'Here, thousands of cast copper cooling staves form a continuous armored belt behind the inner brickwork.',
      'Each copper stave is drilled with deep parallel channels carrying demineralized water under twelve bar of hydrostatic pressure.',
      'Surrounding the lower furnace, a massive bustle pipe three meters in diameter encircles the structure like a colossal crown.',
      'From this ring, flexible blowpipes deliver 1,200-degree compressed air into the thirty-six water-cooled copper tuyeres.',
      'Beside the furnace stand three Cowper blast stoves, towering regenerative heat exchangers packed with millions of refractory checker bricks.',
      'These stoves burn blast furnace top gas to heat their brick matrix for two hours before switching to blast mode to preheat incoming air.',
      'At the furnace base, the hearth is constructed from ultra-dense microporous carbon blocks engineered to resist liquid iron penetration.',
      'A dedicated under-hearth water cooling grid draws heat downward to prevent liquid metal from melting through the concrete foundation.',
      'Two to four tapholes pierce the hearth wall, sealed by compressed anhydrous clay plugs when not casting.',
      'Every two hours, a heavy hydraulic rotary drill hammers through the clay to release a surge of liquid iron at 1,500 degrees.'
    ];

    const prompts = [
      'Exploded 3D architectural cutaway of 80-meter blast furnace tower, revealing five structural zones from top throat to bottom hearth.',
      '3D cross-section view of bell-less top chute rotating in spiral pattern, depositing alternating brown ore and black coke strata into furnace throat.',
      'Slow camera descent inside blast furnace shaft simulation, glowing gas permeating descending iron pellets and carbon coke matrix, 35mm documentary.',
      'Technical cutaway diagram of blast furnace belly and bosh geometry with glowing thermal zones shifting from dull cherry red to blazing white heat.',
      'Macro isometric cutaway showing interlocking array of forged copper cooling staves mounted against the heavy steel shell, high pressure cooling pipes entering and exiting.',
      'Macro view of copper stave cross section, showing four deep cylindrical water bores with high velocity water turbulence and thermocouple sensor probes.',
      'Slow cinematic tracking shot following curved 3-meter refractory-lined bustle pipe encircling blast furnace circumference, glowing heat radiation against dusk.',
      'Extreme close-up of water-cooled tuyere nose protruding into incandescent white raceway, supersonic air blast generating swirling vortex of burning coke.',
      'Wide cinematic angle of three 50-meter cylindrical Cowper blast stoves with domed tops, massive insulated hot blast valves and combustion air ducting.',
      'Cutaway illustration of Cowper stove internal refractory checker bricks glowing incandescent red-orange with combustion gases flowing through hexagonal honeycomb flues.',
      'Technical diagram of hearth refractory wall composed of interlocking high-thermal-conductivity microporous carbon blocks under intense metallic bath pressure.',
      'Sub-hearth subterranean engineering view showing dense network of horizontal cooling pipes embedded in concrete slab beneath furnace crucible.',
      'Detailed architectural view of cast house taphole opening through carbon hearth, showing heavy clay mud seal and water-cooled taphole frame.',
      'Dramatic action shot of hydraulic pneumatic taphole drill punching through dark clay plug, blinding jet of molten iron erupting into cast house trough.'
    ];

    return {
      narrativeRole: 'TECHNICAL_ANATOMY',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'PHYSICAL ANATOMY' : beatIndex === 4 ? 'STAVE ARRAY' : undefined,
      telemetryLabel: beatIndex === 0 ? 'HEIGHT // 82 METERS' : beatIndex === 4 ? 'STAVES // 1,840 UNITS' : undefined,
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
      'The operation of a blast furnace is governed by continuous counter-current chemical kinetics.',
      'Every minute, four hundred thousand cubic meters of hot air blast into the raceways at 250 meters per second.',
      'Oxygen in the blast reacts instantly with incandescent coke to generate carbon monoxide and colossal thermal energy.',
      'This reducing gas ascends through the porous burden in approximately eight seconds, stripping oxygen from descending iron ore.',
      'Hematite reduces first to magnetite, then to wüstite, and finally drops as metallic iron droplets through the cohesive zone.',
      'Meanwhile, the solid burden descends slowly under gravity at approximately three meters per hour.',
      'It takes six to eight hours for an iron ore pellet charged at the top to reach the hearth as liquid metal.',
      'Against the water-cooled copper staves, heat flux reaches three hundred kilowatts per square meter.',
      'That heat flux is equivalent to focusing the heat of thirty electric stovetops onto every single square foot of copper.',
      'To absorb this energy, water pumps through the stave channels at velocities exceeding two point five meters per second.',
      'High velocity is non-negotiable: stagnant water would instantly flash to steam and insulate the metal from cooling.',
      'Sensors monitor temperature rise across every cooling loop, alerting operators if delta-T exceeds three degrees Celsius.',
      'Liquid slag, less dense than molten iron, floats on top of the metal bath and protects it from re-oxidation.',
      'A skimmer gate in the cast house separates the molten stream, sending liquid iron to torpedo cars and slag to granulator pits.',
      'Massive insulated torpedo railcars receive the liquid iron at 1,450 degrees, transporting three hundred tons per car to the steel shop.',
      'The mass balance is staggering: for every ton of steel produced, the furnace consumes 1.6 tons of ore, 500 kilograms of coke, and two tons of air.'
    ];

    const prompts = [
      '3D thermodynamic vector map of blast furnace interior showing ascending reducing gases in cyan and descending solid burden in deep amber.',
      'Cinematic close-up of optical sight glass looking directly into tuyere raceway, incandescent swirling coke particles combustion at 2,200°C.',
      'Chemical kinetics telemetry display: C + O2 ➔ CO2 followed by CO2 + C ➔ 2CO (Boudouard reaction), glowing molecular reaction vectors.',
      'Computer simulation cutaway showing high velocity gas permeating porous bed of sintered iron pellets, stripping oxygen atoms in chemical reduction.',
      'Step-by-step metallurgical reduction cascade diagram showing mineral phase transitions: Fe2O3 ➔ Fe3O4 ➔ FeO ➔ Fe.',
      'Time-lapse style tracking shot following slow downward crawl of dark coke and ore layers inside the upper stack, 35mm film still aesthetic.',
      'Isopach volumetric density map tracking a single batch of iron ore pellets traveling from throat charging chute down to the molten bath.',
      'Thermal heat flux telemetry graph overlaid on copper stave wall, showing steep exponential curve peaking at 320 kW/m² in the bosh zone.',
      'Comparative infographic telemetry card showing concentrated thermal density equivalent to 30 industrial heating elements per square foot.',
      'High speed cutaway visual of water flowing through copper bore, tiny turbulent eddy currents stripping heat from metal surface.',
      'Turbulent flow CFD velocity vectors inside rectangular copper channel, cyan streamlines maintaining forced convective heat transfer coefficient.',
      'SCADA diagnostic grid display with hundreds of stave loop temperature differentials highlighted in green and amber status boxes.',
      'Two-phase liquid separation diagram inside blast furnace hearth: glowing lower liquid iron pool separated from upper foaming liquid slag layer.',
      '3D architectural flow diagram of cast house runner network showing refractory skimmer weir diverting light slag right and heavy iron left.',
      'Cinematic shot of glowing cylindrical torpedo ladle train car receiving blinding stream of molten iron under heavy industrial canopy.',
      'Sankey mass flow throughput diagram: [1.6T ORE] + [0.5T COKE] + [2.0T AIR] ➔ [1.0T HOT METAL] + [0.3T SLAG] + [2.8T TOP GAS].'
    ];

    return {
      narrativeRole: 'MATHEMATICAL_MODEL',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'COUNTER-CURRENT REACTOR' : beatIndex === 7 ? 'EXTREME HEAT FLUX' : undefined,
      telemetryLabel: beatIndex === 0 ? 'GAS VELOCITY // 28 M/S' : beatIndex === 2 ? 'CO LEVEL // 24.5%' : beatIndex === 7 ? 'PEAK FLUX // 320 KW/M²' : undefined,
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
      'The ultimate boundary condition of the blast furnace is the Critical Heat Flux of water.',
      'In nucleate boiling, tiny steam bubbles form and detach rapidly, maximizing heat transfer into the water stream.',
      'If the heat flux exceeds critical limits or water pressure drops, bubbles coalesce into a continuous blanket of vapor.',
      'Steam conducts heat thirty times worse than liquid water, creating instant localized thermal insulation.',
      'Within seconds of vapor blanket formation, the copper stave wall temperature leaps from 120 degrees past its melting point of 1,085.',
      'A second boundary condition governs gas flow: the Ergun equation defining bed permeability and fluidization.',
      'The upward gas velocity must never exceed the buoyant threshold that lifts and fluidizes the thousands of tons of burden.',
      'If gas channels blow holes through the ore layers, top pressure destabilizes and the cohesive zone collapses.',
      'In the hearth, carbon brick integrity depends strictly on maintaining the 1,150-degree solidification isotherm outside the refractories.',
      'If that boundary isotherm moves into the carbon brick, molten iron dissolves the carbon blocks like sugar in hot water.',
      'This continuous thermodynamic equilibrium is so tight that operators manage the furnace within a razor-thin stability envelope.',
      'A deviation of just five percent in gas distribution or water velocity can trigger an unrecoverable chain reaction.'
    ];

    const prompts = [
      'Boiling curve physics graph displaying nucleate boiling transition to film boiling (Leidenfrost point) with red critical threshold boundary.',
      'Microscopic visualization of nucleate boiling: microscopic vapor bubbles nucleating on copper wall and rapidly swept away by water flow.',
      'High resolution diagram showing Leidenfrost vapor film insulating copper wall, causing surface temperature to spike catastrophically.',
      'Comparative thermal conductivity visual: liquid water (0.6 W/mK) versus steam vapor barrier (0.02 W/mK), showing thermal trapping.',
      'Thermal simulation showing rapid red-hot heat spike across copper stave thickness, copper structural lattice softening and failing.',
      'Fluid dynamics formula overlay: Ergun Equation for pressure drop through packed porous bed with gas channeling pressure differentials.',
      '3D force balance diagram: downward gravitational burden weight versus upward aerodynamic drag of 4 bar blast gas.',
      'Cutaway of blast furnace showing localized gas channeling blowout crater through burden layers, causing abrupt pressure oscillation.',
      'Thermodynamic isotherm map through hearth carbon wall, showing the critical 1,150°C iron freezing boundary line pinned inside the slag layer.',
      'Chemical erosion simulation showing liquid iron corroding carbon block boundaries when cooling intensity drops below threshold.',
      '3D operational stability phase diagram showing narrow green safe operating zone bounded by chilling, hanging, and thermal runaway.',
      'Control console multi-parameter tolerance boundary alert showing 5% drift threshold indicators in bold warning yellow and red.'
    ];

    return {
      narrativeRole: 'BOUNDARY_LIMIT',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'CRITICAL HEAT FLUX' : beatIndex === 5 ? 'BED PERMEABILITY' : undefined,
      telemetryLabel: beatIndex === 0 ? 'LIMIT // CHF TRIGGER' : beatIndex === 8 ? 'ISOTHERM // 1,150°C' : undefined,
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
      'When the boundary breaks, the first casualty is a cooling stave microcrack from thermal fatigue.',
      'Under twelve bar of water pressure, cooling water sprays directly into the 1,500-degree molten bath.',
      'When liquid water touches liquid iron, it does not simply boil; it triggers instantaneous thermochemical dissociation.',
      'Liquid iron strips oxygen from water molecules, generating iron oxide and releasing massive clouds of pure hydrogen gas.',
      'The volumetric expansion of water to steam is 1,600 times in less than ten milliseconds.',
      'Explosive pressure spikes blow open top bleeder safety valves, filling the night sky with roar and incandescent gas.',
      'Inside, the sudden pressure drop causes the entire 10,000-ton burden column to hang, then drop violently in a slip.',
      'A burden slip sends seismic shockwaves through the structural steel shell and risks dislodging adjacent tuyeres.',
      'If a tuyere melts through, molten iron backs up into the blowpipe, melting the air delivery circuit from the inside out.',
      'Meanwhile, water leaking into the hearth begins cooling the bottom pool of metal below its freezing point.',
      'Once the bottom pool cools, molten iron solidifies into dead, dense pig iron that cannot be tapped through runners.',
      'The clock starts ticking: operators have less than ninety minutes to restore draft and evacuate the hearth before it freezes forever.',
      'If blast pressure cannot be restored, the furnace suffocates in its own internal resistance.',
      'This is the nightmare scenario known in metallurgy as the death of the furnace.'
    ];

    const prompts = [
      'Extreme close-up 35mm view of microscopic thermal stress crack propagating across cast copper stave surface under intense vibration, 8k.',
      'Slow motion technical simulation of high pressure water jet rupturing into incandescent molten iron bath inside dark furnace cavity.',
      'Blinding flash of white-hot explosion inside furnace cavity, shockwave rippling through incandescent gas and incandescent slag.',
      'Chemical dissociation telemetry graphic: Fe + H2O ➔ FeO + H2 + 1,600x volumetric expansion shockwave.',
      'Blast furnace pressure relief explosion doors on furnace top bleeder valves lifting with deafening roar, venting brown fume to sky.',
      'Dramatic night exterior shot of furnace top bleeder stacks roaring with huge orange gas flames against industrial steelwork.',
      'Internal cutaway showing catastrophic burden slip: solid mass drops 3 meters downward like a piston, compressing hearth gas.',
      'Seismic accelerometer telemetry spike readout showing 4.5 Richter equivalent mechanical shockwave through furnace foundation.',
      'High speed thermal camera view of molten metal backdrafting into blowpipe goose-neck, steel ducting glowing bright yellow before rupture.',
      'Cutaway of furnace crucible: sluggish dark purple crust forming on top of bright liquid iron pool as water quenches hearth.',
      'Cast house floor viewed through heat haze: drill operator furiously trying to bore taphole, encountering hardened solid metal obstruction.',
      'Countdown telemetry clock on master control dashboard: CRITICAL HEARTH WINDOW // 01:29:59 remaining.',
      'Control room master display showing blast air flow plummeting to zero, alarm sirens flashing amber across wide bank of telemetry panels.',
      'Haunting wide angle shot of dying blast furnace: incandescent orange light fading to sullen dull red through dust clouds and steam vents.'
    ];

    return {
      narrativeRole: 'EMERGENCY_DISPATCH',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 3 ? 'HYDROGEN DETONATION' : beatIndex === 11 ? 'CRITICAL WINDOW' : undefined,
      telemetryLabel: beatIndex === 3 ? 'EXPANSION // 1,600X' : beatIndex === 11 ? 'SOLIDIFICATION // IMMINENT' : undefined,
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
      'To prevent catastrophe, every modern blast furnace is fortified with multiple layers of automatic physical defenses.',
      'If electrical grid power fails, emergency diesel-driven backup water pumps automatically start in under fifteen seconds.',
      'Elevated gravity-fed water reserve towers maintain full hydrostatic pressure during the critical transfer interval.',
      'Isolated valves instantly segregate leaking stave loops, isolating the failed section while adjacent staves compensate.',
      'High-pressure nitrogen gas purges the tuyere headers within seconds, displacing oxygen and preventing explosive backdrafts.',
      'Snort valves open wide to dump hot blast pressure into silencing stacks before acoustic shockwaves damage the Cowper stoves.',
      'Emergency oxygen lances are rushed to the cast house, burning through refractory obstructions to tap remaining molten metal.',
      'Operators sacrifice secondary equipment to keep hot metal flowing out of the crucible at all costs.',
      'Thermal cameras scan every square foot of outer shell, identifying hot spots before shell steel exceeds 350 degrees.',
      'External water spray jackets can be activated across the outer shell as a desperate final line of thermal defense.'
    ];

    const prompts = [
      'Tracking shot of automated emergency backup systems activating in parallel inside armored utility annex, 35mm Arri Alexa LF.',
      '3D architectural cutaway of underground pump chamber with massive V16 diesel engines firing up to drive auxiliary cooling pumps.',
      'Cinematic dusk shot of 60-meter emergency gravity water tower with massive pipes connecting directly to blast furnace cooling ring.',
      'Automated pneumatic knife gate valves snapping shut on pipeline manifold, isolating damaged stave loop from main circuit.',
      'Nitrogen purge telemetry graphic: high-pressure N2 injection displacing hot blast air, dropping O2 content to 0.1% across raceway.',
      'Massive hydraulic snort valve actuating, venting hundreds of thousands of cubic meters of compressed hot air with deafening steam roar.',
      'Dramatic action shot of cast house operators in silver aluminized reflective suits driving long steel oxygen lance into taphole.',
      'Molten metal rushing through emergency auxiliary sand runners into backup pit, throwing intense orange light onto operators.',
      'FLIR thermal imaging camera display of blast furnace steel mantle, mapping surface heat distribution in blue, green and danger red.',
      'Exterior view of high-volume water deluge rings spraying cascading sheets of water over outer steel mantle, billowing white steam.'
    ];

    return {
      narrativeRole: 'EMERGENCY_DISPATCH',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 1 ? 'REDUNDANT POWER' : beatIndex === 4 ? 'NITROGEN PURGE' : undefined,
      telemetryLabel: beatIndex === 1 ? 'SWITCH TIME // 12.4 SEC' : beatIndex === 4 ? 'PURGE PRESSURE // 16 BAR' : undefined,
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
      'If all emergency interventions fail and the liquid bath solidifies, the result is the dreaded Salamander.',
      'Two thousand tons of high-carbon iron, mixed with slag and coke, freeze into an impenetrable monolithic block of solid metal.',
      'You cannot simply light a fire on top of the salamander to melt it down: steel is an excellent conductor that diffuses heat outward.',
      'Any heat applied to the top will destroy the upper furnace long before reaching the bottom of the frozen crucible.',
      'The only solution is total demolition: blasting teams drill holes into the solid metal and use specialized shaped explosive charges.',
      'The structural shell must be cut apart, the refractory lining stripped, and the entire multi-billion-dollar installation rebuilt.',
      'A frozen blast furnace represents an immediate 1.2-billion-dollar write-off and eighteen months of lost production.',
      'The economic ripple travels immediately downstream: basic oxygen furnaces starve of molten hot metal within hours.',
      'Continuous slab casters halt, automotive stamping plants run out of sheet steel, and construction supply chains seize up.',
      'Global steel pricing spikes as millions of tons of primary reduction capacity vanish from the market.'
    ];

    const prompts = [
      'Monumental cross-section illustration of solidified blast furnace hearth: 2,000-ton solid iron monolith filling crucible like a rock.',
      'Macro 35mm view of crystalline fractured solid pig iron embedded with burnt coke, unmovable and cold, dramatic cinematic lighting.',
      'Thermal simulation showing heat applied to surface of 2,000-ton iron block diffusing harmlessly without melting the core.',
      'Engineering damage analysis report graphic showing structural failure of upper shaft while hearth remains locked in solid iron.',
      'Industrial demolition crew inside decommissioned blast furnace hearth drilling dynamite holes into massive solid iron bear.',
      'Time-lapse demolition view: heavy cranes tearing apart distorted steel furnace shell sections under grey industrial sky.',
      'Financial audit graphic: [CAPITAL LOSS: $1.2B] // [DOWNTIME: 18 MONTHS] // [LOST OUTPUT: 5.4M TONS HOT METAL].',
      'Empty silent basic oxygen furnace steelmaking shop with overhead crane suspended motionless, cold steel ladles lined up.',
      'Idle automotive factory assembly line with robotic welding arms frozen in place above incomplete car chassis.',
      'Global commodity trading exchange terminal showing dramatic upward price spike in hot rolled coil and rebar futures.'
    ];

    return {
      narrativeRole: 'CORE_THESIS',
      visualMode,
      infographicArchetype: archetype,
      graphicHeadline: beatIndex === 0 ? 'THE SALAMANDER' : beatIndex === 6 ? 'ECONOMIC TOLL' : undefined,
      telemetryLabel: beatIndex === 0 ? 'MASS // 2,100 TONS' : beatIndex === 6 ? 'ASSET WRITE-OFF // $1.2B' : undefined,
      voiceoverScript: scripts[beatIndex % scripts.length],
      promptSubject: prompts[beatIndex % prompts.length]
    };
  }

  // ACT 8: ORIGINAL THESIS & SYSTEM ARCHITECTURE (8 beats)
  const visualMode: HslVisualMode = 'firefly_video';
  const scripts = [
    'We imagine the modern world is constructed on demand, ordered digitally and delivered through just-in-time logistics.',
    'The physical reality is that civilization rests on continuous, unbroken thermodynamic inertia.',
    'You cannot pause the reduction of iron ore; you can only ride the kinetic equilibrium between flame and cooling water.',
    'Every bridge, skyscraper, railway track, and container ship begins inside this continuous twenty-year reaction.',
    'Separating our entire industrial infrastructure from explosive destruction is fifteen millimeters of copper and high-speed water.',
    'The engineers who balance this flame day and night preserve the physical foundation that makes modern life possible.',
    'As long as the cooling water flows, the twenty-year flame will never go out.',
    'This is the Hidden Systems Lab.'
  ];

  const headlines = [
    'THE VISIBLE ILLUSION', 'THERMODYNAMIC INERTIA', 'THE KINETIC RIDE', 'CIVILIZATION MATRIX',
    'THE COPPER SHIELD', 'STEWARDSHIP OF FLAME', 'THE 20-YEAR FLAME', 'HIDDEN SYSTEMS LAB'
  ];

  const telemetry = [
    'GLOBAL INFRASTRUCTURE', 'METALLURGY // 2,200°C', 'EQUILIBRIUM // INERTIA', 'FOUNDATION // CONTINUOUS',
    'MARGIN // 15MM COPPER', 'STEWARDSHIP // 24/7/365', 'FLAME STATUS // UNBROKEN', 'HSL_EPISODE_020 // MASTER'
  ];

  const prompts = [
    'Cinematic drone glide over gleaming modern suspension bridge and glass skyscrapers reflecting sunset, crisp architectural aesthetic.',
    'Close tracking shot of red-hot steel beam exiting rolling mill stand at high speed, water spray flashing into steam.',
    'Split screen technical comparison: blazing 2,200°C furnace core on left versus high-velocity 30,000 m³/h water cooling on right.',
    'Hero panoramic montage showing iconic infrastructure: bridges, bullet trains, cargo ships and towers linked by glowing golden lines.',
    'Macro 35mm detail of pristine copper cooling stave with clean water reflection, gleaming under industrial spotlight.',
    'Silhouette of blast furnace operator in protective gear standing before cast house glow, gazing up at towering blast furnace superstructure.',
    'Epic wide shot of blast furnace at deep night, glowing with molten orange light against dark obsidian sky, Arri Alexa LF 8k.',
    'Final minimalist closing card: HIDDEN SYSTEMS LAB // THE 20-YEAR FLAME // MASTER DOCUMENTARY.'
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
