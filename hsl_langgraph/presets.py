from typing import Dict, Any, Optional

HSL_PRESETS: Dict[str, Dict[str, Any]] = {
    "jet_fuel": {
        "id": "HSL_EPISODE_001",
        "name": "Airport Jet Fuel Logistics",
        "topic": "THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING",
        "target_minutes": 10,
        "entity": "Airport Jet Fuel Logistics",
        "mechanism": "Pipeline to Hydrant Manifold High-Pressure Injection",
        "constraint": "Hydrant Pressure Collapse at Node D (72 Units/min)",
        "consequence": "56 Delayed Flights and $2.7M Cascading Economic Loss",
        "thesis": "The visible product is a flight; the hidden product is synchronized fuel logistics."
    },
    "skyscraper": {
        "id": "HSL_EPISODE_002",
        "name": "Taipei 101 Tuned Mass Damper",
        "topic": "HOW MEGA-SKYSCRAPERS SURVIVE CATEGORY 5 HURRICANES",
        "target_minutes": 10,
        "entity": "Tuned Mass Dampers (Taipei 101 TMD)",
        "mechanism": "660-Tonne Steel Sphere Suspended via 42mm Cables",
        "constraint": "Vortex Shedding Resonance at 0.15 Hz Overstroke Limit",
        "consequence": "Structural Plastic Deformation and Catastrophic Façade Failure",
        "thesis": "The tower does not fight the storm; a 660-tonne pendulum absorbs the oscillation in anti-phase."
    },
    "grid": {
        "id": "HSL_EPISODE_003",
        "name": "Continental Grid Synchronization",
        "topic": "THE 60HZ ENGINE: HOW THE ENTIRE CONTINENT SYNCHRONIZES",
        "target_minutes": 10,
        "entity": "High-Voltage Interconnected Power Grid",
        "mechanism": "Turbine Governor Frequency Droop Response",
        "constraint": "0.2 Hz Frequency Deviation Trip Threshold",
        "consequence": "Cascading Generator Disconnect and Continental Blackout in 800ms",
        "thesis": "Power is not stored; generation and consumption must achieve continuous mathematical equilibrium."
    },
    "wall_street": {
        "id": "HSL_EPISODE_004",
        "name": "Microwave Latency Arbitrage",
        "topic": "THE MICROSECOND RACE: THE SECRET NETWORK BENEATH WALL STREET",
        "target_minutes": 10,
        "entity": "Microwave High-Frequency Trading Links",
        "mechanism": "Line-of-Sight Microwave Transceivers with FPGA Arbiters",
        "constraint": "Atmospheric Rain Fade and Millimeter Wave Attenuation",
        "consequence": "Arb Routing Failure and $14M Slippage Within 12 Milliseconds",
        "thesis": "Speed of light in glass is too slow; the modern financial frontier is millimeter waves in thin air."
    },
    "subsea": {
        "id": "HSL_EPISODE_005",
        "name": "Deep-Sea Fiber Optic Cables",
        "topic": "THE GLASS ARTERIES: THE DEEP-SEA THREADS CARRYING THE INTERNET",
        "target_minutes": 10,
        "entity": "Transatlantic Submarine Fiber Optic Cables",
        "mechanism": "Erbium-Doped Fiber Amplifiers (EDFA) at 8,000m Depth",
        "constraint": "Benthic Anchor Drag and Optical Fiber Micro-Bending",
        "consequence": "Instant Routing Congestion Diverting 42 Terabits across 3 Continents",
        "thesis": "The cloud is not in the sky; 99% of international data rests on fragile fibers at the bottom of the ocean."
    },
    "traffic": {
        "id": "HSL_EPISODE_006",
        "name": "Urban Green Wave Traffic Control",
        "topic": "THE SYNCHRONIZED METROPOLIS: HOW ADAPTIVE SIGNALS PREVENT GRIDLOCK",
        "target_minutes": 10,
        "entity": "Urban Traffic Control & Green Wave Arterials",
        "mechanism": "Inductive Loop Vehicle Presence Sensors and Split Cycle Coordinators",
        "constraint": "Platoon Dispersion Shockwaves at Critical Bottlenecks",
        "consequence": "Spillback Gridlock Locking 14 Intersections for 3 Hours",
        "thesis": "Traffic jams are not accidents; they are backward-traveling density shockwaves born from desynchronization."
    }
}

def get_preset(key_or_name: str) -> Optional[Dict[str, Any]]:
    key = key_or_name.lower().strip().replace("-", "_").replace(" ", "_")
    if key in HSL_PRESETS:
        return HSL_PRESETS[key]
    for k, preset in HSL_PRESETS.items():
        if key in preset["name"].lower() or key in preset["id"].lower():
            return preset
    return None
