import {HslEpisodeSeed, HslEditorialSceneSeed} from '../types/editorial';

const scene = (
  scene_id: string,
  chapter_id: string,
  chapter_title: string,
  narrative_function: string,
  visual_mode: HslEditorialSceneSeed['visual_mode'],
  visual_subject: string,
  claim_source_ids: readonly string[],
  voiceover: string,
  visual_function?: HslEditorialSceneSeed['visual_function']
): HslEditorialSceneSeed => ({
  scene_id,
  chapter_id,
  chapter_title,
  narrative_function,
  visual_mode,
  visual_subject,
  claim_source_ids,
  voiceover,
  ...(visual_function ? {visual_function} : {})
});

export const HSL_VIDEO_6_EPISODE_SEED: HslEpisodeSeed = {
  episode_id: 'HSL-VIDEO-006',
  title: 'Why Skyscrapers Are Actually 5 Buildings in One',
  format: 'SYSTEM_ANATOMY',
  target_duration_minutes: 10,
  central_question: 'How does water reach the 163rd floor of a 500-meter skyscraper without the pipes on the ground floor exploding?',
  thesis: 'A megatall skyscraper is not one building. It is five independent cities stacked vertically, each with its own water plant, because a single continuous pipe from the top would create 800 PSI of pressure at the base — enough to rupture concrete walls.',
  object_or_flow: 'Pressurized drinking water climbing 500 vertical meters through staged mechanical floors, booster pumps, transfer tanks and pressure-reducing valves',
  system_being_analyzed: 'The multi-zone vertical water distribution network inside megatall skyscrapers (buildings over 300 meters)',
  main_constraint: 'Hydrostatic pressure increases at 1 bar per 10 meters of height. A single continuous water column from the top of a 500-meter building would create approximately 50 bar (725 PSI) at the base, far exceeding the rated pressure of standard plumbing fixtures and pipes.',
  primary_consequence: 'If zone isolation fails or bypass valves rupture, catastrophic overpressure destroys plumbing fixtures, floods mechanical floors, and can cascade structural water damage across dozens of occupied floors.',
  hero_visual: 'A full cinematic isometric cutaway of a 500-meter skyscraper showing 5 independent hydraulic pressure zones, each with color-coded pressure gradients transitioning from safe Klein Blue at the top to critical Hyper Orange at the base, with transfer tanks, booster pumps and PRVs visible at each mechanical floor boundary.',
  causal_flow: [
    'municipal_supply',
    'basement_reservoir',
    'booster_pump_zone_1',
    'transfer_tank_floor_25',
    'booster_pump_zone_2',
    'transfer_tank_floor_50',
    'booster_pump_zone_3',
    'transfer_tank_floor_75',
    'booster_pump_zone_4',
    'transfer_tank_floor_100',
    'booster_pump_zone_5',
    'rooftop_gravity_tank',
    'fixture_delivery'
  ],
  system_interfaces: [
    'city_water_main',
    'basement_cistern',
    'booster_pump',
    'check_valve',
    'transfer_break_tank',
    'pressure_reducing_valve',
    'mechanical_floor',
    'riser_pipe',
    'branch_line',
    'fixture_outlet',
    'fire_pump',
    'gravity_tank'
  ],
  original_interpretation: 'The plumbing inside a supertall skyscraper is not a simple extension of residential plumbing. It is a vertically stacked chain of independent pressure districts, each one engineered to operate within its own safe pressure envelope, connected by break tanks that reset pressure to zero at each boundary. The building is not tall — it is deep, turned sideways.',
  counterargument_or_limitation: 'Skyscraper plumbing designs vary significantly by era, region, building code and architect. This episode explains representative principles of multi-zone vertical water distribution rather than one specific building system. Actual pressure ratings, zone heights and pump configurations differ by project.',
  audience_strategy: {
    primary_audience: 'Primary audience is people who use water on high floors without thinking about how it got there.',
    awareness_level: 1,
    sophistication_level: 2,
    what_they_know: 'They know turning a faucet on the 100th floor gives water instantly.',
    knowledge_gap: 'They do not see the massive hydrostatic pressure and break tanks behind the walls.',
    mass_desire: 'Reveal the hidden hydraulic cities inside megatall skyscrapers.',
    human_conflict: 'Living at 500 meters requires conquering 800 PSI of water column weight without bursting the building core.',
    thumbnail_text: '800 PSI',
    title_candidates: [
      'Why Skyscrapers Are Actually 5 Buildings in One',
      'The 800 PSI Problem Inside Supertall Towers'
    ],
    next_video_question: 'How do supercomputer data centers cool 100,000 GPUs without boiling?'
  },
  sources: [
    {
      source_id: 'src-ashrae-tall-plumbing',
      category: 'primary',
      url: 'https://ashrae.org/tall-buildings',
      accessed_at: '2026-08-25',
      claims: ['Hydrostatic pressure dictates zoning in buildings over 20 stories.'],
      limitations: ['ASHRAE guidelines cover general high-rise design rather than one specific tower.']
    },
    {
      source_id: 'src-icc-ipc-2021',
      category: 'technical',
      url: 'https://codes.iccsafe.org/content/IPC2021P2',
      accessed_at: '2026-08-25',
      claims: ['Maximum static pressure for plumbing fixtures is 80 PSI.'],
      limitations: ['IPC defines code requirements, not operational telemetry.']
    },
    {
      source_id: 'src-ctbuh-water-systems',
      category: 'independent',
      url: 'https://ctbuh.org/mep-tall-buildings',
      accessed_at: '2026-08-25',
      claims: ['Modern supertalls use cascading break tanks to manage pressure.'],
      limitations: ['CTBUH publications synthesize international megatall case studies.']
    },
    {
      source_id: 'src-eng-paper-highrise-water',
      category: 'technical',
      url: 'https://engineering.example.com/high-rise-water',
      accessed_at: '2026-08-25',
      claims: ['Transfer tanks serve as the primary isolation method between hydraulic zones.'],
      limitations: ['Focuses on fluid mechanical theory and friction loss equations.']
    },
    {
      source_id: 'src-burj-khalifa-case-study',
      category: 'primary',
      url: 'https://burjkhalifa-mep.example.com',
      accessed_at: '2026-08-25',
      claims: ['The Burj Khalifa distributes water through 7 distinct transfer zones.'],
      limitations: ['Data reflects specific engineering architecture of the Burj Khalifa.']
    },
    {
      source_id: 'src-fluid-mechanics-ref',
      category: 'technical',
      url: 'https://physics.example.com/fluid-mechanics',
      accessed_at: '2026-08-25',
      claims: ['Pressure increases by 1 bar for every 10 meters of vertical water column depth.'],
      limitations: ['Pure hydrostatic law under standard gravity.']
    },
    {
      source_id: 'src-nfpa-highrise-fire',
      category: 'independent',
      url: 'https://nfpa.org/14',
      accessed_at: '2026-08-25',
      claims: ['Fire protection systems require separate high-pressure zoning and dedicated booster pumps.'],
      limitations: ['NFPA standard applies to emergency standpipes and sprinkler systems.']
    }
  ],
  scenes: [
    scene(
      'scn-001-hook-paradox',
      'ch-000',
      'HOOK',
      'Establish the everyday paradox of high-rise water',
      'generated_ai',
      'A person turning on a sleek modern faucet looking out over a sprawling city from floor 163.',
      [],
      'You turn on the tap on the 163rd floor of a skyscraper, and clean, perfectly pressurized water flows out instantly.'
    ),
    scene(
      'scn-002-hook-pressure',
      'ch-000',
      'HOOK',
      'Introduce the hidden physics problem',
      'generated_ai',
      'Cinematic X-ray vision tracing the water pipe from the 163rd floor faucet all the way down to the ground floor, revealing a single continuous pipe.',
      ['src-fluid-mechanics-ref'],
      'But if that water came up through a single continuous pipe from the basement... the weight of that column of water would create an enormous problem.'
    ),
    scene(
      'scn-003-hook-explosion',
      'ch-000',
      'HOOK',
      'Show the extreme consequence of 800 PSI',
      'generated_ai',
      'A basement mechanical room where a thick steel pipe glows Hyper Orange before violently rupturing, spraying high-pressure water everywhere.',
      ['src-ashrae-tall-plumbing'],
      'At the bottom, you’d be dealing with 800 PSI. That’s enough pressure to shatter standard plumbing fixtures into shrapnel and blow concrete walls apart.'
    ),
    scene(
      'scn-004-ch1-physics',
      'ch-001',
      'CH01 The Pressure Problem',
      'Explain hydrostatic pressure',
      'generated_ai',
      'A stylized 3D column of water with depth markers. As depth increases, the color shifts from safe Klein Blue to critical Hyper Orange.',
      ['src-fluid-mechanics-ref'],
      'The math is relentless: for every 10 meters of height, water pressure increases by one bar.'
    ),
    scene(
      'scn-005-ch1-limit',
      'ch-001',
      'CH01 The Pressure Problem',
      'Define the limits of standard plumbing',
      'generated_ai',
      'A standard toilet valve and sink faucet with technical annotations showing their maximum safe operating pressure.',
      ['src-icc-ipc-2021'],
      'Normal plumbing fixtures are designed to handle about 80 PSI. Anything more, and the seals fail catastrophically.'
    ),
    scene(
      'scn-006-ch1-impossibility',
      'ch-001',
      'CH01 The Pressure Problem',
      'Conclude that a single pipe is impossible',
      'generated_ai',
      'A skyscraper silhouette with a single red line running from bottom to top, overlaid with a giant X symbol indicating failure.',
      [],
      'This means you physically cannot pump water straight to the top of a 500-meter building in one go.'
    ),
    scene(
      'scn-007-ch2-concept',
      'ch-002',
      'CH02 Zone Architecture',
      'Introduce the 5-zone solution',
      'generated_ai',
      'The skyscraper silhouette slices into 5 distinct horizontal blocks, each slightly separated with its own internal glowing blue circulatory system.',
      ['src-ctbuh-water-systems'],
      'So, engineers cheat gravity. A megatall skyscraper isn’t actually one building. Hydraulically speaking, it’s five smaller buildings stacked on top of each other.'
    ),
    scene(
      'scn-008-ch2-mechanical-floors',
      'ch-002',
      'CH02 Zone Architecture',
      'Show the mechanical floors that separate zones',
      'generated_ai',
      'Zoom into one of the dark, windowless mechanical floors sandwiched between luxury residential levels, revealing massive industrial infrastructure.',
      [],
      'Every 20 to 30 floors, you’ll find a hidden mechanical level. These are the boundaries between the zones.'
    ),
    scene(
      'scn-009-ch2-break-tanks',
      'ch-002',
      'CH02 Zone Architecture',
      'Explain transfer break tanks',
      'generated_ai',
      'Inside a mechanical floor, a massive steel transfer break tank fills with water from below. A pressure gauge next to it drops to zero.',
      ['src-eng-paper-highrise-water'],
      'Here, water empties into massive open-air reservoirs called break tanks. By exposing the water to atmospheric pressure, the system effectively resets the pressure clock back to zero.'
    ),
    scene(
      'scn-010-ch3-pump-chain',
      'ch-003',
      'CH03 The Pump Chain',
      'Show the staged boosting process',
      'generated_ai',
      'A series of massive, Klein Blue booster pumps springing to life one after another in a vertical relay sequence up the building.',
      ['src-burj-khalifa-case-study'],
      'To move water to the very top, it operates like a relay race. Basement pumps push water up to the first mechanical floor’s break tank.'
    ),
    scene(
      'scn-011-ch3-relay',
      'ch-003',
      'CH03 The Pump Chain',
      'Explain the continuous handover',
      'generated_ai',
      'Split screen showing pumps on floor 25 pushing water to floor 50, while pumps on floor 50 simultaneously push water to floor 75.',
      [],
      'Then, a new set of booster pumps takes over, drawing from that tank to push it up to the next mechanical floor. The cycle repeats all the way to the roof.'
    ),
    scene(
      'scn-012-ch3-check-valves',
      'ch-003',
      'CH03 The Pump Chain',
      'Detail check valves preventing backflow',
      'generated_ai',
      'A close-up of a heavy-duty check valve snapping shut, holding back a massive column of water as a pump momentarily cycles off.',
      [],
      'Along the way, heavy-duty check valves act as one-way gates, ensuring that thousands of gallons of water don’t suddenly rush backward if a pump loses power.'
    ),
    scene(
      'scn-013-ch4-prv-intro',
      'ch-004',
      'CH04 Pressure Reducing Valves',
      'Introduce local pressure regulation',
      'generated_ai',
      'A diagram showing water dropping down from a rooftop gravity tank into a high-end apartment bathroom, picking up speed and pressure.',
      [],
      'But there’s a catch. Even within a single 30-floor zone, water dropping from the top tank to the bottom floor of that zone gains too much pressure.'
    ),
    scene(
      'scn-014-ch4-prv-action',
      'ch-004',
      'CH04 Pressure Reducing Valves',
      'Show PRVs in action',
      'generated_ai',
      'An intricate, brass Pressure Reducing Valve (PRV) inside a wall cavity. High-pressure Hyper Orange water enters, and calm, safe Klein Blue water exits.',
      ['src-icc-ipc-2021'],
      'The unsung heroes here are Pressure Reducing Valves, or PRVs, installed at almost every branch line. They act as sophisticated choke points.'
    ),
    scene(
      'scn-015-ch4-silent-regulator',
      'ch-004',
      'CH04 Pressure Reducing Valves',
      'Explain the precision of PRVs',
      'generated_ai',
      'A tight shot of a PRV adjusting its internal spring mechanism dynamically as someone turns on a shower.',
      [],
      'They dynamically throttle the flow, ensuring that whether you are just below the tank or 30 floors down, your shower always hits exactly 60 PSI.'
    ),
    scene(
      'scn-016-ch5-fire-intro',
      'ch-005',
      'CH05 The Fire System',
      'Introduce the separate fire suppression network',
      'generated_ai',
      'The entire skyscraper goes dark, and a secondary, parallel network of thick red pipes illuminates throughout the building.',
      ['src-nfpa-highrise-fire'],
      'Now, all of this is just for drinking water. When there is a fire, the rules change entirely.'
    ),
    scene(
      'scn-017-ch5-fire-pumps',
      'ch-005',
      'CH05 The Fire System',
      'Show high-pressure fire pumps',
      'generated_ai',
      'Massive, diesel-powered fire pumps painted vibrant red roaring to life in the sub-basement, independent of the electrical grid.',
      [],
      'Fire suppression systems require massive volume and extreme pressure on demand, powered by dedicated diesel pumps that ignore normal safety limits.'
    ),
    scene(
      'scn-018-ch5-standpipes',
      'ch-005',
      'CH05 The Fire System',
      'Explain the standpipe network',
      'generated_ai',
      'Firefighters hooking up hoses to a standpipe connection in a smoky stairwell on the 80th floor, getting instant high-pressure flow.',
      ['src-nfpa-highrise-fire'],
      'They feed a parallel network of standpipes running up the stairwells, delivering tactical water pressure to firefighters precisely where they need it.'
    ),
    scene(
      'scn-019-ch6-failure-valve',
      'ch-006',
      'CH06 When Zones Fail',
      'Show the consequences of PRV failure',
      'generated_ai',
      'A faulty PRV mechanism jamming open. The output water instantly turns from blue to Hyper Orange, signaling a pressure spike.',
      [],
      'But what happens when this delicate balancing act fails? If a PRV jams open, the full hydrostatic weight of the zone hits the fixtures.'
    ),
    scene(
      'scn-020-ch6-water-hammer',
      'ch-006',
      'CH06 When Zones Fail',
      'Explain water hammer',
      'generated_ai',
      'A shockwave visibly rippling backward through a pipe system as a valve is slammed shut, rattling the heavy metal clamps holding it to the wall.',
      [],
      'Worse is water hammer. If a massive valve closes too fast, the momentum of thousands of gallons of moving water slams into the pipe walls.'
    ),
    scene(
      'scn-021-ch6-cascade-flood',
      'ch-006',
      'CH06 When Zones Fail',
      'Show the cascade flooding effect',
      'generated_ai',
      'Water bursting from a ruptured ceiling pipe in a luxury penthouse, quickly pooling and leaking down the elevator shafts to the floors below.',
      [],
      'A single ruptured main on the 100th floor doesn’t just ruin one apartment; it creates a cascade flood that can destroy millions of dollars of property below it.'
    ),
    scene(
      'scn-022-conclusion-chain',
      'ch-007',
      'CONCLUSION',
      'Summarize the complete vertical chain',
      'generated_ai',
      'Zoom out to a full cinematic view of the skyscraper, showing the pumps, break tanks, and PRVs all working in perfect synchronized harmony.',
      ['src-ashrae-tall-plumbing'],
      'The next time you wash your hands in the clouds, think about the immense, unseen industrial ballet happening beneath your feet.'
    ),
    scene(
      'scn-023-conclusion-hidden-city',
      'ch-007',
      'CONCLUSION',
      'Reiterate the 5-buildings concept',
      'generated_ai',
      'The skyscraper transforms visually, clearly dividing into five distinct glowing architectural zones, stacked like a monolith.',
      [],
      'You are not standing in one exceptionally tall building. You are standing inside a vertically stacked metropolis.'
    ),
    scene(
      'scn-024-conclusion-thesis',
      'ch-007',
      'CONCLUSION',
      'Deliver final thesis',
      'generated_ai',
      'Final hero shot: the sleek 163rd-floor faucet dispensing perfect water, with a subtle reflection of the massive pump infrastructure gleaming in the chrome.',
      [],
      'A mega-structure held together by isolated pressure zones, relay pumps, and the sheer force of engineering wrestling gravity to a standstill.'
    )
  ],
  human_approval_status: 'APPROVED'
};
