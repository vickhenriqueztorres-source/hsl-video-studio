# 🛰️ HSL Video Studio — Autonomous Documentary Engine

> **Hidden Systems Lab (HSL)** is an autonomous multi-agent production studio engineered to research, script, storyboard, voice, score, animate, render, and package 10-to-12-minute high-impact technical documentaries (18,000 frames @ 30 FPS Full HD).

---

## 🏛️ Architecture Overview

HSL Video Studio automates the complete lifecycle of investigative, systems-engineering documentaries with **zero human intervention required** between topic ingestion and final YouTube publication deliverables.

```
                               ┌────────────────────────┐
                               │  Editorial Topic Input │
                               └───────────┬────────────┘
                                           │
                                           ▼
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                       11-STAGE MASTER AUTONOMOUS PIPELINE                       │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │  [01] Scene Director         ➔ 8 Canonical Acts // 96 Metric-Driven Beats        │
 │  [02] Image Frame Engine     ➔ 40% 35mm Photoreal + 15% Diagram Infographics    │
 │  [03] Firefly Video Engine   ➔ 30% Continuous Action Video Takes (MP4 / 30 FPS) │
 │  [04] Narration Engine       ➔ ElevenLabs Chris Voice // Auto-Sync (±0.01s)     │
 │  [05] Sound Design Agent     ➔ Multi-Layer Foley (-28dB Score + Kenney CC0 SFX) │
 │  [06] Validation Gatekeeper  ➔ Physical Disk Audit (Zero-Black-Screen Contract) │
 │  [07] Remotion Multi-Part    ➔ 4x Chunks @ 1080p // Lossless FFmpeg Stitch      │
 │  [08] Pre-Mux Gatekeeper     ➔ Visual vs Audio Coherence Audit (Δ ≤ 0.05s)      │
 │  [09] FFmpeg Muxer           ➔ Master Stream Assembly (AAC + H.264 High Profile)│
 │  [10] Packaging Agent        ➔ 3x 4K Thumbnails (A/B/C) + Semantic SEO Package  │
 │  [11] PRD Compliance Auditor ➔ 8/8 Automated Quality Gates Verification         │
 └─────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │ Final Master Delivery  │
                               │  - 1080p MP4 (600s)    │
                               │  - 3x 4K Thumbnails    │
                               │  - SEO Publication MD  │
                               └────────────────────────┘
```

---

## 📊 Media Distribution Matrix (40 / 30 / 15 / 15)

The visual rhythm is governed at the project root (`spec/hsl-spec.ts`) across 96 beats (600.00 seconds):

| Media Archetype | Proportion | Target Beats | Visual & Motion Governance |
| :--- | :---: | :---: | :--- |
| **Photorealistic 35mm Images** (`generated_image_35mm`) | **40%** | **38 Beats** | Industrial documentary aesthetic without burned-in text. Animated via 2.5D camera moves (*Slow Dolly, Camera Drift, Pan*). |
| **Continuous Action Video** (`firefly_video`) | **30%** | **29 Beats** | Full-motion MP4 video takes with fluid dynamics, wake turbulence, and camera panning. |
| **Kinetic Motion Graphics** (`vector_remotion`) | **15%** | **14 Beats** | Pure Remotion overlays, counters, telemetry badges, and monumental Vox typography. |
| **Technical Diagram Images** (`motion_image_diagram`) | **15%** | **15 Beats** | Cutaway schematics, flow vectors, and isometric charts. **Anti-Collision Rule:** Typography overlays are automatically suppressed to avoid double text. |

---

## 🎙️ Sound Design & Audio Architecture

- **Narrator Voice:** ElevenLabs Voice *Chris* (Authoritative, calm, investigative documentary tone).
- **Pitch-Perfect Sync:** Audio length dynamically calibrated to match 600.00s video duration (Delta $\le 0.01\text{s}$).
- **Suspense Score:** Tension soundtrack mixed strictly at **-28dB** to prevent voice masking.
- **Dynamic Ducking:** Automatic -4dB ducking when critical telemetry or alarms trigger.
- **Foley & SFX:** Layered tactile mechanical sounds curated from Kenney CC0 audio library.

---

## 🖼️ High-CTR YouTube Packaging (Rule 1+1=3)

Every episode generates 3 distinct multivariable 4K thumbnails designed for high click-through rate:

1. **Variant A (The Hero Scale):** Colossal system asset in context + high-contrast headline (`5 KM TO BRAKE`) + metric badge.
2. **Variant B (The Split Contrast):** Normal operational state vs. catastrophic failure separated by a glowing laser line (`1.2M CLEARANCE // SUEZ LOCK`).
3. **Variant C (The Crisis Hero):** Action emergency scene with HUD targeting reticle on the failure mechanism (`BANK SUCTION // 14 OCEAN TUGS`).

---

## 🛠️ Project Structure

```
.
├── .agents/                    # Multi-agent skill manifests and subagent definitions
│   └── skills/
│       ├── hsl-master-pipeline/     # Stage orchestration and execution controller
│       ├── hsl-scene-direction/     # 8-Act narrative structure & shot planning
│       ├── hsl-sound-design/        # Foley, narration synthesis & audio mixing
│       ├── hsl-youtube-packaging/   # Thumbnails A/B/C & SEO semantic tagging
│       └── hsl-artifact-registry/   # SHA-256 lineage tracking & deliverable catalog
├── docs/                       # PRD, Rules, Brand System, and Cinematic guidelines
├── hsl/
│   ├── core/                   # ImageFrameEngine, FireflyVideoEngine, Gatekeeper, PathResolver
│   ├── packaging/              # ThumbnailSeoEngine, YouTube metadata generator
│   └── pipeline/               # Stage orchestrator and runner
├── remotion/                   # Remotion compositions (HslLongFormComposition, HslThumbnail)
├── scripts/                    # Episode generation scripts and utility runners
├── spec/                       # Canonical visual spec, duration math, and types
├── public/                     # Static assets, fonts, icons, sound library, and images
└── deliveries/                 # Final output folder (MP4 video, 4K thumbnails, SEO packages)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- FFmpeg & FFprobe installed and available in system `PATH`
- ElevenLabs API Key (set in `.env` as `ELEVENLABS_API_KEY`)

### Installation
```bash
# Clone the repository
git clone https://github.com/vickhenriqueztorres-source/hsl-video-studio.git
cd hsl-video-studio

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
ELEVENLABS_API_KEY="your_api_key_here"
ELEVENLABS_VOICE_ID="iP95p4xoKVk53GoZ742B" # Chris voice
HSL_ASSET_BASE_URL=""
```

---

## 🎬 Generating an Episode

To execute the end-to-end master pipeline for an episode:

```bash
# Run Episode 011 (Megaship Hydrodynamics)
npx ts-node -T scripts/generateMegashipEpisode.ts

# Re-render Thumbnails Only
npx ts-node scripts/renderMegashipThumbnails.ts

# Refresh YouTube SEO Packaging
npx ts-node scripts/refreshMegashipPackaging.ts

# Audit PRD Compliance
npx ts-node scripts/auditMegashipCompliance.ts
```

---

## 🛡️ PRD Quality Gates (Automated Compliance)

The pipeline enforces 8 strict quality gates before delivery:
1. **Target Duration Gate:** Exactly 600.00s (18,000 frames @ 30 FPS).
2. **Audio-Visual Sync Gate:** Delta between visual video and narration $\le 0.05\text{s}$.
3. **Physical Asset Gate:** 100% of beat frames/videos verified on disk (Zero Black Screen).
4. **Media Ratio Gate:** 40% photoreal images, 30% continuous video, 15% motion graphics, 15% diagrams.
5. **Collision Prevention Gate:** Zero typography overlays on diagram frames.
6. **Sound Balancing Gate:** Score locked at -28dB with dynamic ducking.
7. **Packaging Gate:** 3x 4K thumbnail variants (A/B/C) + 3 SEO titles generated.
8. **Manifest Integrity Gate:** Valid `run-manifest.json` with SHA-256 lineage tracking.

---

## 📜 License
Private & Confidential — Hidden Systems Lab © 2026. All rights reserved.
